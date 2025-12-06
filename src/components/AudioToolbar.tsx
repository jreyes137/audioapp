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
import SpatialAudioPanel from "./SpatialAudioPanel";

const GOLD = "#D4AF37";
const CYAN = "#06b6d4";

interface Props {
    isVisible?: boolean;
    onMetadataClick?: () => void;
    onABTestClick?: () => void;
}

export default function AudioToolbar({ isVisible = true, onMetadataClick, onABTestClick }: Props) {
    // Estados de herramientas
    const [isMonoMode, setIsMonoMode] = useState(false);
    const [midSideMode, setMidSideMode] = useState<"OFF" | "MID" | "SIDE">("OFF");
    const [isEqualLoudness, setIsEqualLoudness] = useState(false);
    
    // Mediciones en tiempo real
    const [lufs, setLufs] = useState(-60);
    const [peak, setPeak] = useState(-60);
    const [truePeak, setTruePeak] = useState(-60);
    const [currentGain, setCurrentGain] = useState(1.0);
    const [phaseCorrelation, setPhaseCorrelation] = useState(0);
    
    // ⭐ NUEVO: Audio Quality Metadata
    const [audioMetadata, setAudioMetadata] = useState<{
        format: string | null;
        sampleRate: number | null;
        channelLabel: string;
        isHiRes: boolean;
        bpm: number | null;
        key: string | null;
    }>({
        format: null,
        sampleRate: null,
        channelLabel: 'Stereo',
        isHiRes: false,
        bpm: null,
        key: null,
    });
    
    // ⭐ NUEVO: Environment Simulation (Car Test)
    const [environment, setEnvironment] = useState<'studio' | 'car' | 'phone' | 'laptop'>('studio');
    
    // ⭐ NUEVO: Spatial Audio (3D Mode)
    const [is3DMode, setIs3DMode] = useState(false);
    const [showSpatialPanel, setShowSpatialPanel] = useState(false);
    
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

                    // True Peak estimado (time domain)
                    const maxSample = Math.max(...timeDomainArray.map(v => Math.abs((v - 128) / 128)));
                    const tp = maxSample > 0 ? 20 * Math.log10(maxSample) : -60;
                    setTruePeak(Math.max(-60, tp));

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

        const maxVal = Math.max(...data);

        if (maxVal < 1) {
            // Grid logarítmica 20Hz-20kHz
            const freqs = [20, 1000, 20000];
            freqs.forEach((f) => {
                const x = Math.log10(f / 20) / Math.log10(20000 / 20);
                const pos = x * w;
                ctx.strokeStyle = "rgba(255,255,255,0.08)";
                ctx.beginPath();
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, h);
                ctx.stroke();
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.font = "10px monospace";
                ctx.fillText(f === 20000 ? "20k" : f === 1000 ? "1k" : "20", pos + 4, 12);
            });
            [0.25, 0.5, 0.75].forEach((y) => {
                const pos = h * y;
                ctx.strokeStyle = "rgba(255,255,255,0.05)";
                ctx.beginPath();
                ctx.moveTo(0, pos);
                ctx.lineTo(w, pos);
                ctx.stroke();
            });
            return;
        }

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

    /**
     * ⭐ NUEVO: Actualizar metadatos de audio cada segundo
     */
    useEffect(() => {
        if (!isVisible) return;

        const updateMetadata = () => {
            const metadata = audioManager.getAudioMetadata();
            setAudioMetadata(metadata);
        };

        // Actualizar inmediatamente
        updateMetadata();

        // Actualizar cada segundo
        const interval = setInterval(updateMetadata, 1000);

        return () => clearInterval(interval);
    }, [isVisible]);

    /**
     * ⭐ NUEVO: Handler para cambiar entorno de simulación
     */
    const handleEnvironmentChange = (env: 'studio' | 'car' | 'phone' | 'laptop') => {
        setEnvironment(env);
        audioManager.setEnvironment(env);
        console.log(`[AudioToolbar] 🎧 Entorno cambiado a: ${env.toUpperCase()}`);
    };

    /**
     * ⭐ NUEVO: Handler para 3D Mode
     */
    const handle3DModeToggle = () => {
        const newState = !is3DMode;
        const success = audioManager.toggleSpatialAudio(newState);
        
        if (success) {
            setIs3DMode(newState);
            if (newState) {
                setShowSpatialPanel(true);
            }
            console.log(`[AudioToolbar] 🎧 3D Mode ${newState ? 'ON' : 'OFF'}`);
        } else {
            console.warn('[AudioToolbar] No se pudo activar 3D Mode');
        }
    };

    const formatNumber = (value: number | null | undefined, decimals = 1, suffix = '') => {
        if (value === null || value === undefined || Number.isNaN(value)) return `--${suffix}`;
        return `${value.toFixed(decimals)}${suffix}`;
    };

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
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-sm font-mono font-black text-white drop-shadow-lg">
                                            {formatNumber(lufs, 1)} LUFS
                                        </span>
                                        <span className="text-[10px] font-mono text-white/70">
                                            TP {formatNumber(truePeak, 1, ' dBTP')}
                                        </span>
                                    </div>
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

                        {/* ⭐ NUEVO: Audio Quality Monitor (Chip Técnico) */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            className="flex-shrink-0"
                        >
                            <div className="text-[9px] text-white/50 font-mono mb-2 uppercase tracking-widest flex items-center gap-2">
                                <span className="text-green-500">●</span> AUDIO SPECS
                            </div>
                            <div 
                                className="px-4 py-3 bg-black/60 border border-white/10 rounded-xl"
                                style={{
                                    boxShadow: audioMetadata.isHiRes 
                                        ? `0 0 20px ${CYAN}40, inset 0 0 10px ${CYAN}20` 
                                        : 'inset 0 2px 10px rgba(0,0,0,0.5)',
                                }}
                            >
                                <div className="flex items-center gap-3 text-xs font-mono font-black">
                                    {/* Formato */}
                                    <span 
                                        className="tracking-wider"
                                        style={{ color: audioMetadata.format ? CYAN : '#666' }}
                                    >
                                        {audioMetadata.format || '--'}
                                    </span>
                                    
                                    <span className="text-white/20">•</span>
                                    
                                    {/* Sample Rate */}
                                    <span 
                                        className="tracking-wider"
                                        style={{ color: audioMetadata.sampleRate ? GOLD : '#666' }}
                                    >
                                        {audioMetadata.sampleRate 
                                            ? `${(audioMetadata.sampleRate / 1000).toFixed(1)}kHz`
                                            : '--'}
                                    </span>
                                    
                                    <span className="text-white/20">•</span>
                                    
                                    {/* Channel */}
                                    <span className="text-white tracking-wider">
                                        {audioMetadata.channelLabel || '--'}
                                    </span>

                                    {/* ⭐ NUEVO: BPM */}
                                    {audioMetadata.bpm && (
                                        <>
                                            <span className="text-white/20">•</span>
                                            <span 
                                                className="tracking-wider"
                                                style={{ color: '#22c55e' }}
                                                title="Tempo detectado automáticamente"
                                            >
                                                {audioMetadata.bpm} BPM
                                            </span>
                                        </>
                                    )}
                                    
                                    {/* ⭐ NUEVO: Key (si está disponible) */}
                                    {audioMetadata.key && (
                                        <>
                                            <span className="text-white/20">•</span>
                                            <span 
                                                className="tracking-wider"
                                                style={{ color: '#a855f7' }}
                                                title="Tonalidad detectada"
                                            >
                                                {audioMetadata.key}
                                            </span>
                                        </>
                                    )}

                                    {/* Hi-Res Badge */}
                                    {audioMetadata.isHiRes && (
                                        <>
                                            <span className="text-white/20">•</span>
                                            <span 
                                                className="text-[10px] px-2 py-0.5 rounded-md font-black tracking-widest"
                                                style={{
                                                    backgroundColor: CYAN,
                                                    color: 'black',
                                                    boxShadow: `0 0 10px ${CYAN}60`,
                                                }}
                                            >
                                                HQ
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="text-[8px] text-white/30 mt-1 font-mono tracking-wider">
                                    {audioMetadata.bpm 
                                        ? `🎵 Tempo: ${audioMetadata.bpm} BPM` 
                                        : audioMetadata.isHiRes 
                                            ? '✓ Hi-Resolution Audio' 
                                            : audioMetadata.format 
                                                ? 'Standard Quality' 
                                                : 'Waiting for audio...'}
                                </div>
                            </div>
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

                        {/* ⭐ NUEVO: Environment Simulator (Car Test) */}
                        <div className="flex gap-1 bg-black/40 border border-white/10 rounded-xl p-1.5">
                            {([
                                { id: 'studio', icon: '🎧', label: 'Studio' },
                                { id: 'car', icon: '🚗', label: 'Car' },
                                { id: 'phone', icon: '📱', label: 'Phone' },
                                { id: 'laptop', icon: '💻', label: 'Laptop' },
                            ] as const).map((env) => (
                                <motion.button
                                    key={env.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEnvironmentChange(env.id)}
                                    style={{
                                        backgroundColor: environment === env.id ? GOLD : 'transparent',
                                        color: environment === env.id ? 'black' : 'white',
                                        boxShadow: environment === env.id ? `0 0 15px ${GOLD}60` : 'none',
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${environment === env.id ? 'ring-2 ring-cyan-500 text-white' : ''}`}
                                    title={
                                        env.id === 'studio' ? 'Bypass (sin simulación)' :
                                        env.id === 'car' ? 'Simula estéreo de coche (V-shape)' :
                                        env.id === 'phone' ? 'Simula speaker de celular (sin bajos)' :
                                        'Simula speakers de laptop (resonancia 2kHz)'
                                    }
                                >
                                    {env.icon}
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
                        {/* A/B Test */}
                        {onABTestClick && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onABTestClick}
                                className="px-4 py-2 border-2 border-white/15 rounded-xl text-xs font-black tracking-widest text-white/80 hover:border-cyan-400/60 hover:text-white transition-all flex items-center gap-2"
                                title="Comparar referencia A/B"
                            >
                                🔄 A/B
                            </motion.button>
                        )}

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

                        {/* ⭐ NUEVO: 3D Mode */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handle3DModeToggle}
                            style={{
                                backgroundColor: is3DMode ? CYAN : 'rgba(255,255,255,0.03)',
                                color: is3DMode ? 'black' : 'white',
                                borderColor: is3DMode ? CYAN : 'rgba(255,255,255,0.15)',
                                boxShadow: is3DMode ? `0 0 20px ${CYAN}60, inset 0 0 10px ${CYAN}40` : 'none',
                            }}
                            className="px-5 py-2.5 border-2 rounded-xl text-xs font-black tracking-widest transition-all hover:border-cyan-500/50 flex items-center gap-2"
                            title="Activar Audio Espacial 3D (HRTF Binaural)"
                        >
                            <span className="text-base">🎧</span>
                            3D MODE
                            {is3DMode && (
                                <span className="text-[9px] opacity-70 font-mono animate-pulse">
                                    SPATIAL
                                </span>
                            )}
                        </motion.button>

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

                {/* ⭐ NUEVO: Aviso de Simulación Activa (Borde Amarillo) */}
                {environment !== 'studio' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 px-6 py-3 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl flex items-center justify-between"
                        style={{
                            boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <div className="text-sm font-bold text-yellow-400">
                                    Simulación Activa: {
                                        environment === 'car' ? '🚗 Coche (V-Shape)' :
                                        environment === 'phone' ? '📱 Celular (Sin Bajos)' :
                                        '💻 Laptop (Resonancia 2kHz)'
                                    }
                                </div>
                                <div className="text-xs text-yellow-500/70 font-mono mt-1">
                                    Esta es una simulación. Recuerda volver a 🎧 Studio antes de exportar.
                                </div>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEnvironmentChange('studio')}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-black transition-all"
                        >
                            DESACTIVAR
                        </motion.button>
                    </motion.div>
                )}

                {/* Subtle scan line effect */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                    }}
                />
            </div>

            {/* ⭐ NUEVO: Spatial Audio Panel */}
            <SpatialAudioPanel
                isOpen={showSpatialPanel}
                onClose={() => setShowSpatialPanel(false)}
            />
        </motion.div>
    );
}

