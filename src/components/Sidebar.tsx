/**
 * SIDEBAR - Navegación Global
 * 
 * Sidebar lateral izquierdo fijo con estilo Dark Luxury
 * Glassmorphism sutil, iconos y links principales
 */

"use client";
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import UserProfileModal from './UserProfileModal';

const GOLD = "#D4AF37";

interface NavItemProps {
    href: string;
    icon: string;
    label: string;
    isActive: boolean;
    isExternal?: boolean;
}

const NavItem = ({ href, icon, label, isActive, isExternal }: NavItemProps) => {
    return (
        <Link
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-300 ease-out
                ${isActive 
                    ? 'bg-white/10 backdrop-blur-lg shadow-lg' 
                    : 'hover:bg-white/5 backdrop-blur-sm'
                }
            `}
            style={isActive ? {
                boxShadow: `0 0 20px ${GOLD}40, inset 0 0 20px ${GOLD}20`,
                borderLeft: `3px solid ${GOLD}`,
            } : {}}
        >
            {/* Glow effect cuando está activo */}
            {isActive && (
                <div
                    className="absolute inset-0 rounded-xl opacity-20 blur-xl"
                    style={{ backgroundColor: GOLD }}
                />
            )}

            {/* Icono */}
            <span 
                className={`text-2xl relative z-10 transition-all duration-300 ${
                    isActive 
                        ? 'scale-110 drop-shadow-lg' 
                        : 'group-hover:scale-105'
                }`}
                style={isActive ? { filter: `drop-shadow(0 0 8px ${GOLD})` } : {}}
            >
                {icon}
            </span>

            {/* Label */}
            <span 
                className={`text-sm font-bold tracking-wide relative z-10 transition-all duration-300 ${
                    isActive 
                        ? 'text-white' 
                        : 'text-white/60 group-hover:text-white/90'
                }`}
            >
                {label}
            </span>

            {/* Indicador activo */}
            {isActive && (
                <div 
                    className="absolute right-3 w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: GOLD }}
                />
            )}
        </Link>
    );
};

export default function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const tabParam = searchParams?.get('tab');

    const navGroups = [
        {
            title: 'ESTUDIO',
            items: [
                { href: '/dashboard', icon: '🏠', label: 'Dashboard', matchTab: undefined },
                { href: '/dashboard?tab=INBOX', icon: '📥', label: 'Inbox', matchTab: 'INBOX' },
                { href: '/dashboard/orders', icon: '📋', label: 'Ordenes' },
                { href: '/dashboard?tab=SITE', icon: '🌍', label: 'Ver Mi Sitio', matchTab: 'SITE' },
            ],
        },
    ];

    return (
        <aside 
            className={`
                fixed left-0 top-0 h-screen z-40
                bg-black/80 backdrop-blur-xl border-r border-white/10
                transition-all duration-300 ease-out
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}
            style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(10,10,10,0.9) 100%)',
            }}
        >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ 
                                    backgroundColor: GOLD,
                                    boxShadow: `0 0 10px ${GOLD}`
                                }}
                            />
                            <h1 className="text-sm font-black tracking-tighter text-white uppercase">
                                Audio App
                            </h1>
                        </div>
                    )}
                    
                    {/* Toggle button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        title={isCollapsed ? "Expandir" : "Colapsar"}
                    >
                        <span className="text-white/40 text-xs">
                            {isCollapsed ? '→' : '←'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-4">
                {navGroups.map((group) => (
                    <div key={group.title} className="space-y-2">
                        {!isCollapsed && (
                            <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 px-3">
                                {group.title}
                            </p>
                        )}
                        <div className="space-y-2">
                            {group.items.map((item) => {
                                const isDashboardRoot = item.href === '/dashboard' && pathname === '/dashboard' && !tabParam;
                                const isTabMatch = item.matchTab && pathname === '/dashboard' && tabParam === item.matchTab;
                                const isRouteMatch = pathname === item.href || pathname?.startsWith(item.href + '/');
                                const isActive = isDashboardRoot || isTabMatch || isRouteMatch;

                                return (
                                    <NavItem
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={isCollapsed ? '' : item.label}
                                        isActive={!!isActive}
                                        isExternal={item.isExternal}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer - User info (Clickeable) */}
            {!isCollapsed && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowProfileModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <div 
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold"
                            style={{
                                boxShadow: `0 0 15px ${GOLD}40`,
                            }}
                        >
                            👤
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-bold text-white truncate">
                                Engineer
                            </p>
                            <p className="text-[10px] text-white/40">
                                Pro Account
                            </p>
                        </div>
                        <span className="text-white/40 text-xs">›</span>
                    </motion.button>
                </div>
            )}

            {/* Glassmorphism overlay */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at top left, rgba(212, 175, 55, 0.03) 0%, transparent 50%)',
                }}
            />

            {/* Modal de Perfil */}
            <UserProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </aside>
    );
}

