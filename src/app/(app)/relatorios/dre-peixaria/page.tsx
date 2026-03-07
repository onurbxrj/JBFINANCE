"use client";

import { useEffect, useState, useMemo } from "react";
import { getReceitas, getDespesas, getCustosGelo, getCustosPeixe, getAllRateios, Receita, Despesa, CustoGelo, CustoPeixe, RateioDespesa } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function DrePeixariaPage() {
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
                const [r, d, cg, cp, rt] = await Promise.all([getReceitas(), getDespesas(), getCustosGelo(), getCustosPeixe(), getAllRateios()]);
                setReceitas(r); setDespesas(d); setCustosGelo(cg); setCustosPeixe(cp); setRateios(rt);
            } catch (error) { console.error(error); }
            finally { setIsLoading(false); }
        }
        load();
    }, []);

    const dreData = useMemo(() => {
        let receita = 0, custos = 0, despesasSetor = 0;
        receitas.forEach(r => { if (r.setor === 'PEIXARIA') receita += r.valor; });
        custosGelo.forEach(c => { custos += c.custo_total || (c.quantidade * c.custo_unitario); });
        custosPeixe.forEach(c => { custos += c.custo_total || (c.quantidade * c.custo_unitario); });
        despesas.forEach(dp => {
            if (dp.tipo_rateio === 'nenhum' || !dp.tipo_rateio) {
                if (dp.centro_custo === 'Peixaria') despesasSetor += dp.valor;
            } else {
                const myRateios = rateios.filter(rt => rt.despesa_id === dp.id);
                const perc = myRateios.find(rt => rt.setor === 'Peixaria')?.percentual || 0;
                despesasSetor += (dp.valor * perc) / 100;
            }
        });
        const resultado = receita - custos - despesasSetor;
        return { receita, custos, despesas: despesasSetor, resultado, margem: receita > 0 ? (resultado / receita) * 100 : 0 };
    }, [receitas, despesas, custosGelo, custosPeixe, rateios]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">DRE — Peixaria</h1>
                <p className="text-[13px] text-muted-foreground mt-1">Demonstração do Resultado do Exercício do setor Peixaria</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <Card className="max-w-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-3">
                        <CardTitle className="text-[15px] flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Resultado Peixaria
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            <div className="p-4 px-6 flex justify-between items-center hover:bg-muted/20 transition-colors">
                                <span className="font-medium text-foreground text-[14px]">1. Receita Bruta (Peixaria)</span>
                                <span className="font-bold text-success financial-value">{formatCurrency(dreData.receita)}</span>
                            </div>
                            <div className="p-4 px-6 pl-10 flex justify-between items-center text-[13px] text-muted-foreground hover:bg-muted/20 transition-colors">
                                <span>(-) Custos Diretos (Gelo + Peixe)</span>
                                <span className="font-medium text-danger financial-value">{formatCurrency(dreData.custos)}</span>
                            </div>
                            <div className="p-4 px-6 flex justify-between items-center bg-primary/5 font-semibold text-[14px]">
                                <span className="text-foreground">= Lucro Bruto</span>
                                <span className="text-foreground financial-value">{formatCurrency(dreData.receita - dreData.custos)}</span>
                            </div>
                            <div className="p-4 px-6 pl-10 flex justify-between items-center text-[13px] text-muted-foreground hover:bg-muted/20 transition-colors">
                                <span>(-) Despesas Rateadas / Fixas</span>
                                <span className="font-medium text-danger financial-value">{formatCurrency(dreData.despesas)}</span>
                            </div>
                            <div className="p-4 px-6 flex justify-between items-center bg-gradient-to-r from-primary/20 to-primary/5 font-bold text-lg">
                                <span className="text-foreground">= Resultado Operacional</span>
                                <span className={`financial-value ${dreData.resultado >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(dreData.resultado)}</span>
                            </div>
                            <div className="p-3 px-6 text-right text-[13px] text-muted-foreground bg-muted/20">
                                Margem: <span className="font-semibold text-foreground">{dreData.margem.toFixed(2)}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isLoading && dreData.receita === 0 && dreData.despesas === 0 && dreData.custos === 0 && (
                <div className="text-center p-8 bg-muted/30 rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground text-lg font-medium">Nenhum dado lançado para a Peixaria</p>
                    <p className="text-muted-foreground/70 text-sm mt-1">Registre receitas, custos de gelo/peixe e despesas com setor Peixaria para visualizar o DRE.</p>
                </div>
            )}
        </div>
    );
}
