"use server";

import { createClient } from '@/lib/supabase/server';
import { format, subDays, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function getDashboardData(dateString: string) {
    const supabase = await createClient();
    const currentDate = new Date(dateString);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const sevenDaysAgo = subDays(new Date(), 6);

    // Determines the widest range to fetch everything needed in one go
    // For Dashboard: Needs current month metrics, yesterday, today, and last 7 days.
    const earliestDate = [monthStart, sevenDaysAgo, yesterday].reduce((a, b) => a < b ? a : b);
    const latestDate = [monthEnd, new Date()].reduce((a, b) => a > b ? a : b);

    const startStr = format(earliestDate, 'yyyy-MM-dd');
    const endStr = format(latestDate, 'yyyy-MM-dd');

    const [receitasRes, despesasRes, geloRes, peixeRes, rateiosRes] = await Promise.all([
        supabase.from('receitas').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('despesas').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('custo_gelo').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('custo_peixe').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('rateio_despesas').select('*') // Rateios usually few, or we can filter later, fetching all for now as it's a join table
    ]);

    const receitas = receitasRes.data || [];
    const despesas = despesasRes.data || [];
    const custosGelo = geloRes.data || [];
    const custosPeixe = peixeRes.data || [];
    const rateios = rateiosRes.data || [];

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let receitaHoje = 0, despesaHoje = 0, custoHoje = 0;
    let receitaMes = 0, despesaMes = 0, custoMes = 0;
    let receitaOntem = 0, despesaOntem = 0, custoOntem = 0;

    let receitaAcougue = 0, receitaPeixaria = 0;
    let despesaAcougue = 0, despesaPeixaria = 0;
    let custoAcougue = 0, custoPeixaria = 0;
    const despesasAcouguePorPlano: Record<string, number> = {};
    const despesasPeixariaPorPlano: Record<string, number> = {};

    receitas.forEach(r => {
        const d = new Date(r.data + "T12:00:00");
        if (r.data.startsWith(todayStr)) receitaHoje += r.valor;
        if (r.data.startsWith(yesterdayStr)) receitaOntem += r.valor;
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            receitaMes += r.valor;
            if (r.setor === 'ACOUQUE') receitaAcougue += r.valor;
            if (r.setor === 'PEIXARIA') receitaPeixaria += r.valor;
        }
    });

    despesas.forEach(dp => {
        const d = new Date(dp.data + "T12:00:00");
        if (dp.data.startsWith(todayStr)) despesaHoje += dp.valor;
        if (dp.data.startsWith(yesterdayStr)) despesaOntem += dp.valor;
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            despesaMes += dp.valor;

            const plano = dp.plano_contas || 'Sem Plano';
            if (dp.tipo_rateio === 'nenhum' || !dp.tipo_rateio) {
                if (dp.centro_custo === 'Açougue') {
                    despesaAcougue += dp.valor;
                    despesasAcouguePorPlano[plano] = (despesasAcouguePorPlano[plano] || 0) + dp.valor;
                }
                if (dp.centro_custo === 'Peixaria') {
                    despesaPeixaria += dp.valor;
                    despesasPeixariaPorPlano[plano] = (despesasPeixariaPorPlano[plano] || 0) + dp.valor;
                }
            } else if (dp.tipo_rateio === 'igual') {
                const half = dp.valor / 2;
                despesaAcougue += half;
                despesaPeixaria += half;
                despesasAcouguePorPlano[plano] = (despesasAcouguePorPlano[plano] || 0) + half;
                despesasPeixariaPorPlano[plano] = (despesasPeixariaPorPlano[plano] || 0) + half;
            } else if (dp.tipo_rateio === 'percentual') {
                const despRateios = rateios.filter(r => r.despesa_id === dp.id);
                despRateios.forEach(rt => {
                    const val = (dp.valor * rt.percentual) / 100;
                    if (rt.setor === 'Açougue') {
                        despesaAcougue += val;
                        despesasAcouguePorPlano[plano] = (despesasAcouguePorPlano[plano] || 0) + val;
                    }
                    if (rt.setor === 'Peixaria') {
                        despesaPeixaria += val;
                        despesasPeixariaPorPlano[plano] = (despesasPeixariaPorPlano[plano] || 0) + val;
                    }
                });
            }
        }
    });

    custosGelo.forEach(c => {
        const d = new Date(c.data + "T12:00:00");
        const total = c.custo_total || (c.quantidade * c.custo_unitario);
        if (c.data.startsWith(todayStr)) custoHoje += total;
        if (c.data.startsWith(yesterdayStr)) custoOntem += total;
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            custoMes += total;
            custoPeixaria += total;
        }
    });

    custosPeixe.forEach(c => {
        const d = new Date(c.data + "T12:00:00");
        const total = c.custo_total || (c.quantidade * c.custo_unitario);
        if (c.data.startsWith(todayStr)) custoHoje += total;
        if (c.data.startsWith(yesterdayStr)) custoOntem += total;
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            custoMes += total;
            custoPeixaria += total;
        }
    });

    const despTotalHoje = despesaHoje + custoHoje;
    const despTotalMes = despesaMes + custoMes;
    const despTotalOntem = despesaOntem + custoOntem;
    const lucroMes = receitaMes - despTotalMes;

    const receitaVsOntem = receitaOntem > 0 ? ((receitaHoje - receitaOntem) / receitaOntem) * 100 : 0;
    const despesaVsOntem = despTotalOntem > 0 ? ((despTotalHoje - despTotalOntem) / despTotalOntem) * 100 : 0;

    const stats = {
        receitaHoje,
        despesaHojeTotal: despTotalHoje,
        lucroHoje: receitaHoje - despTotalHoje,
        receitaMes,
        despesaMesTotal: despTotalMes,
        lucroMes,
        custosMesTotal: custoMes,
        despesasAdminMesTotal: despesaMes,
        margemMes: receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0,
        receitaVsOntem,
        despesaVsOntem,
        receitaAcougue,
        receitaPeixaria,
        despesaAcougue,
        despesaPeixaria,
        custoAcougue,
        custoPeixaria,
        despesasAcouguePorPlano,
        despesasPeixariaPorPlano
    };

    const mapCat: Record<string, number> = {};
    despesas.forEach(dp => {
        const d = new Date(dp.data + "T12:00:00");
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            mapCat[dp.categoria] = (mapCat[dp.categoria] || 0) + dp.valor;
        }
    });

    const despesasPorCategoria = Object.entries(mapCat)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    const barChartData = [];
    const refDate = isSameMonth(currentDate, new Date()) ? new Date() : new Date(monthEnd);
    for (let i = 6; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(d.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const label = format(d, "dd/MM", { locale: ptBR });

        let rec = 0, desp = 0;
        receitas.forEach(r => { if (r.data.startsWith(dateStr)) rec += r.valor; });
        despesas.forEach(dp => { if (dp.data.startsWith(dateStr)) desp += dp.valor; });

        barChartData.push({ date: label, receipts: rec, expenses: desp });
    }

    const receitaPorSetor = [
        { name: 'Açougue', value: stats.receitaAcougue },
        { name: 'Peixaria', value: stats.receitaPeixaria },
    ].filter(s => s.value > 0);

    const transactions: any[] = [];
    receitas.forEach(r => {
        transactions.push({
            id: r.id || '',
            data: r.data,
            tipo: 'Receita',
            plano_contas: r.plano_contas || '',
            categoria: r.categoria,
            setor: r.setor === 'ACOUQUE' ? 'Açougue' : 'Peixaria',
            valor: r.valor,
        });
    });
    despesas.forEach(d => {
        transactions.push({
            id: d.id || '',
            data: d.data,
            tipo: 'Despesa',
            plano_contas: d.plano_contas || '',
            categoria: d.categoria,
            setor: d.centro_custo,
            valor: d.valor,
        });
    });

    transactions.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return {
        stats,
        despesasPorCategoria,
        barChartData,
        receitaPorSetor,
        transactions
    };
}
