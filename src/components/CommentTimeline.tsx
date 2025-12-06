/**
 * COMMENT TIMELINE - Timeline interactiva para comentarios
 * 
 * Permite:
 * - Click en timeline para seleccionar tiempo exacto
 * - Ver markers de comentarios existentes
 * - Preview al hover
 * - Botón "Reproducir desde aquí"
 * 
 * Estilo: Dark Luxury
 */

"use client";
import { useState, useRef, useEffect } from "react";
import { audioManager } from "@/lib/audioManager";

const GOLD = "#D4AF37";

interface Comment {
    text: string;
    time: number;
    date: string;
    author?: string;
}

interface Props {
    comments: Comment[];
    duration: number;
    currentTime: number;
    onAddComment: (time: number) => void;
    accentColor?: string;
}

export default function CommentTimeline({
    comments,
    duration,
    currentTime,
    onAddComment,
    accentColor = GOLD,
}: Props) {
    const [hoveredTime, setHoveredTime] = useState<number | null>(null);
    const [hoveredComment, setHoveredComment] = useState<Comment | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * duration;

        console.log('[CommentTimeline] Tiempo seleccionado:', time.toFixed(2), 's');
        onAddComment(time);
    };

    const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * duration;

        setHoveredTime(time);
    };

    const handleCommentHover = (comment: Comment | null) => {
        setHoveredComment(comment);
    };

    const handlePlayFromComment = (time: number) => {
        audioManager.seek(time);
        if (!audioManager.isPlaying()) {
            audioManager.play(audioManager.getAudioElement()?.src || '', time).catch(console.error);
        }
    };

    return (
        <div className="space-y-2">
            {/* Timeline interactiva */}
            <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                onMouseMove={handleTimelineHover}
                onMouseLeave={() => setHoveredTime(null)}
                className="relative h-20 bg-black border border-white/10 rounded-lg cursor-crosshair overflow-hidden group"
            >
                {/* Progress bar */}
                <div
                    style={{
                        width: `${(currentTime / (duration || 1)) * 100}%`,
                        backgroundColor: accentColor,
                        opacity: 0.3,
                    }}
                    className="absolute top-0 left-0 h-full transition-all duration-100"
                />

                {/* Waveform simulada (decorativa) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    {Array.from({ length: 100 }).map((_, i) => {
                        const height = Math.sin(i * 0.5) * 30 + 40;
                        return (
                            <div
                                key={i}
                                className="bg-white/30 mx-px"
                                style={{
                                    height: `${height}%`,
                                    width: '1%',
                                }}
                            />
                        );
                    })}
                </div>

                {/* Markers de comentarios existentes */}
                {comments.map((comment, i) => {
                    const position = (comment.time / (duration || 1)) * 100;
                    return (
                        <div
                            key={i}
                            style={{ left: `${position}%` }}
                            className="absolute top-0 bottom-0 w-1 bg-red-500 z-10 cursor-pointer hover:w-2 transition-all"
                            onMouseEnter={() => handleCommentHover(comment)}
                            onMouseLeave={() => handleCommentHover(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePlayFromComment(comment.time);
                            }}
                        >
                            {/* Tooltip */}
                            {hoveredComment === comment && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-red-500 text-white text-xs px-3 py-2 rounded shadow-xl whitespace-nowrap z-50">
                                    <div className="font-bold mb-1">
                                        {Math.floor(comment.time / 60)}:{(Math.floor(comment.time) % 60).toString().padStart(2, '0')}
                                    </div>
                                    <div className="max-w-xs truncate">{comment.text}</div>
                                    <div className="text-[9px] text-white/60 mt-1">{comment.date}</div>
                                    {/* Flecha */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Hover indicator */}
                {hoveredTime !== null && (
                    <div
                        style={{ left: `${(hoveredTime / (duration || 1)) * 100}%` }}
                        className="absolute top-0 bottom-0 w-px bg-white/40 pointer-events-none"
                    >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white/90 text-black text-[9px] px-2 py-1 rounded font-mono font-bold whitespace-nowrap">
                            {Math.floor(hoveredTime / 60)}:{(Math.floor(hoveredTime) % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                )}

                {/* Help text (visible on hover) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                        <p className="text-xs text-white/80 font-mono">
                            Click para agregar comentario en ese momento
                        </p>
                    </div>
                </div>
            </div>

            {/* Instrucciones */}
            <div className="flex items-center justify-between px-2">
                <p className="text-[9px] text-white/40 font-mono">
                    {comments.length} comentarios • Click en la línea para agregar
                </p>
                <p className="text-[9px] text-white/40 font-mono">
                    {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}
                </p>
            </div>
        </div>
    );
}

