"use client";

const GOLD = "#D4AF37";

interface MetersProps {
    monitorMode: "STEREO" | "MONO" | "SIDE";
    setMonitorMode: (m: any) => void;
    metrics: { lufs: number; rms: number; peak: number; avgLufs: number; phase: number };
    accentColor?: string;
}

export default function AudioMeters({ monitorMode, setMonitorMode, metrics, accentColor = GOLD }: MetersProps) {
    return (
        <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-2">
            {/* BOTONES DE ESCUCHA */}
            <div className="flex gap-1">
                {["STEREO", "MONO", "SIDE"].map((m) => (
                    <button 
                        key={m} 
                        onClick={() => setMonitorMode(m)} 
                        style={{
                            borderColor: monitorMode === m ? accentColor : '#333', 
                            color: monitorMode === m ? accentColor : '#555',
                            backgroundColor: monitorMode === m ? `${accentColor}10` : 'transparent'
                        }} 
                        className="text-[8px] font-bold px-3 py-1 rounded border transition-all hover:text-white"
                    >
                        {m.substring(0, 1)}
                    </button>
                ))}
            </div>
            
            {/* ÁREA TÉCNICA */}
            <div className="flex items-center gap-6">
                
                {/* MEDIDOR DE FASE */}
                <div className="flex flex-col items-center w-20" title="Correlación de Fase (-1 a +1)">
                    <div className="w-full h-1 bg-[#222] rounded-full relative overflow-hidden">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 z-10"></div>
                        {/* Barra bidireccional */}
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
                    <div className="flex justify-between w-full text-[5px] text-[#444] font-black mt-1 px-0.5">
                        <span>-</span><span>PHASE</span><span>+</span>
                    </div>
                </div>

                {/* NÚMEROS LUFS */}
                <div className="flex gap-3">
                    <div className="flex flex-col items-end">
                        <span style={{color: accentColor}} className="text-[10px] font-mono font-bold">{metrics.lufs.toFixed(1)}</span>
                        <span className="text-[5px] text-[#444] uppercase font-black">LIVE</span>
                    </div>
                    <div className="flex flex-col items-end border-l border-[#222] pl-3">
                        <span className="text-[10px] font-mono font-bold text-white">{metrics.avgLufs.toFixed(1)}</span>
                        <span className="text-[5px] text-[#555] uppercase font-black">AVG</span>
                    </div>
                </div>
            </div>
        </div>
    );
}