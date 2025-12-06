/**
 * PORTAFOLIO PÚBLICO - Quiet Luxury / Futurismo Minimalista
 * Ruta: /p/[username]
 * 
 * Filosofía: "Lujo Silencioso" - El audio es el protagonista
 * Diseño: Minimalista, estático, profesional
 */

"use client";
import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getProjectsFromDB, Project } from "@/lib/db";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";

const GOLD = "#D4AF37";

interface Settings {
    title: string;
    bio: string;
    primaryColor: string;
    fontFamily: string;
    showGear: boolean;
    showHistory: boolean;
    texture: boolean;
    layout: string;
    showSpectrum: boolean;
    profilePhoto?: string;
}

interface Props {
    params: Promise<{ username: string }>;
}

export default function PublicPortfolio({ params }: Props) {
    const resolvedParams = use(params);
    const { username } = resolvedParams;
    
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | number | null>(null);
    
    // Cargar settings del editor
    const [settings, setSettings] = useState<Settings>({
        title: "AUDIO STUDIO",
        bio: "Mixing & Mastering Engineer",
        primaryColor: GOLD,
        fontFamily: "'Inter', 'Geist Mono', ui-sans-serif, system-ui, sans-serif",
        showGear: false,
        showHistory: false,
        texture: false,
        layout: "grid",
        showSpectrum: true,
    });

    // Cargar settings del localStorage
    useEffect(() => {
        const saved = localStorage.getItem("1307_settings");
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Error al cargar settings:', e);
            }
        }

        const handleStorageChange = () => {
            const updated = localStorage.getItem("1307_settings");
            if (updated) {
                try {
                    setSettings(JSON.parse(updated));
                } catch (e) {
                    console.error('Error al actualizar settings:', e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const allProjects = await getProjectsFromDB();
                const publicProjects = allProjects.filter(
                    (p) => p.category === "PORTFOLIO" && p.isPublic
                );
                setProjects(publicProjects);
            } catch (error) {
                console.error('Error al cargar portafolio:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPortfolio();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-center">
                    <div 
                        style={{ borderTopColor: settings.primaryColor }}
                        className="w-12 h-12 border-2 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"
                    />
                    <p className="text-neutral-400 font-mono text-xs tracking-wider uppercase">Cargando...</p>
                </div>
            </div>
        );
    }

    const activeProject = projects.find((p) => p.id === activeId);

    return (
        <div 
            className="min-h-screen bg-neutral-950 text-white"
            style={{ fontFamily: settings.fontFamily }}
        >
            {/* Fondo sutil fijo (no animado) */}
            <div className="fixed inset-0 pointer-events-none">
                <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 opacity-5"
                    style={{
                        background: `radial-gradient(ellipse at top, ${settings.primaryColor}, transparent 70%)`,
                    }}
                />
            </div>

            {/* Container centrado */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 py-24">
                
                {/* Header - Fade In solo al cargar */}
                <motion.header 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-24 text-center"
                >
                    {/* Foto de perfil (si existe) */}
                    {settings.profilePhoto && (
                        <div className="mb-8">
                            <img 
                                src={settings.profilePhoto} 
                                alt="Profile"
                                className="w-20 h-20 rounded-full mx-auto border border-white/10 object-cover"
                            />
                        </div>
                    )}

                    <h1 
                        className="text-4xl md:text-5xl font-light tracking-tight mb-6 text-white"
                        style={{ 
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {settings.title}
                    </h1>
                    
                    <div 
                        className="w-12 h-px mx-auto mb-6"
                        style={{ backgroundColor: settings.primaryColor }}
                    />
                    
                    <p className="text-base text-neutral-400 tracking-wide font-light max-w-md mx-auto">
                        {settings.bio}
                    </p>
                </motion.header>

                {/* Sección Historia (opcional) - Minimalista */}
                {settings.showHistory && (
                    <motion.section 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="mb-24"
                    >
                        <div className="border border-white/5 rounded-lg p-10 bg-neutral-900/30">
                            <h2 className="text-sm font-mono text-neutral-500 uppercase tracking-widest mb-6">
                                Acerca de
                            </h2>
                            <p className="text-neutral-300 leading-relaxed font-light">
                                Con más de 10 años de experiencia en la industria del audio, 
                                he trabajado con artistas de todo el mundo, desde indie hasta 
                                grandes producciones. Mi enfoque es capturar la esencia de cada 
                                proyecto y llevarlo al siguiente nivel.
                            </p>
                        </div>
                    </motion.section>
                )}

                {/* Proyectos - Sin animaciones individuales, fade-in global */}
                <motion.section 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="mb-24"
                >
                    <h2 className="text-sm font-mono text-neutral-500 uppercase tracking-widest mb-8">
                        Proyectos Destacados
                    </h2>

                    {projects.length === 0 ? (
                        <div className="border border-white/5 rounded-lg p-16 text-center">
                            <p className="text-neutral-500 text-sm">
                                No hay proyectos públicos todavía.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => setActiveId(activeId === project.id ? null : project.id)}
                                    className="border border-white/5 hover:border-white/10 rounded-lg p-6 transition-colors cursor-pointer group bg-neutral-900/20 hover:bg-neutral-900/40"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-white mb-1 group-hover:text-neutral-200 transition-colors">
                                                {project.title}
                                            </h3>
                                            <p className="text-sm text-neutral-500 font-mono">
                                                {project.artist} • {project.genre}
                                            </p>
                                        </div>
                                        
                                        {/* Play/Pause button - Minimalista */}
                                        <div
                                            style={{ 
                                                borderColor: activeId === project.id ? settings.primaryColor : 'rgba(255,255,255,0.1)',
                                                color: activeId === project.id ? settings.primaryColor : 'rgba(255,255,255,0.4)',
                                            }}
                                            className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all group-hover:border-white/20"
                                        >
                                            {activeId === project.id ? '⏸' : '▶'}
                                        </div>
                                    </div>

                                    {activeId === project.id && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <span 
                                                className="text-xs font-mono"
                                                style={{ color: settings.primaryColor }}
                                            >
                                                REPRODUCIENDO
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Player activo - PROTAGONISTA VISUAL */}
                {activeProject && (
                    <motion.section 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-24"
                    >
                        <div 
                            className="border-2 rounded-lg p-10 bg-black/40"
                            style={{
                                borderColor: settings.primaryColor,
                                boxShadow: `0 0 40px ${settings.primaryColor}15`,
                            }}
                        >
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div 
                                        className="w-2 h-2 rounded-full animate-pulse"
                                        style={{ backgroundColor: settings.primaryColor }}
                                    />
                                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                                        Ahora Escuchando
                                    </span>
                                </div>
                                <h3 
                                    className="text-3xl font-light mb-2"
                                    style={{ color: settings.primaryColor }}
                                >
                                    {activeProject.title}
                                </h3>
                                <p className="text-neutral-400 font-mono text-sm">
                                    {activeProject.artist} • {activeProject.genre}
                                </p>
                            </div>

                            <ActiveProjectPlayer
                                key={`player-${activeProject.id}`}
                                mixUrl={activeProject.mixUrl}
                                masterUrl={activeProject.masterUrl}
                                hideToggle={false}
                                accentColor={settings.primaryColor}
                            />
                        </div>
                    </motion.section>
                )}

                {/* Sección Gear (opcional) - Minimalista */}
                {settings.showGear && (
                    <motion.section 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mb-24"
                    >
                        <div className="border border-white/5 rounded-lg p-10 bg-neutral-900/20">
                            <h2 className="text-sm font-mono text-neutral-500 uppercase tracking-widest mb-8">
                                Equipo
                            </h2>
                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
                                        Hardware
                                    </h4>
                                    <ul className="space-y-3 text-neutral-300 font-light text-sm">
                                        <li>Neumann U87 Ai</li>
                                        <li>Universal Audio Apollo x8</li>
                                        <li>Genelec 8351B</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
                                        Software
                                    </h4>
                                    <ul className="space-y-3 text-neutral-300 font-light text-sm">
                                        <li>Pro Tools Ultimate</li>
                                        <li>FabFilter Suite</li>
                                        <li>iZotope RX 10</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Contact CTA - Minimalista */}
                <motion.section 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="mb-24"
                >
                    <div 
                        className="border-2 rounded-lg p-16 text-center"
                        style={{ borderColor: settings.primaryColor }}
                    >
                        <h2 className="text-2xl font-light mb-4">¿Trabajamos juntos?</h2>
                        <p className="text-neutral-400 mb-10 max-w-md mx-auto font-light">
                            Si tienes un proyecto en mente y buscas calidad profesional, hablemos.
                        </p>
                        <a
                            href="mailto:contact@audioapp.io"
                            style={{ 
                                backgroundColor: settings.primaryColor,
                            }}
                            className="inline-block px-10 py-4 rounded-lg text-black text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
                        >
                            Contactar
                        </a>
                    </div>
                </motion.section>
            </div>

            {/* Footer - Minimalista */}
            <footer className="relative z-10 border-t border-white/5 mt-32">
                <div className="max-w-4xl mx-auto px-6 py-10 text-center">
                    <p className="text-neutral-600 text-xs font-mono tracking-wider">
                        Powered by <span style={{ color: settings.primaryColor }}>Audio App</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
