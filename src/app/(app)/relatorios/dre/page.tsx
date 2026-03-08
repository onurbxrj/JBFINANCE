"use client";

import { useEffect, useState } from "react";
import { getDreData } from "@/app/actions/dre";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isSameMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DrePage() {
    const [dreData, setDreData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            try {
                const data = await getDreData(currentDate.toISOString());
                setDreData(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [currentDate]);

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
                        <span className={`financial-value ${resultado >= 0 ? 'text-gradient-accent text-xl' : 'text-danger text-xl'}`}>
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
            ) : dreData && (
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
