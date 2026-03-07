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
            <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
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
