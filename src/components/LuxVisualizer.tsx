/**
 * LUX VISUALIZER - Visualizador con Gravedad
 * 
 * Efecto elegante con:
 * - Barras suben rápido, bajan con gravedad
 * - Peak hold que desaparece lento
 * - Gradientes dorados/blancos/cyan
 * - Sin colores arcoíris
 * 
 * Estilo: Dark Luxury
 */

"use client";
import { useRef, useEffect } from "react";

const GOLD = "#D4AF37";
const CYAN = "#06b6d4";

interface Props {
    analyzerNode?: AnalyserNode | null;
    isPlaying: boolean;
    accentColor?: string;
    width?: number;
    height?: number;
}

interface Bar {
    current: number;
    peak: number;
    peakHoldTime: number;
    velocity: number;
}

export default function LuxVisualizer({
    analyzerNode,
    isPlaying,
    accentColor = GOLD,
    width = 800,
    height = 200,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const barsRef = useRef<Bar[]>([]);

    // Constantes de física
    const GRAVITY = 0.003;
    const RISE_SPEED = 0.15;
    const PEAK_HOLD_DURATION = 30; // frames
    const BAR_COUNT = 64;

    /**
     * Inicializar barras
     */
    useEffect(() => {
        barsRef.current = Array.from({ length: BAR_COUNT }, () => ({
            current: 0,
            peak: 0,
            peakHoldTime: 0,
            velocity: 0,
        }));
    }, []);

    /**
     * Loop de animación con gravedad
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dataArray = new Uint8Array(BAR_COUNT);

        const loop = () => {
            const w = canvas.width;
            const h = canvas.height;

            // Clear con degradado sutil
            const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
            bgGradient.addColorStop(0, '#000000');
            bgGradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, w, h);

            // Grid de fondo minimalista
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            
            // Líneas horizontales
            for (let i = 1; i < 4; i++) {
                const y = (h / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Obtener datos del analyzer (si existe y está sonando)
            let hasRealData = false;
            if (analyzerNode && isPlaying) {
                try {
                    analyzerNode.getByteFrequencyData(dataArray);
                    const sum = dataArray.reduce((a, b) => a + b, 0);
                    if (sum > 100) {
                        hasRealData = true;
                    }
                } catch (e) {
                    // Silenciar error
                }
            }

            // Gradiente para barras (Dark Luxury)
            const barGradient = ctx.createLinearGradient(0, h, 0, 0);
            barGradient.addColorStop(0, '#1a1a1a');
            barGradient.addColorStop(0.3, accentColor);
            barGradient.addColorStop(0.7, '#ffffff');
            barGradient.addColorStop(1, '#ffffff');

            const barWidth = w / BAR_COUNT;

            for (let i = 0; i < BAR_COUNT; i++) {
                const bar = barsRef.current[i];
                
                // Obtener valor objetivo
                let targetHeight = 0;
                if (hasRealData) {
                    // Datos reales de WebAudio
                    targetHeight = (dataArray[i] / 255) * h * 0.9;
                } else if (isPlaying) {
                    // Simulación matemática (fallback)
                    const t = Date.now() / 1000;
                    const noise = Math.sin(i * 0.2 + t * 8) * Math.cos(i * 0.1 - t * 2);
                    targetHeight = Math.abs(noise) * h * 0.7 * (1 - i / BAR_COUNT * 0.2);
                }

                // Física de gravedad
                if (targetHeight > bar.current) {
                    // Subir rápido
                    bar.velocity = RISE_SPEED;
                    bar.current = targetHeight;
                } else {
                    // Bajar con gravedad
                    bar.velocity -= GRAVITY;
                    bar.current += bar.velocity;
                    
                    // No bajar de 0
                    if (bar.current < 0) {
                        bar.current = 0;
                        bar.velocity = 0;
                    }
                }

                // Peak hold
                if (bar.current >= bar.peak) {
                    bar.peak = bar.current;
                    bar.peakHoldTime = PEAK_HOLD_DURATION;
                } else {
                    bar.peakHoldTime--;
                    if (bar.peakHoldTime <= 0) {
                        // Bajar peak lentamente
                        bar.peak -= 0.5;
                        if (bar.peak < bar.current) {
                            bar.peak = bar.current;
                        }
                    }
                }

                // Dibujar barra actual
                ctx.fillStyle = barGradient;
                ctx.fillRect(
                    i * barWidth,
                    h - bar.current,
                    barWidth - 2,
                    bar.current
                );

                // Dibujar peak hold (línea)
                if (bar.peak > 5) {
                    ctx.fillStyle = accentColor;
                    ctx.globalAlpha = 0.9;
                    ctx.fillRect(
                        i * barWidth,
                        h - bar.peak - 2,
                        barWidth - 2,
                        2
                    );
                    ctx.globalAlpha = 1.0;
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
    }, [analyzerNode, isPlaying, accentColor]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full"
        />
    );
}

