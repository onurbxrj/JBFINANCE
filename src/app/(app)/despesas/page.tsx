"use client";

import { useEffect, useState, useMemo } from "react";
import { getDespesas, addDespesa, updateDespesa, deleteDespesa, saveRateiosDespesa, getRateiosDespesa, getPlanosContas, getCategorias, addPlanoConta, addCategoria, addDespesasBulk, addRateiosBulk, Despesa, PlanoConta, Categoria } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Edit2, Trash2, Plus, Search, ChevronLeft, ChevronRight, Upload, FileSpreadsheet } from "lucide-react";
import * as xlsx from "xlsx";
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
    const { role, userId } = useAuth();

    // Search & Pagination
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

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

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportErrors([]);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = xlsx.read(buffer);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = xlsx.utils.sheet_to_json(sheet);

            let errors: string[] = [];
            let despesasParaSalvar: any[] = [];

            let currentPlanos = [...planosContasOpts];
            let currentCats = [...categoriasOpts];
            
            // 1. Rastreador Dinâmico de Cabeçalhos
            // Procurar qual linha possui "DATA" e "VALOR"
            let headerRowIndex = -1;
            let colMap = { data: '', valor: '', ccust: '', plano: '', cat: '', desc: '', obs: '' };

            const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Matrix raw
            
            for (let i = 0; i < rawData.length; i++) {
                const row: any = rawData[i];
                if (!Array.isArray(row)) continue;
                const concatRow = row.map(c => String(c).toLowerCase().trim()).join('|');
                if (concatRow.includes('data') && concatRow.includes('valor')) {
                    headerRowIndex = i;
                    // Mapear headers
                    row.forEach((cell: any, cIdx: number) => {
                        const cName = String(cell).toLowerCase().trim().replace(/[\u0300-\u036f]/g, '');
                        if (cName.includes('data')) colMap.data = cIdx.toString();
                        else if (cName === 'valor') colMap.valor = cIdx.toString();
                        else if (cName.includes('centro') || cName.includes('setor')) colMap.ccust = cIdx.toString();
                        else if (cName.includes('plano')) colMap.plano = cIdx.toString();
                        else if (cName.includes('cat')) colMap.cat = cIdx.toString();
                        else if (cName.includes('desc')) colMap.desc = cIdx.toString();
                        else if (cName.includes('obs')) colMap.obs = cIdx.toString();
                    });
                    break;
                }
            }

            if (headerRowIndex === -1) {
                setImportErrors(['Não foi possível identificar os Cabeçalhos reais (Data, Valor, etc) na planilha.']);
                setIsImporting(false);
                return;
            }

            // Memória de herança (para preencher campos vazios da mesma data)
            let lastData = "";
            let lastCat = "Indefinido";
            let lastCcust = "Geral / Loja";
            let lastPlano = "Geral";

            for (let index = headerRowIndex + 1; index < rawData.length; index++) {
                const row: any = rawData[index];
                const linha = index + 1;
                
                // Pular linhas vazias puras
                if (!row || row.length === 0 || row.join('').trim() === '') continue;

                // Extrair valores usando mapeamento
                let valData = row[colMap.data as any];
                const valValor = row[colMap.valor as any];
                let valCentroCusto = row[colMap.ccust as any] || lastCcust;
                let valPlano = row[colMap.plano as any] || lastPlano;
                let valCat = row[colMap.cat as any] || lastCat;
                const valDesc = row[colMap.desc as any];
                const valObs = colMap.obs ? row[colMap.obs as any] : "";

                // Se a linha não tem valor ou descrição principais salvas após header, apenas pula (linha não computável)
                if (valValor === undefined || valValor === null || valValor === '') {
                    continue; 
                }

                if (valData === undefined || valData === null || valData === '') {
                    if (lastData) valData = lastData;
                    else {
                        errors.push(`Linha ${linha}: Data não definida e sem data anterior para herdar.`);
                        continue;
                    }
                }

                // Normalização Case-Insensitive: Plano de Contas
                let planoOficial = "";
                const planoStr = String(valPlano).trim() || 'Geral';
                const planoMatch = currentPlanos.find(p => p.nome.toLowerCase() === planoStr.toLowerCase());
                
                if (planoMatch) {
                    planoOficial = planoMatch.nome;
                } else {
                    if (role === 'diretor') {
                        try {
                            const newP = await addPlanoConta(planoStr);
                            currentPlanos.push(newP);
                            planoOficial = newP.nome;
                        } catch (e) {
                            errors.push(`Linha ${linha}: Erro ao criar novo Plano de Contas '${planoStr}'.`);
                            continue;
                        }
                    } else {
                        errors.push(`Linha ${linha}: Plano de Contas '${planoStr}' não existe. Mude para 'Operacional' ou consulte o diretor.`);
                        continue;
                    }
                }

                // Normalização Case-Insensitive: Categoria
                let catOficial = "";
                const catStr = String(valCat).trim() || 'Geral';
                const catMatch = currentCats.find(c => c.nome.toLowerCase() === catStr.toLowerCase());

                if (catMatch) {
                    catOficial = catMatch.nome;
                } else {
                    if (role === 'diretor') {
                        try {
                            const newC = await addCategoria(catStr);
                            currentCats.push(newC);
                            catOficial = newC.nome;
                        } catch (e) {
                            errors.push(`Linha ${linha}: Erro ao criar nova Categoria '${catStr}'.`);
                            continue;
                        }
                    } else {
                        errors.push(`Linha ${linha}: Categoria '${catStr}' não existe no sistema.`);
                        continue;
                    }
                }

                // Tratar data (Excel serial date to YYYY-MM-DD ou string já formatada)
                let dataFormatada = "";
                if (typeof valData === "number") {
                    const dateObj = new Date((valData - (25567 + 1)) * 86400 * 1000); 
                    dataFormatada = dateObj.toISOString().split("T")[0];
                } else {
                    const strData = String(valData);
                    if (strData.includes("/")) {
                        const partes = strData.split("/");
                        if (partes.length === 3) {
                            dataFormatada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                        } else {
                            dataFormatada = strData;
                        }
                    } else {
                        dataFormatada = strData;
                    }
                }

                // Tratar valor
                let valorTratado = 0;
                if (typeof valValor === "string") {
                     valorTratado = parseFloat(valValor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
                } else if (typeof valValor === "number") {
                     valorTratado = valValor;
                }
                
                if (isNaN(valorTratado) || valorTratado < 0) {
                     errors.push(`Linha ${linha}: Valor financeiro inválido '${valValor}'.`);
                     continue;
                }

                // Normalizar o Centro de Custo para bater com os Selectors (Açougue, Peixaria, Geral / Loja)
                let rawCcust = String(valCentroCusto).toLowerCase().trim();
                let ccustNormalizado = "Geral / Loja";
                if (rawCcust.includes('açougue') || rawCcust.includes('acougue')) {
                    ccustNormalizado = "Açougue";
                } else if (rawCcust.includes('peix') || rawCcust.includes('peixaria')) {
                    ccustNormalizado = "Peixaria";
                }

                // Atualizar memórias
                lastData = valData;
                lastPlano = String(valPlano).trim();
                lastCat = String(valCat).trim();
                lastCcust = ccustNormalizado;

                let tipoRateio = "nenhum";
                if (ccustNormalizado === "Geral / Loja") {
                    tipoRateio = "percentual";
                }

                despesasParaSalvar.push({
                    data: dataFormatada,
                    valor: valorTratado,
                    centro_custo: lastCcust,
                    plano_contas: planoOficial,
                    categoria: catOficial,
                    descricao: String(valDesc || '').trim() || 'Despesa não especificada',
                    observacao: String(valObs || '').trim(),
                    tipo_rateio: tipoRateio,
                    created_by: userId || undefined
                });
            }

            // Atualiza o estado da tabela se novos registros foram criados
            if (currentPlanos.length > planosContasOpts.length) setPlanosContasOpts([...currentPlanos]);
            if (currentCats.length > categoriasOpts.length) setCategoriasOpts([...currentCats]);

            if (errors.length > 0) {
                setImportErrors(errors);
                return;
            }

            if (despesasParaSalvar.length === 0) {
                 setImportErrors(["Nenhum dado válido encontrado na planilha."]);
                 return;
            }

            const savedDespesas = await addDespesasBulk(despesasParaSalvar);

            // Gerar rateios automaticamente se necessário
            const rateiosToSave: any[] = [];
            if (savedDespesas && Array.isArray(savedDespesas)) {
                savedDespesas.forEach((d: any) => {
                    if (d.tipo_rateio === "percentual" && d.centro_custo === "Geral / Loja") {
                        rateiosToSave.push({
                            despesa_id: d.id,
                            setor: "Açougue",
                            percentual: 66.66
                        });
                        rateiosToSave.push({
                            despesa_id: d.id,
                            setor: "Peixaria",
                            percentual: 33.34
                        });
                    }
                });
            }

            if (rateiosToSave.length > 0) {
                 await addRateiosBulk(rateiosToSave);
            }

            setIsImportModalOpen(false);
            alert(`${despesasParaSalvar.length} despesa(s) importada(s) com sucesso!`);
            loadData();
        } catch (error: any) {
            console.error(error);
            setImportErrors([`Erro no processo (${error.message || 'Desconhecido'}): verifique o log.`]);
        } finally {
            setIsImporting(false);
            e.target.value = ''; // Reset file input
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Filtered + paginated
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return despesas.filter(d =>
            d.categoria.toLowerCase().includes(q) ||
            d.centro_custo.toLowerCase().includes(q) ||
            d.descricao.toLowerCase().includes(q) ||
            d.data.includes(q)
        );
    }, [despesas, search]);

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
                    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="bg-card text-foreground border-border hover:bg-muted/50 gap-2 font-medium">
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Importar</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[460px] bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Importar Despesas</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[13px]">
                                    Faça upload de uma planilha do Excel para importar despesas em lote.
                                </DialogDescription>
                            </DialogHeader>
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
                                
                                {importErrors.length > 0 && (
                                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-[13px] text-danger/90 max-h-32 overflow-y-auto">
                                        <p className="font-semibold mb-1">Encontramos os seguintes problemas:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {importErrors.map((err, i) => <li key={i}>{ err }</li>)}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label className={labelClasses}>Selecione o arquivo (.xlsx, .csv)</Label>
                                    <Input 
                                        type="file" 
                                        accept=".xlsx, .xls, .csv" 
                                        onChange={handleFileUpload} 
                                        disabled={isImporting}
                                        className="bg-muted/40 border-border/50 text-foreground cursor-pointer file:text-foreground file:bg-muted file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md hover:file:bg-muted/80" 
                                    />
                                </div>
                                
                                {isImporting && (
                                    <p className="text-[13px] text-center text-muted-foreground py-2 animate-pulse">
                                        Processando arquivo e enviando...
                                    </p>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

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
                                                <SelectItem value="Geral/Loja">Geral / Loja</SelectItem>
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

            {/* Summary badges */}
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
