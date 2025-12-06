"use client";
import { useAudio } from "@/hooks/useAudioPlayer"; // IMPORTAMOS EL HOOK
import { COLORS, ICONS } from "@/lib/theme";

export default function AdminPlayer({ mixUrl, masterUrl }: any) {
    // Usamos el hook que creamos
    const { 
        audioRefA, audioRefB, canvasRef,
        isPlaying, togglePlay,
        showMaster, setShowMaster,
        metrics, setMonitorMode,
        currentTime, duration,
        setDuration, setCurrentTime
    } = useAudio(mixUrl, masterUrl);

    const handleSeek = (e: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const p = (e.clientX - rect.left) / rect.width;
        const t = p * duration;
        if(audioRefA.current) audioRefA.current.currentTime = t;
        if(audioRefB.current) audioRefB.current.currentTime = t;
        setCurrentTime(t);
    };

    return (
        <div className="p-4 bg-[#080808] rounded-xl border border-[#222]">
            {/* HERRAMIENTAS (Visualiza datos del Hook) */}
            <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-2">
                <div className="flex gap-1">
                    {["STEREO", "MONO", "SIDE"].map((m) => (
                        <button key={m} onClick={() => setMonitorMode(m as any)} className="text-[9px] border border-[#333] px-2 py-1 rounded text-[#555] hover:text-white hover:border-white transition-all">{m}</button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-1 bg-[#222] rounded relative"><div className="absolute top-0 bottom-0 bg-green-500" style={{left: '50%', width: `${metrics.phase * 40}%`}}></div></div>
                    <span className="text-[10px] font-mono text-white">{metrics.lufs.toFixed(1)} LUFS</span>
                </div>
            </div>

            {/* CANVAS */}
            <div className="relative h-32 w-full bg-black rounded-lg border border-[#1a1a1a] flex items-center justify-center mb-2">
                <canvas ref={canvasRef} width="600" height="150" className="absolute inset-0 w-full h-full opacity-90" />
                <button onClick={togglePlay} style={{backgroundColor: isPlaying ? COLORS.gold : 'white', color: 'black'}} className="z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                    {isPlaying ? <ICONS.Pause /> : <ICONS.Play />}
                </button>
            </div>

            {/* TIMELINE */}
            <div onClick={handleSeek} className="h-4 w-full bg-[#111] cursor-crosshair mb-2 relative rounded overflow-hidden">
                <div style={{width: `${(currentTime/duration)*100}%`, backgroundColor: COLORS.gold, opacity: 0.5}} className="h-full absolute top-0 left-0 pointer-events-none"></div>
            </div>

            {/* CONTROLES */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <button onClick={()=>setShowMaster(false)} style={{color: !showMaster?COLORS.gold:'#555'}} className="text-[9px] font-bold border border-[#333] px-2 rounded">MIX</button>
                    <button onClick={()=>setShowMaster(true)} style={{color: showMaster?COLORS.gold:'#555'}} className="text-[9px] font-bold border border-[#333] px-2 rounded">MASTER</button>
                </div>
                <span className="text-[9px] text-[#555] font-mono">{Math.floor(currentTime)}s</span>
            </div>

            {/* AUDIOS OCULTOS */}
            <audio ref={audioRefA} src={mixUrl} onLoadedMetadata={(e)=>setDuration(e.currentTarget.duration)} onTimeUpdate={(e)=>setCurrentTime(e.currentTarget.currentTime)} crossOrigin="anonymous" />
            <audio ref={audioRefB} src={masterUrl} crossOrigin="anonymous" />
        </div>
    );
}