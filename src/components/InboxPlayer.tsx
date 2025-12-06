"use client";
import { useState, useRef } from "react";
import { COLORS, ICONS } from "@/lib/theme";

// Variable Global para evitar que se empalmen audios
let globalAudioInbox: HTMLAudioElement | null = null;

export default function InboxPlayer({ project }: any) {
    const [playingCommentIndex, setPlayingCommentIndex] = useState<number | null>(null);
    
    const playSnippet = (url: string, time: number, index: number) => {
        const src = url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Fallback
        
        // 1. Matar audio anterior
        if (globalAudioInbox) {
            globalAudioInbox.pause();
            globalAudioInbox = null;
        }
        
        // Si es el mismo, solo paramos (Toggle)
        if (playingCommentIndex === index) {
            setPlayingCommentIndex(null);
            return;
        }

        // 2. Nuevo Audio
        const audio = new Audio(src);
        audio.currentTime = time;
        globalAudioInbox = audio;
        setPlayingCommentIndex(index);
        
        audio.play();

        // 3. Auto-Stop 5s
        setTimeout(() => {
            if (globalAudioInbox === audio) {
                audio.pause();
                setPlayingCommentIndex(null);
            }
        }, 5000);
        
        audio.onended = () => setPlayingCommentIndex(null);
    };

    return (
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-4">
                <h3 className="text-white font-bold">{project.title} <span className="text-[#555] text-xs">/ Feedback</span></h3>
                <span className="text-[9px] bg-red-900 text-red-200 px-2 py-1 rounded font-bold">{project.comments.length} NUEVOS</span>
            </div>

            <div className="space-y-3">
                {project.comments.map((c: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 border border-[#222] rounded bg-[#0f0f0f] items-center hover:bg-[#111] transition-colors">
                        {/* Botón Play Snippet */}
                        <button 
                            onClick={() => playSnippet(project.masterUrl, c.time, i)}
                            className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full border transition-all 
                            ${playingCommentIndex === i ? `bg-[${COLORS.gold}] border-[${COLORS.gold}] text-black animate-pulse` : "border-[#333] text-[#555] hover:text-white hover:border-white"}`}
                            style={playingCommentIndex === i ? {backgroundColor: COLORS.gold} : {}}
                        >
                            {playingCommentIndex === i ? <span className="text-[9px] font-black">❚❚</span> : <ICONS.Play />}
                        </button>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span style={{color: COLORS.gold}} className="text-xs font-bold font-mono">{Math.floor(c.time)}s</span>
                                <span className="text-[9px] text-[#444] uppercase">{c.date || "Hoy"}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-tight">"{c.text}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}