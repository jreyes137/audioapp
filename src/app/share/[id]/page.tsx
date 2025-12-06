/**
 * LINK PRIVADO - Sala de Escucha Virtual
 * Ruta: /share/[id]
 * 
 * Filosofía: "Estudio de Mastering Online"
 * Diseño: Inmersivo, oscuro, sin distracciones - El audio es TODO
 */

"use client";
import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getProjectsFromDB, Project } from "@/lib/db";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";
import AudioToolbar from "@/components/AudioToolbar";
import TimelinePins, { TimelineComment, TimelineRegion } from "@/components/TimelinePins";
import { audioManager } from "@/lib/audioManager";
import { ProjectsProvider, useProjects } from "@/context/ProjectsContext";

const GOLD = "#D4AF37";

interface Props {
    params: Promise<{ id: string }>;
}

interface Comment {
    id: string;
    timestamp: number;
    text: string;
    author: string;
    date: string;
}

export default function PrivateShareLink({ params }: Props) {
    return (
        <ProjectsProvider>
            <PrivateShareLinkContent params={params} />
        </ProjectsProvider>
    );
}

function PrivateShareLinkContent({ params }: Props) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getProjectById, addCommentLocal } = useProjects();
    
    // ⭐ NUEVO: Timeline Comments (en lugar de comments legacy)
    const [timelineComments, setTimelineComments] = useState<TimelineComment[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // ⭐ NUEVO: Regiones opcionales
    const [regions, setRegions] = useState<TimelineRegion[]>([]);

    // ⭐ NUEVO: Actualizar tiempo actual desde audioManager
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(audioManager.getCurrentTime());
            setDuration(audioManager.getDuration());
        }, 100); // Actualizar cada 100ms

        return () => clearInterval(interval);
    }, []);

    // ⭐ NUEVO: Suscribirse al estado de reproducción
    useEffect(() => {
        const unsubscribe = audioManager.subscribe((state) => {
            setIsPlaying(state === 'playing');
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const loadProject = async () => {
            try {
                const cached = getProjectById(id);
                if (cached) {
                    setProject(cached);
                    const legacyComments = cached.comments || [];
                    const converted: TimelineComment[] = legacyComments.map((c: any) => ({
                        id: c.id || Date.now().toString() + Math.random(),
                        time: c.timestamp || c.time || 0,
                        text: c.text || '',
                        author: c.author || 'Usuario',
                        date: c.date || new Date().toLocaleDateString(),
                        color: GOLD,
                    }));
                    setTimelineComments(converted);
                    setIsLoading(false);
                    return;
                }

                const allProjects = await getProjectsFromDB();
                const foundProject = allProjects.find((p) => String(p.id) === id);
                
                if (foundProject) {
                    setProject(foundProject);
                    const legacyComments = foundProject.comments || [];
                    const converted: TimelineComment[] = legacyComments.map((c: any) => ({
                        id: c.id || Date.now().toString() + Math.random(),
                        time: c.timestamp || 0,
                        text: c.text || '',
                        author: c.author || 'Usuario',
                        date: c.date || new Date().toLocaleDateString(),
                        color: GOLD,
                    }));
                    setTimelineComments(converted);
                } else {
                    // ⭐ MODO DEMO: Cargar proyecto de prueba automáticamente
                    console.log('[Link Privado] No se encontró el proyecto, cargando DEMO...');
                    const demoProject: Project = {
                        id: 'demo',
                        title: 'Demo Track - Audio Test',
                        artist: 'Audio Engineer',
                        genre: 'Electronic',
                        category: 'ORDER',
                        isPublic: false,
                        status: 'PENDING',
                        type: 'AUDIO',
                        mixUrl: 'https://www.w3schools.com/html/horse.mp3',
                        masterUrl: '',
                        versions: [
                            {
                                id: 'v1',
                                name: 'Demo Mix',
                                url: 'https://www.w3schools.com/html/horse.mp3',
                                date: new Date().toISOString(),
                                type: 'Mix',
                            }
                        ],
                        currentVersionId: 'v1',
                        date: new Date().toLocaleDateString(),
                        comments: [],
                    };
                    setProject(demoProject);
                    setTimelineComments([]);
                }
            } catch (error) {
                console.error('Error al cargar proyecto compartido:', error);
                // ⭐ FALLBACK: Cargar demo en caso de error
                console.log('[Link Privado] Error en DB, cargando DEMO como fallback...');
                const demoProject: Project = {
                    id: 'demo-error',
                    title: 'Demo Track (Offline Mode)',
                    artist: 'Audio App',
                    genre: 'Demo',
                    category: 'ORDER',
                    isPublic: false,
                    status: 'PENDING',
                    type: 'AUDIO',
                    mixUrl: 'https://www.w3schools.com/html/horse.mp3',
                    masterUrl: '',
                    versions: [
                        {
                            id: 'v1',
                            name: 'Demo Mix',
                            url: 'https://www.w3schools.com/html/horse.mp3',
                            date: new Date().toISOString(),
                            type: 'Mix',
                        }
                    ],
                    currentVersionId: 'v1',
                    date: new Date().toLocaleDateString(),
                    comments: [],
                };
                setProject(demoProject);
            } finally {
                setIsLoading(false);
            }
        };

        loadProject();
    }, [id, getProjectById]);

    /**
     * ⭐ NUEVO: Handler para agregar comentario desde TimelinePins
     */
    const handleAddComment = (comment: Omit<TimelineComment, 'id' | 'date'>) => {
        const newComment: TimelineComment = {
            ...comment,
            id: Date.now().toString() + Math.random(),
            date: new Date().toLocaleDateString(),
        };

        setTimelineComments([...timelineComments, newComment]);
        if (project) {
            addCommentLocal(project.id, {
                text: newComment.text,
                time: newComment.time,
                date: newComment.date,
                author: newComment.author,
            });
        }
        console.log('[Link Privado] ✓ Comentario agregado en', comment.time.toFixed(2) + 's');

        // TODO: Guardar en DB cuando esté conectado
    };

    /**
     * ⭐ NUEVO: Handler para eliminar comentario
     */
    const handleDeleteComment = (id: string) => {
        setTimelineComments(timelineComments.filter(c => c.id !== id));
        console.log('[Link Privado] 🗑️ Comentario eliminado:', id);
    };

    /**
     * ⭐ NUEVO: Handler para saltar a un tiempo específico
     */
    const handleSeek = (time: number) => {
        audioManager.seek(time);
        console.log('[Link Privado] ⏩ Saltando a', time.toFixed(2) + 's');
    };

    /**
     * ⭐ NUEVO: Handler para agregar región
     */
    const handleAddRegion = (region: Omit<TimelineRegion, 'id'>) => {
        const newRegion: TimelineRegion = {
            ...region,
            id: Date.now().toString() + Math.random(),
        };

        setRegions([...regions, newRegion]);
        console.log('[Link Privado] 🔴 Región agregada:', region.startTime, '-', region.endTime);
    };

    const handleAddComment_LEGACY = () => {
        // Legacy function - ya no se usa
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div 
                        style={{ borderTopColor: GOLD }}
                        className="w-12 h-12 border-2 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"
                    />
                    <p className="text-neutral-500 font-mono text-xs tracking-wider uppercase">Cargando...</p>
                </div>
            </div>
        );
    }

    // ⭐ Ya no mostramos "Link no encontrado", siempre cargamos un proyecto (real o demo)
    if (!project) {
        // Esto solo se ve brevemente mientras carga
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div 
                        style={{ borderTopColor: GOLD }}
                        className="w-12 h-12 border-2 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"
                    />
                    <p className="text-neutral-500 font-mono text-xs tracking-wider uppercase">Cargando proyecto...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header - Logo pequeño + AudioToolbar centrada */}
            <header className="border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: GOLD }}
                        />
                        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                            Audio App
                        </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-600">
                        Link Privado
                    </span>
                </div>
            </header>

            {/* AudioToolbar - Izotope Style */}
            <AudioToolbar isVisible={true} />

            {/* Main Content - Sala de Escucha */}
            <main className="flex-1 flex flex-col">
                {/* Player Section - Protagonista */}
                <div className="flex-1 flex items-center justify-center px-6 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full max-w-5xl"
                    >
                        {/* Título del Proyecto */}
                        <div className="mb-12 text-center">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div 
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ backgroundColor: GOLD }}
                                />
                                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                                    Proyecto Compartido
                                </span>
                            </div>
                            <h1 
                                className="text-4xl md:text-5xl font-light tracking-tight mb-4"
                                style={{ 
                                    color: GOLD,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {project.title}
                            </h1>
                            <p className="text-neutral-400 font-mono text-sm">
                                {project.artist} • {project.genre}
                            </p>
                        </div>

                        {/* Player - Grande e Imponente */}
                        <div 
                            className="border-2 rounded-lg p-8 bg-neutral-950/50 space-y-6"
                            style={{
                                borderColor: GOLD,
                                boxShadow: `0 0 60px ${GOLD}10`,
                            }}
                        >
                            {/* ActiveProjectPlayer */}
                            <ActiveProjectPlayer
                                key={`player-${project.id}`}
                                mixUrl={project.mixUrl}
                                masterUrl={project.masterUrl}
                                hideToggle={false}
                                accentColor={GOLD}
                            />

                            {/* ⭐ NUEVO: Timeline Pins - Sistema de Comentarios Visual */}
                            <div className="pt-6 border-t border-white/10">
                                <TimelinePins
                                    comments={timelineComments}
                                    onAddComment={handleAddComment}
                                    onDeleteComment={handleDeleteComment}
                                    onSeek={handleSeek}
                                    currentTime={currentTime}
                                    duration={duration}
                                    isPlaying={isPlaying}
                                    accentColor={GOLD}
                                    regions={regions}
                                    onAddRegion={handleAddRegion}
                                    enableRegions={true}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ⭐ LEGACY Comments Section - ELIMINADO (Ahora usa TimelinePins) */}
            </main>
        </div>
    );
}

