"use client";
import { useState, useRef, useEffect } from "react";
import EngineeringToolbar from "@/components/EngineeringToolbar";

const GOLD = "#D4AF37";

// Helper de audio
const getDb = (buffer: Float32Array) => {
    let sum = 0; for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    const rms = Math.sqrt(sum / buffer.length);
    return Math.max(-60, 20 * Math.log10(rms));
};

export default function Studio() {
    // --- ESTADO ---
    const [monitorMode, setMonitorMode] = useState<"STEREO" | "MONO" | "SIDE">("STEREO");
    const [metrics, setMetrics] = useState({ lufs: -60, rms: -60, peak: -60 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [showMaster, setShowMaster] = useState(false); // Toggle A/B

    // --- REFS ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null); // Un solo audio ref para el demo visual

    // --- INICIAR MOTOR VISUAL ---
    useEffect(() => {
        if (isPlaying && !audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            audioContextRef.current = ctx;
            
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            // Creamos un oscilador simple o conectamos un audio real aqui
            // Para este demo visual usaremos un audio HTML oculto
            const audio = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
            audio.crossOrigin = "anonymous";
            audioRef.current = audio;
            
            const source = ctx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            
            audio.play();
            audio.loop = true;
        } else if (audioRef.current) {
            if(isPlaying) audioRef.current.play();
            else audioRef.current.pause();
        }
    }, [isPlaying]);

    // --- LOOP DE DIBUJO SPAN ---
    useEffect(() => {
        let raf: number;
        const data = new Uint8Array(2048);
        const time = new Float32Array(2048);

        const draw = () => {
            if (analyserRef.current && canvasRef.current) {
                analyserRef.current.getByteFrequencyData(data);
                analyserRef.current.getFloatTimeDomainData(time);
                
                // Calcular métricas falsas basadas en audio real para que se muevan
                const rms = getDb(time);
                setMetrics({ rms, peak: rms + 6, lufs: rms - 2 });

                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    const w = ctx.canvas.width;
                    const h = ctx.canvas.height;
                    ctx.clearRect(0,0,w,h);

                    // Grid
                    ctx.strokeStyle = "#111"; ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w,h/2); ctx.stroke();

                    // Relleno Dorado Solido (Estilo SPAN)
                    ctx.fillStyle = GOLD;
                    ctx.beginPath();
                    ctx.moveTo(0, h);
                    
                    for(let i=0; i<data.length; i++) {
                        // Logarítmico para que se vea Pro
                        const x = (Math.log10(i + 1) / Math.log10(data.length)) * w;
                        const y = h - (data[i] / 255) * h;
                        ctx.lineTo(x, y);
                    }
                    ctx.lineTo(w, h);
                    ctx.fill();
                }
            }
            raf = requestAnimationFrame(draw);
        };
        if (isPlaying) draw();
        return () => cancelAnimationFrame(raf);
    }, [isPlaying]);

    return (
        <div className="h-screen w-screen bg-[#050505] flex flex-col overflow-hidden text-white font-sans">
            
            {/* 1. BARRA COMPARTIDA */}
            <EngineeringToolbar 
                title="VISTA DE CLIENTE" 
                monitorMode={monitorMode} 
                setMonitorMode={setMonitorMode} 
                metrics={metrics} 
            />

            {/* 2. VISUALIZADOR GIGANTE */}
            <main className="flex-1 relative flex items-center justify-center bg-black">
                {/* Canvas ocupa todo el fondo */}
                <canvas ref={canvasRef} width="1600" height="600" className="w-full h-full opacity-80" />
                
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                        <button 
                            onClick={() => setIsPlaying(true)}
                            className={`w-20 h-20 rounded-full bg-[${GOLD}] text-black font-black text-xl shadow-[0_0_50px_${GOLD}] hover:scale-110 transition-transform`}
                        >
                            PLAY
                        </button>
                    </div>
                )}
            </main>

            {/* 3. CONTROLES FLOTANTES (Abajo) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20 bg-[#111]/80 backdrop-blur-md px-6 py-3 rounded-full border border-[#333]">
                <span className={`text-[10px] font-black tracking-[0.2em] cursor-pointer ${!showMaster ? "text-white" : "text-[#444]"}`} onClick={()=>setShowMaster(false)}>MIX</span>
                <div 
                    onClick={()=>setShowMaster(!showMaster)}
                    className="w-12 h-2 bg-[#000] rounded-full relative cursor-pointer border border-[#333]"
                >
                    <div className={`absolute -top-1 w-6 h-4 bg-[${GOLD}] rounded-full shadow-[0_0_10px_${GOLD}] transition-all ${showMaster ? "left-6" : "left-0"}`}></div>
                </div>
                <span className={`text-[10px] font-black tracking-[0.2em] cursor-pointer ${showMaster ? "text-white" : "text-[#444]"}`} onClick={()=>setShowMaster(true)}>MASTER</span>
            </div>

        </div>
    );
}