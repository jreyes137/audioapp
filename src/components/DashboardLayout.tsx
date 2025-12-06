/**
 * DASHBOARD LAYOUT - App Shell
 * 
 * Layout principal con Sidebar, Breadcrumbs y Transiciones
 * Wrapper para todas las páginas del dashboard
 */

"use client";
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import PageTransition from './PageTransition';
import { ReactNode } from 'react';
import { ProjectsProvider } from '@/context/ProjectsContext';
import GlobalPlayer from './GlobalPlayer';

interface DashboardLayoutProps {
    children: ReactNode;
    showBreadcrumbs?: boolean;
    projectName?: string;
}

export default function DashboardLayout({ 
    children, 
    showBreadcrumbs = true,
    projectName 
}: DashboardLayoutProps) {
    return (
        <ProjectsProvider>
            <div className="min-h-screen bg-black flex">
                {/* Sidebar fijo */}
                <Sidebar />

                {/* Contenido principal con offset para el sidebar */}
                <main className="flex-1 ml-64 transition-all duration-300">
                    {/* Breadcrumbs */}
                    {showBreadcrumbs && (
                        <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10 px-8">
                            <Breadcrumbs projectName={projectName} />
                        </div>
                    )}

                    {/* Contenido con transiciones */}
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
            <GlobalPlayer />
        </ProjectsProvider>
    );
}

