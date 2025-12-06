"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audioManager";

interface SpatialAudioPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SpatialAudioPanel({ isOpen, onClose }: SpatialAudioPanelProps) {
    // Estados del sonido
    const [soundPos, setSoundPos] = useState({ x: 0, z: -2 }); // x: izq/der, z: adelante/atrás
    const [distance, setDistance] = useState(2);
    const [angle, setAngle] = useState(0); // En grados
    
    // Estados de interacción
    const [isDragging, setIsDragging] = useState(false);
    const [isOrbiting, setIsOrbiting] = useState(false);
    const orbitIntervalRef = useRef<number | null>(null);
    
    // Referencias
    const radarRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Constantes
    const RADAR_SIZE = 400;
    const RADAR_CENTER = RADAR_SIZE / 2;
    const MAX_DISTANCE = 5; // metros
    const ORBIT_DURATION = 8000; // 8 segundos por vuelta

    /**
     * Convertir coordenadas cartesianas (x, z) a polares (ángulo, distancia)
     */
    const cartesianToPolar = (x: number, z: number) => {
        const dist = Math.sqrt(x * x + z * z);
        let ang = Math.atan2(x, -z) * (180 / Math.PI); // -z porque z negativo es "frente"
        return { angle: ang, distance: dist };
    };

    /**
     * Convertir coordenadas polares a cartesianas
     */
    const polarToCartesian = (angle: number, dist: number) => {
        const radians = angle * (Math.PI / 180);
        return {
            x: dist * Math.sin(radians),
            z: -dist * Math.cos(radians), // -dist porque adelante es z negativo
        };
    };

    /**
     * Actualizar posición del sonido en audioManager
     */
    const updateAudioPosition = (x: number, z: number) => {
        audioManager.updateSoundPosition(x, 0, z); // y=0 (altura neutra)
        setSoundPos({ x, z });
        
        const { angle: ang, distance: dist } = cartesianToPolar(x, z);
        setAngle(ang);
        setDistance(dist);
    };

