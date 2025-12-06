"use client";
import { useState, useRef, useEffect, DragEvent } from "react";

// --- CONFIGURACIÓN VISUAL ---
const GOLD = "#D4AF37";

// --- ICONOS ---
const PlayIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-black"><path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.673 0 3.385L7.28 20.091c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>);
const PauseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-black"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" /></svg>);
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>);
const ChipIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 text-[${GOLD}] animate-pulse`}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" /><path fillRule="evenodd" d="M12 16.5a4.5 4.5 0 1 0-4.5-4.5 4.5 4.5 0 0 0 4.5 4.5Zm0-7.5a3 3 0 1 1-3 3 3 3 0 0 1 3-3Z" clipRule="evenodd" /></svg>);

// --- SUB-COMPONENTES UI ---
const MonitorBtn = ({ label, active, onClick }: any) => (
    <button onClick={onClick} className={`px-3 py-1 rounded text-[9px] font-black tracking-widest border transition-all ${active ? `bg-[${GOLD}] border-[${GOLD}] text-black` : "bg-transparent border-[#333] text-[#555] hover:border-[#666]"}`}>{label}</button>
);

const MetricDisplay = ({ label, value, isPeak = false }: any) => (
    <div className="flex flex-col items-center min-w-[50px]">
        <span className={`text-sm font-mono font-bold ${isPeak && value > -1.0 ? "text-[#ff3333] animate-pulse" : "text-white"}`}>{value.toFixed(1)}</span>
        <span className="text-[8px] text-[#444] font-black tracking-widest uppercase">{label}</span>
    </div>
);

const StudioUpload = ({ label, file, onFileSelect, align }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); if (e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]); };
  return (
    <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className={`flex flex-col gap-1 cursor-pointer group ${align === "right" ? "items-end" : "items-start"}`}>
      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} accept="audio/*" className="hidden" />
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${file ? `border-[${GOLD}] bg-[${GOLD}]/10` : "border-[#333] bg-[#111] hover:border-[#555]"}`}>
         {file ? <ChipIcon /> : <UploadIcon className="text-[#555]" />}
         <span className={`text-[10px] font-black tracking-widest uppercase ${file ? `text-[${GOLD}]` : "text-[#555]"}`}>{label}</span>
      </div>
    </div>
  );
};

// --- HELPER AUDIO ---
const getDb = (buffer: Float32Array) => {
    let sum = 0, peak = 0;
    for (let i = 0; i < buffer.length; i++) {
        const val = buffer[i];
        sum += val * val;
        if (Math.abs(val) > peak) peak = Math.abs(val);
    }
    const rms = Math.sqrt(sum / buffer.length);
    return { rms: Math.max(-60, 20 * Math.log10(rms)), peak: Math.max(-60, 20 * Math.log10(peak)) };
};

// --- PROPS DEL COMPONENTE ---
interface ConsoleProps {
    role: "ENGINEER" | "CLIENT"; // Define quién lo está viendo
    clientFiles?: { mixUrl: string, masterUrl: string }; // Para cuando el cliente entra
}

