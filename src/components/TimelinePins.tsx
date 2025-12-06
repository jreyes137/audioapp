/**
 * TIMELINE PINS - Sistema de Comentarios en Onda
 * 
 * "Google Maps del Audio" - Feedback visual y preciso
 * 
 * Funcionalidades:
 * - Click en onda/barra → Coloca un Pin
 * - Pin muestra timestamp exacto
 * - Input flotante para escribir comentario
 * - Lista de comentarios sincronizada
 * - Click en comentario → Salta a ese segundo
 * - Opcional: Selección de regiones
 */

"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#D4AF37";
const CYAN = "#06b6d4";

export interface TimelineComment {
    id: string;
    time: number; // Segundos exactos
    text: string;
    author?: string;
    date: string;
    color?: string; // Color del pin
}

export interface TimelineRegion {
    id: string;
    startTime: number;
    endTime: number;
    color: string;
    label?: string;
}

interface Props {
    comments: TimelineComment[];
    onAddComment: (comment: Omit<TimelineComment, 'id' | 'date'>) => void;
    onDeleteComment?: (id: string) => void;
    onSeek: (time: number) => void;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    accentColor?: string;
    canvasRef?: React.RefObject<HTMLCanvasElement>;
    regions?: TimelineRegion[];
    onAddRegion?: (region: Omit<TimelineRegion, 'id'>) => void;
    enableRegions?: boolean;
}

