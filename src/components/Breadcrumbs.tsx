/**
 * BREADCRUMBS - Migajas de Pan
 * 
 * Muestra la ruta actual y permite navegación rápida
 * Estilo Dark Luxury con iconos y separadores elegantes
 */

"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const GOLD = "#D4AF37";

interface BreadcrumbItem {
    label: string;
    href: string;
    icon?: string;
}

interface BreadcrumbsProps {
    customItems?: BreadcrumbItem[];
    projectName?: string;
}

export default function Breadcrumbs({ customItems, projectName }: BreadcrumbsProps) {
    const pathname = usePathname();

    const items = useMemo(() => {
        if (customItems) return customItems;

        // Generar breadcrumbs automáticamente desde la ruta
        const segments = pathname?.split('/').filter(Boolean) || [];
        const breadcrumbs: BreadcrumbItem[] = [
            { label: 'Inicio', href: '/', icon: '🏠' }
        ];

        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            
            // Mapear rutas a nombres legibles
            let label = segment.charAt(0).toUpperCase() + segment.slice(1);
            let icon = '';

            switch (segment) {
                case 'dashboard':
                    label = 'Dashboard';
                    icon = '📊';
                    break;
                case 'inbox':
                    label = 'Inbox';
                    icon = '📥';
                    break;
                case 'settings':
                    label = 'Ajustes';
                    icon = '⚙️';
                    break;
                case 'studio':
                    label = 'Studio';
                    icon = '🎛️';
                    break;
                case 'p':
                    label = 'Portafolio';
                    icon = '🌍';
                    break;
                default:
                    // Si es un ID, usar projectName si está disponible
                    if (projectName && index === segments.length - 1) {
                        label = projectName;
                        icon = '📁';
                    }
            }

            breadcrumbs.push({ label, href: currentPath, icon });
        });

        return breadcrumbs;
    }, [pathname, customItems, projectName]);

    if (items.length <= 1) return null; // No mostrar si solo hay "Inicio"

    return (
        <nav className="flex items-center gap-2 py-3 px-1 text-xs">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                
                return (
                    <div key={item.href} className="flex items-center gap-2">
                        {/* Link del breadcrumb */}
                        {isLast ? (
                            // Último item (actual) - No clickeable
                            <span 
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                                style={{ 
                                    color: GOLD,
                                    boxShadow: `0 0 10px ${GOLD}20`
                                }}
                            >
                                {item.icon && <span className="text-sm">{item.icon}</span>}
                                <span className="font-bold">{item.label}</span>
                            </span>
                        ) : (
                            // Items anteriores - Clickeables
                            <Link
                                href={item.href}
                                className="
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                                    text-white/60 hover:text-white hover:bg-white/5
                                    transition-all duration-200
                                    border border-transparent hover:border-white/10
                                "
                            >
                                {item.icon && <span className="text-sm">{item.icon}</span>}
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )}

                        {/* Separador */}
                        {!isLast && (
                            <span className="text-white/20 text-lg">›</span>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

