"use client";

import { useEffect, useState, useMemo } from "react";
import { getReceitas, getDespesas, getCustosGelo, getCustosPeixe, getAllRateios, Receita, Despesa, CustoGelo, CustoPeixe, RateioDespesa } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isSameMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DrePage() {
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [despesas, setDespesas] = useState<Despesa[]>([]);
    const [custosGelo, setCustosGelo] = useState<CustoGelo[]>([]);
    const [custosPeixe, setCustosPeixe] = useState<CustoPeixe[]>([]);
    const [rateios, setRateios] = useState<RateioDespesa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

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
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const dreData = useMemo(() => {
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
    }, [receitas, despesas, custosGelo, custosPeixe, rateios, currentDate]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const DreTable = ({ title, receita, custos, despesas, resultado, margem, despesasAnaliticas, showCustosAsPescado }: {
        title: string; receita: number; custos: number; despesas: number; resultado: number; margem: number; despesasAnaliticas?: Record<string, number>; showCustosAsPescado?: boolean;
    }) => (
        <Card className="glass-card inner-border overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    <div className="p-4 px-6 flex justify-between items-center hover:bg-muted/20 transition-colors">
                        <span className="font-semibold text-foreground text-sm tracking-tight">1. Receita Bruta</span>
                        <span className="font-bold text-success financial-value">{formatCurrency(receita)}</span>
                    </div>
                    <div className="p-4 px-6 pl-10 flex justify-between items-center text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                        <span>(-) Custos Diretos</span>
                        <span className="font-medium text-danger financial-value">{formatCurrency(custos)}</span>
                    </div>
                    <div className="p-4 px-6 flex justify-between items-center bg-primary/5 font-semibold text-sm tracking-tight">
                        <span className="text-foreground">= Lucro Bruto</span>
                        <span className="text-foreground financial-value">{formatCurrency(receita - custos)}</span>
                    </div>

                    {despesasAnaliticas ? (
                        Object.entries(despesasAnaliticas).map(([plano, valor]) => (
                            <div key={plano} className="p-4 px-6 pl-10 flex justify-between items-center text-[13px] text-muted-foreground hover:bg-muted/20 transition-colors">
                                <span>(-) {plano}</span>
                                <span className="font-medium text-danger financial-value">-{formatCurrency(valor)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 px-6 pl-10 flex justify-between items-center text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                            <span>(-) Despesas Rateadas / Fixas</span>
                            <span className="font-medium text-danger financial-value">{formatCurrency(despesas)}</span>
                        </div>
                    )}
                    <div className="p-4 px-6 flex justify-between items-center bg-background/20 font-bold text-lg">
                        <span className="text-foreground">= Resultado Operacional</span>
                        <span className={`financial-value ${resultado >= 0 ? 'text-gradient-neon text-xl' : 'text-danger text-xl'}`}>
                            {formatCurrency(resultado)}
                        </span>
                    </div>
                    <div className="p-3 px-6 text-right bg-muted/20">
                        <span className={margem >= 0 ? "badge-glass-success" : "badge-glass-danger"}>
                            Margem: {margem.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">DRE Gerencial</h1>
                    <p className="text-sm text-muted-foreground mt-1">Demonstração do Resultado do Exercício — Consolidado e por Setor</p>
                </div>

                <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-border/50 shadow-sm self-start sm:self-auto backdrop-blur-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="h-8 w-8 text-foreground hover:bg-muted/50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col items-center justify-center w-36 py-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Mês de Referência
                        </span>
                        <span className="text-sm font-bold capitalize text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="h-8 w-8 text-foreground hover:bg-muted/50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-6">
                    <div className="h-4 w-48 bg-muted/20 animate-pulse rounded mb-4" />
                    <div className="h-[280px] w-full max-w-3xl rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                    <div className="h-4 w-48 bg-muted/20 animate-pulse rounded mt-8 mb-4" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-[280px] rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                        <div className="h-[280px] rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                    </div>
                </div>
            ) : (
                <>
                    <div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">DRE Consolidado (Loja)</h2>
                        <div className="max-w-3xl">
                            <DreTable
                                title="Resultado Geral da Loja"
                                receita={dreData.totalReceitas}
                                custos={dreData.totalCustos}
                                despesas={dreData.totalDespesas}
                                resultado={dreData.resultadoLoja}
                                margem={dreData.margem}
                                despesasAnaliticas={dreData.despesasLojaPorPlano}
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">DRE por Setor</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DreTable
                                title="Açougue"
                                receita={dreData.receitasAcougue}
                                custos={dreData.custosAcougue}
                                despesas={dreData.despesasAcougue}
                                resultado={dreData.resultadoAcougue}
                                margem={dreData.margemAcougue}
                                despesasAnaliticas={dreData.despesasAcouguePorPlano}
                            />
                            <DreTable
                                title="Peixaria"
                                receita={dreData.receitasPeixaria}
                                custos={dreData.custosPeixaria}
                                despesas={dreData.despesasPeixaria}
                                resultado={dreData.resultadoPeixaria}
                                margem={dreData.margemPeixaria}
                                despesasAnaliticas={dreData.despesasPeixariaPorPlano}
                            />
                        </div>
                    </div>

                    {dreData.totalReceitas === 0 && dreData.totalDespesas === 0 && dreData.totalCustos === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500 mt-8 rounded-2xl border border-dashed border-border/50 bg-muted/10">
                            <div className="bg-muted/10 p-5 rounded-full mb-4 shadow-sm border border-border/50">
                                <BarChart3 className="w-8 h-8 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Sem movimentações</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mb-6">
                                Registre receitas, despesas ou custos operacionais para que o relatório DRE possa calcular seu resultado consolidado.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
