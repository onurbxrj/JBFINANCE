"use client";

import { usePathname } from 'next/navigation';
import { Bell, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/receitas': 'Receitas',
    '/despesas': 'Despesas',
    '/custos/gelo': 'Custos — Gelo',
    '/custos/peixe': 'Custos — Peixe',
    '/relatorios/dre': 'DRE Consolidado',
    '/relatorios/dre-acougue': 'DRE Açougue',
    '/relatorios/dre-peixaria': 'DRE Peixaria',
    '/configuracoes/contas': 'Planos de Contas',
    '/configuracoes/usuarios': 'Usuários',
};

export default function Topbar() {
    const pathname = usePathname();

    const getPageTitle = () => {
        return PAGE_TITLES[pathname] || 'Dashboard';
    };

    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                    {getPageTitle()}
                </h2>
                <div className="hidden md:flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Calendar className="w-3 h-3" />
                    <span className="capitalize">{today}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-9 bg-muted/40 border-border/50 focus:bg-muted/60 text-[13px] h-9 rounded-lg placeholder:text-muted-foreground/60"
                    />
                </div>

                <button className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-card pulse-dot"></span>
                </button>
            </div>
        </header>
    );
}
