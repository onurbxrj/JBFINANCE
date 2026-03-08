"use client";

import { useEffect, useState, useMemo } from "react";
import { getReceitas, addReceita, updateReceita, deleteReceita, Receita } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Edit2, Trash2, Plus, Search, ChevronLeft, ChevronRight, FileDown, Filter, X } from "lucide-react";
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

    // Advanced Filters
    const [filterDataInicio, setFilterDataInicio] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterSetor, setFilterSetor] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = filterDataInicio || filterDataFim || filterSetor || filterCategoria;

    function clearFilters() {
        setFilterDataInicio('');
        setFilterDataFim('');
        setFilterSetor('');
        setFilterCategoria('');
        setPage(1);
    }

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
        return receitas.filter(r => {
            // Text search
            if (q && !(
                r.categoria.toLowerCase().includes(q) ||
                r.setor.toLowerCase().includes(q) ||
                r.data.includes(q)
            )) return false;

            // Date range filter
            const rDate = r.data.split('T')[0];
            if (filterDataInicio && rDate < filterDataInicio) return false;
            if (filterDataFim && rDate > filterDataFim) return false;

            // Setor filter
            if (filterSetor && r.setor !== filterSetor) return false;

            // Categoria filter
            if (filterCategoria && r.categoria !== filterCategoria) return false;

            return true;
        });
    }, [receitas, search, filterDataInicio, filterDataFim, filterSetor, filterCategoria]);

    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    // Total value
    const totalValue = useMemo(() => filtered.reduce((acc, r) => acc + r.valor, 0), [filtered]);

    /** Exporta os dados filtrados em PDF */
    async function handleExportPDF() {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF('portrait', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('JB Finance — Relatório de Receitas', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 27);

        // Active filters info
        let filterY = 33;
        const filterTexts: string[] = [];
        if (filterDataInicio || filterDataFim) {
            const ini = filterDataInicio ? format(new Date(filterDataInicio + 'T12:00:00'), 'dd/MM/yyyy') : 'início';
            const fim = filterDataFim ? format(new Date(filterDataFim + 'T12:00:00'), 'dd/MM/yyyy') : 'hoje';
            filterTexts.push(`Período: ${ini} a ${fim}`);
        }
        if (filterSetor) filterTexts.push(`Setor: ${filterSetor === 'ACOUQUE' ? 'Açougue' : 'Peixaria'}`);
        if (filterCategoria) filterTexts.push(`Categoria: ${filterCategoria}`);
        if (search) filterTexts.push(`Busca: "${search}"`);

        if (filterTexts.length > 0) {
            doc.setTextColor(80);
            const wrappedText = doc.splitTextToSize(`Filtros: ${filterTexts.join(' | ')}`, pageWidth - 28);
            doc.text(wrappedText, 14, filterY);
            filterY += 6 * wrappedText.length;
        }

        // Table
        const rows = filtered.map(r => [
            format(new Date(r.data), 'dd/MM/yyyy', { locale: ptBR }),
            r.setor === 'ACOUQUE' ? 'Açougue' : 'Peixaria',
            r.categoria,
            formatCurrency(r.valor),
        ]);

        autoTable(doc, {
            startY: filterY + 2,
            head: [['Data', 'Setor', 'Categoria', 'Valor']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [17, 17, 24], textColor: [232, 232, 237], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, textColor: [60, 60, 70] },
            alternateRowStyles: { fillColor: [245, 245, 250] },
            columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
            margin: { left: 14, right: 14 },
        });

        // Footer with totals
        const finalY = (doc as any).lastAutoTable?.finalY || 200;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40);
        doc.text(`Total: ${formatCurrency(totalValue)}`, pageWidth - 14, finalY + 10, { align: 'right' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(`${filtered.length} registro(s)`, 14, finalY + 10);

        // Download com nome correto via anchor tag
        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        const fileName = `receitas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }



    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center w-full">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Receitas</h1>
                    <p className="text-[13px] text-muted-foreground mt-1">Gerencie todas as receitas por setor</p>
                </div>

                <Dialog open={isOpen} onOpenChange={handleCloseModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-black font-bold shadow-lg shadow-primary/20 font-medium gap-2">
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
                                <Button type="submit" disabled={isSubmitting} className="text-black font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    {isSubmitting ? "Salvando..." : "Salvar Receita"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary badges + Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="bg-success/10 text-success rounded-full px-4 py-1.5 text-[13px] font-semibold">
                        Total: {formatCurrency(totalValue)}
                    </div>
                    <div className="bg-muted/50 text-muted-foreground rounded-full px-4 py-1.5 text-[13px]">
                        {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`gap-2 text-[13px] ${hasActiveFilters ? 'border-primary/50 text-primary' : 'text-muted-foreground'}`}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filtros
                        {hasActiveFilters && (
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center">
                                {[filterDataInicio, filterDataFim, filterSetor, filterCategoria].filter(Boolean).length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={filtered.length === 0}
                        className="gap-2 text-[13px] text-muted-foreground disabled:opacity-40"
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Advanced Filters Bar */}
            {showFilters && (
                <div className="glass-card rounded-xl p-4 border border-border animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-[13px] text-muted-foreground">Data Início</Label>
                            <Input
                                type="date"
                                value={filterDataInicio}
                                onChange={(e) => { setFilterDataInicio(e.target.value); setPage(1); }}
                                className="bg-muted/40 border-border/50 text-foreground h-9 text-[13px]"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[13px] text-muted-foreground">Data Fim</Label>
                            <Input
                                type="date"
                                value={filterDataFim}
                                onChange={(e) => { setFilterDataFim(e.target.value); setPage(1); }}
                                className="bg-muted/40 border-border/50 text-foreground h-9 text-[13px]"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[13px] text-muted-foreground">Setor</Label>
                            <Select value={filterSetor} onValueChange={(v) => { setFilterSetor(v === '__all__' ? '' : v); setPage(1); }}>
                                <SelectTrigger className="bg-muted/40 border-border/50 text-foreground h-9 text-[13px]">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="__all__">Todos</SelectItem>
                                    <SelectItem value="ACOUQUE">Açougue</SelectItem>
                                    <SelectItem value="PEIXARIA">Peixaria</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[13px] text-muted-foreground">Categoria</Label>
                            <Select value={filterCategoria} onValueChange={(v) => { setFilterCategoria(v === '__all__' ? '' : v); setPage(1); }}>
                                <SelectTrigger className="bg-muted/40 border-border/50 text-foreground h-9 text-[13px]">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="__all__">Todas</SelectItem>
                                    {Object.values(CATEGORIAS_POR_SETOR).flat().filter((item, i, ar) => ar.indexOf(item) === i).sort().map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex justify-end mt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="gap-1.5 text-[12px] text-muted-foreground hover:text-danger"
                            >
                                <X className="w-3.5 h-3.5" />
                                Limpar Filtros
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Active Removable Tags (UX Pro Max) */}
            {hasActiveFilters && !showFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in duration-300">
                    <span className="text-[12px] text-muted-foreground mr-1">Filtros ativos:</span>

                    {(filterDataInicio || filterDataFim) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-medium">
                            <span className="max-w-[150px] truncate">
                                Período: {filterDataInicio ? format(new Date(filterDataInicio + 'T12:00:00'), 'dd/MM/yyyy') : '...'} a {filterDataFim ? format(new Date(filterDataFim + 'T12:00:00'), 'dd/MM/yyyy') : '...'}
                            </span>
                            <button onClick={() => { setFilterDataInicio(''); setFilterDataFim(''); setPage(1); }} className="hover:text-foreground">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filterSetor && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-medium">
                            <span className="max-w-[150px] truncate">Setor: {filterSetor === 'ACOUQUE' ? 'Açougue' : 'Peixaria'}</span>
                            <button onClick={() => { setFilterSetor(''); setPage(1); }} className="hover:text-foreground">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filterCategoria && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-medium">
                            <span className="max-w-[150px] truncate">Cat: {filterCategoria}</span>
                            <button onClick={() => { setFilterCategoria(''); setPage(1); }} className="hover:text-foreground">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-[11px] text-muted-foreground hover:text-danger px-2 py-0 ml-1">
                        Limpar todos
                    </Button>
                </div>
            )}

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
                                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${p === page ? 'bg-primary text-black font-bold' : 'hover:bg-muted/50 text-muted-foreground'}`}>
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