export default function MasteringConsole({ role, clientFiles }: ConsoleProps) {
    // Archivos (Si es Ingeniero usa Files locales, si es Cliente usa URLs pre-cargadas)
    const [fileA, setFileA] = useState<File | null>(null);
    const [fileB, setFileB] = useState<File | null>(null);
    const [audioUrlA, setAudioUrlA] = useState<string | null>(clientFiles?.mixUrl || null);
    const [audioUrlB, setAudioUrlB] = useState<string | null>(clientFiles?.masterUrl || null);

    // Si suben archivos locales (Ingeniero)
    useEffect(() => { if (fileA) setAudioUrlA(URL.createObjectURL(fileA)); }, [fileA]);
    useEffect(() => { if (fileB) setAudioUrlB(URL.createObjectURL(fileB)); }, [fileB]);

    // Estados
    const [isPlaying, setIsPlaying] = useState(false);
    const [showMaster, setShowMaster] = useState(false);
    const [monitorMode, setMonitorMode] = useState<"STEREO" | "MONO" | "SIDE">("STEREO");
    const [metrics, setMetrics] = useState({ rms: -60, peak: -60, lufs: -60 });

    // Refs
    const audioRefA = useRef<HTMLAudioElement>(null);
    const audioRefB = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- MOTOR DE AUDIO ---
    const initAudioEngine = () => {
        if (!audioContextRef.current && audioRefA.current && audioRefB.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            const sourceA = ctx.createMediaElementSource(audioRefA.current);
            const sourceB = ctx.createMediaElementSource(audioRefB.current);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.85;
            analyserRef.current = analyser;

            const gainA = ctx.createGain(); const gainB = ctx.createGain();
            const splitter = ctx.createChannelSplitter(2); 
            const merger = ctx.createChannelMerger(2);
            const gainL = ctx.createGain(); const gainR = ctx.createGain();

            sourceA.connect(gainA); sourceB.connect(gainB);
            gainA.connect(splitter); gainB.connect(splitter);
            splitter.connect(gainL, 0); splitter.connect(gainR, 1);
            gainL.connect(merger, 0, 0); gainR.connect(merger, 0, 1);
            merger.connect(analyser); analyser.connect(ctx.destination);

            (window as any).studioGraph = { gainA, gainB, gainL, gainR, ctx };
        }
    };

    // --- LOOP VISUAL ---
    useEffect(() => {
        let rafId: number;
        const dataArray = new Uint8Array(2048);
        const timeArray = new Float32Array(2048);

        const renderLoop = () => {
            if (analyserRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d");
                analyserRef.current.getByteFrequencyData(dataArray);
                analyserRef.current.getFloatTimeDomainData(timeArray);
                
                // Métricas
                const calc = getDb(timeArray);
                setMetrics({ rms: calc.rms, peak: calc.peak, lufs: calc.rms - 0.6 });

                // Dibujar
                if (ctx) {
                    const w = canvasRef.current.width; const h = canvasRef.current.height;
                    ctx.clearRect(0, 0, w, h);
                    
                    // Grid
                    ctx.strokeStyle = "#222"; ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();

                    // Espectro SPAN Logarítmico
                    ctx.fillStyle = isPlaying ? "rgba(212, 175, 55, 0.8)" : "#333";
                    ctx.beginPath(); ctx.moveTo(0, h);
                    for (let i = 0; i < dataArray.length; i++) {
                        const logIndex = Math.log10(i + 1) / Math.log10(dataArray.length);
                        const x = logIndex * w;
                        const y = h - (dataArray[i] / 255) * h;
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.lineTo(w, h); ctx.fill();
                }
            }
            rafId = requestAnimationFrame(renderLoop);
        };
        if (isPlaying) renderLoop();
        return () => cancelAnimationFrame(rafId);
    }, [isPlaying]);

    // --- CONTROLES AUDIO ---
    const updateAudioState = () => {
        const graph = (window as any).studioGraph;
        if (!graph) return;
        
        // A/B
        const now = graph.ctx.currentTime;
        graph.gainA.gain.setValueAtTime(showMaster ? 0 : 1, now);
        graph.gainB.gain.setValueAtTime(showMaster ? 1 : 0, now);

        // Monitor Modes
        graph.gainL.gain.value = 1; graph.gainR.gain.value = 1;
        if (monitorMode === "SIDE") graph.gainR.gain.value = -1; // Inversión de fase
    };
    useEffect(() => { updateAudioState(); }, [showMaster, monitorMode]);

    const togglePlay = async () => {
        if (!audioContextRef.current) initAudioEngine();
        if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
        if (audioRefA.current && audioRefB.current) {
            if (isPlaying) { audioRefA.current.pause(); audioRefB.current.pause(); }
            else { 
                audioRefB.current.currentTime = audioRefA.current.currentTime; 
                audioRefA.current.play(); audioRefB.current.play(); 
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#050505] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
            
            {/* TOP BAR */}
            <header className="h-16 bg-[#080808] border-b border-[#222] flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] text-[#555] font-black tracking-widest uppercase">{role} VIEW</span>
                </div>
                <div className="flex gap-2">
                    <MonitorBtn label="ST" active={monitorMode === "STEREO"} onClick={() => setMonitorMode("STEREO")} />
                    <MonitorBtn label="M" active={monitorMode === "MONO"} onClick={() => setMonitorMode("MONO")} />
                    <MonitorBtn label="S" active={monitorMode === "SIDE"} onClick={() => setMonitorMode("SIDE")} />
                </div>
                <div className="flex gap-4">
                    <MetricDisplay label="LUFS" value={metrics.lufs} />
                    <MetricDisplay label="RMS" value={metrics.rms} />
                    <MetricDisplay label="PEAK" value={metrics.peak} isPeak />
                </div>
            </header>

            {/* MAIN DISPLAY */}
            <main className="flex-1 relative bg-[#050505] flex items-center justify-center overflow-hidden">
                <canvas ref={canvasRef} width="1200" height="400" className="w-full h-full max-h-[500px] z-10 opacity-90"></canvas>
                {/* Texto de espera si no hay audio cargado */}
                {(!audioUrlA && !audioUrlB) && <p className="absolute text-[#222] font-black text-4xl">NO SIGNAL</p>}
            </main>

            {/* BOTTOM CONTROLS */}
            <footer className="h-28 bg-[#0a0a0a] border-t border-[#222] flex items-center justify-between px-8 z-10">
                
                {/* IZQUIERDA: Solo visible si eres Ingeniero */}
                <div className="w-1/3 flex justify-start">
                    {role === "ENGINEER" && <StudioUpload label="MIX (A)" file={fileA} onFileSelect={setFileA} align="left" />}
                </div>

                {/* CENTRO: Controles Universales */}
                <div className="w-1/3 flex flex-col items-center gap-3">
                    <button onClick={togglePlay} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl ${isPlaying ? `bg-[${GOLD}] scale-95` : `bg-[#1a1a1a] border-2 border-[${GOLD}] text-[${GOLD}] hover:scale-105 hover:bg-[${GOLD}] hover:text-black`}`}>
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <div className="flex items-center gap-4 bg-[#050505] px-4 py-1.5 rounded-full border border-[#222]">
                        <span className={`text-[9px] font-black cursor-pointer ${!showMaster ? "text-white" : "text-[#444]"}`} onClick={() => setShowMaster(false)}>MIX</span>
                        <div onClick={() => setShowMaster(!showMaster)} className="w-8 h-1.5 bg-[#222] rounded-full relative cursor-pointer">
                            <div className={`absolute -top-0.5 w-4 h-2.5 rounded-full bg-[${GOLD}] shadow-[0_0_8px_${GOLD}] transition-all ${showMaster ? "left-4" : "left-0"}`}></div>
                        </div>
                        <span className={`text-[9px] font-black cursor-pointer ${showMaster ? "text-white" : "text-[#444]"}`} onClick={() => setShowMaster(true)}>MST</span>
                    </div>
                </div>

                {/* DERECHA: Solo visible si eres Ingeniero */}
                <div className="w-1/3 flex justify-end">
                    {role === "ENGINEER" && <StudioUpload label="MASTER (B)" file={fileB} onFileSelect={setFileB} align="right" />}
                    {role === "CLIENT" && <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-xs hover:bg-gray-200">APROBAR MASTER</button>}
                </div>
            </footer>

            {/* MOTORES OCULTOS */}
            <audio ref={audioRefA} src={audioUrlA || undefined} loop crossOrigin="anonymous" />
            <audio ref={audioRefB} src={audioUrlB || undefined} loop crossOrigin="anonymous" />
        </div>
    );
}