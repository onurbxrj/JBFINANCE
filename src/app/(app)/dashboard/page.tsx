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
import { getDashboardData } from '@/app/actions/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PIE_COLORS = ['#34D399', '#38BDF8', '#FBBF24', '#FB923C', '#F87171', '#2DD4BF'];

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
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
                const res = await getDashboardData(currentDate.toISOString());
                setData(res);
                setTxPage(1); // resettamos a pág inação nas trocas de mes
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [currentDate]);

    // Filtered transactions (we still do this on the subset returned by the server)
    const filteredTx = useMemo(() => {
        if (!data?.transactions) return [];
        const q = txSearch.toLowerCase();
        return data.transactions.filter((tx: any) =>
            tx.categoria.toLowerCase().includes(q) ||
            tx.setor.toLowerCase().includes(q) ||
            tx.tipo.toLowerCase().includes(q) ||
            tx.plano_contas.toLowerCase().includes(q)
        );
    }, [data?.transactions, txSearch]);

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
    }) => {
        // Extrair cor dominante para borda-esquerda
        const borderColor = color.includes('success') ? 'border-l-emerald-400'
            : color.includes('danger') ? 'border-l-red-400'
                : 'border-l-amber-400';

        return (
            <Card className={`glass-card inner-border group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default border-l-[3px] ${borderColor}`}>
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
    };

    const isCurrentMonth = isSameMonth(currentDate, new Date());
    const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

    const stats = data?.stats;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Massive Typographic Hero Section (UX PRO MAX) */}
            <div className="relative overflow-hidden glass-card rounded-3xl p-8 sm:p-12 inner-border bg-gradient-to-br from-background via-background/90 to-primary/5">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 relative z-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            <Activity className="w-4 h-4" /> Resumo Financeiro
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-foreground leading-[1.1]">
                            Dashboard
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium flex items-center gap-2">
                            Mês ativo:
                            <span className="text-foreground border-b border-primary/30 pb-0.5">
                                {format(currentDate, "MMMM", { locale: ptBR })}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md border border-border/50 rounded-2xl p-1.5 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-10 w-10 rounded-xl hover:bg-muted/80 text-muted-foreground transition-all">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="w-40 text-center font-bold text-sm text-foreground capitalize">
                            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={isCurrentMonth} className="h-10 w-10 rounded-xl hover:bg-muted/80 text-muted-foreground disabled:opacity-20 transition-all">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Row 1: Today's Metrics (Só exibe se for o mês corrente) */}
            {isCurrentMonth && stats && (
                <div className="animate-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-4 pl-2 opacity-80">
                        Visão de Hoje
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            {stats && (
                <div className="animate-in slide-in-from-bottom-6 duration-700">
                    <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-4 pl-2 opacity-80">
                        Acumulado do Mês
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
            )}

            {/* Charts Section */}
            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Bar Chart: Receita vs Despesas */}
                    <Card className="glass-card inner-border">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-primary" />
                                <CardTitle className="text-sm font-semibold tracking-tight text-gradient-accent">Receita vs Despesas</CardTitle>
                            </div>
                            <p className="text-xs text-muted-foreground">{isCurrentMonth ? "Últimos 7 dias" : "Última semana do mês"}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[260px] mt-2">
                                {data.barChartData.some((d: any) => d.receipts > 0 || d.expenses > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.barChartData} barGap={4}>
                                            <defs>
                                                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.9} />
                                                    <stop offset="95%" stopColor="#34D399" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F87171" stopOpacity={0.9} />
                                                    <stop offset="95%" stopColor="#F87171" stopOpacity={0.1} />
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
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2 opacity-80">
                                        <BarChart3 className="w-8 h-8 opacity-20" />
                                        <span>Sem fluxo de caixa nos dias analisados</span>
                                    </div>
                                )}
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
                                {data.receitaPorSetor.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.receitaPorSetor}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={4}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {data.receitaPorSetor.map((_: any, i: number) => (
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
            )}
            {/* Despesas por Categoria chart */}
            {data?.despesasPorCategoria?.length > 0 && (
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
                            {data.despesasPorCategoria.map((item: any, i: number) => (
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
            {role !== 'funcionario' && stats && (
                <div className="animate-in slide-in-from-bottom-10 duration-700">
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
                                    <span className={`financial-value ${stats.lucroMes >= 0 ? 'text-gradient-accent text-xl' : 'text-danger text-xl'}`}>
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
                                {Object.entries<number>(stats.despesasAcouguePorPlano).map(([plano, valor]) => (
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
                                {Object.entries<number>(stats.despesasPeixariaPorPlano).map(([plano, valor]) => (
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
                                        {paginatedTx.map((tx: any, i: number) => (
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
                                        ).map((p: number) => (
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
