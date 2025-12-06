"use client";
import { useState, useRef, useEffect } from "react";

export default function ClientPlayer({ mixUrl, masterUrl, accentColor = "#D4AF37" }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showMaster, setShowMaster] = useState(true); // Cliente escucha Master por defecto
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let raf: number;
        const loop = () => {
            if (canvasRef.current && isPlaying) {
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    const w = ctx.canvas.width; const h = ctx.canvas.height;
                    ctx.clearRect(0,0,w,h);
                    // Dibujo Minimalista (Lineas finas)
                    ctx.fillStyle = accentColor;
                    const t = Date.now() / 1000;
                    for(let i=0; i<100; i++) {
                        const hBar = Math.abs(Math.sin(i * 0.05 + t * 3)) * h * 0.5;
                        ctx.fillRect(i * (w/100), h/2 - hBar/2, (w/100)-1, hBar);
                    }
                }
            }
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(raf);
    }, [isPlaying, accentColor]);

    const toggle = () => {
        if(!audioRef.current) return;
        if(isPlaying) audioRef.current.pause();
        else audioRef.current.play().catch(()=>{});
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="relative w-full h-40 bg-black rounded-xl overflow-hidden group">
            <canvas ref={canvasRef} width="800" height="200" className="absolute inset-0 w-full h-full opacity-50" />
            
            <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={toggle} style={{backgroundColor: isPlaying ? accentColor : 'white'}} className="w-16 h-16 rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform">
                    {isPlaying ? "||" : "▶"}
                </button>
            </div>
            
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={()=>setShowMaster(!showMaster)} className="text-[9px] bg-black/50 text-white border border-white/20 px-3 py-1 rounded backdrop-blur-md">
                    {showMaster ? "MASTER" : "ORIGINAL"}
                </button>
            </div>
            <audio ref={audioRef} src={showMaster ? masterUrl : mixUrl} />
        </div>
    );
}