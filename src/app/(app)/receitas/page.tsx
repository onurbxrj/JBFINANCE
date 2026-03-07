"use client";

import { useEffect, useState, useMemo } from "react";
import { getReceitas, addReceita, updateReceita, deleteReceita, Receita } from "@/lib/api";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const CATEGORIAS_POR_SETOR: Record<string, string[]> = {
    ACOUQUE: ["Mercearia", "Bebidas", "Frios e Laticinios", "Condimentos", "Carnes"],
    PEIXARIA: ["Atacado Pescado", "Pescados"],
};

export default function ReceitasPage() {
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { role, userId } = useAuth();

    // Search & Pagination
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Form State
    const [data, setData] = useState(new Date().toISOString().split("T")[0]);
    const [setor, setSetor] = useState("ACOUQUE");
    const [categoria, setCategoria] = useState("");
    const [valor, setValor] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setCategoria("");
    }, [setor]);

    async function loadData() {
        try {
            setIsLoading(true);
            const data = await getReceitas();
            setReceitas(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!categoria || !valor) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                data,
                setor,
                categoria,
                valor: parseFloat(valor),
                created_by: userId || undefined,
            };

            if (editingId) {
                await updateReceita(editingId, payload);
            } else {
                await addReceita(payload);
            }

            setIsOpen(false);
            setEditingId(null);

            setData(new Date().toISOString().split("T")[0]);
            setSetor("ACOUQUE");
            setCategoria("");
            setValor("");

            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar receita.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleEdit(receita: Receita) {
        setEditingId(receita.id!);
        setData(receita.data.split('T')[0]);
        setSetor(receita.setor);
        setCategoria(receita.categoria);
        setValor(receita.valor.toString());
        setIsOpen(true);
    }

    async function handleDelete(id: string) {
        if (!window.confirm("Deseja realmente excluir este registro?")) return;
        try {
            await deleteReceita(id);
            setReceitas(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir receita.");
        }
    }

    function handleCloseModal(open: boolean) {
        setIsOpen(open);
        if (!open) {
            setEditingId(null);
            setData(new Date().toISOString().split("T")[0]);
            setSetor("ACOUQUE");
            setCategoria("");
            setValor("");
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Filtered + paginated data
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return receitas.filter(r =>
            r.categoria.toLowerCase().includes(q) ||
            r.setor.toLowerCase().includes(q) ||
            r.data.includes(q)
        );
    }, [receitas, search]);

    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    // Total value
    const totalValue = useMemo(() => filtered.reduce((acc, r) => acc + r.valor, 0), [filtered]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center w-full">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Receitas</h1>
                    <p className="text-[13px] text-muted-foreground mt-1">Gerencie todas as receitas por setor</p>
                </div>

                <Dialog open={isOpen} onOpenChange={handleCloseModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium gap-2">
                            <Plus className="w-4 h-4" />
                            Nova Receita
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[460px] bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">{editingId ? "Editar Receita" : "Registrar Nova Receita"}</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[13px]">
                                Preencha os campos abaixo para registrar ou atualizar a receita.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="data" className="text-[13px] text-muted-foreground">Data</Label>
                                    <Input
                                        id="data"
                                        type="date"
                                        value={data}
                                        onChange={(e) => setData(e.target.value)}
                                        required
                                        className="bg-muted/40 border-border/50 text-foreground"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="valor" className="text-[13px] text-muted-foreground">Valor (R$)</Label>
                                    <Input
                                        id="valor"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0,00"
                                        value={valor}
                                        onChange={(e) => setValor(e.target.value)}
                                        required
                                        className="bg-muted/40 border-border/50 text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[13px] text-muted-foreground">Setor</Label>
                                <Select value={setor} onValueChange={setSetor}>
                                    <SelectTrigger className="bg-muted/40 border-border/50 text-foreground">
                                        <SelectValue placeholder="Selecione o setor" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        <SelectItem value="ACOUQUE">Açougue</SelectItem>
                                        <SelectItem value="PEIXARIA">Peixaria</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[13px] text-muted-foreground">Categoria</Label>
                                <Select value={categoria} onValueChange={setCategoria}>
                                    <SelectTrigger className="bg-muted/40 border-border/50 text-foreground">
                                        <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        {CATEGORIAS_POR_SETOR[setor]?.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => handleCloseModal(false)} className="text-muted-foreground hover:text-foreground">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    {isSubmitting ? "Salvando..." : "Salvar Receita"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary badge */}
            <div className="flex items-center gap-3">
                <div className="bg-success/10 text-success rounded-full px-4 py-1.5 text-[13px] font-semibold">
                    Total: {formatCurrency(totalValue)}
                </div>
                <div className="bg-muted/50 text-muted-foreground rounded-full px-4 py-1.5 text-[13px]">
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-[15px]">Histórico de Receitas</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-9 bg-muted/40 border-border/50 text-[13px] h-9 rounded-lg"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : paginated.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                            {search ? 'Nenhum resultado encontrado.' : 'Lista vazia. Adicione uma receita para ver os dados.'}
                        </p>
                    ) : (
                        <>
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Data</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Setor</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</TableHead>
                                            <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Valor</TableHead>
                                            {role !== 'funcionario' && (
                                                <TableHead className="w-[100px] text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.map((receita) => (
                                            <TableRow key={receita.id} className="hover:bg-muted/20 transition-colors even:bg-muted/10">
                                                <TableCell className="text-[13px] text-foreground">
                                                    {format(new Date(receita.data), "dd/MM/yyyy", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{receita.setor === 'ACOUQUE' ? 'Açougue' : 'Peixaria'}</TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{receita.categoria}</TableCell>
                                                <TableCell className="text-right font-semibold text-[13px] text-success financial-value">
                                                    {formatCurrency(receita.valor)}
                                                </TableCell>
                                                {role !== 'funcionario' && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                onClick={() => handleEdit(receita)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
                                                                onClick={() => handleDelete(receita.id!)}
                                                            >
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 text-[13px] text-muted-foreground">
                                    <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map(p => (
                                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'hover:bg-muted/50 text-muted-foreground'}`}>
                                                {p}
                                            </button>
                                        ))}
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
