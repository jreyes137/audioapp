"use client";

const GOLD = "#D4AF37";

const MonitorBtn = ({ label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`h-6 px-3 rounded flex items-center justify-center text-[9px] font-black tracking-widest border transition-all duration-200
        ${active 
            ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
            : "bg-transparent border-[#333] text-[#555] hover:border-[#666] hover:text-white"
        }`}
        style={active ? { backgroundColor: GOLD, borderColor: GOLD } : {}}
    >
        {label}
    </button>
);

const MetricDisplay = ({ label, value, isPeak = false, isAvg = false }: any) => (
    <div className={`flex flex-col items-end min-w-[50px] ${isAvg ? "border-l border-[#222] pl-4 ml-2 opacity-80" : ""}`}>
        <span 
            className={`text-sm font-mono font-bold ${isPeak && value > -0.5 ? "animate-pulse" : ""}`}
            style={{ color: isPeak && value > -0.5 ? "#ff3333" : isAvg ? "white" : GOLD }}
        >
            {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-[7px] text-[#444] font-black tracking-widest uppercase">{label}</span>
    </div>
);

interface ToolbarProps {
    title?: string;
    monitorMode: "STEREO" | "MONO" | "SIDE";
    setMonitorMode: (mode: "STEREO" | "MONO" | "SIDE") => void;
    metrics: { lufs: number; rms: number; peak: number; avgLufs: number; phase: number };
}

export default function EngineeringToolbar({ title = "PANEL", monitorMode, setMonitorMode, metrics }: ToolbarProps) {
    return (
        <header className="h-16 bg-[#050505] border-b border-[#222] flex items-center justify-between px-8 sticky top-0 z-50 shadow-2xl backdrop-blur-md bg-opacity-90">
            <div className="flex items-center gap-3 w-1/4">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: GOLD, boxShadow: `0 0 10px ${GOLD}` }}></div>
                <h1 className="text-xs font-black tracking-tighter text-white uppercase">{title}</h1>
            </div>

            <div className="flex items-center justify-center gap-6 w-2/4">
                <div className="flex items-center gap-1">
                    <MonitorBtn label="STEREO" active={monitorMode === "STEREO"} onClick={() => setMonitorMode("STEREO")} />
                    <MonitorBtn label="MONO" active={monitorMode === "MONO"} onClick={() => setMonitorMode("MONO")} />
                    <MonitorBtn label="SIDE" active={monitorMode === "SIDE"} onClick={() => setMonitorMode("SIDE")} />
                </div>
                
                {/* BARRA DE FASE */}
                <div className="flex flex-col items-center w-24" title="Correlación de Fase">
                    <div className="w-full h-1 bg-[#111] rounded-full relative overflow-hidden border border-[#222]">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 z-10"></div>
                        <div 
                            className="absolute top-0 bottom-0 transition-all duration-100 ease-out" 
                            style={{
                                backgroundColor: metrics.phase >= 0 ? '#22c55e' : '#ef4444',
                                left: '50%',
                                width: `${Math.abs(metrics.phase) * 50}%`,
                                marginLeft: metrics.phase < 0 ? `-${Math.abs(metrics.phase) * 50}%` : '0'
                            }}
                        ></div>
                    </div>
                    <div className="flex justify-between w-full text-[5px] text-[#444] font-black mt-1 px-1">
                        <span>-1</span><span>PHASE</span><span>+1</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 justify-end w-1/4">
                <MetricDisplay label="LUFS (SHORT)" value={metrics.lufs} />
                <MetricDisplay label="LUFS (INT)" value={metrics.avgLufs} isAvg={true} />
                <div className="w-[1px] h-6 bg-[#222] self-center mx-1"></div>
                <MetricDisplay label="RMS" value={metrics.rms} />
            </div>
        </header>
    );
}