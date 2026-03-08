"use server";

import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, isSameMonth, format } from 'date-fns';

export async function getDreData(dateString: string) {
    const supabase = await createClient();
    const currentDate = new Date(dateString);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const startStr = format(monthStart, 'yyyy-MM-dd');
    const endStr = format(monthEnd, 'yyyy-MM-dd');

    const [receitasRes, despesasRes, geloRes, peixeRes, rateiosRes] = await Promise.all([
        supabase.from('receitas').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('despesas').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('custo_gelo').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('custo_peixe').select('*').gte('data', startStr).lte('data', endStr),
        supabase.from('rateio_despesas').select('*')
    ]);

    const receitas = receitasRes.data || [];
    const despesas = despesasRes.data || [];
    const custosGelo = geloRes.data || [];
    const custosPeixe = peixeRes.data || [];
    const rateios = rateiosRes.data || [];

    let totalReceitas = 0, receitasAcougue = 0, receitasPeixaria = 0;
    let totalCustos = 0, custosAcougue = 0, custosPeixariaVal = 0;
    let totalDespesas = 0, despesasAcougue = 0, despesasPeixariaVal = 0;

    const despesasLojaPorPlano: Record<string, number> = {};
    const despesasAcouguePorPlano: Record<string, number> = {};
    const despesasPeixariaPorPlano: Record<string, number> = {};

    receitas.forEach(r => {
        const dDate = new Date(r.data + "T12:00:00");
        if (!isSameMonth(dDate, currentDate)) return;

        totalReceitas += r.valor;
        if (r.setor === 'ACOUQUE') receitasAcougue += r.valor;
        if (r.setor === 'PEIXARIA') receitasPeixaria += r.valor;
    });

    custosGelo.forEach(c => {
        const dDate = new Date(c.data + "T12:00:00");
        if (!isSameMonth(dDate, currentDate)) return;

        const total = c.custo_total || (c.quantidade * c.custo_unitario);
        totalCustos += total;
        custosPeixariaVal += total;
    });

    custosPeixe.forEach(c => {
        const dDate = new Date(c.data + "T12:00:00");
        if (!isSameMonth(dDate, currentDate)) return;

        const total = c.custo_total || (c.quantidade * c.custo_unitario);
        totalCustos += total;
        custosPeixariaVal += total;
    });

    despesas.forEach(dp => {
        const dDate = new Date(dp.data + "T12:00:00");
        if (!isSameMonth(dDate, currentDate)) return;

        totalDespesas += dp.valor;
        const plano = dp.plano_contas || 'Sem Plano';
        despesasLojaPorPlano[plano] = (despesasLojaPorPlano[plano] || 0) + dp.valor;

        if (dp.tipo_rateio === 'nenhum' || !dp.tipo_rateio) {
            if (dp.centro_custo === 'Açougue') {
                despesasAcougue += dp.valor;
                despesasAcouguePorPlano[plano] = (despesasAcouguePorPlano[plano] || 0) + dp.valor;
            }
            if (dp.centro_custo === 'Peixaria') {
                despesasPeixariaVal += dp.valor;
                despesasPeixariaPorPlano[plano] = (despesasPeixariaPorPlano[plano] || 0) + dp.valor;
            }
        } else if (dp.tipo_rateio === 'igual') {
            const perc = dp.valor / 2;
            despesasAcougue += perc;
            despesasPeixariaVal += perc;
            despesasAcouguePorPlano[plano] = (despesasAcouguePorPlano[plano] || 0) + perc;
            despesasPeixariaPorPlano[plano] = (despesasPeixariaPorPlano[plano] || 0) + perc;
        } else if (dp.tipo_rateio === 'percentual') {
            const myRateios = rateios.filter(rt => rt.despesa_id === dp.id);
            if (myRateios.length > 0) {
                const percRealAcougue = myRateios.find(rt => rt.setor === 'Açougue')?.percentual || 0;
                const percRealPeixaria = myRateios.find(rt => rt.setor === 'Peixaria')?.percentual || 0;

                const valAcougue = (dp.valor * percRealAcougue) / 100;
                const valPeixaria = (dp.valor * percRealPeixaria) / 100;

                despesasAcougue += valAcougue;
                despesasPeixariaVal += valPeixaria;
                despesasAcouguePorPlano[plano] = (despesasAcouguePorPlano[plano] || 0) + valAcougue;
                despesasPeixariaPorPlano[plano] = (despesasPeixariaPorPlano[plano] || 0) + valPeixaria;
            }
        }
    });

    const resultadoLoja = totalReceitas - totalCustos - totalDespesas;
    const resultadoAcougue = receitasAcougue - custosAcougue - despesasAcougue;
    const resultadoPeixaria = receitasPeixaria - custosPeixariaVal - despesasPeixariaVal;

    return {
        totalReceitas, receitasAcougue, receitasPeixaria,
        totalCustos, custosAcougue, custosPeixaria: custosPeixariaVal,
        totalDespesas, despesasAcougue, despesasPeixaria: despesasPeixariaVal,
        despesasLojaPorPlano, despesasAcouguePorPlano, despesasPeixariaPorPlano,
        resultadoLoja, resultadoAcougue, resultadoPeixaria,
        margem: totalReceitas > 0 ? (resultadoLoja / totalReceitas) * 100 : 0,
        margemAcougue: receitasAcougue > 0 ? (resultadoAcougue / receitasAcougue) * 100 : 0,
        margemPeixaria: receitasPeixaria > 0 ? (resultadoPeixaria / receitasPeixaria) * 100 : 0,
    };
}
