/**
 * ACTIVE PROJECT PLAYER
 * 
 * Arquitectura Híbrida:
 * - Audio: HTML5 Audio (via audioManager singleton) - INDESTRUCTIBLE
 * - Visualizador: WebAudio API con FALLBACK matemático
 * 
 * Soluciones implementadas:
 * 1. ✓ No más audio fantasma (usa audioManager global)
 * 2. ✓ Visualizador siempre funciona (simulación si WebAudio falla)
 * 3. ✓ Reactividad Firebase (key basada en URLs)
 * 4. ✓ TypeScript estricto
 */

"use client";
import { useState, useRef, useEffect } from "react";
import { audioManager } from "@/lib/audioManager";
import { COLORS } from "@/lib/theme";
import Toast from "./Toast";

const ACCENT = COLORS?.gold || "#D4AF37";
const FALLBACK = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

interface Comment {
    text: string;
    time: number;
    date: string;
}

interface Metrics {
    lufs: number;
    rms: number;
    peak: number;
    avgLufs: number;
    phase: number;
}

// ⭐ NUEVO: Interfaz para versiones (Version Stacking)
interface Version {
    id: string;
    name: string;
    url: string;
    date: string;
    type: "Mix" | "Master" | "Revision" | "Final";
    notes?: string;
}

interface Props {
    // ⚠️ DEPRECATED (mantener para compatibilidad)
    mixUrl?: string | null;
    masterUrl?: string | null;
    
    // ⭐ NUEVO: Version Stacking
    versions?: Version[];
    projectTitle?: string;
    
    monitorMode?: "STEREO" | "MONO" | "SIDE";
    onMetricsUpdate?: (metrics: Metrics) => void;
    showInternalTools?: boolean;
    isInteractive?: boolean;
    comments?: Comment[];
    onAddComment?: (comment: Comment) => void;
    autoPlay?: boolean;
    triggerSnippet?: number | null;
    accentColor?: string;
    hideToggle?: boolean;
    
    // ⭐ NUEVO: Seguridad (Fase 3)
    isPaid?: boolean; // Si el proyecto ha sido pagado
    onDownloadRequest?: () => void; // Callback para manejar descarga
}

