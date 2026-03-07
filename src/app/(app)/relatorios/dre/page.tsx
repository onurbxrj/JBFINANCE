"use client";

import { useEffect, useState, useMemo } from "react";
import { getReceitas, getDespesas, getCustosGelo, getCustosPeixe, getAllRateios, Receita, Despesa, CustoGelo, CustoPeixe, RateioDespesa } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function DrePage() {
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [despesas, setDespesas] = useState<Despesa[]>([]);
    const [custosGelo, setCustosGelo] = useState<CustoGelo[]>([]);
    const [custosPeixe, setCustosPeixe] = useState<CustoPeixe[]>([]);
    const [rateios, setRateios] = useState<RateioDespesa[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

        receitas.forEach(r => {
            totalReceitas += r.valor;
            if (r.setor === 'ACOUQUE') receitasAcougue += r.valor;
            if (r.setor === 'PEIXARIA') receitasPeixaria += r.valor;
        });

        custosGelo.forEach(c => {
            const total = c.custo_total || (c.quantidade * c.custo_unitario);
            totalCustos += total;
            custosPeixariaVal += total;
        });

        custosPeixe.forEach(c => {
            const total = c.custo_total || (c.quantidade * c.custo_unitario);
            totalCustos += total;
            custosPeixariaVal += total;
        });

        despesas.forEach(dp => {
            totalDespesas += dp.valor;
            if (dp.tipo_rateio === 'nenhum' || !dp.tipo_rateio) {
                if (dp.centro_custo === 'Açougue') despesasAcougue += dp.valor;
                if (dp.centro_custo === 'Peixaria') despesasPeixariaVal += dp.valor;
            } else {
                const myRateios = rateios.filter(rt => rt.despesa_id === dp.id);
                if (myRateios.length > 0) {
                    const percAcougue = myRateios.find(rt => rt.setor === 'Açougue')?.percentual || 0;
                    const percPeixaria = myRateios.find(rt => rt.setor === 'Peixaria')?.percentual || 0;
                    despesasAcougue += (dp.valor * percAcougue) / 100;
                    despesasPeixariaVal += (dp.valor * percPeixaria) / 100;
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
            resultadoLoja, resultadoAcougue, resultadoPeixaria,
            margem: totalReceitas > 0 ? (resultadoLoja / totalReceitas) * 100 : 0,
            margemAcougue: receitasAcougue > 0 ? (resultadoAcougue / receitasAcougue) * 100 : 0,
            margemPeixaria: receitasPeixaria > 0 ? (resultadoPeixaria / receitasPeixaria) * 100 : 0,
        };
    }, [receitas, despesas, custosGelo, custosPeixe, rateios]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const DreTable = ({ title, receita, custos, despesas, resultado, margem }: {
        title: string; receita: number; custos: number; despesas: number; resultado: number; margem: number;
    }) => (
        <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-[15px] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    <div className="p-4 px-6 flex justify-between items-center hover:bg-muted/20 transition-colors">
                        <span className="font-medium text-foreground text-[14px]">1. Receita Bruta</span>
                        <span className="font-bold text-success financial-value">{formatCurrency(receita)}</span>
                    </div>
                    <div className="p-4 px-6 pl-10 flex justify-between items-center text-[13px] text-muted-foreground hover:bg-muted/20 transition-colors">
                        <span>(-) Custos Diretos</span>
                        <span className="font-medium text-danger financial-value">{formatCurrency(custos)}</span>
                    </div>
                    <div className="p-4 px-6 flex justify-between items-center bg-primary/5 font-semibold text-[14px]">
                        <span className="text-foreground">= Lucro Bruto</span>
                        <span className="text-foreground financial-value">{formatCurrency(receita - custos)}</span>
                    </div>
                    <div className="p-4 px-6 pl-10 flex justify-between items-center text-[13px] text-muted-foreground hover:bg-muted/20 transition-colors">
                        <span>(-) Despesas Rateadas / Fixas</span>
                        <span className="font-medium text-danger financial-value">{formatCurrency(despesas)}</span>
                    </div>
                    <div className="p-4 px-6 flex justify-between items-center bg-gradient-to-r from-primary/20 to-primary/5 font-bold text-lg">
                        <span className="text-foreground">= Resultado Operacional</span>
                        <span className={`financial-value ${resultado >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(resultado)}
                        </span>
                    </div>
                    <div className="p-3 px-6 text-right text-[13px] text-muted-foreground bg-muted/20">
                        Margem: <span className="font-semibold text-foreground">{margem.toFixed(2)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">DRE Gerencial</h1>
                <p className="text-[13px] text-muted-foreground mt-1">Demonstração do Resultado do Exercício — Consolidado e por Setor</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    <div>
                        <h2 className="text-[15px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">DRE Consolidado (Loja)</h2>
                        <div className="max-w-3xl">
                            <DreTable
                                title="Resultado Geral da Loja"
                                receita={dreData.totalReceitas}
                                custos={dreData.totalCustos}
                                despesas={dreData.totalDespesas}
                                resultado={dreData.resultadoLoja}
                                margem={dreData.margem}
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[15px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">DRE por Setor</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DreTable
                                title="Açougue"
                                receita={dreData.receitasAcougue}
                                custos={dreData.custosAcougue}
                                despesas={dreData.despesasAcougue}
                                resultado={dreData.resultadoAcougue}
                                margem={dreData.margemAcougue}
                            />
                            <DreTable
                                title="Peixaria"
                                receita={dreData.receitasPeixaria}
                                custos={dreData.custosPeixaria}
                                despesas={dreData.despesasPeixaria}
                                resultado={dreData.resultadoPeixaria}
                                margem={dreData.margemPeixaria}
                            />
                        </div>
                    </div>

                    {dreData.totalReceitas === 0 && dreData.totalDespesas === 0 && dreData.totalCustos === 0 && (
                        <div className="text-center p-8 bg-muted/30 rounded-2xl border border-dashed border-border">
                            <p className="text-muted-foreground text-lg font-medium">Nenhum dado lançado ainda</p>
                            <p className="text-muted-foreground/70 text-sm mt-1">Registre receitas, despesas ou custos para visualizar o relatório DRE completo.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
