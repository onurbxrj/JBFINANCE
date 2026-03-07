import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/index.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'JB Finance — Gestão Financeira',
    description: 'Dashboard financeiro premium para gestão inteligente de receitas, despesas e DRE',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className={inter.variable}>
            <body className="font-sans antialiased bg-background text-foreground h-screen overflow-hidden">
                {children}
            </body>
        </html>
    );
}