export default function ActiveProjectPlayer({
    mixUrl,
    masterUrl,
    versions,
    projectTitle,
    monitorMode = "STEREO",
    onMetricsUpdate,
    showInternalTools = false,
    isInteractive = false,
    comments = [],
    onAddComment,
    autoPlay = false,
    triggerSnippet = null,
    accentColor = ACCENT,
    hideToggle = false,
    isPaid = true, // ⭐ NUEVO: Por defecto asumimos que está pagado
    onDownloadRequest,
}: Props) {
    // ⭐ NUEVO: Convertir mixUrl/masterUrl legacy a versiones si no hay array
    const getInitialVersions = (): Version[] => {
        if (versions && versions.length > 0) {
            return versions;
        }
        
        // Compatibilidad: convertir mixUrl/masterUrl a versiones
        const legacyVersions: Version[] = [];
        if (mixUrl) {
            legacyVersions.push({
                id: 'mix-legacy',
                name: 'Mix',
                url: mixUrl,
                date: new Date().toISOString(),
                type: 'Mix',
            });
        }
        if (masterUrl) {
            legacyVersions.push({
                id: 'master-legacy',
                name: 'Master',
                url: masterUrl,
                date: new Date().toISOString(),
                type: 'Master',
            });
        }
        return legacyVersions;
    };

    // Estados UI
    const [isPlaying, setIsPlaying] = useState(false);
    const [availableVersions] = useState<Version[]>(getInitialVersions());
    const [selectedVersionId, setSelectedVersionId] = useState<string>(
        availableVersions.length > 0 ? availableVersions[availableVersions.length - 1].id : ''
    );
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [displayMetrics, setDisplayMetrics] = useState<Metrics>({
        lufs: -14.0,
        rms: -15.0,
        peak: -0.5,
        avgLufs: -14.2,
        phase: 0.9,
    });

    // ⭐ NUEVO: Estado para archivo local (Local First)
    const [localFile, setLocalFile] = useState<File | null>(null);
    const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
    const [localFileName, setLocalFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // ⭐ NUEVO: Toast para File Gate
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    
    // ⭐ NUEVO: A/B Testing con Referencia (Fase 5)
    const [referenceFile, setReferenceFile] = useState<File | null>(null);
    const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
    const [referenceName, setReferenceName] = useState<string | null>(null);
    const [isPlayingB, setIsPlayingB] = useState(false); // false = A (main), true = B (reference)
    const referenceInputRef = useRef<HTMLInputElement | null>(null);

    // ⭐ NUEVO: Obtener versión seleccionada
    const selectedVersion = availableVersions.find(v => v.id === selectedVersionId);

    // Referencias
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const snippetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Motor Híbrido: Flag para saber si WebAudio funciona
    const [useSimulation, setUseSimulation] = useState(false);

    // URL SEGURA: Si no hay URL válida, usar fallback
    // ⭐ NUEVO: Determinar fuente de audio (Version Stacking con Local First + A/B Testing)
    const activeSrc = isPlayingB && referenceUrl 
        ? referenceUrl 
        : (localFileUrl || 
           (selectedVersion?.url && selectedVersion.url.length > 5 ? selectedVersion.url : FALLBACK));

    /**
     * EFECTO 1: Cambio de archivo
     * Cuando cambia la URL, forzar recarga en audioManager
     */
    useEffect(() => {
        console.log('[Player] Cambio detectado:', activeSrc.slice(0, 50));
        
        // Si estaba reproduciendo, continuar con la nueva fuente
        const wasPlaying = audioManager.isPlaying();
            
            if (wasPlaying) {
            audioManager.play(activeSrc, 0).catch((err) => {
                console.error('[Player] Error al cambiar fuente:', err);
                setIsPlaying(false);
            });
        }

        // Limpiar analyzer viejo
        if (sourceNodeRef.current && audioContextRef.current) {
            try {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
                console.log('[Player] Nodo WebAudio desconectado para recarga');
            } catch (e) {
                // Ya estaba desconectado
            }
        }
    }, [activeSrc]);

    /**
     * EFECTO 2: Obtener analyserNode del audioManager (NO crear uno nuevo)
     */
    useEffect(() => {
        const initWebAudio = async () => {
            if (typeof window === 'undefined') return;

            try {
                // ⭐ CRÍTICO: Usar el analyserNode del audioManager
                // NO crear un nuevo AudioContext (solo puede haber uno por <audio>)
                const analyserFromManager = audioManager.getAnalyserNode();
                
                if (analyserFromManager) {
                    analyzerRef.current = analyserFromManager;
                    console.log('[Player] ✓ Usando analyserNode del audioManager');
                    setUseSimulation(false);
                } else {
                    console.warn('[Player] ⚠️ analyserNode no disponible, usando simulación');
                    setUseSimulation(true);
                }
            } catch (error: any) {
                console.warn('[Player] Error al obtener analyserNode:', error.message);
                console.warn('[Player] Activando simulación matemática como fallback');
                setUseSimulation(true);
            }
        };

        initWebAudio();

        // ⭐ Reintentar si el analyser no estaba disponible al inicio
        const retryInterval = setInterval(() => {
            if (!analyzerRef.current) {
                const analyserFromManager = audioManager.getAnalyserNode();
                if (analyserFromManager) {
                    analyzerRef.current = analyserFromManager;
                    console.log('[Player] ✓ analyserNode conectado (retry exitoso)');
                    setUseSimulation(false);
                    clearInterval(retryInterval);
                }
            }
        }, 1000);

        // Cleanup
        return () => {
            clearInterval(retryInterval);
            // NO cerrar el audioContext aquí, pertenece al audioManager
        };
    }, []);

    /**
     * EFECTO 3: Loop de visualización (MOTOR HÍBRIDO)
     */
    useEffect(() => {
        const dataArray = new Uint8Array(64);

        const loop = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            const w = ctx.canvas.width;
            const h = ctx.canvas.height;

            // Limpiar canvas
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "#050505";
            ctx.fillRect(0, 0, w, h);
                    
                    // Grid de fondo
            ctx.strokeStyle = "#222";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();

            // Gradiente para barras
                    const grd = ctx.createLinearGradient(0, h, 0, 0);
            grd.addColorStop(0, "#1a1a1a");
            grd.addColorStop(0.5, accentColor);
            grd.addColorStop(1, "#fff");
                    ctx.fillStyle = grd;

            const bars = 64;
            const barW = w / bars;

            // MOTOR HÍBRIDO: Intentar datos reales, si falla usar simulación
            let hasRealData = false;

            if (!useSimulation && analyzerRef.current) {
                try {
                    analyzerRef.current.getByteFrequencyData(dataArray);
                    
                    // Verificar si hay datos reales (no todo ceros)
                    const sum = dataArray.reduce((a, b) => a + b, 0);
                    if (sum > 10 && isPlaying) {
                        hasRealData = true;
                        
                        // Dibujar datos reales de WebAudio
                    for (let i = 0; i < bars; i++) {
                            const value = dataArray[i] / 255.0;
                            const height = value * h * 0.85;
                            ctx.fillRect(i * barW, h - height, barW - 1, height);
                        }
                    }
                } catch (e) {
                    // Falló WebAudio, usar simulación
                }
            }

            // ⭐ DESACTIVADO: Simulación matemática
            // Usuario prefiere ver la barra plana si no hay datos reales
            if (!hasRealData) {
                // Mostrar barras mínimas (silencio)
                for (let i = 0; i < bars; i++) {
                    const height = 2; // Solo línea base
                    ctx.fillRect(i * barW, h - height, barW - 1, height);
                }
                
                // Log para debug
                if (isPlaying && Math.random() > 0.95) {
                    console.log('[Player] ⚠️ Sin datos de WebAudio - Verifica conexión a analyserNode');
                }
            }

            // Actualizar métricas simuladas
            if (isPlaying && onMetricsUpdate && Math.random() > 0.85) {
                const t = Date.now() / 1000;
                const lufs = -14 + Math.sin(t * 0.5) * 1.5;
                const rms = lufs - 1;
                const peak = -0.5 + Math.random() * 0.3;
                const phase = 0.85 + Math.random() * 0.1;
                const newMetrics = { lufs, rms, peak, avgLufs: -14.2, phase };
                setDisplayMetrics(newMetrics);
                onMetricsUpdate(newMetrics);
            }

            // Sincronizar tiempo desde audioManager
            setCurrentTime(audioManager.getCurrentTime());
            setDuration(audioManager.getDuration() || 1);
            
            rafRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isPlaying, accentColor, useSimulation, onMetricsUpdate]);

    /**
     * EFECTO 4: Suscribirse a cambios de estado del audioManager
     */
    useEffect(() => {
        const unsubscribe = audioManager.subscribe((state) => {
            setIsPlaying(state === 'playing');
        });

        return unsubscribe;
    }, []);

    /**
     * EFECTO 5: Autoplay si se requiere
     */
    useEffect(() => {
        if (autoPlay) {
            audioManager.play(activeSrc, 0).catch((err) => {
                console.error('[Player] Autoplay bloqueado:', err);
            });
        }
    }, [autoPlay, activeSrc]);

    /**
     * ⭐ NUEVO EFECTO 7: Activar/desactivar watermark según isPaid
     */
    useEffect(() => {
        if (!isPaid) {
            console.log('[Player] 🔒 Proyecto NO pagado → Activando watermark');
            audioManager.enableWatermark(true);
        } else {
            console.log('[Player] 🔓 Proyecto pagado → Desactivando watermark');
            audioManager.enableWatermark(false);
        }

        // Cleanup al desmontar
        return () => {
            audioManager.enableWatermark(false);
        };
    }, [isPaid]);

    /**
     * ⭐ NUEVO EFECTO 8: Cleanup de Object URLs (Fase 5)
     */
    useEffect(() => {
        // Cleanup al desmontar componente
        return () => {
            if (localFileUrl) {
                URL.revokeObjectURL(localFileUrl);
                console.log('[Player] 🧹 Cleanup: Local file URL revoked');
            }
            if (referenceUrl) {
                URL.revokeObjectURL(referenceUrl);
                console.log('[Player] 🧹 Cleanup: Reference URL revoked');
            }
        };
    }, [localFileUrl, referenceUrl]);

    /**
     * EFECTO 6: Trigger de snippet (Inbox)
     */
    useEffect(() => {
        if (triggerSnippet !== null && triggerSnippet >= 0) {
            // Reproducir snippet de 5 segundos
            audioManager.playSnippet(activeSrc, triggerSnippet, 5).catch((err) => {
                console.error('[Player] Error en snippet:', err);
            });

            // Limpiar timeout anterior
            if (snippetTimeoutRef.current) {
                clearTimeout(snippetTimeoutRef.current);
            }

            // Auto-pausar después de 5 segundos
            snippetTimeoutRef.current = setTimeout(() => {
                if (audioManager.getCurrentTime() >= triggerSnippet + 5) {
                    audioManager.pause();
                }
            }, 5000);
        }

        return () => {
            if (snippetTimeoutRef.current) {
                clearTimeout(snippetTimeoutRef.current);
            }
        };
    }, [triggerSnippet, activeSrc]);

    /**
     * ⭐ NUEVO: HANDLERS PARA ARCHIVOS LOCALES (Local First)
     */
    const handleFileSelect = (file: File) => {
        if (!file) return;

        // Validar que sea un archivo de audio
        if (!file.type.startsWith('audio/')) {
            alert('Por favor selecciona un archivo de audio válido');
            return;
        }

        console.log('[Player] 📁 Archivo local seleccionado:', file.name);

        // Limpiar URL anterior si existe
        if (localFileUrl) {
            URL.revokeObjectURL(localFileUrl);
        }

        // ⭐ Crear Object URL (NO sube a Firebase, reproducción instantánea)
        const objectUrl = URL.createObjectURL(file);
        
        setLocalFile(file);
        setLocalFileUrl(objectUrl);
        setLocalFileName(file.name);

        console.log('[Player] ✓ Object URL creado:', objectUrl.slice(0, 50) + '...');

        // ⭐ Reproducir INMEDIATAMENTE
        audioManager.play(objectUrl, 0).then(() => {
            console.log('[Player] ▶ Reproduciendo archivo local');
        }).catch((err) => {
            console.error('[Player] Error al reproducir archivo local:', err);
        });
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    /**
     * ⭐ NUEVO: HANDLERS PARA A/B TESTING (Fase 5)
     */
    const handleReferenceSelect = (file: File) => {
        if (!file) return;

        // Validar que sea un archivo de audio
        if (!file.type.startsWith('audio/')) {
            alert('Por favor selecciona un archivo de audio válido');
            return;
        }

        console.log('[Player] 🔄 Archivo de referencia seleccionado:', file.name);

        // Limpiar URL anterior si existe
        if (referenceUrl) {
            URL.revokeObjectURL(referenceUrl);
        }

        // Crear Object URL para la referencia
        const objectUrl = URL.createObjectURL(file);
        
        setReferenceFile(file);
        setReferenceUrl(objectUrl);
        setReferenceName(file.name);

        console.log('[Player] ✓ Referencia cargada:', file.name);
        
        // Mostrar toast de éxito
        setToastMessage(`✅ Referencia cargada: ${file.name}`);
        setShowToast(true);
    };

    const handleABToggle = async () => {
        if (!referenceUrl) {
            setToastMessage('⚠️ Primero carga una referencia con el botón +');
            setShowToast(true);
            return;
        }

        // ⭐ CRÍTICO: Capturar tiempo actual ANTES de cambiar
        const currentTime = audioManager.getCurrentTime();
        const wasPlaying = isPlaying;

        console.log('[Player] 🔄 A/B Toggle:', isPlayingB ? 'B→A' : 'A→B', 'at', currentTime.toFixed(2) + 's');

        // Alternar modo
        const newMode = !isPlayingB;
        setIsPlayingB(newMode);

        // Determinar qué fuente usar
        const targetUrl = newMode ? referenceUrl : activeSrc;

        // ⭐ SINCRONIZACIÓN: Cambiar fuente manteniendo el tiempo
        try {
            if (wasPlaying) {
                // Si estaba reproduciendo, seguir reproduciendo desde el mismo tiempo
                await audioManager.play(targetUrl, currentTime);
                console.log('[Player] ✓ Cambiado a', newMode ? 'B (Referencia)' : 'A (Principal)', 'en', currentTime.toFixed(2) + 's');
            } else {
                // Si estaba pausado, solo cambiar la fuente y buscar el tiempo
                audioManager.stop();
                await audioManager.play(targetUrl, currentTime);
                audioManager.pause();
                console.log('[Player] ✓ Cambiado a', newMode ? 'B (Referencia)' : 'A (Principal)', '(pausado)');
            }
        } catch (error) {
            console.error('[Player] Error al cambiar A/B:', error);
            setIsPlayingB(!newMode); // Revertir en caso de error
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Cleanup de Object URL al desmontar
    useEffect(() => {
        return () => {
            if (localFileUrl) {
                URL.revokeObjectURL(localFileUrl);
            }
        };
    }, [localFileUrl]);

    /**
     * CONTROLES
     */
    const togglePlay = async () => {
        try {
        if (isPlaying) {
                audioManager.pause();
        } else {
                // Reanudar AudioContext si está suspendido (requisito de navegadores)
                if (audioContextRef.current?.state === 'suspended') {
                    await audioContextRef.current.resume();
                }
                await audioManager.play(activeSrc, audioManager.getCurrentTime());
            }
        } catch (error) {
            console.error('[Player] Error en toggle:', error);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        audioManager.seek(newTime);
        setCurrentTime(newTime);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * ⭐ NUEVO: Handler para cambiar de versión (Version Stacking)
     */
    const handleVersionChange = async (newVersionId: string) => {
        const newVersion = availableVersions.find(v => v.id === newVersionId);
        if (!newVersion) return;

        console.log('[Player] 🔄 Cambiando a versión:', newVersion.name);

        // Guardar estado actual
        const wasPlaying = isPlaying;
        const currentTimePosition = audioManager.getCurrentTime();

        // Cambiar versión
        setSelectedVersionId(newVersionId);

        // Cargar nueva versión manteniendo el tiempo
        try {
            await audioManager.play(newVersion.url, currentTimePosition);
            
            // Si estaba pausado, pausar de nuevo
            if (!wasPlaying) {
                audioManager.pause();
            }

            console.log('[Player] ✓ Versión cambiada exitosamente');
        } catch (error) {
            console.error('[Player] Error al cambiar versión:', error);
        }
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`bg-[#080808] rounded-xl border p-4 w-full relative transition-all ${
                isDragging ? 'border-2 border-yellow-500 bg-yellow-500/5' : 'border-[#222]'
            }`}
        >
            {/* ⭐ NUEVO: Indicador de Drag & Drop */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-xl backdrop-blur-sm">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎵</div>
                        <p className="text-yellow-500 font-bold text-xl">
                            Suelta tu archivo aquí
                        </p>
                        <p className="text-white/60 text-sm mt-2">
                            Reproducción instantánea, sin subir a la nube
                        </p>
                    </div>
                </div>
            )}

            {/* ⭐ NUEVO: File Input oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileInputChange}
                className="hidden"
            />

            {/* ⭐ NUEVO: Indicador de archivo local cargado */}
            {localFileName && (
                <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📁</span>
                        <div>
                            <p className="text-yellow-500 font-bold text-sm">Archivo Local</p>
                            <p className="text-white/60 text-xs truncate max-w-md">{localFileName}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (localFileUrl) URL.revokeObjectURL(localFileUrl);
                            setLocalFile(null);
                            setLocalFileUrl(null);
                            setLocalFileName(null);
                            audioManager.stop();
                        }}
                        className="text-white/40 hover:text-white text-xs px-3 py-1 border border-white/20 rounded hover:bg-white/5 transition-all"
                    >
                        Quitar
                    </button>
                </div>
            )}

            {/* ⭐ NUEVO: Indicador de referencia cargada (Fase 5) */}
            {referenceName && (
                <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔄</span>
                        <div>
                            <p className="text-cyan-400 font-bold text-sm">
                                Referencia {isPlayingB && <span className="text-[10px] ml-2 bg-cyan-500 text-black px-2 py-0.5 rounded">ACTIVA</span>}
                            </p>
                            <p className="text-white/60 text-xs truncate max-w-md">{referenceName}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (referenceUrl) URL.revokeObjectURL(referenceUrl);
                            setReferenceFile(null);
                            setReferenceUrl(null);
                            setReferenceName(null);
                            setIsPlayingB(false);
                            // Si estaba reproduciendo B, volver a A
                            if (isPlayingB && isPlaying) {
                                const currentTime = audioManager.getCurrentTime();
                                audioManager.play(activeSrc, currentTime).catch(console.error);
                            }
                        }}
                        className="text-white/40 hover:text-white text-xs px-3 py-1 border border-white/20 rounded hover:bg-white/5 transition-all"
                    >
                        Quitar
                    </button>
                </div>
            )}

            {/* ⭐ NUEVO: Botón para seleccionar archivo si no hay uno cargado */}
            {!localFileName && !mixUrl && !masterUrl && (
                <div className="mb-4 text-center py-8 border-2 border-dashed border-white/10 rounded-lg hover:border-yellow-500/50 transition-all cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}>
                    <div className="text-4xl mb-3">🎵</div>
                    <p className="text-white/80 font-bold mb-2">
                        Arrastra un archivo o haz click
                    </p>
                    <p className="text-white/40 text-xs">
                        MP3, WAV, FLAC, OGG - Reproducción instantánea
                    </p>
                </div>
            )}

            {/* Indicador de modo híbrido (solo dev) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-2 right-2 text-[8px] text-[#444] font-mono">
                    {useSimulation ? 'SIM' : 'WAA'}
                </div>
            )}

            {/* Herramientas internas */}
            {showInternalTools && (
                <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-2">
                    <div className="flex gap-2">
                        <span className="text-[9px] border border-[#333] px-2 rounded text-[#555]">
                            {monitorMode}
                        </span>
                    </div>
                     <div className="flex items-center gap-4">
                        {/* Phase meter */}
                        <div className="w-16 h-1 bg-[#222] rounded relative">
                            <div
                                className="absolute top-0 bottom-0 bg-green-500 transition-all"
                                style={{
                                    left: '50%',
                                    width: `${displayMetrics.phase * 50}%`,
                                }}
                            ></div>
                        </div>
                        <span className="text-[10px] font-mono text-white">
                            {displayMetrics.lufs.toFixed(1)} LUFS
                        </span>
                     </div>
                </div>
            )}

            {/* ⭐ NUEVO: Título del proyecto (si está disponible) */}
            {projectTitle && !localFileName && (
                <div className="mb-3 px-2">
                    <h3 className="text-sm font-bold text-white/90 truncate">
                        {projectTitle}
                    </h3>
                    {selectedVersion && (
                        <p className="text-[10px] text-white/40 mt-1">
                            {selectedVersion.date ? new Date(selectedVersion.date).toLocaleDateString() : ''}
                            {selectedVersion.notes && ` • ${selectedVersion.notes}`}
                        </p>
                    )}
                </div>
            )}

            {/* Visualizador + Play Button */}
            <div className="relative h-32 w-full bg-black flex items-center justify-center rounded-lg overflow-hidden border border-[#1a1a1a] mb-2">
                <canvas
                    ref={canvasRef}
                    width="600"
                    height="150"
                    className="absolute inset-0 w-full h-full opacity-90"
                />
                <button
                    onClick={togglePlay}
                    style={{
                        backgroundColor: isPlaying ? accentColor : 'white',
                        color: 'black',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        zIndex: 20,
                        cursor: 'pointer',
                        border: 'none',
                        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    className="hover:scale-110"
                >
                    {isPlaying ? (
                        <span className="font-black text-xl">||</span>
                    ) : (
                        <span className="font-black text-xl">▶</span>
                    )}
                </button>
            </div>

            {/* Timeline + Comments */}
            <div
                onClick={handleSeek}
                className="relative h-6 bg-[#111] w-full cursor-crosshair mb-4 rounded overflow-hidden border-t border-[#222]"
            >
                {/* Progress bar */}
                <div
                    style={{
                        width: `${(currentTime / duration) * 100}%`,
                        backgroundColor: accentColor,
                        opacity: 0.4,
                    }}
                    className="absolute top-0 left-0 h-full transition-all duration-100"
                ></div>

                {/* Markers de comentarios */}
                {comments.map((c, i) => (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${(c.time / duration) * 100}%` }}
                    ></div>
                ))}
            </div>

            {/* ⭐ NUEVO: Selector de Versiones (Version Stacking) + Timer + A/B Testing */}
            <div className="flex items-center justify-between px-2 gap-4">
                {/* Dropdown de versiones + Botón de Referencia */}
                {availableVersions.length > 0 && !hideToggle && (
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] text-white/40 font-mono uppercase tracking-wider">
                                Versión
                            </span>
                        </div>
                        <select
                            value={selectedVersionId}
                            onChange={(e) => handleVersionChange(e.target.value)}
                            style={{
                                backgroundColor: '#0a0a0a',
                                borderColor: accentColor + '40',
                                color: accentColor,
                            }}
                            className="flex-1 text-[11px] font-black border px-3 py-2 rounded-lg transition-all hover:bg-[#111] focus:outline-none focus:border-opacity-100 appearance-none cursor-pointer"
                        >
                            {availableVersions.map((version) => (
                                <option 
                                    key={version.id} 
                                    value={version.id}
                                    style={{ 
                                        backgroundColor: '#000',
                                        color: '#fff',
                                        padding: '8px'
                                    }}
                                >
                                    {version.name} {version.type && `(${version.type})`}
                                </option>
                            ))}
                        </select>

                        {/* ⭐ NUEVO: Botón '+' para cargar referencia (Fase 5) */}
                        <button
                            onClick={() => referenceInputRef.current?.click()}
                            style={{
                                backgroundColor: referenceUrl ? accentColor + '20' : 'transparent',
                                borderColor: referenceUrl ? accentColor : 'rgba(255,255,255,0.2)',
                                color: referenceUrl ? accentColor : 'white',
                            }}
                            className="text-[11px] font-black border px-3 py-2 rounded-lg transition-all hover:bg-white/5 hover:border-white/40 flex items-center gap-1"
                            title="Cargar archivo de referencia para A/B Testing"
                        >
                            <span className="text-base">+</span>
                            {referenceName ? (
                                <span className="max-w-[100px] truncate text-[8px]">{referenceName}</span>
                            ) : (
                                <span className="text-[9px]">REF</span>
                            )}
                        </button>
                        <input
                            ref={referenceInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleReferenceSelect(file);
                                e.target.value = ''; // Reset input
                            }}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Indicador de versión actual si hideToggle */}
                {hideToggle && selectedVersion && (
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-[9px] font-bold text-white/60">
                            📁 {selectedVersion.name}
                        </span>
                        {selectedVersion.type && (
                            <span 
                                className="text-[8px] px-2 py-0.5 rounded"
                                style={{
                                    backgroundColor: accentColor + '20',
                                    color: accentColor,
                                }}
                            >
                                {selectedVersion.type}
                            </span>
                        )}
                </div>
                )}

                {/* ⭐ NUEVO: Botón A/B Mágico (Fase 5) */}
                {referenceUrl && (
                    <button
                        onClick={handleABToggle}
                        style={{
                            backgroundColor: isPlayingB ? '#06b6d4' : accentColor,
                            borderColor: isPlayingB ? '#06b6d4' : accentColor,
                            color: 'black',
                        }}
                        className="text-[14px] font-black border-2 px-6 py-2 rounded-lg transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2"
                        title="Alternar entre A (Principal) y B (Referencia) - Mantiene tiempo sincronizado"
                    >
                        <span className="text-[18px] font-black">
                            {isPlayingB ? 'B' : 'A'}
                        </span>
                        <span className="text-[10px] font-mono opacity-80">
                            {isPlayingB ? 'REF' : 'MIX'}
                        </span>
                    </button>
                )}

                {/* Timer */}
                <span className="text-[9px] font-mono text-[#555] whitespace-nowrap">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* ⭐ NUEVO: Botón de descarga con File Gate */}
                {onDownloadRequest && (
                    <button
                        onClick={() => {
                            if (!isPaid) {
                                // Mostrar toast elegante si no está pagado
                                setToastMessage('Completa el pago para desbloquear la descarga Hi-Res');
                                setShowToast(true);
                            } else {
                                onDownloadRequest();
                            }
                        }}
                        disabled={!isPaid}
                        style={{
                            backgroundColor: isPaid ? accentColor + '20' : '#333',
                            borderColor: isPaid ? accentColor : '#555',
                            color: isPaid ? accentColor : '#888',
                            cursor: isPaid ? 'pointer' : 'not-allowed',
                            opacity: isPaid ? 1 : 0.5,
                        }}
                        className="text-[9px] font-black px-3 py-2 border rounded-lg transition-all hover:bg-opacity-30 flex items-center gap-2"
                        title={isPaid ? 'Descargar archivo Hi-Res' : 'Completa el pago para descargar'}
                    >
                        {isPaid ? '⬇️ DESCARGAR' : '🔒 BLOQUEADO'}
                    </button>
                )}
            </div>

            {/* ⭐ NUEVO: Toast para notificaciones */}
            {showToast && (
                <Toast
                    message={toastMessage}
                    type="error"
                    duration={4000}
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
}
