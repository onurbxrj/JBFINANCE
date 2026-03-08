"use client";

import { useEffect, useState, useMemo } from "react";
import { getReceitas, getDespesas, getCustosGelo, getCustosPeixe, getAllRateios, Receita, Despesa, CustoGelo, CustoPeixe, RateioDespesa } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isSameMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DrePeixariaPage() {
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
                const [r, d, cg, cp, rt] = await Promise.all([getReceitas(), getDespesas(), getCustosGelo(), getCustosPeixe(), getAllRateios()]);
                setReceitas(r); setDespesas(d); setCustosGelo(cg); setCustosPeixe(cp); setRateios(rt);
            } catch (error) { console.error(error); }
            finally { setIsLoading(false); }
        }
        load();
    }, []);

    const dreData = useMemo(() => {
        let receita = 0, custos = 0, despesasSetor = 0;
        const despesasPorPlano: Record<string, number> = {};

        receitas.forEach(r => {
            const dDate = new Date(r.data + "T12:00:00");
            if (isSameMonth(dDate, currentDate) && r.setor === 'PEIXARIA') {
                receita += r.valor;
            }
        });

        custosGelo.forEach(c => {
            const dDate = new Date(c.data + "T12:00:00");
            if (isSameMonth(dDate, currentDate)) {
                custos += c.custo_total || (c.quantidade * c.custo_unitario);
            }
        });

        custosPeixe.forEach(c => {
            const dDate = new Date(c.data + "T12:00:00");
            if (isSameMonth(dDate, currentDate)) {
                custos += c.custo_total || (c.quantidade * c.custo_unitario);
            }
        });

        despesas.forEach(dp => {
            const dDate = new Date(dp.data + "T12:00:00");
            if (!isSameMonth(dDate, currentDate)) return;

            const plano = dp.plano_contas || 'Sem Plano';
            if (dp.tipo_rateio === 'nenhum' || !dp.tipo_rateio) {
                if (dp.centro_custo === 'Peixaria') {
                    despesasSetor += dp.valor;
                    despesasPorPlano[plano] = (despesasPorPlano[plano] || 0) + dp.valor;
                }
            } else if (dp.tipo_rateio === 'igual') {
                const perc = dp.valor / 2;
                despesasSetor += perc;
                despesasPorPlano[plano] = (despesasPorPlano[plano] || 0) + perc;
            } else if (dp.tipo_rateio === 'percentual') {
                const myRateios = rateios.filter(rt => rt.despesa_id === dp.id);
                const percReal = myRateios.find(rt => rt.setor === 'Peixaria')?.percentual || 0;
                const perc = (dp.valor * percReal) / 100;
                despesasSetor += perc;
                despesasPorPlano[plano] = (despesasPorPlano[plano] || 0) + perc;
            }
        });

        const resultado = receita - custos - despesasSetor;
        return {
            receita,
            custos,
            despesas: despesasSetor,
            despesasPorPlano,
            resultado,
            margem: receita > 0 ? (resultado / receita) * 100 : 0
        };
    }, [receitas, despesas, custosGelo, custosPeixe, rateios, currentDate]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">DRE — Peixaria</h1>
                    <p className="text-sm text-muted-foreground mt-1">Demonstração do Resultado do Exercício do setor Peixaria</p>
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
                    <div className="h-[400px] w-full max-w-3xl rounded-xl bg-muted/20 animate-pulse border border-border/50" />
                </div>
            ) : (
                <Card className="glass-card inner-border max-w-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-3">
                        <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Resultado Peixaria
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            <div className="p-4 px-6 flex justify-between items-center hover:bg-muted/20 transition-colors">
                                <span className="font-semibold text-foreground text-sm tracking-tight">1. Receita Bruta (Peixaria)</span>
                                <span className="font-bold text-success financial-value">{formatCurrency(dreData.receita)}</span>
                            </div>
                            <div className="p-4 px-6 pl-10 flex justify-between items-center text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                                <span>(-) Custos Diretos (Gelo + Peixe)</span>
                                <span className="font-medium text-danger financial-value">{formatCurrency(dreData.custos)}</span>
                            </div>
                            <div className="p-4 px-6 flex justify-between items-center bg-primary/5 font-semibold text-sm tracking-tight">
                                <span className="text-foreground">= Lucro Bruto</span>
                                <span className="text-foreground financial-value">{formatCurrency(dreData.receita - dreData.custos)}</span>
                            </div>
                            {Object.entries(dreData.despesasPorPlano).map(([plano, valor]) => (
                                <div key={plano} className="p-4 px-6 pl-10 flex justify-between items-center text-[13px] text-muted-foreground hover:bg-muted/20 transition-colors">
                                    <span>(-) {plano}</span>
                                    <span className="font-medium text-danger financial-value">-{formatCurrency(valor)}</span>
                                </div>
                            ))}
                            <div className="p-4 px-6 flex justify-between items-center bg-background/20 font-bold text-lg">
                                <span className="text-foreground">= Resultado Operacional</span>
                                <span className={`financial-value ${dreData.resultado >= 0 ? 'text-gradient-accent text-xl' : 'text-danger text-xl'}`}>{formatCurrency(dreData.resultado)}</span>
                            </div>
                            <div className="p-3 px-6 text-right bg-muted/20">
                                <span className={dreData.margem >= 0 ? "badge-glass-success" : "badge-glass-danger"}>
                                    Margem: {dreData.margem.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isLoading && dreData.receita === 0 && dreData.despesas === 0 && dreData.custos === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500 mt-8 rounded-2xl border border-dashed border-border/50 bg-muted/10 max-w-3xl">
                    <div className="bg-muted/10 p-5 rounded-full mb-4 shadow-sm border border-border/50">
                        <BarChart3 className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Sem movimentações</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                        Registre receitas, custos (gelo/peixe) e despesas com setor Peixaria para visualizar o DRE setorial.
                    </p>
                </div>
            )}
        </div>
    );
}
