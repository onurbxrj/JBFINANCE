"use client";

import { useEffect, useState, useMemo } from "react";
import { getCustosGelo, addCustoGelo, updateCustoGelo, deleteCustoGelo, CustoGelo } from "@/lib/api";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CustosGeloPage() {
    const [custosGelo, setCustosGelo] = useState<CustoGelo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isGeloOpen, setIsGeloOpen] = useState(false);
    const [isGeloSubmitting, setIsGeloSubmitting] = useState(false);
    const [editingGeloId, setEditingGeloId] = useState<string | null>(null);
    const { role, userId } = useAuth();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    const [geloData, setGeloData] = useState(new Date().toISOString().split("T")[0]);
    const [geloQuantidade, setGeloQuantidade] = useState("");
    const [geloCustoUnitario, setGeloCustoUnitario] = useState("");
    const [geloValorVenda, setGeloValorVenda] = useState("");

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setIsLoading(true);
            const gelo = await getCustosGelo();
            setCustosGelo(gelo);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmitGelo(e: React.FormEvent) {
        e.preventDefault();
        try {
            setIsGeloSubmitting(true);
            const qtd = parseFloat(geloQuantidade);
            const unit = parseFloat(geloCustoUnitario);
            const payload = {
                data: geloData,
                quantidade: qtd,
                custo_unitario: unit,
                custo_total: qtd * unit,
                valor_venda: parseFloat(geloValorVenda || "0"),
                created_by: userId || undefined,
            };

            if (editingGeloId) {
                await updateCustoGelo(editingGeloId, payload);
            } else {
                await addCustoGelo(payload);
            }

            setIsGeloOpen(false);
            setEditingGeloId(null);
            setGeloData(new Date().toISOString().split("T")[0]);
            setGeloQuantidade("");
            setGeloCustoUnitario("");
            setGeloValorVenda("");
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar custo de gelo.");
        } finally {
            setIsGeloSubmitting(false);
        }
    }

    function handleEditGelo(c: CustoGelo) {
        setEditingGeloId(c.id!);
        setGeloData(c.data.split('T')[0]);
        setGeloQuantidade(c.quantidade.toString());
        setGeloCustoUnitario(c.custo_unitario.toString());
        setGeloValorVenda(c.valor_venda.toString());
        setIsGeloOpen(true);
    }

    async function handleDeleteGelo(id: string) {
        if (!window.confirm("Deseja realmente excluir este registro?")) return;
        try {
            await deleteCustoGelo(id);
            setCustosGelo(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir registro.");
        }
    }

    function handleCloseModal(open: boolean) {
        setIsGeloOpen(open);
        if (!open) {
            setEditingGeloId(null);
            setGeloData(new Date().toISOString().split("T")[0]);
            setGeloQuantidade("");
            setGeloCustoUnitario("");
            setGeloValorVenda("");
        }
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return custosGelo.filter(c => c.data.includes(q));
    }, [custosGelo, search]);

    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);
    const totalValue = useMemo(() => filtered.reduce((acc, c) => acc + (c.custo_total || c.quantidade * c.custo_unitario), 0), [filtered]);

    const inputClasses = "bg-muted/40 border-border/50 text-foreground";
    const labelClasses = "text-[13px] text-muted-foreground";

    return (
        <div className="space-y-6 animate-in fade-in duration-500 w-full">
            <div className="flex justify-between items-center w-full">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Custos — Gelo</h1>
                    <p className="text-[13px] text-muted-foreground mt-1">Controle de custos operacionais de gelo (Peixaria)</p>
                </div>
                <Dialog open={isGeloOpen} onOpenChange={handleCloseModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Registro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[460px] bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">{editingGeloId ? "Editar Custo — Gelo" : "Registrar Custo — Gelo"}</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[13px]">Preencha os campos abaixo.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitGelo} className="space-y-4 pt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="geloData" className={labelClasses}>Data</Label>
                                <Input id="geloData" type="date" value={geloData} onChange={(e) => setGeloData(e.target.value)} required className={inputClasses} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="geloQtd" className={labelClasses}>Quantidade (Sacos)</Label>
                                    <Input id="geloQtd" type="number" step="0.01" value={geloQuantidade} onChange={(e) => setGeloQuantidade(e.target.value)} required className={inputClasses} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="geloUnit" className={labelClasses}>Custo Unitário (R$)</Label>
                                    <Input id="geloUnit" type="number" step="0.01" value={geloCustoUnitario} onChange={(e) => setGeloCustoUnitario(e.target.value)} required className={inputClasses} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="geloVenda" className={labelClasses}>Preço de Venda (R$)</Label>
                                <Input id="geloVenda" type="number" step="0.01" value={geloValorVenda} onChange={(e) => setGeloValorVenda(e.target.value)} className={inputClasses} />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => handleCloseModal(false)} className="text-muted-foreground">Cancelar</Button>
                                <Button type="submit" disabled={isGeloSubmitting} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    {isGeloSubmitting ? "Salvando..." : "Salvar"}
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
                        <CardTitle className="text-[15px]">Histórico de Gelo</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Buscar por data..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-muted/40 border-border/50 text-[13px] h-9 rounded-lg" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                    ) : paginated.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum custo de gelo registrado.</p>
                    ) : (
                        <>
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Data</TableHead>
                                            <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Qtd</TableHead>
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
                                                <TableCell className="text-right text-[13px] text-muted-foreground">{c.quantidade}</TableCell>
                                                <TableCell className="text-right text-[13px] text-muted-foreground financial-value">{formatCurrency(c.custo_unitario)}</TableCell>
                                                <TableCell className="text-right font-semibold text-[13px] text-danger financial-value">
                                                    {formatCurrency(c.custo_total || (c.quantidade * c.custo_unitario))}
                                                </TableCell>
                                                {role !== 'funcionario' && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditGelo(c)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10" onClick={() => handleDeleteGelo(c.id!)}>
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
