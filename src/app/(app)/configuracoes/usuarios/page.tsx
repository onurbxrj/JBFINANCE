"use client";

import { useEffect, useState } from "react";
import { getProfiles, updateProfileRole, Profile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UsuariosPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (role && role !== 'diretor') {
            router.push('/dashboard');
        } else if (role === 'diretor') {
            loadProfiles();
        }
    }, [role, router]);

    async function loadProfiles() {
        setIsLoading(true);
        try {
            const data = await getProfiles();
            setProfiles(data);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleRoleChange(userId: string, newRole: Profile['role']) {
        try {
            await updateProfileRole(userId, newRole);
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        } catch (error) {
            console.error("Erro ao atualizar nível de acesso:", error);
            alert("Não foi possível atualizar o nível de acesso.");
        }
    }

    if (role !== 'diretor') return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Usuários</h1>
                <p className="text-[13px] text-muted-foreground mt-1">Gerencie os acessos e permissões da equipe no sistema</p>
            </div>

            <Card>
                <CardHeader className="bg-primary/5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <CardTitle className="text-[15px]">Usuários e Permissões</CardTitle>
                    </div>
                    <CardDescription className="text-[13px] text-muted-foreground">
                        Apenas Diretores podem alterar o nível hierárquico dos perfis.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="w-[300px] text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                                    <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</TableHead>
                                    <TableHead className="w-[200px] text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Nível de Acesso</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {profiles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground text-sm">
                                            Nenhum usuário encontrado na plataforma.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    profiles.map((profile) => (
                                        <TableRow key={profile.id} className="hover:bg-muted/20 transition-colors even:bg-muted/10">
                                            <TableCell className="font-medium text-[13px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold">
                                                        {profile.nome ? profile.nome[0].toUpperCase() : 'U'}
                                                    </div>
                                                    <span className="text-foreground">{profile.nome || "Usuário não nomeado"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[13px] text-muted-foreground">
                                                {profile.email}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={profile.role}
                                                    onValueChange={(val: Profile['role']) => handleRoleChange(profile.id, val)}
                                                >
                                                    <SelectTrigger className="w-[160px] h-8 text-[12px] font-semibold bg-muted/40 border-border/50 text-foreground">
                                                        <SelectValue placeholder="Selecione o acesso" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card border-border">
                                                        <SelectItem value="funcionario">Funcionário</SelectItem>
                                                        <SelectItem value="gestor">Gestor</SelectItem>
                                                        <SelectItem value="diretor">Diretor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
