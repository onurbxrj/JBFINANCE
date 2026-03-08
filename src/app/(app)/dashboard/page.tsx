"use client";

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    BarChart3,
    PieChart as PieIcon,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getReceitas, getDespesas, getCustosGelo, getCustosPeixe, getAllRateios, Receita, Despesa, CustoGelo, CustoPeixe, RateioDespesa } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PIE_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function DashboardPage() {
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [despesas, setDespesas] = useState<Despesa[]>([]);
    const [custosGelo, setCustosGelo] = useState<CustoGelo[]>([]);
    const [custosPeixe, setCustosPeixe] = useState<CustoPeixe[]>([]);
    const [rateios, setRateios] = useState<RateioDespesa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { role } = useAuth();

    // Time filter
    const [currentDate, setCurrentDate] = useState(new Date());

    // Transactions search + pagination
    const [txSearch, setTxSearch] = useState('');
    const [txPage, setTxPage] = useState(1);
    const txPerPage = 8;

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            try {
                const [r, d, cg, cp, rt] = await Promise.all([
                    getReceitas(),
                    getDespesas(),
                    getCustosGelo(),
                    getCustosPeixe(),
                    getAllRateios()
                ]);
                setReceitas(r);
                setDespesas(d);
                setCustosGelo(cg);
                setCustosPeixe(cp);
                setRateios(rt);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Yesterday for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let receitaHoje = 0, despesaHoje = 0, custoHoje = 0;
        let receitaMes = 0, despesaMes = 0, custoMes = 0;
        let receitaOntem = 0, despesaOntem = 0, custoOntem = 0;

        // Receitas by setor
        let receitaAcougue = 0, receitaPeixaria = 0;
        let despesaAcougue = 0, despesaPeixaria = 0;
        let custoAcougue = 0, custoPeixaria = 0;
        const despesasAcouguePorPlano: Record<string, number> = {};
        const despesasPeixariaPorPlano: Record<string, number> = {};

        receitas.forEach(r => {
            const d = new Date(r.data);
            if (r.data.startsWith(todayStr)) receitaHoje += r.valor;
            if (r.data.startsWith(yesterdayStr)) receitaOntem += r.valor;
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                receitaMes += r.valor;
                if (r.setor === 'ACOUQUE') receitaAcougue += r.valor;
                if (r.setor === 'PEIXARIA') receitaPeixaria += r.valor;
            }
        });

        despesas.forEach(dp => {
            const d = new Date(dp.data);
            if (dp.data.startsWith(todayStr)) despesaHoje += dp.valor;
            if (dp.data.startsWith(yesterdayStr)) despesaOntem += dp.valor;
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                despesaMes += dp.valor;

                // Distribuição por Setor (Rateio vs Direto)
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
            const d = new Date(c.data);
            const total = c.custo_total || (c.quantidade * c.custo_unitario);
            if (c.data.startsWith(todayStr)) custoHoje += total;
            if (c.data.startsWith(yesterdayStr)) custoOntem += total;
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                custoMes += total;
                custoPeixaria += total; // Gelo sempre vai para Peixaria neste contexto de custo direto
            }
        });

        custosPeixe.forEach(c => {
            const d = new Date(c.data);
            const total = c.custo_total || (c.quantidade * c.custo_unitario);
            if (c.data.startsWith(todayStr)) custoHoje += total;
            if (c.data.startsWith(yesterdayStr)) custoOntem += total;
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                custoMes += total;
                custoPeixaria += total; // Peixe também é custo direto da Peixaria
            }
        });

        const despTotalHoje = despesaHoje + custoHoje;
        const despTotalMes = despesaMes + custoMes;
        const despTotalOntem = despesaOntem + custoOntem;
        const lucroMes = receitaMes - despTotalMes;

        // Percentage comparisons vs yesterday
        const receitaVsOntem = receitaOntem > 0 ? ((receitaHoje - receitaOntem) / receitaOntem) * 100 : 0;
        const despesaVsOntem = despTotalOntem > 0 ? ((despTotalHoje - despTotalOntem) / despTotalOntem) * 100 : 0;

        return {
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
    }, [receitas, despesas, custosGelo, custosPeixe, rateios, currentDate]);

    // Despesas por categoria (for pie chart)
    const despesasPorCategoria = useMemo(() => {
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const map: Record<string, number> = {};

        despesas.forEach(dp => {
            const d = new Date(dp.data);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                map[dp.categoria] = (map[dp.categoria] || 0) + dp.valor;
            }
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [despesas, currentDate]);

    // Bar chart: Receita vs Despesa by day (last 7 days)
    const barChartData = useMemo(() => {
        const days: { date: string; receipts: number; expenses: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = format(d, "dd/MM", { locale: ptBR });

            let rec = 0, desp = 0;
            receitas.forEach(r => { if (r.data.startsWith(dateStr)) rec += r.valor; });
            despesas.forEach(dp => { if (dp.data.startsWith(dateStr)) desp += dp.valor; });

            days.push({ date: label, receipts: rec, expenses: desp });
        }

        return days;
    }, [receitas, despesas]);

    // Pie chart: Receita por setor
    const receitaPorSetor = useMemo(() => [
        { name: 'Açougue', value: stats.receitaAcougue },
        { name: 'Peixaria', value: stats.receitaPeixaria },
    ].filter(s => s.value > 0), [stats]);

    // Recent transactions (combined)
    const transactions = useMemo(() => {
        const all: { id: string; data: string; tipo: 'Receita' | 'Despesa'; plano_contas: string; categoria: string; setor: string; valor: number }[] = [];

        receitas.forEach(r => {
            all.push({
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
            all.push({
                id: d.id || '',
                data: d.data,
                tipo: 'Despesa',
                plano_contas: d.plano_contas || '',
                categoria: d.categoria,
                setor: d.centro_custo,
                valor: d.valor,
            });
        });

        return all.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [receitas, despesas]);

    // Filtered transactions
    const filteredTx = useMemo(() => {
        const q = txSearch.toLowerCase();
        return transactions.filter(tx =>
            tx.categoria.toLowerCase().includes(q) ||
            tx.setor.toLowerCase().includes(q) ||
            tx.tipo.toLowerCase().includes(q) ||
            tx.plano_contas.toLowerCase().includes(q)
        );
    }, [transactions, txSearch]);

    const paginatedTx = filteredTx.slice((txPage - 1) * txPerPage, txPage * txPerPage);
    const totalTxPages = Math.ceil(filteredTx.length / txPerPage);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatCompact = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <div className="h-5 w-32 bg-muted/20 animate-pulse rounded mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[120px] rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                        ))}
                    </div>
                </div>
                <div>
                    <div className="h-5 w-32 bg-muted/20 animate-pulse rounded mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[4, 5, 6].map(i => (
                            <div key={i} className="h-[120px] rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[360px] rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                    <div className="h-[360px] rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                </div>
            </div>
        );
    }

    const MetricCard = ({
        title,
        value,
        comparison,
        icon: Icon,
        color,
        isPositive,
    }: {
        title: string;
        value: string;
        comparison?: string;
        icon: React.ElementType;
        color: string;
        isPositive?: boolean;
    }) => (
        <Card className="glass-card inner-border group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className={`p-2 rounded-xl ${color}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-bold tracking-tight financial-value text-foreground">{value}</p>
                {comparison && (
                    <div className="flex items-center mt-3">
                        <span className={isPositive === undefined ? "text-xs text-muted-foreground" : isPositive ? "badge-glass-success" : "badge-glass-danger"}>
                            {isPositive !== undefined && (
                                isPositive
                                    ? <ArrowUpRight className="w-3 h-3 mr-1" />
                                    : <ArrowDownRight className="w-3 h-3 mr-1" />
                            )}
                            {comparison}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const isCurrentMonth = isSameMonth(currentDate, new Date());
    const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Month Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-[13px] text-muted-foreground mt-1">Visão geral financeira consolidada</p>
                </div>
                
                <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl p-1 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-lg hover:bg-muted/50 text-muted-foreground">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-36 text-center font-semibold text-sm text-foreground capitalize">
                        {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={isCurrentMonth} className="h-8 w-8 rounded-lg hover:bg-muted/50 text-muted-foreground disabled:opacity-30">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Row 1: Today's Metrics (Só exibe se for o mês corrente) */}
            {isCurrentMonth && (
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Visão de Hoje</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="Receita Hoje"
                        value={formatCurrency(stats.receitaHoje)}
                        comparison={stats.receitaVsOntem !== 0 ? `${stats.receitaVsOntem > 0 ? '+' : ''}${stats.receitaVsOntem.toFixed(1)}% vs ontem` : 'sem variação'}
                        icon={TrendingUp}
                        color="bg-success/10 text-success"
                        isPositive={stats.receitaVsOntem >= 0}
                    />
                    <MetricCard
                        title="Despesas Hoje"
                        value={formatCurrency(stats.despesaHojeTotal)}
                        comparison={stats.despesaVsOntem !== 0 ? `${stats.despesaVsOntem > 0 ? '+' : ''}${stats.despesaVsOntem.toFixed(1)}% vs ontem` : 'sem variação'}
                        icon={TrendingDown}
                        color="bg-danger/10 text-danger"
                        isPositive={stats.despesaVsOntem <= 0}
                    />
                    <MetricCard
                        title="Lucro Hoje"
                        value={formatCurrency(stats.lucroHoje)}
                        icon={Activity}
                        color={stats.lucroHoje >= 0 ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"}
                    />
                </div>
            </div>
            )}

            {/* Row 2: Month Metrics */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Visão do Mês {isCurrentMonth ? '(Atual)' : ''}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="Receita do Mês"
                        value={formatCurrency(stats.receitaMes)}
                        icon={DollarSign}
                        color="bg-success/10 text-success"
                    />
                    <MetricCard
                        title="Despesas do Mês"
                        value={formatCurrency(stats.despesaMesTotal)}
                        icon={TrendingDown}
                        color="bg-danger/10 text-danger"
                    />
                    <MetricCard
                        title="Lucro do Mês"
                        value={formatCurrency(stats.lucroMes)}
                        comparison={`Margem: ${stats.margemMes.toFixed(1)}%`}
                        icon={Activity}
                        color={stats.lucroMes >= 0 ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"}
                        isPositive={stats.margemMes >= 0}
                    />
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Receita vs Despesas */}
                <Card className="glass-card inner-border">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            <CardTitle className="text-sm font-semibold tracking-tight text-gradient-neon">Receita vs Despesas</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} barGap={4}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#DB2777" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#DB2777" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#E2E8F0', fontSize: '13px' }}
                                        labelStyle={{ color: '#94A3B8' }}
                                        formatter={(value: any) => [formatCurrency(Number(value))]}
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    />
                                    <Bar dataKey="receipts" name="Receitas" fill="url(#colorReceita)" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="expenses" name="Despesas" fill="url(#colorDespesa)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart: Receita por Setor */}
                <Card className="glass-card inner-border">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-primary" />
                            <CardTitle className="text-sm font-semibold tracking-tight">Receita por Setor</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">Mês atual</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] mt-2">
                            {receitaPorSetor.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={receitaPorSetor}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {receitaPorSetor.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '12px', color: '#E2E8F0', fontSize: '13px' }}
                                            formatter={(value: any) => [formatCurrency(Number(value))]}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: '13px', color: '#94A3B8', paddingTop: '16px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Sem dados de receita neste mês
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Despesas por Categoria chart */}
            {despesasPorCategoria.length > 0 && (
                <Card className="glass-card inner-border">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-danger" />
                            <CardTitle className="text-sm font-semibold tracking-tight">Despesas por Categoria</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">Mês atual — Top 6</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-2">
                            {despesasPorCategoria.map((item, i) => (
                                <div key={item.name} className="bg-muted/50 rounded-xl p-4 text-center border border-border/50">
                                    <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                                    <p className="text-sm font-bold text-foreground financial-value mt-1">{formatCurrency(item.value)}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* DRE Section */}
            {role !== 'funcionario' && (
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        DRE Consolidado — Mês Atual
                    </h2>
                    <Card className="glass-card inner-border overflow-hidden max-w-4xl">
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                <div className="p-4 px-6 flex justify-between items-center bg-primary/5">
                                    <span className="font-semibold text-foreground text-sm tracking-tight">1. Receita Bruta Total</span>
                                    <span className="font-bold text-success text-lg financial-value">{formatCurrency(stats.receitaMes)}</span>
                                </div>
                                <div className="p-4 px-6 pl-10 flex justify-between items-center text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                                    <span>(-) Custos Operacionais (Gelo e Peixe)</span>
                                    <span className="text-danger font-medium financial-value">{formatCurrency(stats.custosMesTotal)}</span>
                                </div>
                                <div className="p-4 px-6 flex justify-between items-center bg-primary/5 font-semibold text-sm tracking-tight">
                                    <span className="text-foreground">= Lucro Bruto</span>
                                    <span className="text-foreground financial-value">{formatCurrency(stats.receitaMes - stats.custosMesTotal)}</span>
                                </div>
                                <div className="p-4 px-6 pl-10 flex justify-between items-center text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                                    <span>(-) Despesas Administrativas / Rateadas</span>
                                    <span className="text-danger font-medium financial-value">{formatCurrency(stats.despesasAdminMesTotal)}</span>
                                </div>
                                <div className="p-4 px-6 flex justify-between items-center bg-background/20 font-bold text-lg">
                                    <span className="text-foreground">= Resultado Operacional</span>
                                    <span className={`financial-value ${stats.lucroMes >= 0 ? 'text-gradient-neon text-xl' : 'text-danger text-xl'}`}>
                                        {formatCurrency(stats.lucroMes)}
                                    </span>
                                </div>
                                <div className="p-3 px-6 text-right bg-muted/20">
                                    <span className={stats.margemMes >= 0 ? "badge-glass-success" : "badge-glass-danger"}>
                                        Margem: {stats.margemMes.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* DRE by Sector */}
            {role !== 'funcionario' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    {/* DRE Açougue */}
                    <Card className="glass-card inner-border overflow-hidden">
                        <CardHeader className="pb-2 bg-primary/5">
                            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-chart-1" />
                                DRE Açougue
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border text-sm">
                                <div className="p-3 px-5 flex justify-between">
                                    <span className="text-muted-foreground">Receita</span>
                                    <span className="text-success font-medium financial-value">{formatCurrency(stats.receitaAcougue)}</span>
                                </div>
                                {Object.entries(stats.despesasAcouguePorPlano).map(([plano, valor]) => (
                                    <div key={plano} className="p-3 px-5 flex justify-between hover:bg-muted/30 transition-colors">
                                        <span className="text-muted-foreground">(-) {plano}</span>
                                        <span className="text-danger font-medium financial-value">-{formatCurrency(valor)}</span>
                                    </div>
                                ))}
                                {stats.custoAcougue > 0 && (
                                    <div className="p-3 px-5 flex justify-between hover:bg-muted/30 transition-colors">
                                        <span className="text-muted-foreground">(-) Custos Operacionais</span>
                                        <span className="text-danger font-medium financial-value">-{formatCurrency(stats.custoAcougue)}</span>
                                    </div>
                                )}
                                <div className="p-3 px-5 flex justify-between bg-muted/20 font-semibold">
                                    <span className="text-foreground">Resultado</span>
                                    <span className={`financial-value ${(stats.receitaAcougue - (stats.despesaAcougue + stats.custoAcougue)) >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(stats.receitaAcougue - (stats.despesaAcougue + stats.custoAcougue))}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DRE Peixaria */}
                    <Card className="glass-card inner-border overflow-hidden">
                        <CardHeader className="pb-2 bg-success/5">
                            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-success" />
                                DRE Peixaria
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border text-sm">
                                <div className="p-3 px-5 flex justify-between">
                                    <span className="text-muted-foreground">Receita</span>
                                    <span className="text-success font-medium financial-value">{formatCurrency(stats.receitaPeixaria)}</span>
                                </div>
                                {Object.entries(stats.despesasPeixariaPorPlano).map(([plano, valor]) => (
                                    <div key={plano} className="p-3 px-5 flex justify-between hover:bg-muted/30 transition-colors">
                                        <span className="text-muted-foreground">(-) {plano}</span>
                                        <span className="text-danger font-medium financial-value">-{formatCurrency(valor)}</span>
                                    </div>
                                ))}
                                {stats.custoPeixaria > 0 && (
                                    <div className="p-3 px-5 flex justify-between hover:bg-muted/30 transition-colors">
                                        <span className="text-muted-foreground">(-) Custos Operacionais (Pescado)</span>
                                        <span className="text-danger font-medium financial-value">-{formatCurrency(stats.custoPeixaria)}</span>
                                    </div>
                                )}
                                <div className="p-3 px-5 flex justify-between bg-muted/20 font-semibold">
                                    <span className="text-foreground">Resultado</span>
                                    <span className={`financial-value ${(stats.receitaPeixaria - (stats.despesaPeixaria + stats.custoPeixaria)) >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(stats.receitaPeixaria - (stats.despesaPeixaria + stats.custoPeixaria))}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Transactions Table */}
            <Card className="glass-card inner-border">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-sm font-semibold tracking-tight">Últimas Transações</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar transação..."
                                value={txSearch}
                                onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                                className="pl-9 bg-muted/40 border-border/50 text-sm h-9 rounded-lg"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {paginatedTx.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
                            <div className="bg-muted/10 p-5 rounded-full mb-4 border border-border/50 shadow-sm">
                                <Search className="w-8 h-8 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Sem resultados</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mb-6">
                                Nenhuma transação financeira foi encontrada neste período ou com os termos de busca informados.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Data</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">P.Contas</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Setor</TableHead>
                                            <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedTx.map((tx, i) => (
                                            <TableRow key={tx.id + i} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="text-[13px]">
                                                    {format(new Date(tx.data), "dd/MM/yyyy", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${tx.tipo === 'Receita'
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-danger/10 text-danger'
                                                        }`}>
                                                        {tx.tipo === 'Receita' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {tx.tipo}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{tx.plano_contas}</TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{tx.categoria}</TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{tx.setor}</TableCell>
                                                <TableCell className={`text-right font-semibold text-[13px] financial-value ${tx.tipo === 'Receita' ? 'text-success' : 'text-danger'}`}>
                                                    {tx.tipo === 'Receita' ? '+' : '-'}{formatCurrency(tx.valor)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalTxPages > 1 && (
                                <div className="flex items-center justify-between mt-4 text-[13px] text-muted-foreground">
                                    <span>
                                        {(txPage - 1) * txPerPage + 1}–{Math.min(txPage * txPerPage, filteredTx.length)} de {filteredTx.length}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setTxPage(p => Math.max(1, p - 1))}
                                            disabled={txPage === 1}
                                            className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {Array.from({ length: totalTxPages }, (_, i) => i + 1).slice(
                                            Math.max(0, txPage - 3),
                                            Math.min(totalTxPages, txPage + 2)
                                        ).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setTxPage(p)}
                                                className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${p === txPage
                                                    ? 'bg-primary text-black font-bold shadow-md'
                                                    : 'hover:bg-muted/50 text-muted-foreground'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                                            disabled={txPage === totalTxPages}
                                            className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