export default function TimelinePins({
    comments,
    onAddComment,
    onDeleteComment,
    onSeek,
    currentTime,
    duration,
    isPlaying,
    accentColor = GOLD,
    canvasRef,
    regions = [],
    onAddRegion,
    enableRegions = false,
}: Props) {
    const [isAddingPin, setIsAddingPin] = useState(false);
    const [newPinTime, setNewPinTime] = useState<number | null>(null);
    const [newPinText, setNewPinText] = useState("");
    const [hoveredPin, setHoveredPin] = useState<string | null>(null);
    
    // Selección de regiones
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
    
    const progressBarRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * Convertir click en X a tiempo en segundos
     */
    const getTimeFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current) return 0;
        
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const time = percentage * duration;
        
        return Math.max(0, Math.min(duration, time));
    };

    /**
     * Handle click en la barra de progreso
     */
    const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Si estamos seleccionando región, no colocar pin
        if (enableRegions && e.shiftKey) {
            handleRegionStart(e);
            return;
        }

        const time = getTimeFromClick(e);
        
        // Si ya hay un pin en edición, cancelarlo
        if (isAddingPin) {
            setIsAddingPin(false);
            setNewPinTime(null);
            setNewPinText("");
            return;
        }

        // Colocar nuevo pin
        setNewPinTime(time);
        setIsAddingPin(true);
        setNewPinText("");
        
        console.log('[TimelinePins] 📍 Nuevo pin en', formatTime(time));
    };

    /**
     * Iniciar selección de región (Shift + Click)
     */
    const handleRegionStart = (e: React.MouseEvent<HTMLDivElement>) => {
        const time = getTimeFromClick(e);
        setSelectionStart(time);
        setIsSelecting(true);
    };

    /**
     * Finalizar selección de región
     */
    const handleRegionEnd = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || selectionStart === null) return;
        
        const time = getTimeFromClick(e);
        setSelectionEnd(time);
        
        // Crear región
        const start = Math.min(selectionStart, time);
        const end = Math.max(selectionStart, time);
        
        if (end - start > 0.5 && onAddRegion) { // Mínimo 0.5s
            onAddRegion({
                startTime: start,
                endTime: end,
                color: 'rgba(239, 68, 68, 0.3)', // Rojo semitransparente
                label: `${formatTime(start)} - ${formatTime(end)}`,
            });
            console.log('[TimelinePins] 🔴 Región creada:', start, '-', end);
        }
        
        // Reset
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    /**
     * Guardar comentario del pin
     */
    const handleSavePin = () => {
        if (newPinTime === null || newPinText.trim() === "") return;
        
        onAddComment({
            time: newPinTime,
            text: newPinText.trim(),
            author: "Usuario",
            color: accentColor,
        });
        
        // Reset
        setIsAddingPin(false);
        setNewPinTime(null);
        setNewPinText("");
        
        console.log('[TimelinePins] ✓ Comentario guardado en', formatTime(newPinTime));
    };

    /**
     * Cancelar pin en edición
     */
    const handleCancelPin = () => {
        setIsAddingPin(false);
        setNewPinTime(null);
        setNewPinText("");
    };

    /**
     * Auto-focus en input cuando se coloca un pin
     */
    useEffect(() => {
        if (isAddingPin && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAddingPin]);

    /**
     * Formatear tiempo (segundos → mm:ss)
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Calcular posición X del pin (porcentaje)
     */
    const getPinPosition = (time: number): number => {
        if (duration === 0) return 0;
        return (time / duration) * 100;
    };

    return (
        <div className="w-full space-y-4">
            {/* Barra de progreso con Pins */}
            <div className="relative">
                <div 
                    ref={progressBarRef}
                    onClick={handleBarClick}
                    onMouseUp={enableRegions ? handleRegionEnd : undefined}
                    className="relative h-16 bg-black/40 border border-white/10 rounded-lg cursor-crosshair overflow-hidden group"
                    style={{
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* Regiones de fondo */}
                    {regions.map((region) => (
                        <div
                            key={region.id}
                            className="absolute top-0 bottom-0 pointer-events-none"
                            style={{
                                left: `${getPinPosition(region.startTime)}%`,
                                width: `${getPinPosition(region.endTime) - getPinPosition(region.startTime)}%`,
                                backgroundColor: region.color,
                                borderLeft: '2px solid rgba(239, 68, 68, 0.6)',
                                borderRight: '2px solid rgba(239, 68, 68, 0.6)',
                            }}
                        />
                    ))}

                    {/* Progreso actual */}
                    <div 
                        className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"
                        style={{
                            width: `${getPinPosition(currentTime)}%`,
                        }}
                    />

                    {/* Playhead (línea vertical del tiempo actual) */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
                        style={{
                            left: `${getPinPosition(currentTime)}%`,
                            backgroundColor: accentColor,
                            boxShadow: `0 0 10px ${accentColor}60`,
                        }}
                    />

                    {/* Pins existentes */}
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            onMouseEnter={() => setHoveredPin(comment.id)}
                            onMouseLeave={() => setHoveredPin(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSeek(comment.time);
                            }}
                            className="absolute top-0 bottom-0 cursor-pointer"
                            style={{
                                left: `${getPinPosition(comment.time)}%`,
                                transform: 'translateX(-50%)',
                            }}
                        >
                            {/* Pin marker */}
                            <div 
                                className="absolute bottom-0 w-0.5 h-full transition-all"
                                style={{
                                    backgroundColor: comment.color || CYAN,
                                    boxShadow: hoveredPin === comment.id 
                                        ? `0 0 20px ${comment.color || CYAN}` 
                                        : 'none',
                                }}
                            />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: hoveredPin === comment.id ? 1.2 : 1 }}
                                className="absolute bottom-0 w-3 h-3 rounded-full border-2 border-white"
                                style={{
                                    backgroundColor: comment.color || CYAN,
                                    transform: 'translate(-50%, 50%)',
                                    boxShadow: `0 0 10px ${comment.color || CYAN}60`,
                                }}
                            />

                            {/* Tooltip en hover */}
                            <AnimatePresence>
                                {hoveredPin === comment.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-full mb-2 px-3 py-2 bg-black/90 border border-white/20 rounded-lg text-xs text-white font-mono whitespace-nowrap"
                                        style={{
                                            transform: 'translateX(-50%)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        <div className="font-bold mb-1" style={{ color: comment.color || CYAN }}>
                                            {formatTime(comment.time)}
                                        </div>
                                        <div className="text-white/80 max-w-xs">
                                            {comment.text}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Pin en edición */}
                    {isAddingPin && newPinTime !== null && (
                        <div
                            className="absolute top-0 bottom-0"
                            style={{
                                left: `${getPinPosition(newPinTime)}%`,
                                transform: 'translateX(-50%)',
                            }}
                        >
                            <div 
                                className="absolute bottom-0 w-0.5 h-full animate-pulse"
                                style={{
                                    backgroundColor: accentColor,
                                    boxShadow: `0 0 20px ${accentColor}`,
                                }}
                            />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute bottom-0 w-4 h-4 rounded-full border-2 border-white animate-pulse"
                                style={{
                                    backgroundColor: accentColor,
                                    transform: 'translate(-50%, 50%)',
                                    boxShadow: `0 0 15px ${accentColor}`,
                                }}
                            />
                        </div>
                    )}

                    {/* Instrucciones */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-white/40 font-mono bg-black/60 px-3 py-1 rounded-lg">
                            {enableRegions 
                                ? 'Click para Pin • Shift+Arrastrar para Región' 
                                : 'Click para colocar un Pin'}
                        </div>
                    </div>
                </div>

                {/* Input flotante para nuevo pin */}
                <AnimatePresence>
                    {isAddingPin && newPinTime !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full mt-2 left-0 right-0 z-50"
                        >
                            <div 
                                className="bg-black/95 border-2 rounded-xl p-4"
                                style={{
                                    borderColor: accentColor,
                                    boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 40px ${accentColor}20`,
                                }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: accentColor }}
                                    />
                                    <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>
                                        {formatTime(newPinTime)}
                                    </span>
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newPinText}
                                    onChange={(e) => setNewPinText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSavePin();
                                        if (e.key === 'Escape') handleCancelPin();
                                    }}
                                    placeholder="Escribe tu comentario aquí... (Enter para guardar)"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40 transition-colors"
                                />
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={handleSavePin}
                                        disabled={newPinText.trim() === ""}
                                        style={{
                                            backgroundColor: newPinText.trim() ? accentColor : 'rgba(255,255,255,0.1)',
                                            color: newPinText.trim() ? 'black' : 'rgba(255,255,255,0.3)',
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:cursor-not-allowed"
                                    >
                                        ✓ Guardar
                                    </button>
                                    <button
                                        onClick={handleCancelPin}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Lista de comentarios */}
            {comments.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-mono text-white/50 uppercase tracking-wider mb-3">
                        Comentarios ({comments.length})
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {[...comments]
                            .sort((a, b) => a.time - b.time)
                            .map((comment) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => onSeek(comment.time)}
                                    className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all group"
                                >
                                    {/* Timeline marker */}
                                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                        <div 
                                            className="w-3 h-3 rounded-full border-2 border-white"
                                            style={{
                                                backgroundColor: comment.color || CYAN,
                                                boxShadow: `0 0 10px ${comment.color || CYAN}60`,
                                            }}
                                        />
                                        <div className="text-[10px] font-mono font-bold" style={{ color: comment.color || CYAN }}>
                                            {formatTime(comment.time)}
                                        </div>
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white leading-relaxed">
                                            {comment.text}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-white/40 font-mono">
                                                {comment.author || 'Usuario'}
                                            </span>
                                            <span className="text-white/20">•</span>
                                            <span className="text-xs text-white/40 font-mono">
                                                {comment.date}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Botón eliminar */}
                                    {onDeleteComment && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteComment(comment.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center transition-all"
                                        >
                                            <span className="text-red-400 text-xs">✕</span>
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                    </div>
                </div>
            )}

            {/* Custom scrollbar styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    );
}

