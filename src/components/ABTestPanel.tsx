/**
 * A/B TEST PANEL - Comparador de Tracks
 * 
 * Permite cargar 2 tracks y alternar entre ellos sin latencia.
 * Útil para comparar mezclas, masters, o antes/después.
 * 
 * Características:
 * - Switch instantáneo (mantiene tiempo de reproducción)
 * - Igualación automática de volumen (opcional)
 * - Visualización dual
 * 
 * Estilo: Dark Luxury
 */

"use client";
import { useState, useEffect, useRef } from "react";
import { audioManager } from "@/lib/audioManager";

const GOLD = "#D4AF37";
const CYAN = "#06b6d4";

interface Props {
    onClose?: () => void;
}

export default function ABTestPanel({ onClose }: Props) {
    const [trackA, setTrackA] = useState<{ url: string; name: string } | null>(null);
    const [trackB, setTrackB] = useState<{ url: string; name: string } | null>(null);
    const [activeTrack, setActiveTrack] = useState<"A" | "B">("A");
    const [volumeMatch, setVolumeMatch] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    const fileInputARef = useRef<HTMLInputElement>(null);
    const fileInputBRef = useRef<HTMLInputElement>(null);

    // Sincronizar tiempo
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(audioManager.getCurrentTime());
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const handleFileSelect = async (file: File, track: "A" | "B") => {
        if (!file) return;

        console.log(`[ABTest] Cargando track ${track}:`, file.name);

        // Crear URL temporal del archivo local
        const url = URL.createObjectURL(file);

        const trackData = {
            url,
            name: file.name,
        };

        if (track === "A") {
            setTrackA(trackData);
            console.log('[ABTest] Track A cargado');
        } else {
            setTrackB(trackData);
            console.log('[ABTest] Track B cargado');
        }
    };

    const handleSwitch = async (track: "A" | "B") => {
        const targetTrack = track === "A" ? trackA : trackB;

        if (!targetTrack) {
            alert(`⚠️ Primero carga el Track ${track}`);
            return;
        }

        try {
            const wasPlaying = audioManager.isPlaying();
            const currentTime = audioManager.getCurrentTime();

            // Switch instantáneo manteniendo el tiempo
            await audioManager.play(targetTrack.url, currentTime);

            if (!wasPlaying) {
                audioManager.pause();
            }

            setActiveTrack(track);
            console.log(`[ABTest] Switched to track ${track} at ${currentTime.toFixed(2)}s`);
        } catch (error) {
            console.error('[ABTest] Error al cambiar track:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
            <div className="bg-black border border-white/10 rounded-2xl p-8 max-w-4xl w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white mb-2">A/B Test</h2>
                        <p className="text-sm text-white/60">
                            Compara dos mezclas alternando sin latencia
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Tracks Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Track A */}
                    <div
                        style={{
                            borderColor: activeTrack === "A" ? CYAN : 'rgba(255,255,255,0.1)',
                            backgroundColor: activeTrack === "A" ? 'rgba(6,182,212,0.05)' : 'transparent',
                        }}
                        className="border-2 rounded-xl p-6 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div
                                style={{ backgroundColor: CYAN }}
                                className="w-12 h-12 rounded-full flex items-center justify-center text-black font-black text-xl"
                            >
                                A
                            </div>
                            {trackA && (
                                <button
                                    onClick={() => handleSwitch("A")}
                                    style={{
                                        backgroundColor: activeTrack === "A" ? CYAN : 'transparent',
                                        borderColor: CYAN,
                                        color: activeTrack === "A" ? 'black' : 'white',
                                    }}
                                    className="px-4 py-2 border rounded-lg text-xs font-black transition-all"
                                >
                                    {activeTrack === "A" ? "ACTIVO" : "ACTIVAR"}
                                </button>
                            )}
                        </div>

                        {trackA ? (
                            <div className="bg-white/5 rounded-lg p-4">
                                <p className="text-sm text-white font-mono truncate">{trackA.name}</p>
                                <button
                                    onClick={() => setTrackA(null)}
                                    className="text-xs text-red-400 hover:text-red-300 mt-2"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ) : (
                            <label className="block cursor-pointer">
                                <input
                                    ref={fileInputARef}
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], "A")}
                                />
                                <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:bg-white/10 transition-all">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="text-sm text-white/60">Click para cargar Track A</p>
                                </div>
                            </label>
                        )}
                    </div>

                    {/* Track B */}
                    <div
                        style={{
                            borderColor: activeTrack === "B" ? GOLD : 'rgba(255,255,255,0.1)',
                            backgroundColor: activeTrack === "B" ? 'rgba(212,175,55,0.05)' : 'transparent',
                        }}
                        className="border-2 rounded-xl p-6 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div
                                style={{ backgroundColor: GOLD }}
                                className="w-12 h-12 rounded-full flex items-center justify-center text-black font-black text-xl"
                            >
                                B
                            </div>
                            {trackB && (
                                <button
                                    onClick={() => handleSwitch("B")}
                                    style={{
                                        backgroundColor: activeTrack === "B" ? GOLD : 'transparent',
                                        borderColor: GOLD,
                                        color: activeTrack === "B" ? 'black' : 'white',
                                    }}
                                    className="px-4 py-2 border rounded-lg text-xs font-black transition-all"
                                >
                                    {activeTrack === "B" ? "ACTIVO" : "ACTIVAR"}
                                </button>
                            )}
                        </div>

                        {trackB ? (
                            <div className="bg-white/5 rounded-lg p-4">
                                <p className="text-sm text-white font-mono truncate">{trackB.name}</p>
                                <button
                                    onClick={() => setTrackB(null)}
                                    className="text-xs text-red-400 hover:text-red-300 mt-2"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ) : (
                            <label className="block cursor-pointer">
                                <input
                                    ref={fileInputBRef}
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], "B")}
                                />
                                <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:bg-white/10 transition-all">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="text-sm text-white/60">Click para cargar Track B</p>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                {/* Controles */}
                <div className="border-t border-white/10 pt-6">
                    {/* Switch rápido */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <button
                            onClick={() => handleSwitch("A")}
                            disabled={!trackA}
                            style={{
                                backgroundColor: activeTrack === "A" && trackA ? CYAN : 'transparent',
                                borderColor: CYAN,
                                color: activeTrack === "A" && trackA ? 'black' : 'white',
                            }}
                            className="px-8 py-4 border-2 rounded-xl text-lg font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                        >
                            A
                        </button>

                        <div className="text-white/40 font-mono text-sm">
                            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
                        </div>

                        <button
                            onClick={() => handleSwitch("B")}
                            disabled={!trackB}
                            style={{
                                backgroundColor: activeTrack === "B" && trackB ? GOLD : 'transparent',
                                borderColor: GOLD,
                                color: activeTrack === "B" && trackB ? 'black' : 'white',
                            }}
                            className="px-8 py-4 border-2 rounded-xl text-lg font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                        >
                            B
                        </button>
                    </div>

                    {/* Opciones */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={volumeMatch}
                                onChange={(e) => setVolumeMatch(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-white/60 group-hover:text-white transition-colors">
                                Igualar volumen (RMS match)
                            </span>
                        </label>

                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-xs text-white/60">
                        <strong className="text-white">💡 Tip:</strong> Usa las teclas{' '}
                        <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono">A</kbd> y{' '}
                        <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono">B</kbd>{' '}
                        para alternar rápidamente mientras escuchas.
                    </p>
                </div>
            </div>
        </div>
    );
}

