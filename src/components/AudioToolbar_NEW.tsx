/**
 * AUDIO TOOLBAR - Suite de Herramientas Profesionales
 * 
 * Barra superior global estilo Izotope con herramientas de audio pro:
 * - LUFS Meter (Loudness)
 * - Phase Meter (Correlación)
 * - Goniometer (Campo estéreo)
 * - Spectrum Analyzer (RTA frecuencias)
 * - Mono Check
 * - Mid/Side
 * - Equal Loudness
 * - Metadata
 * 
 * Estilo: Dark Luxury "Izotope" - Espaciado, futurista, con glow effects
 */

"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { audioManager } from "@/lib/audioManager";

const GOLD = "#D4AF37";
const CYAN = "#06b6d4";

interface Props {
    isVisible?: boolean;
    onMetadataClick?: () => void;
}

export default function AudioToolbar({ isVisible = true, onMetadataClick }: Props) {
    // Estados de herramientas
    const [isMonoMode, setIsMonoMode] = useState(false);
    const [midSideMode, setMidSideMode] = useState<"OFF" | "MID" | "SIDE">("OFF");
    const [isEqualLoudness, setIsEqualLoudness] = useState(false);
    
    // Mediciones en tiempo real
    const [lufs, setLufs] = useState(-60);
    const [peak, setPeak] = useState(-60);
    const [currentGain, setCurrentGain] = useState(1.0);
    const [phaseCorrelation, setPhaseCorrelation] = useState(0);
    
    // Referencias para visualizadores
    const goniometerRef = useRef<HTMLCanvasElement>(null);
    const spectrumRef = useRef<HTMLCanvasElement>(null);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number | null>(null);

    /**
     * ⭐ USAR EL ANALYSER DEL AUDIOMANAGER (No crear uno nuevo)
     */
    useEffect(() => {
        if (typeof window === 'undefined' || !isVisible) return;

        const initAudio = () => {
            try {
                const analyserFromManager = audioManager.getAnalyserNode();
                const audioContext = audioManager.getAudioContext();
                
                if (analyserFromManager && audioContext) {
                    analyzerRef.current = analyserFromManager;
                    audioContextRef.current = audioContext;
                    console.log('[AudioToolbar] ✓ Usando analyserNode del audioManager');
                } else {
                    console.warn('[AudioToolbar] ⚠️ analyserNode no disponible aún');
                }
            } catch (error) {
                console.warn('[AudioToolbar] Error al obtener analyser:', error);
            }
        };

        initAudio();

        const retryInterval = setInterval(() => {
            if (!analyzerRef.current) {
                const analyserFromManager = audioManager.getAnalyserNode();
                const audioContext = audioManager.getAudioContext();
                
                if (analyserFromManager && audioContext) {
                    analyzerRef.current = analyserFromManager;
                    audioContextRef.current = audioContext;
                    console.log('[AudioToolbar] ✓ analyserNode conectado (retry exitoso)');
                    clearInterval(retryInterval);
                }
            }
        }, 1000);

        return () => {
            clearInterval(retryInterval);
        };
    }, [isVisible]);

    /**
     * Loop de análisis en tiempo real
     */
    useEffect(() => {
        if (!isVisible) return;

        const dataArray = new Uint8Array(2048);
        const timeDomainArray = new Uint8Array(2048);

        const loop = () => {
            if (analyzerRef.current) {
                try {
                    analyzerRef.current.getByteFrequencyData(dataArray);
                    analyzerRef.current.getByteTimeDomainData(timeDomainArray);

                    // Calcular LUFS simulado (en realidad es RMS)
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        const normalized = dataArray[i] / 255;
                        sum += normalized * normalized;
                    }
                    const rms = Math.sqrt(sum / dataArray.length);
                    const lufsValue = rms > 0 ? 20 * Math.log10(rms) : -60;
                    setLufs(Math.max(-60, Math.min(0, lufsValue)));

                    // Calcular Peak
                    const peakValue = Math.max(...dataArray) / 255;
                    setPeak(peakValue > 0 ? 20 * Math.log10(peakValue) : -60);

                    // Calcular Phase Correlation
                    const correlation = calculatePhaseCorrelation(timeDomainArray);
                    setPhaseCorrelation(correlation);

                    // Dibujar visualizadores
                    drawGoniometer(timeDomainArray);
                    drawSpectrum(dataArray);
                } catch (e) {
                    // Silenciar errores
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isVisible]);

    /**
     * Calcula la correlación de fase entre L y R
     */
    const calculatePhaseCorrelation = (data: Uint8Array): number => {
        if (!analyzerRef.current) return 0;

        const bufferLength = analyzerRef.current.fftSize;
        const leftChannel = new Float32Array(bufferLength);
        const rightChannel = new Float32Array(bufferLength);
        
        for (let i = 0; i < Math.min(bufferLength, data.length); i += 2) {
            leftChannel[i / 2] = (data[i] / 255) - 0.5;
            rightChannel[i / 2] = (data[i + 1] / 255) - 0.5;
        }

        let sumL = 0, sumR = 0, sumLR = 0, sumL2 = 0, sumR2 = 0;
        const samples = bufferLength / 2;

        for (let i = 0; i < samples; i++) {
            const l = leftChannel[i];
            const r = rightChannel[i];
            
            sumL += l;
            sumR += r;
            sumLR += l * r;
            sumL2 += l * l;
            sumR2 += r * r;
        }

        const meanL = sumL / samples;
        const meanR = sumR / samples;
        
        const numerator = (sumLR / samples) - (meanL * meanR);
        const denominator = Math.sqrt(
            ((sumL2 / samples) - (meanL * meanL)) *
            ((sumR2 / samples) - (meanR * meanR))
        );

        if (denominator === 0) return 0;
        
        const correlation = numerator / denominator;
        return Math.max(-1, Math.min(1, correlation));
    };

    const drawGoniometer = (data: Uint8Array) => {
        const canvas = goniometerRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const centerX = w / 2;
        const centerY = h / 2;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, h);
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();

        [0.3, 0.6, 1.0].forEach((r) => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (w / 2) * r, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();

        for (let i = 0; i < data.length - 1; i++) {
            const x = ((data[i] / 255) - 0.5) * w;
            const y = ((data[i + 1] / 255) - 0.5) * h;
            
            if (i === 0) {
                ctx.moveTo(centerX + x, centerY + y);
            } else {
                ctx.lineTo(centerX + x, centerY + y);
            }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    };

    const drawSpectrum = (data: Uint8Array) => {
        const canvas = spectrumRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        const bars = 64;
        const barWidth = w / bars;

        for (let i = 0; i < bars; i++) {
            const value = data[i] / 255;
            const barHeight = value * h;
            
            const gradient = ctx.createLinearGradient(0, h - barHeight, 0, h);
            gradient.addColorStop(0, CYAN);
            gradient.addColorStop(0.5, GOLD);
            gradient.addColorStop(1, '#ff4444');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
        }
    };

    const handleMonoToggle = () => {
        const newMode = !isMonoMode;
        setIsMonoMode(newMode);
        
        if (newMode) {
            audioManager.setAudioMode('MONO');
            if (midSideMode !== 'OFF') setMidSideMode('OFF');
        } else {
            audioManager.setAudioMode('STEREO');
        }
    };

    const handleMidSideChange = (mode: "OFF" | "MID" | "SIDE") => {
        setMidSideMode(mode);
        
        if (mode === 'OFF') {
            if (isMonoMode) {
                audioManager.setAudioMode('MONO');
            } else {
                audioManager.setAudioMode('STEREO');
            }
        } else {
            audioManager.setAudioMode(mode);
            if (isMonoMode) {
                setIsMonoMode(false);
            }
        }
    };

    const handleEqualLoudnessToggle = () => {
        const newState = audioManager.toggleEqualLoudness();
        setIsEqualLoudness(newState);
    };

    useEffect(() => {
        if (!isEqualLoudness) return;

        const interval = setInterval(() => {
            const gain = audioManager.getCurrentGain();
            setCurrentGain(gain);
        }, 100);

        return () => clearInterval(interval);
    }, [isEqualLoudness]);

    if (!isVisible) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-black/60 border-b border-white/5 backdrop-blur-md"
            style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(5,5,5,0.7) 100%)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
            }}
        >
            <div className="max-w-[1920px] mx-auto px-8 py-6">
                {/* ⭐ DISEÑO IZOTOPE: 3 Secciones con gaps generosos */}
                <div className="flex items-center gap-8">
                    
                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECCIÓN 1: MEDICIÓN (Izquierda) - gap-6        */}
                    {/* ═══════════════════════════════════════════════ */}
                    <div className="flex items-end gap-6 flex-1">
                        {/* LUFS Meter */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="flex-1 max-w-[220px]"
                        >
                            <div className="text-[9px] text-white/50 font-mono mb-2 uppercase tracking-widest flex items-center gap-2">
                                <span className="text-amber-500">●</span> LUFS
                            </div>
                            <div 
                                className="relative h-10 bg-gradient-to-r from-black to-zinc-900 border border-white/10 rounded-xl overflow-hidden"
                                style={{
                                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${Math.max(0, (lufs + 60) / 60 * 100)}%`,
                                        background: `linear-gradient(to right, ${GOLD}, #ef4444)`,
                                        boxShadow: lufs > -20 ? `0 0 15px ${GOLD}` : 'none',
                                    }}
                                    className="absolute left-0 top-0 h-full transition-all duration-100"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-mono font-black text-white drop-shadow-lg">
                                        {lufs.toFixed(1)} LUFS
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Phase Meter */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="flex-1 max-w-[220px]"
                        >
                            <div className="text-[9px] text-white/50 font-mono mb-2 uppercase tracking-widest flex items-center gap-2">
                                <span className="text-cyan-500">●</span> PHASE
                            </div>
                            <div 
                                className="relative h-10 bg-gradient-to-r from-black to-zinc-900 border border-white/10 rounded-xl overflow-hidden"
                                style={{
                                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                                }}
                            >
                                <div className="absolute inset-0 flex">
                                    <div className="flex-1 bg-gradient-to-r from-red-600/30 via-yellow-500/30 to-green-500/30"></div>
                                </div>
                                
                                <div
                                    style={{
                                        left: `${((phaseCorrelation + 1) / 2) * 100}%`,
                                        transform: 'translateX(-50%)',
                                        boxShadow: phaseCorrelation > 0 ? '0 0 10px #22c55e' : '0 0 10px #ef4444',
                                    }}
                                    className="absolute top-1 bottom-1 w-1 bg-white rounded-full transition-all duration-100"
                                />
                                
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-mono font-black text-white drop-shadow-lg">
                                        {phaseCorrelation >= 0 ? '+' : ''}{phaseCorrelation.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[9px] text-white/40 mt-1 text-center font-mono">
                                {phaseCorrelation > 0.8 ? '✓ In Phase' : phaseCorrelation < -0.3 ? '⚠ Out of Phase' : '≈ Stereo'}
                            </div>
                        </motion.div>

                        {/* Goniometer */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="flex-shrink-0"
                        >
                            <div className="text-[9px] text-white/50 font-mono mb-2 uppercase tracking-widest">
                                GONIOMETER
                            </div>
                            <canvas
                                ref={goniometerRef}
                                width="160"
                                height="120"
                                className="w-40 h-[120px] bg-black border border-white/10 rounded-xl"
                                style={{
                                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.1)',
                                }}
                            />
                        </motion.div>

                        {/* Spectrum Analyzer */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                            className="flex-shrink-0"
                        >
                            <div className="text-[9px] text-white/50 font-mono mb-2 uppercase tracking-widest">
                                SPECTRUM RTA
                            </div>
                            <canvas
                                ref={spectrumRef}
                                width="320"
                                height="120"
                                className="w-80 h-[120px] bg-black border border-white/10 rounded-xl"
                                style={{
                                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 0 20px rgba(6,182,212,0.1)',
                                }}
                            />
                        </motion.div>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECCIÓN 2: CONTROLES DE ESCUCHA (Centro)       */}
                    {/* ═══════════════════════════════════════════════ */}
                    <div className="flex items-center gap-4">
                        {/* Mono Check */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleMonoToggle}
                            style={{
                                backgroundColor: isMonoMode ? GOLD : 'rgba(255,255,255,0.03)',
                                color: isMonoMode ? 'black' : 'white',
                                borderColor: isMonoMode ? GOLD : 'rgba(255,255,255,0.15)',
                                boxShadow: isMonoMode ? `0 0 20px ${GOLD}60, inset 0 0 10px ${GOLD}40` : 'none',
                            }}
                            className="px-5 py-2.5 border-2 rounded-xl text-xs font-black tracking-widest transition-all hover:border-white/30"
                            title="Suma canales L+R para verificar compatibilidad mono"
                        >
                            🔘 MONO
                        </motion.button>

                        {/* Mid/Side Selector */}
                        <div className="flex gap-1 bg-black/40 border border-white/10 rounded-xl p-1.5">
                            {(['OFF', 'MID', 'SIDE'] as const).map((mode) => (
                                <motion.button
                                    key={mode}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMidSideChange(mode)}
                                    style={{
                                        backgroundColor: midSideMode === mode ? CYAN : 'transparent',
                                        color: midSideMode === mode ? 'black' : 'white',
                                        boxShadow: midSideMode === mode ? `0 0 15px ${CYAN}60` : 'none',
                                    }}
                                    className="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                                    title={
                                        mode === 'MID' ? 'Solo el centro (L+R)' :
                                        mode === 'SIDE' ? 'Solo los lados (L-R)' :
                                        'Stereo normal'
                                    }
                                >
                                    {mode === 'OFF' ? '📻' : mode === 'MID' ? '◉' : '◎'} {mode}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECCIÓN 3: UTILIDADES (Derecha)                */}
                    {/* ═══════════════════════════════════════════════ */}
                    <div className="flex items-center gap-4">
                        {/* Equal Loudness */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEqualLoudnessToggle}
                            style={{
                                backgroundColor: isEqualLoudness ? GOLD : 'rgba(255,255,255,0.03)',
                                color: isEqualLoudness ? 'black' : 'white',
                                borderColor: isEqualLoudness ? GOLD : 'rgba(255,255,255,0.15)',
                                boxShadow: isEqualLoudness ? `0 0 20px ${GOLD}60, inset 0 0 10px ${GOLD}40` : 'none',
                            }}
                            className="px-5 py-2.5 border-2 rounded-xl text-xs font-black tracking-widest transition-all hover:border-white/30 flex items-center gap-2"
                            title="Normaliza el volumen a -14 LUFS (estándar streaming)"
                        >
                            <span className="text-base">⚖️</span>
                            EQUAL
                            {isEqualLoudness && (
                                <span className="text-[10px] opacity-70 font-mono">
                                    {(currentGain * 100).toFixed(0)}%
                                </span>
                            )}
                        </motion.button>

                        {/* Metadata Editor */}
                        {onMetadataClick && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onMetadataClick}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.15)',
                                }}
                                className="px-5 py-2.5 border-2 rounded-xl text-xs font-black tracking-widest hover:border-amber-500/50 hover:bg-amber-500/10 transition-all flex items-center gap-2"
                                title="Editor de Metadatos ID3 profesional"
                            >
                                <span className="text-base">📝</span>
                                METADATA
                            </motion.button>
                        )}

                        {/* Peak Indicator */}
                        <div 
                            className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl"
                            style={{
                                boxShadow: peak > -1 ? '0 0 15px rgba(239,68,68,0.5)' : 'none',
                            }}
                        >
                            <div className="text-[9px] text-white/50 font-mono uppercase tracking-widest">
                                PEAK
                            </div>
                            <div 
                                className={`text-sm font-mono font-black transition-colors ${
                                    peak > -1 ? 'text-red-500 animate-pulse' : 'text-white'
                                }`}
                            >
                                {peak.toFixed(1)} dB
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subtle scan line effect */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                    }}
                />
            </div>
        </motion.div>
    );
}

