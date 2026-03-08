"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getDespesas, addDespesa, updateDespesa, deleteDespesa, saveRateiosDespesa, getRateiosDespesa, getPlanosContas, getCategorias, addPlanoConta, addCategoria, addDespesasBulk, addRateiosBulk, deleteDespesasBulk, Despesa, PlanoConta, Categoria } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Edit2, Trash2, Plus, Search, ChevronLeft, ChevronRight, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Undo2, Loader2, FileDown, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseSpreadsheetFile, findDuplicates, generateRateios, ParsedDespesa, CENTRO_CUSTO_GERAL } from "@/lib/importExcel";
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
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DespesasPage() {
    const [despesas, setDespesas] = useState<Despesa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const [importPreview, setImportPreview] = useState<ParsedDespesa[]>([]);
    const [importDuplicates, setImportDuplicates] = useState<number[]>([]);
    const [importNewPlanos, setImportNewPlanos] = useState<string[]>([]);
    const [importNewCats, setImportNewCats] = useState<string[]>([]);
    const [importStep, setImportStep] = useState<'upload' | 'preview' | 'success'>('upload');
    const [lastImportedIds, setLastImportedIds] = useState<string[]>([]);
    const [importSummary, setImportSummary] = useState<{ total: number; valor: number; porCentro: Record<string, { count: number; valor: number }> } | null>(null);
    const [importProgress, setImportProgress] = useState(0);
    const { role, userId } = useAuth();

    // Search & Pagination
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Advanced Filters
    const [filterDataInicio, setFilterDataInicio] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterPlano, setFilterPlano] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterCentroCusto, setFilterCentroCusto] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = filterDataInicio || filterDataFim || filterPlano || filterCategoria || filterCentroCusto;

    function clearFilters() {
        setFilterDataInicio('');
        setFilterDataFim('');
        setFilterPlano('');
        setFilterCategoria('');
        setFilterCentroCusto('');
        setPage(1);
    }

    // Form State
    const [data, setData] = useState(new Date().toISOString().split("T")[0]);
    const [centroCusto, setCentroCusto] = useState("");
    const [planoContas, setPlanoContas] = useState("");
    const [categoria, setCategoria] = useState("");
    const [descricao, setDescricao] = useState("");
    const [observacao, setObservacao] = useState("");
    const [valor, setValor] = useState("");
    const [tipoRateio, setTipoRateio] = useState("nenhum");
    const [percentualAcougue, setPercentualAcougue] = useState("50");
    const [percentualPeixaria, setPercentualPeixaria] = useState("50");

    const [planosContasOpts, setPlanosContasOpts] = useState<PlanoConta[]>([]);
    const [categoriasOpts, setCategoriasOpts] = useState<Categoria[]>([]);
    const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false);
    const [newPlano, setNewPlano] = useState("");
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [newCat, setNewCat] = useState("");

    useEffect(() => {
        loadData();
        loadOptions();
    }, []);

    async function loadOptions() {
        try {
            const [pc, cat] = await Promise.all([getPlanosContas(), getCategorias()]);
            setPlanosContasOpts(pc);
            setCategoriasOpts(cat);
        } catch (error: any) {
            console.error("Erro ao carregar opções", error?.message || error);
        }
    }

    async function handleSavePlano(e: React.FormEvent) {
        e.preventDefault();
        if (!newPlano) return;
        try {
            const res = await addPlanoConta(newPlano);
            setPlanosContasOpts([...planosContasOpts, res]);
            setPlanoContas(res.nome);
            setIsPlanoModalOpen(false);
            setNewPlano("");
        } catch (e) { alert("Erro ao salvar plano de contas."); }
    }

    async function handleSaveCat(e: React.FormEvent) {
        e.preventDefault();
        if (!newCat) return;
        try {
            const res = await addCategoria(newCat);
            setCategoriasOpts([...categoriasOpts, res]);
            setCategoria(res.nome);
            setIsCatModalOpen(false);
            setNewCat("");
        } catch (e) { alert("Erro ao salvar categoria."); }
    }

    async function loadData() {
        try {
            setIsLoading(true);
            const data = await getDespesas();
            setDespesas(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if ((tipoRateio === "nenhum" && !centroCusto) || !planoContas || !categoria || !descricao || !valor) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                data,
                centro_custo: tipoRateio === "nenhum" ? centroCusto : "Loja",
                plano_contas: planoContas,
                categoria,
                descricao,
                observacao,
                valor: parseFloat(valor),
                tipo_rateio: tipoRateio,
                created_by: userId || undefined,
            };

            let despesaId = editingId;
            if (editingId) {
                await updateDespesa(editingId, payload);
            } else {
                const res = await addDespesa(payload);
                despesaId = res.id;
            }

            if (despesaId) {
                if (tipoRateio === "igual") {
                    await saveRateiosDespesa(despesaId, [
                        { setor: "Açougue", percentual: 50 },
                        { setor: "Peixaria", percentual: 50 }
                    ]);
                } else if (tipoRateio === "percentual") {
                    await saveRateiosDespesa(despesaId, [
                        { setor: "Açougue", percentual: parseFloat(percentualAcougue) || 0 },
                        { setor: "Peixaria", percentual: parseFloat(percentualPeixaria) || 0 }
                    ]);
                } else {
                    await saveRateiosDespesa(despesaId, []);
                }
            }

            setIsOpen(false);
            setEditingId(null);

            setData(new Date().toISOString().split("T")[0]);
            setCentroCusto("");
            setPlanoContas("");
            setCategoria("");
            setDescricao("");
            setObservacao("");
            setValor("");
            setTipoRateio("nenhum");
            setPercentualAcougue("50");
            setPercentualPeixaria("50");

            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar despesa.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleEdit(despesa: Despesa) {
        setEditingId(despesa.id!);
        setData(despesa.data.split('T')[0]);
        setCentroCusto(despesa.centro_custo);
        setPlanoContas(despesa.plano_contas);
        setCategoria(despesa.categoria);
        setDescricao(despesa.descricao);
        setObservacao(despesa.observacao || "");
        setValor(despesa.valor.toString());
        setTipoRateio(despesa.tipo_rateio || "nenhum");
        setIsOpen(true);

        if (despesa.tipo_rateio === "percentual" && despesa.id) {
            try {
                const rateios = await getRateiosDespesa(despesa.id);
                const rAcougue = rateios.find(r => r.setor === "Açougue");
                const rPeixaria = rateios.find(r => r.setor === "Peixaria");
                if (rAcougue) setPercentualAcougue(rAcougue.percentual.toString());
                if (rPeixaria) setPercentualPeixaria(rPeixaria.percentual.toString());
            } catch (error) {
                console.error("Erro ao carregar rateios", error);
            }
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm("Deseja realmente excluir este registro?")) return;
        try {
            await deleteDespesa(id);
            setDespesas(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir despesa.");
        }
    }

    function handleCloseModal(open: boolean) {
        setIsOpen(open);
        if (!open) {
            setEditingId(null);
            setData(new Date().toISOString().split("T")[0]);
            setCentroCusto("");
            setPlanoContas("");
            setCategoria("");
            setDescricao("");
            setObservacao("");
            setValor("");
            setTipoRateio("nenhum");
            setPercentualAcougue("50");
            setPercentualPeixaria("50");
        }
    }

    /** Reseta todo o estado de importação */
    function resetImportState() {
        setImportErrors([]);
        setImportPreview([]);
        setImportDuplicates([]);
        setImportNewPlanos([]);
        setImportNewCats([]);
        setImportStep('upload');
        setIsImporting(false);
        setImportProgress(0);
        setImportSummary(null);
    }

    /** Etapa 1: Faz parsing do arquivo e mostra a pré-visualização */
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportErrors([]);

        try {
            const buffer = await file.arrayBuffer();
            const ext = file.name.split('.').pop()?.toLowerCase() || 'xlsx';
            const result = parseSpreadsheetFile(buffer, planosContasOpts, categoriasOpts, userId || undefined, ext);

            if (result.errors.length > 0) {
                setImportErrors(result.errors);
                setIsImporting(false);
                return;
            }

            if (result.despesas.length === 0) {
                setImportErrors(["Nenhum dado válido encontrado na planilha."]);
                setIsImporting(false);
                return;
            }

            const { duplicates, unique } = findDuplicates(result.despesas, despesas);

            setImportPreview(unique);
            setImportDuplicates(duplicates);
            setImportNewPlanos(result.newPlanos);
            setImportNewCats(result.newCategorias);
            setImportStep('preview');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Desconhecido';
            setImportErrors([`Erro ao processar arquivo (${msg}): verifique o formato.`]);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    }

    /** Etapa 2: Confirma e salva as despesas após pré-visualização */
    async function handleConfirmImport() {
        if (importPreview.length === 0) return;

        setIsImporting(true);
        setImportErrors([]);
        setImportProgress(10);

        try {
            // Criar Planos de Contas novos
            let updatedPlanos = [...planosContasOpts];
            for (const planoName of importNewPlanos) {
                const exists = updatedPlanos.find(p => p.nome.toLowerCase() === planoName.toLowerCase());
                if (!exists) {
                    try {
                        const newP = await addPlanoConta(planoName);
                        updatedPlanos.push(newP);
                    } catch {
                        setImportErrors(prev => [...prev, `Erro ao criar Plano '${planoName}'.`]);
                    }
                }
            }
            setImportProgress(25);

            // Criar Categorias novas
            let updatedCats = [...categoriasOpts];
            for (const catName of importNewCats) {
                const exists = updatedCats.find(c => c.nome.toLowerCase() === catName.toLowerCase());
                if (!exists) {
                    try {
                        const newC = await addCategoria(catName);
                        updatedCats.push(newC);
                    } catch {
                        setImportErrors(prev => [...prev, `Erro ao criar Categoria '${catName}'.`]);
                    }
                }
            }
            setImportProgress(40);

            // Atualizar referências
            const finalDespesas = importPreview.map(d => {
                const planoRef = updatedPlanos.find(p => p.nome.toLowerCase() === d.plano_contas.toLowerCase());
                const catRef = updatedCats.find(c => c.nome.toLowerCase() === d.categoria.toLowerCase());
                return {
                    ...d,
                    plano_contas: planoRef?.nome || d.plano_contas,
                    categoria: catRef?.nome || d.categoria,
                };
            });
            setImportProgress(50);

            // Inserir despesas em lote
            const savedDespesas = await addDespesasBulk(finalDespesas);
            setImportProgress(75);

            // Gerar e inserir rateios
            let savedIds: string[] = [];
            if (savedDespesas && Array.isArray(savedDespesas)) {
                savedIds = savedDespesas.map((d: Despesa) => d.id!).filter(Boolean);
                const rateios = generateRateios(savedDespesas as Despesa[]);
                if (rateios.length > 0) {
                    await addRateiosBulk(rateios);
                }
            }
            setImportProgress(90);

            // Atualizar opções locais
            if (updatedPlanos.length > planosContasOpts.length) setPlanosContasOpts([...updatedPlanos]);
            if (updatedCats.length > categoriasOpts.length) setCategoriasOpts([...updatedCats]);

            // Gerar resumo por centro de custo
            const porCentro: Record<string, { count: number; valor: number }> = {};
            for (const d of finalDespesas) {
                if (!porCentro[d.centro_custo]) porCentro[d.centro_custo] = { count: 0, valor: 0 };
                porCentro[d.centro_custo].count++;
                porCentro[d.centro_custo].valor += d.valor;
            }

            setImportSummary({
                total: finalDespesas.length,
                valor: finalDespesas.reduce((a, d) => a + d.valor, 0),
                porCentro,
            });
            setLastImportedIds(savedIds);
            setImportProgress(100);
            setImportStep('success');
            loadData();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Desconhecido';
            setImportErrors([`Erro no envio (${msg}): verifique o log.`]);
        } finally {
            setIsImporting(false);
        }
    }

    /** Desfaz a última importação removendo todas as despesas inseridas */
    async function handleUndoImport() {
        if (lastImportedIds.length === 0) return;
        if (!window.confirm(`Deseja realmente desfazer a importação e excluir ${lastImportedIds.length} despesa(s)?`)) return;

        try {
            setIsImporting(true);
            await deleteDespesasBulk(lastImportedIds);
            setLastImportedIds([]);
            setIsImportModalOpen(false);
            resetImportState();
            alert(`Importação desfeita com sucesso.`);
            loadData();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Desconhecido';
            alert(`Erro ao desfazer: ${msg}`);
        } finally {
            setIsImporting(false);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Filtered + paginated
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return despesas.filter(d => {
            // Text search
            if (q && !(
                d.categoria.toLowerCase().includes(q) ||
                d.centro_custo.toLowerCase().includes(q) ||
                d.descricao.toLowerCase().includes(q) ||
                d.data.includes(q)
            )) return false;

            // Date range filter
            const dDate = d.data.split('T')[0];
            if (filterDataInicio && dDate < filterDataInicio) return false;
            if (filterDataFim && dDate > filterDataFim) return false;

            // Plano de contas filter
            if (filterPlano && d.plano_contas !== filterPlano) return false;

            // Categoria filter
            if (filterCategoria && d.categoria !== filterCategoria) return false;

            // Centro de Custo filter
            if (filterCentroCusto && d.centro_custo !== filterCentroCusto) return false;

            return true;
        });
    }, [despesas, search, filterDataInicio, filterDataFim, filterPlano, filterCategoria, filterCentroCusto]);

    /** Exporta os dados filtrados em PDF */
    async function handleExportPDF() {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('JB Finance — Relatório de Despesas', 14, 20);

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
        if (filterPlano) filterTexts.push(`Plano: ${filterPlano}`);
        if (filterCategoria) filterTexts.push(`Categoria: ${filterCategoria}`);
        if (filterCentroCusto) filterTexts.push(`C.Custo: ${filterCentroCusto}`);
        if (search) filterTexts.push(`Busca: "${search}"`);

        if (filterTexts.length > 0) {
            doc.setTextColor(80);
            doc.text(`Filtros: ${filterTexts.join(' | ')}`, 14, filterY);
            filterY += 6;
        }

        // Table
        const rows = filtered.map(d => [
            format(new Date(d.data), 'dd/MM/yyyy', { locale: ptBR }),
            d.centro_custo,
            d.plano_contas,
            d.categoria,
            d.descricao.length > 40 ? d.descricao.slice(0, 40) + '...' : d.descricao,
            formatCurrency(d.valor),
        ]);

        autoTable(doc, {
            startY: filterY + 2,
            head: [['Data', 'C.Custo', 'P.Contas', 'Categoria', 'Descrição', 'Valor']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [17, 17, 24], textColor: [232, 232, 237], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, textColor: [60, 60, 70] },
            alternateRowStyles: { fillColor: [245, 245, 250] },
            columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
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

        // Download com nome correto via anchor tag (criação explícita de Blob para evitar hash em Chromium)
        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        const fileName = `despesas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);
    const totalValue = useMemo(() => filtered.reduce((acc, d) => acc + d.valor, 0), [filtered]);

    const inputClasses = "bg-muted/40 border-border/50 text-foreground";
    const labelClasses = "text-[13px] text-muted-foreground";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center w-full">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Despesas</h1>
                    <p className="text-[13px] text-muted-foreground mt-1">Gerencie despesas, rateios e centros de custo</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botão de Importar — somente para Diretor */}
                    {role === 'diretor' && (
                        <Dialog open={isImportModalOpen} onOpenChange={(open) => { setIsImportModalOpen(open); if (!open) resetImportState(); }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="bg-card text-foreground border-border hover:bg-muted/50 gap-2 font-medium">
                                    <Upload className="w-4 h-4" />
                                    <span className="hidden sm:inline">Importar</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={`bg-card border-border ${importStep === 'preview' || importStep === 'success' ? 'sm:max-w-[700px]' : 'sm:max-w-[460px]'}`}>
                                <DialogHeader>
                                    <DialogTitle className="text-foreground">
                                        {importStep === 'upload' && 'Importar Despesas'}
                                        {importStep === 'preview' && 'Pré-visualização da Importação'}
                                        {importStep === 'success' && '✅ Importação Concluída'}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground text-[13px]">
                                        {importStep === 'upload' && 'Faça upload de uma planilha Excel ou CSV para importar despesas em lote.'}
                                        {importStep === 'preview' && 'Confira os dados abaixo antes de confirmar a importação.'}
                                        {importStep === 'success' && 'Todas as despesas foram salvas com sucesso.'}
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Erros */}
                                {importErrors.length > 0 && (
                                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-[13px] text-danger/90 max-h-32 overflow-y-auto">
                                        <p className="font-semibold mb-1">Encontramos os seguintes problemas:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {/* Etapa 1: Upload */}
                                {importStep === 'upload' && (
                                    <div className="space-y-4 pt-2">
                                        <div className="p-4 bg-muted/30 border border-border/50 rounded-xl flex items-center gap-3">
                                            <FileSpreadsheet className="w-8 h-8 text-primary/80" />
                                            <div className="text-[13px]">
                                                <p className="text-foreground font-medium">Precisa do modelo?</p>
                                                <a href="/template-despesas.xlsx" download className="text-primary hover:underline">
                                                    Baixar template preenchível
                                                </a>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className={labelClasses}>Selecione o arquivo (.xlsx)</Label>
                                            <Input
                                                type="file"
                                                accept=".xlsx, .xls"
                                                onChange={handleFileUpload}
                                                disabled={isImporting}
                                                className="bg-muted/40 border-border/50 text-foreground cursor-pointer file:text-foreground file:bg-muted file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md hover:file:bg-muted/80"
                                            />
                                        </div>

                                        {isImporting && (
                                            <p className="text-[13px] text-center text-muted-foreground py-2 animate-pulse">
                                                Processando arquivo...
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Etapa 2: Pré-visualização */}
                                {importStep === 'preview' && (
                                    <div className="space-y-4 pt-2">
                                        {/* Resumo */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
                                                <p className="text-lg font-bold text-primary">{importPreview.length}</p>
                                                <p className="text-[11px] text-muted-foreground">Despesas válidas</p>
                                            </div>
                                            <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-center">
                                                <p className="text-lg font-bold text-success">
                                                    {formatCurrency(importPreview.reduce((acc, d) => acc + d.valor, 0))}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">Valor total</p>
                                            </div>
                                            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-center">
                                                <p className="text-lg font-bold text-danger">{importDuplicates.length}</p>
                                                <p className="text-[11px] text-muted-foreground">Duplicatas removidas</p>
                                            </div>
                                        </div>

                                        {/* Avisos de novos planos/categorias */}
                                        {(importNewPlanos.length > 0 || importNewCats.length > 0) && (
                                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-[13px] text-foreground">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <AlertTriangle className="w-4 h-4 text-primary" />
                                                    <span className="font-semibold">Serão criados automaticamente:</span>
                                                </div>
                                                {importNewPlanos.length > 0 && (
                                                    <p className="text-muted-foreground ml-6">Planos: {importNewPlanos.join(', ')}</p>
                                                )}
                                                {importNewCats.length > 0 && (
                                                    <p className="text-muted-foreground ml-6">Categorias: {importNewCats.join(', ')}</p>
                                                )}
                                            </div>
                                        )}

                                        {importDuplicates.length > 0 && (
                                            <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg text-[13px] text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-danger" />
                                                    <span>{importDuplicates.length} linha(s) removida(s) por duplicidade (data + descrição + valor + centro custo).</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tabela de pré-visualização */}
                                        <div className="rounded-xl border border-border overflow-hidden max-h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                        <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground">Data</TableHead>
                                                        <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground">C.Custo</TableHead>
                                                        <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground">Descrição</TableHead>
                                                        <TableHead className="text-right text-[11px] font-semibold uppercase text-muted-foreground">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {importPreview.slice(0, 50).map((d, i) => (
                                                        <TableRow key={i} className="hover:bg-muted/20 even:bg-muted/10">
                                                            <TableCell className="text-[12px] text-foreground">{d.data}</TableCell>
                                                            <TableCell className="text-[12px] text-muted-foreground">{d.centro_custo}</TableCell>
                                                            <TableCell className="text-[12px] text-muted-foreground max-w-[180px] truncate">{d.descricao}</TableCell>
                                                            <TableCell className="text-right text-[12px] text-danger font-semibold financial-value">{formatCurrency(d.valor)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            {importPreview.length > 50 && (
                                                <p className="text-[11px] text-muted-foreground text-center py-2">... e mais {importPreview.length - 50} linhas</p>
                                            )}
                                        </div>

                                        {/* Botões de ação */}
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button type="button" variant="ghost" onClick={() => resetImportState()} className="text-muted-foreground hover:text-foreground">
                                                Voltar
                                            </Button>
                                            <Button
                                                onClick={handleConfirmImport}
                                                disabled={isImporting || importPreview.length === 0}
                                                className="text-black font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
                                            >
                                                {isImporting ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Importando... {importProgress}%
                                                    </span>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Confirmar Importação ({importPreview.length})
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Progress bar */}
                                        {isImporting && importProgress > 0 && (
                                            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${importProgress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Etapa 3: Sucesso + Resumo */}
                                {importStep === 'success' && importSummary && (
                                    <div className="space-y-4 pt-2">
                                        {/* Resumo geral */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center">
                                                <p className="text-2xl font-bold text-success">{importSummary.total}</p>
                                                <p className="text-[11px] text-muted-foreground">Despesas importadas</p>
                                            </div>
                                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                                                <p className="text-2xl font-bold text-primary">{formatCurrency(importSummary.valor)}</p>
                                                <p className="text-[11px] text-muted-foreground">Valor total</p>
                                            </div>
                                        </div>

                                        {/* Breakdown por centro de custo */}
                                        <div className="rounded-xl border border-border overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                        <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground">Centro de Custo</TableHead>
                                                        <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground">Qtd</TableHead>
                                                        <TableHead className="text-right text-[11px] font-semibold uppercase text-muted-foreground">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Object.entries(importSummary.porCentro).map(([centro, info]) => (
                                                        <TableRow key={centro} className="hover:bg-muted/20">
                                                            <TableCell className="text-[12px] text-foreground font-medium">{centro}</TableCell>
                                                            <TableCell className="text-center text-[12px] text-muted-foreground">{info.count}</TableCell>
                                                            <TableCell className="text-right text-[12px] text-danger font-semibold financial-value">{formatCurrency(info.valor)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Botões de Desfazer e Fechar */}
                                        <div className="flex justify-between pt-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={handleUndoImport}
                                                disabled={isImporting || lastImportedIds.length === 0}
                                                className="text-danger hover:text-danger hover:bg-danger/10 gap-2"
                                            >
                                                <Undo2 className="w-4 h-4" />
                                                Desfazer Importação
                                            </Button>
                                            <Button
                                                onClick={() => { setIsImportModalOpen(false); resetImportState(); }}
                                                className="text-black font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Fechar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-black font-bold shadow-lg shadow-primary/20 font-medium gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nova Despesa</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px] bg-card border-border max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">{editingId ? "Editar Despesa" : "Registrar Nova Despesa"}</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[13px]">
                                    Preencha os campos abaixo para registrar ou atualizar a despesa.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                                {/* Row 1: Data | Valor */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="data" className={labelClasses}>Data</Label>
                                        <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClasses} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="valor" className={labelClasses}>Valor (R$)</Label>
                                        <Input id="valor" type="number" step="0.01" min="0" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required className={inputClasses} />
                                    </div>
                                </div>

                                {/* Row 2: Setor | Tipo de Rateio */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className={labelClasses}>Tipo de Rateio</Label>
                                        <Select value={tipoRateio} onValueChange={setTipoRateio}>
                                            <SelectTrigger className={inputClasses}>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border">
                                                <SelectItem value="nenhum">Nenhum (Específico)</SelectItem>
                                                <SelectItem value="igual">Igual (50% / 50%)</SelectItem>
                                                <SelectItem value="percentual">Percentual Personalizado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {tipoRateio === "nenhum" ? (
                                        <div className="grid gap-2">
                                            <Label htmlFor="centroCusto" className={labelClasses}>Centro de Custo</Label>
                                            <Select value={centroCusto} onValueChange={setCentroCusto}>
                                                <SelectTrigger className={inputClasses}>
                                                    <SelectValue placeholder="Selecione o setor" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border">
                                                    <SelectItem value="Açougue">Açougue</SelectItem>
                                                    <SelectItem value="Peixaria">Peixaria</SelectItem>
                                                    <SelectItem value="Geral / Loja">Geral / Loja</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            <Label htmlFor="centroCusto" className={labelClasses}>Centro de Custo</Label>
                                            <Input id="centroCusto" value="Loja (Rateado)" disabled className={inputClasses + " opacity-50"} />
                                        </div>
                                    )}
                                </div>

                                {/* Rateio percentual */}
                                {tipoRateio === "percentual" && (
                                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                        <div className="grid gap-2">
                                            <Label htmlFor="perc1" className={labelClasses}>Açougue (%)</Label>
                                            <Input id="perc1" type="number" step="0.01" value={percentualAcougue} onChange={(e) => setPercentualAcougue(e.target.value)} required className={inputClasses} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="perc2" className={labelClasses}>Peixaria (%)</Label>
                                            <Input id="perc2" type="number" step="0.01" value={percentualPeixaria} onChange={(e) => setPercentualPeixaria(e.target.value)} required className={inputClasses} />
                                        </div>
                                    </div>
                                )}

                                {/* Row 3: Plano de Contas */}
                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="planoContas" className={labelClasses}>Plano de Contas</Label>
                                        {role === 'diretor' && (
                                            <Button type="button" variant="ghost" className="h-5 p-0 px-2 text-[11px] text-primary hover:text-primary/80" onClick={() => setIsPlanoModalOpen(true)}>
                                                + Novo Plano
                                            </Button>
                                        )}
                                    </div>
                                    <Select value={planoContas} onValueChange={setPlanoContas}>
                                        <SelectTrigger className={inputClasses}>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {planosContasOpts.map((p) => (
                                                <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Row 4: Categoria */}
                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="categoria" className={labelClasses}>Categoria</Label>
                                        {role === 'diretor' && (
                                            <Button type="button" variant="ghost" className="h-5 p-0 px-2 text-[11px] text-primary hover:text-primary/80" onClick={() => setIsCatModalOpen(true)}>
                                                + Nova Categoria
                                            </Button>
                                        )}
                                    </div>
                                    <Select value={categoria} onValueChange={setCategoria}>
                                        <SelectTrigger className={inputClasses}>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {categoriasOpts.map((c) => (
                                                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Row 5: Descrição */}
                                <div className="grid gap-2">
                                    <Label htmlFor="descricao" className={labelClasses}>Descrição</Label>
                                    <Input id="descricao" placeholder="Ex: Conta de luz" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className={inputClasses} />
                                </div>

                                {/* Row 6: Observação */}
                                <div className="grid gap-2">
                                    <Label htmlFor="observacao" className={labelClasses}>Observação (Opcional)</Label>
                                    <Textarea id="observacao" placeholder="Detalhes adicionais" value={observacao} onChange={(e) => setObservacao(e.target.value)} className={inputClasses + " min-h-[80px] resize-none"} />
                                </div>

                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => handleCloseModal(false)} className="text-muted-foreground hover:text-foreground">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="text-black font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                        {isSubmitting ? "Salvando..." : "Salvar Despesa"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Secondary Modals */}
                <Dialog open={isPlanoModalOpen} onOpenChange={setIsPlanoModalOpen}>
                    <DialogContent className="sm:max-w-[400px] bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">Novo Plano de Contas</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[13px]">
                                Crie um novo plano de contas mestre.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSavePlano} className="space-y-4 pt-2">
                            <div className="grid gap-2">
                                <Label className={labelClasses}>Nome do Plano</Label>
                                <Input value={newPlano} onChange={(e) => setNewPlano(e.target.value)} required placeholder="Ex: Administrativo" className={inputClasses} />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsPlanoModalOpen(false)} className="text-muted-foreground">Cancelar</Button>
                                <Button type="submit" className="text-black font-bold bg-primary hover:bg-primary/90">Salvar</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
                    <DialogContent className="sm:max-w-[400px] bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">Nova Categoria</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[13px]">
                                Crie uma nova categoria.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveCat} className="space-y-4 pt-2">
                            <div className="grid gap-2">
                                <Label className={labelClasses}>Nome da Categoria</Label>
                                <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} required placeholder="Ex: Manutenção" className={inputClasses} />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsCatModalOpen(false)} className="text-muted-foreground">Cancelar</Button>
                                <Button type="submit" className="text-black font-bold bg-primary hover:bg-primary/90">Salvar</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary badges + Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="bg-danger/10 text-danger rounded-full px-4 py-1.5 text-[13px] font-semibold">
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
                                {[filterDataInicio, filterDataFim, filterPlano, filterCategoria].filter(Boolean).length}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="grid gap-1.5">
                            <Label className={labelClasses}>Data Início</Label>
                            <Input
                                type="date"
                                value={filterDataInicio}
                                onChange={(e) => { setFilterDataInicio(e.target.value); setPage(1); }}
                                className={`${inputClasses} h-9 text-[13px]`}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className={labelClasses}>Data Fim</Label>
                            <Input
                                type="date"
                                value={filterDataFim}
                                onChange={(e) => { setFilterDataFim(e.target.value); setPage(1); }}
                                className={`${inputClasses} h-9 text-[13px]`}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className={labelClasses}>Centro de Custo</Label>
                            <Select value={filterCentroCusto} onValueChange={(v) => { setFilterCentroCusto(v === '__all__' ? '' : v); setPage(1); }}>
                                <SelectTrigger className={`${inputClasses} h-9 text-[13px]`}>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="__all__">Todos</SelectItem>
                                    <SelectItem value="Açougue">Açougue</SelectItem>
                                    <SelectItem value="Peixaria">Peixaria</SelectItem>
                                    <SelectItem value="Geral / Loja">Geral / Loja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className={labelClasses}>Plano de Contas</Label>
                            <Select value={filterPlano} onValueChange={(v) => { setFilterPlano(v === '__all__' ? '' : v); setPage(1); }}>
                                <SelectTrigger className={`${inputClasses} h-9 text-[13px]`}>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="__all__">Todos</SelectItem>
                                    {planosContasOpts.map(p => (
                                        <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className={labelClasses}>Categoria</Label>
                            <Select value={filterCategoria} onValueChange={(v) => { setFilterCategoria(v === '__all__' ? '' : v); setPage(1); }}>
                                <SelectTrigger className={`${inputClasses} h-9 text-[13px]`}>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="__all__">Todas</SelectItem>
                                    {categoriasOpts.map(c => (
                                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
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

                    {filterCentroCusto && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-medium">
                            <span className="max-w-[150px] truncate">C.Custo: {filterCentroCusto}</span>
                            <button onClick={() => { setFilterCentroCusto(''); setPage(1); }} className="hover:text-foreground">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filterPlano && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-medium">
                            <span className="max-w-[150px] truncate">P.Contas: {filterPlano}</span>
                            <button onClick={() => { setFilterPlano(''); setPage(1); }} className="hover:text-foreground">
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
                        <CardTitle className="text-[15px]">Histórico de Despesas</CardTitle>
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
                            {search ? 'Nenhum resultado encontrado.' : 'Lista vazia. Adicione uma despesa para ver os dados.'}
                        </p>
                    ) : (
                        <>
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Data</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">C.Custo</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">P.Contas</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</TableHead>
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</TableHead>
                                            <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Valor</TableHead>
                                            {role !== 'funcionario' && (
                                                <TableHead className="w-[100px] text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.map((d) => (
                                            <TableRow key={d.id} className="hover:bg-muted/20 transition-colors even:bg-muted/10">
                                                <TableCell className="text-[13px] text-foreground">
                                                    {format(new Date(d.data), "dd/MM/yyyy", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{d.centro_custo}</TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{d.plano_contas}</TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground">{d.categoria}</TableCell>
                                                <TableCell className="text-[13px] text-muted-foreground max-w-[200px] truncate">{d.descricao}</TableCell>
                                                <TableCell className="text-right font-semibold text-[13px] text-danger financial-value">
                                                    {formatCurrency(d.valor)}
                                                </TableCell>
                                                {role !== 'funcionario' && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                onClick={() => handleEdit(d)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
                                                                onClick={() => handleDelete(d.id!)}
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