    /**
     * Handler de mouse down en el radar
     */
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!radarRef.current) return;
        setIsDragging(true);
        handleMouseMove(e);
    };

    /**
     * Handler de mouse move (drag)
     */
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
        if (!radarRef.current) return;
        if (!isDragging && e.type === 'mousemove') return;

        const rect = radarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Posición del mouse relativa al centro
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calcular distancia y ángulo
        let dist = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
        const maxRadiusPixels = (RADAR_SIZE / 2) * 0.9; // 90% del radio
        
        // Limitar distancia
        if (dist > maxRadiusPixels) {
            dist = maxRadiusPixels;
        }

        // Normalizar distancia (0 a MAX_DISTANCE metros)
        const normalizedDist = (dist / maxRadiusPixels) * MAX_DISTANCE;

        // Calcular ángulo
        const ang = Math.atan2(mouseX, -mouseY) * (180 / Math.PI);

        // Convertir a coordenadas 3D
        const { x, z } = polarToCartesian(ang, normalizedDist);
        updateAudioPosition(x, z);
    };

    /**
     * Handler de mouse up
     */
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    /**
     * Toggle órbita automática
     */
    const toggleOrbit = () => {
        if (isOrbiting) {
            // Detener órbita
            if (orbitIntervalRef.current) {
                clearInterval(orbitIntervalRef.current);
                orbitIntervalRef.current = null;
            }
            setIsOrbiting(false);
        } else {
            // Iniciar órbita
            setIsOrbiting(true);
            
            const startTime = Date.now();
            const orbitDistance = distance || 2; // Mantener distancia actual
            
            orbitIntervalRef.current = window.setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = (elapsed % ORBIT_DURATION) / ORBIT_DURATION;
                const currentAngle = progress * 360;
                
                const { x, z } = polarToCartesian(currentAngle, orbitDistance);
                updateAudioPosition(x, z);
            }, 16); // ~60 FPS
        }
    };

    /**
     * Dibujar radar en canvas
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limpiar canvas
        ctx.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);

        const center = RADAR_CENTER;
        const maxRadius = (RADAR_SIZE / 2) * 0.9;

        // Fondo
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, RADAR_SIZE, RADAR_SIZE);

        // Círculos concéntricos (distancia)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            const radius = (maxRadius / 5) * i;
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Líneas de ángulo (cada 45 grados)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * (Math.PI / 180);
            const x = center + Math.cos(angle) * maxRadius;
            const y = center + Math.sin(angle) * maxRadius;
            
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Labels de dirección
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FRONT', center, 30);
        ctx.fillText('BACK', center, RADAR_SIZE - 20);
        ctx.textAlign = 'right';
        ctx.fillText('LEFT', 40, center + 5);
        ctx.textAlign = 'left';
        ctx.fillText('RIGHT', RADAR_SIZE - 40, center + 5);

        // Cabeza del oyente (centro)
        ctx.fillStyle = '#D4AF37'; // Gold
        ctx.beginPath();
        ctx.arc(center, center, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Indicador de "mirando hacia arriba" (triángulo)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(center, center - 6);
        ctx.lineTo(center - 4, center + 3);
        ctx.lineTo(center + 4, center + 3);
        ctx.closePath();
        ctx.fill();

        // Punto de sonido
        const soundX = center + (soundPos.x / MAX_DISTANCE) * maxRadius;
        const soundZ = center + (-soundPos.z / MAX_DISTANCE) * maxRadius; // -z porque adelante es negativo

        // Glow effect
        const gradient = ctx.createRadialGradient(soundX, soundZ, 0, soundX, soundZ, 25);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)'); // Cyan
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(soundX, soundZ, 25, 0, Math.PI * 2);
        ctx.fill();

        // Punto sólido
        ctx.fillStyle = '#00FFFF'; // Cyan
        ctx.beginPath();
        ctx.arc(soundX, soundZ, 8, 0, Math.PI * 2);
        ctx.fill();

        // Línea conectando cabeza con sonido
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(soundX, soundZ);
        ctx.stroke();
        ctx.setLineDash([]);

        // Distancia en metros (texto)
        const midX = (center + soundX) / 2;
        const midZ = (center + soundZ) / 2;
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${distance.toFixed(1)}m`, midX, midZ - 10);

    }, [soundPos, distance]);

    /**
     * Event listeners globales para drag
     */
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove as any);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove as any);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    /**
     * Cleanup al cerrar
     */
    useEffect(() => {
        return () => {
            if (orbitIntervalRef.current) {
                clearInterval(orbitIntervalRef.current);
            }
        };
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-neutral-900 to-black border border-cyan-500/30 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
                            style={{
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(0, 255, 255, 0.15)',
                            }}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 px-8 py-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                            🎧 3D Audio Playground
                                            {isOrbiting && (
                                                <span className="text-sm px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-cyan-400 animate-pulse">
                                                    ORBITING
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-sm text-white/60 mt-1 font-mono">
                                            Spatial Audio con HRTF • Headphones Required
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/50 hover:text-white transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                {/* Instrucciones */}
                                <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🎧</span>
                                        <div>
                                            <p className="text-sm font-bold text-cyan-400 mb-1">
                                                Instrucciones:
                                            </p>
                                            <ul className="text-xs text-white/70 space-y-1">
                                                <li>• <strong>Ponte audífonos</strong> para la mejor experiencia</li>
                                                <li>• <strong>Arrastra</strong> el punto cyan para mover el sonido</li>
                                                <li>• Click en <strong>"Orbitar"</strong> para que gire automáticamente</li>
                                                <li>• El sonido rotará 360° alrededor de tu cabeza</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Radar Visual */}
                                <div className="flex justify-center mb-6">
                                    <div 
                                        ref={radarRef}
                                        onMouseDown={handleMouseDown}
                                        className="relative cursor-crosshair"
                                        style={{
                                            width: RADAR_SIZE,
                                            height: RADAR_SIZE,
                                        }}
                                    >
                                        <canvas
                                            ref={canvasRef}
                                            width={RADAR_SIZE}
                                            height={RADAR_SIZE}
                                            className="rounded-xl border-2 border-cyan-500/30"
                                            style={{
                                                boxShadow: 'inset 0 0 50px rgba(0, 255, 255, 0.1)',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Controles */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Info */}
                                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                                        <div className="text-xs text-white/50 font-mono uppercase mb-2">
                                            Position
                                        </div>
                                        <div className="space-y-1 text-sm font-mono">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Angle:</span>
                                                <span className="text-cyan-400 font-bold">{angle.toFixed(0)}°</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Distance:</span>
                                                <span className="text-cyan-400 font-bold">{distance.toFixed(1)}m</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">X:</span>
                                                <span className="text-white font-bold">{soundPos.x.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Z:</span>
                                                <span className="text-white font-bold">{soundPos.z.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preset Positions */}
                                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                                        <div className="text-xs text-white/50 font-mono uppercase mb-2">
                                            Quick Presets
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => updateAudioPosition(0, -2)}
                                                className="px-3 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-lg text-xs font-bold text-white transition-all"
                                            >
                                                Front
                                            </button>
                                            <button
                                                onClick={() => updateAudioPosition(0, 2)}
                                                className="px-3 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-lg text-xs font-bold text-white transition-all"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={() => updateAudioPosition(-2, 0)}
                                                className="px-3 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-lg text-xs font-bold text-white transition-all"
                                            >
                                                Left
                                            </button>
                                            <button
                                                onClick={() => updateAudioPosition(2, 0)}
                                                className="px-3 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-lg text-xs font-bold text-white transition-all"
                                            >
                                                Right
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Orbit Button */}
                                <div className="mt-6">
                                    <button
                                        onClick={toggleOrbit}
                                        className={`w-full px-6 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                                            isOrbiting
                                                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white'
                                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
                                        }`}
                                        style={{
                                            boxShadow: isOrbiting 
                                                ? '0 0 30px rgba(239, 68, 68, 0.5)' 
                                                : '0 0 30px rgba(0, 255, 255, 0.4)',
                                        }}
                                    >
                                        {isOrbiting ? (
                                            <>
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                                </svg>
                                                DETENER ÓRBITA
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                INICIAR ÓRBITA (8 seg/vuelta)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

