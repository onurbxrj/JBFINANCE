"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    Package,
    FileText,
    Snowflake,
    Fish,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    Wallet
} from 'lucide-react';
import { useState } from 'react';

const SIDEBAR_ITEMS = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['funcionario', 'gestor', 'diretor'] },
    { name: 'Receitas', path: '/receitas', icon: TrendingUp, roles: ['funcionario', 'gestor', 'diretor'] },
    { name: 'Despesas', path: '/despesas', icon: TrendingDown, roles: ['funcionario', 'gestor', 'diretor'] },
    {
        name: 'Custos',
        icon: Package,
        roles: ['funcionario', 'gestor', 'diretor'],
        subItems: [
            { name: 'Gelo', path: '/custos/gelo', icon: Snowflake },
            { name: 'Peixe', path: '/custos/peixe', icon: Fish },
        ]
    },
    {
        name: 'Relatórios',
        icon: FileText,
        roles: ['gestor', 'diretor'],
        subItems: [
            { name: 'DRE Consolidado', path: '/relatorios/dre', icon: FileText },
            { name: 'DRE Açougue', path: '/relatorios/dre-acougue', icon: FileText },
            { name: 'DRE Peixaria', path: '/relatorios/dre-peixaria', icon: FileText },
        ]
    },
    {
        name: 'Configurações',
        icon: Settings,
        roles: ['diretor'],
        subItems: [
            { name: 'Contas', path: '/configuracoes/contas', icon: Wallet },
            { name: 'Usuários', path: '/configuracoes/usuarios', icon: Users },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { userEmail, role, logout } = useAuth();

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        'Custos': true,
        'Relatórios': true,
        'Configurações': true
    });

    const toggleMenu = (name: string) => {
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const isActive = (path: string) => {
        if (!path) return false;
        return pathname === path || pathname.startsWith(path + '/');
    };

    const visibleItems = SIDEBAR_ITEMS.filter(item => {
        if (!role) return false;
        return item.roles.includes(role);
    });

    return (
        <aside className="w-[240px] min-w-[240px] bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-y-auto">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white font-bold text-sm">JB</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">JB Finance</h1>
                        <p className="text-[11px] text-muted-foreground font-medium">Gestão Inteligente</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
                {visibleItems.map((item) => {
                    const Icon = item.icon;

                    if (item.subItems) {
                        const hasActiveChild = item.subItems.some(sub => isActive(sub.path));
                        const isOpen = openMenus[item.name];

                        return (
                            <div key={item.name} className="space-y-0.5">
                                <button
                                    onClick={() => toggleMenu(item.name)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer
                                        ${hasActiveChild
                                            ? 'text-sidebar-accent-foreground bg-sidebar-accent'
                                            : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-[18px] h-[18px]" />
                                        {item.name}
                                    </div>
                                    {isOpen
                                        ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                        : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    }
                                </button>

                                {isOpen && (
                                    <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                                        {item.subItems.map(sub => {
                                            const SubIcon = sub.icon;
                                            const isSubActive = pathname === sub.path;

                                            return (
                                                <Link
                                                    key={sub.name}
                                                    href={sub.path!}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                                                        ${isSubActive
                                                            ? 'text-sidebar-accent-foreground bg-sidebar-accent border-l-2 border-primary -ml-[13px] pl-[23px]'
                                                            : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-white/[0.04]'
                                                        }`}
                                                >
                                                    <SubIcon className="w-4 h-4" />
                                                    {sub.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const active = isActive(item.path!);
                    return (
                        <Link
                            key={item.name}
                            href={item.path!}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                                ${active
                                    ? 'text-sidebar-accent-foreground bg-sidebar-accent border-l-2 border-primary'
                                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-white/[0.04]'
                                }`}
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-sidebar-border">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-muted-foreground hover:text-danger hover:bg-danger/10 cursor-pointer outline-none transition-all duration-200 group"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                        {userEmail ? userEmail[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                        <p className="font-medium text-sidebar-foreground truncate text-[13px] group-hover:text-danger">{userEmail || "Usuário"}</p>
                        <p className="text-[11px] truncate capitalize">{role || "Logoff"}</p>
                    </div>
                    <LogOut className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </aside>
    );
}
