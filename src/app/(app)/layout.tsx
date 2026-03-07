import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground relative">
                {/* Ambient Background Glows (Nível CoinMarketCap/Linear) */}
                <div className="fixed top-[-150px] left-[-150px] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
                <div className="fixed bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
                <div className="fixed top-[40%] left-[30%] w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

                <div className="z-10 relative flex h-full">
                    <Sidebar />
                </div>
                <div className="flex flex-col flex-1 overflow-hidden z-20 relative">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto pb-12">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthProvider>
    );
}
