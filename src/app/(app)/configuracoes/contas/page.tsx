"use client";

import { useEffect, useState } from "react";
import { getPlanosContas, getCategorias, addPlanoConta, updatePlanoConta, addCategoria, updateCategoria, PlanoConta, Categoria } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Power, PowerOff, Edit2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ContasPage() {
    const { role } = useAuth();
    const router = useRouter();

    const [planos, setPlanos] = useState<PlanoConta[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);

    const [editingPlanoId, setEditingPlanoId] = useState<string | null>(null);
    const [planoNome, setPlanoNome] = useState("");

    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [catNome, setCatNome] = useState("");

    useEffect(() => {
        if (role && role !== 'diretor') {
            router.push('/dashboard');
        } else if (role === 'diretor') {
            loadData();
        }
    }, [role]);

    async function loadData() {
        try {
            setIsLoading(true);
            const [pOpts, cOpts] = await Promise.all([getPlanosContas(true), getCategorias(true)]);
            setPlanos(pOpts);
            setCategorias(cOpts);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const openPlanoModal = (plano?: PlanoConta) => {
        if (plano) { setEditingPlanoId(plano.id!); setPlanoNome(plano.nome); }
        else { setEditingPlanoId(null); setPlanoNome(""); }
        setIsPlanoModalOpen(true);
    };

    const handleSavePlano = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlanoId) await updatePlanoConta(editingPlanoId, { nome: planoNome });
            else await addPlanoConta(planoNome);
            setIsPlanoModalOpen(false);
            loadData();
        } catch (error) { alert("Erro ao salvar o plano de contas"); }
    };

    const togglePlanoAtivo = async (plano: PlanoConta) => {
        try { await updatePlanoConta(plano.id!, { ativo: !plano.ativo }); loadData(); }
        catch (error) { alert("Erro ao alterar o status do plano de contas"); }
    };

    const openCatModal = (cat?: Categoria) => {
        if (cat) { setEditingCatId(cat.id!); setCatNome(cat.nome); }
        else { setEditingCatId(null); setCatNome(""); }
        setIsCatModalOpen(true);
    };

    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCatId) await updateCategoria(editingCatId, { nome: catNome });
            else await addCategoria(catNome);
            setIsCatModalOpen(false);
            loadData();
        } catch (error) { alert("Erro ao salvar a categoria"); }
    };

    const toggleCatAtiva = async (cat: Categoria) => {
        try { await updateCategoria(cat.id!, { ativo: !cat.ativo }); loadData(); }
        catch (error) { alert("Erro ao alterar o status da categoria"); }
    };

    if (role !== 'diretor') return null;

    const inputClasses = "bg-muted/40 border-border/50 text-foreground";
    const labelClasses = "text-[13px] text-muted-foreground";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Contas</h1>
                <p className="text-[13px] text-muted-foreground mt-1">Gerencie planos de contas e categorias usadas no sistema</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PLANOS DE CONTAS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-[15px]">Planos de Contas</CardTitle>
                        <Button size="sm" onClick={() => openPlanoModal()} className="bg-primary text-black font-bold gap-1.5 text-[12px] shadow-lg shadow-primary/20">
                            <Plus className="w-3.5 h-3.5" />
                            Novo Plano
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                        ) : (
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                                            <TableHead className="w-[80px] text-center text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                            <TableHead className="w-[90px] text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {planos.map((p) => (
                                            <TableRow key={p.id} className="hover:bg-muted/20 transition-colors even:bg-muted/10">
                                                <TableCell className={`text-[13px] ${!p.ativo ? 'text-muted-foreground/50 line-through' : 'text-foreground'}`}>{p.nome}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.ativo ? 'bg-success/10 text-success' : 'bg-muted/50 text-muted-foreground'}`}>
                                                        {p.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openPlanoModal(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="icon" className={`h-7 w-7 ${p.ativo ? 'text-danger hover:bg-danger/10 hover:text-danger' : 'text-success hover:bg-success/10 hover:text-success'}`} onClick={() => togglePlanoAtivo(p)}>
                                                            {p.ativo ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {planos.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6">Nenhum plano cadastrado</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CATEGORIAS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-[15px]">Categorias</CardTitle>
                        <Button size="sm" onClick={() => openCatModal()} className="bg-primary text-black font-bold gap-1.5 text-[12px] shadow-lg shadow-primary/20">
                            <Plus className="w-3.5 h-3.5" />
                            Nova Categoria
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                        ) : (
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                                            <TableHead className="w-[80px] text-center text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                            <TableHead className="w-[90px] text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categorias.map((c) => (
                                            <TableRow key={c.id} className="hover:bg-muted/20 transition-colors even:bg-muted/10">
                                                <TableCell className={`text-[13px] ${!c.ativo ? 'text-muted-foreground/50 line-through' : 'text-foreground'}`}>{c.nome}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.ativo ? 'bg-success/10 text-success' : 'bg-muted/50 text-muted-foreground'}`}>
                                                        {c.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openCatModal(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="icon" className={`h-7 w-7 ${c.ativo ? 'text-danger hover:bg-danger/10 hover:text-danger' : 'text-success hover:bg-success/10 hover:text-success'}`} onClick={() => toggleCatAtiva(c)}>
                                                            {c.ativo ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {categorias.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6">Nenhuma categoria cadastrada</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* MODALS */}
            <Dialog open={isPlanoModalOpen} onOpenChange={setIsPlanoModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{editingPlanoId ? "Editar Plano de Contas" : "Novo Plano de Contas"}</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-[13px]">Preencha o nome do plano de contas.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSavePlano} className="space-y-4 pt-2">
                        <div className="grid gap-2">
                            <Label className={labelClasses}>Nome do Plano</Label>
                            <Input value={planoNome} onChange={(e) => setPlanoNome(e.target.value)} required placeholder="Ex: Administrativo" className={inputClasses} />
                        </div>
                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsPlanoModalOpen(false)} className="text-muted-foreground">Cancelar</Button>
                            <Button type="submit" className="text-black font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Salvar Plano</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{editingCatId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-[13px]">Informe o nome da categoria.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveCat} className="space-y-4 pt-2">
                        <div className="grid gap-2">
                            <Label className={labelClasses}>Nome da Categoria</Label>
                            <Input value={catNome} onChange={(e) => setCatNome(e.target.value)} required placeholder="Ex: Manutenção" className={inputClasses} />
                        </div>
                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsCatModalOpen(false)} className="text-muted-foreground">Cancelar</Button>
                            <Button type="submit" className="text-black font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Salvar</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
