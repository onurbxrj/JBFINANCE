"use client";

import { useEffect, useState, useMemo } from "react";
import { getCustosPeixe, addCustoPeixe, updateCustoPeixe, deleteCustoPeixe, CustoPeixe } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Edit2, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CustosPeixePage() {
    const [custosPeixe, setCustosPeixe] = useState<CustoPeixe[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isPeixeOpen, setIsPeixeOpen] = useState(false);
    const [isPeixeSubmitting, setIsPeixeSubmitting] = useState(false);
    const [editingPeixeId, setEditingPeixeId] = useState<string | null>(null);
    const { role } = useAuth();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    const [peixeData, setPeixeData] = useState(new Date().toISOString().split("T")[0]);
    const [peixeProduto, setPeixeProduto] = useState("");
    const [peixeQuantidade, setPeixeQuantidade] = useState("");
    const [peixeCustoUnitario, setPeixeCustoUnitario] = useState("");
    const [peixeValorVenda, setPeixeValorVenda] = useState("");
    const [peixeObservacao, setPeixeObservacao] = useState("");

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setIsLoading(true);
            const peixe = await getCustosPeixe();
            setCustosPeixe(peixe);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmitPeixe(e: React.FormEvent) {
        e.preventDefault();
        try {
            setIsPeixeSubmitting(true);
            const qtd = parseFloat(peixeQuantidade);
            const unit = parseFloat(peixeCustoUnitario);
            const payload = {
                data: peixeData,
                produto: peixeProduto,
                quantidade: qtd,
                custo_unitario: unit,
                custo_total: qtd * unit,
                valor_venda: parseFloat(peixeValorVenda || "0"),
                observacao: peixeObservacao,
            };

            if (editingPeixeId) {
                await updateCustoPeixe(editingPeixeId, payload);
            } else {
                await addCustoPeixe(payload);
            }

            setIsPeixeOpen(false);
            setEditingPeixeId(null);
            setPeixeData(new Date().toISOString().split("T")[0]);
            setPeixeProduto("");
            setPeixeQuantidade("");
            setPeixeCustoUnitario("");
            setPeixeValorVenda("");
            setPeixeObservacao("");
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar custo de peixe.");
        } finally {
            setIsPeixeSubmitting(false);
        }
    }

    function handleEditPeixe(c: CustoPeixe) {
        setEditingPeixeId(c.id!);
        setPeixeData(c.data.split('T')[0]);
        setPeixeProduto(c.produto);
        setPeixeQuantidade(c.quantidade.toString());
        setPeixeCustoUnitario(c.custo_unitario.toString());
        setPeixeValorVenda(c.valor_venda.toString());
        setPeixeObservacao(c.observacao || "");
        setIsPeixeOpen(true);
    }

    async function handleDeletePeixe(id: string) {
        if (!window.confirm("Deseja realmente excluir este registro?")) return;
        try {
            await deleteCustoPeixe(id);
            setCustosPeixe(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir registro.");
        }
    }

    function handleCloseModal(open: boolean) {
        setIsPeixeOpen(open);
        if (!open) {
            setEditingPeixeId(null);
            setPeixeData(new Date().toISOString().split("T")[0]);
            setPeixeProduto("");
            setPeixeQuantidade("");
            setPeixeCustoUnitario("");
            setPeixeValorVenda("");
            setPeixeObservacao("");
        }
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return custosPeixe.filter(c =>
            c.produto.toLowerCase().includes(q) ||
            c.data.includes(q)
        );
    }, [custosPeixe, search]);

    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);
    const totalValue = useMemo(() => filtered.reduce((acc, c) => acc + (c.custo_total || c.quantidade * c.custo_unitario), 0), [filtered]);

    const inputClasses = "bg-muted/40 border-border/50 text-foreground";
    const labelClasses = "text-[13px] text-muted-foreground";

    return (
        <div className="space-y-6 animate-in fade-in duration-500 w-full">
            <div className="flex justify-between items-center w-full">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Custos — Peixe</h1>
                    <p className="text-[13px] text-muted-foreground mt-1">Controle de compras e custos de pescados</p>
                </div>
                <Dialog open={isPeixeOpen} onOpenChange={handleCloseModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Registro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[520px] bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">{editingPeixeId ? "Editar Custo — Peixe" : "Registrar Custo — Peixe"}</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[13px]">Preencha os campos abaixo.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitPeixe} className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="peixeData" className={labelClasses}>Data</Label>
                                    <Input id="peixeData" type="date" value={peixeData} onChange={(e) => setPeixeData(e.target.value)} required className={inputClasses} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="peixeProduto" className={labelClasses}>Produto</Label>
                                    <Input id="peixeProduto" placeholder="Qual peixe?" value={peixeProduto} onChange={(e) => setPeixeProduto(e.target.value)} required className={inputClasses} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="peixeQtd" className={labelClasses}>Quantidade (Kg)</Label>
                                    <Input id="peixeQtd" type="number" step="0.01" value={peixeQuantidade} onChange={(e) => setPeixeQuantidade(e.target.value)} required className={inputClasses} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="peixeUnit" className={labelClasses}>Custo Unitário (R$)</Label>
                                    <Input id="peixeUnit" type="number" step="0.01" value={peixeCustoUnitario} onChange={(e) => setPeixeCustoUnitario(e.target.value)} required className={inputClasses} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="peixeVenda" className={labelClasses}>Preço de Venda (R$)</Label>
                                <Input id="peixeVenda" type="number" step="0.01" value={peixeValorVenda} onChange={(e) => setPeixeValorVenda(e.target.value)} className={inputClasses} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="peixeObs" className={labelClasses}>Observação</Label>
                                <Textarea id="peixeObs" value={peixeObservacao} onChange={(e) => setPeixeObservacao(e.target.value)} className={inputClasses + " min-h-[80px] resize-none"} />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => handleCloseModal(false)} className="text-muted-foreground">Cancelar</Button>
                                <Button type="submit" disabled={isPeixeSubmitting} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    {isPeixeSubmitting ? "Salvando..." : "Salvar"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-3">
                <div className="bg-danger/10 text-danger rounded-full px-4 py-1.5 text-[13px] font-semibold">
                    Total: {formatCurrency(totalValue)}
                </div>
                <div className="bg-muted/50 text-muted-foreground rounded-full px-4 py-1.5 text-[13px]">
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-[15px]">Histórico de Peixe</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Buscar por produto..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-muted/40 border-border/50 text-[13px] h-9 rounded-lg" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                    ) : paginated.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum custo de peixe registrado.</p>
                    ) : (
                        <>
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Data</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Produto</TableHead>
                                            <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Qtd (Kg)</TableHead>
                                            <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Unitário</TableHead>
                                            <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Custo Total</TableHead>
                                            {role !== 'funcionario' && (
                                                <TableHead className="w-[100px] text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.map((c) => (
                                            <TableRow key={c.id} className="hover:bg-muted/20 transition-colors even:bg-muted/10">
                                                <TableCell className="text-[13px] text-foreground">{format(new Date(c.data), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{c.produto}</TableCell>
                                                <TableCell className="text-right text-[13px] text-muted-foreground">{c.quantidade}</TableCell>
                                                <TableCell className="text-right text-[13px] text-muted-foreground financial-value">{formatCurrency(c.custo_unitario)}</TableCell>
                                                <TableCell className="text-right font-semibold text-[13px] text-danger financial-value">
                                                    {formatCurrency(c.custo_total || (c.quantidade * c.custo_unitario))}
                                                </TableCell>
                                                {role !== 'funcionario' && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditPeixe(c)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10" onClick={() => handleDeletePeixe(c.id!)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 text-[13px] text-muted-foreground">
                                    <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map(p => (
                                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'hover:bg-muted/50 text-muted-foreground'}`}>{p}</button>
                                        ))}
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
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
