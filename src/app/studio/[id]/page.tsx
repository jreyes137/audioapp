"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; 
import EngineeringToolbar from "@/components/EngineeringToolbar";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";
import CommentTimeline from "@/components/CommentTimeline";
import { audioManager } from "@/lib/audioManager";

export default function PrivateStudioSession() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [monitorMode, setMonitorMode] = useState<any>("STEREO");
    const [metrics, setMetrics] = useState({ lufs: -60, rms: -60, peak: -60, avgLufs: -60, phase: 0 });
    
    // Settings del Ingeniero
    const [brand, setBrand] = useState({ title: "STUDIO", color: "#D4AF37", texture: false });

    // Comentarios
    const [comments, setComments] = useState<any[]>([]);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [tempTime, setTempTime] = useState(0);
    const [commentText, setCommentText] = useState("");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const savedP = localStorage.getItem("1307_projects");
        if (savedP) {
            const found = JSON.parse(savedP).find((p: any) => p.id == params.id);
            setProject(found);
            if(found?.comments) setComments(found.comments);
        }
        const savedS = localStorage.getItem("1307_settings");
        if (savedS) {
            const s = JSON.parse(savedS);
            setBrand({ title: s.title, color: s.primaryColor, texture: s.texture });
        }
    }, [params.id]);

    const saveChanges = (newComments: any[], status?: string) => {
        const saved = localStorage.getItem("1307_projects");
        if (saved && project) {
            const all = JSON.parse(saved);
            const updated = all.map((p: any) => p.id === project.id ? { ...p, comments: newComments, status: status || p.status } : p);
            localStorage.setItem("1307_projects", JSON.stringify(updated));
            window.dispatchEvent(new Event("storage"));
        }
    };

    const handleSaveComment = () => {
        const newC = { time: tempTime, text: commentText, date: new Date().toLocaleTimeString() };
        const updatedComments = [...comments, newC];
        setComments(updatedComments);
        saveChanges(updatedComments);
        setIsCommentModalOpen(false);
        setCommentText("");
    };

    const updateStatus = (status: string) => {
        saveChanges(comments, status);
        alert(status === "APPROVED" ? "¡Master Aprobado!" : "Feedback enviado.");
    };

    // Sincronizar tiempo del audioManager
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(audioManager.getCurrentTime());
            setDuration(audioManager.getDuration());
        }, 100);

        return () => clearInterval(interval);
    }, []);

    if (!project) return <div className="h-screen bg-black flex items-center justify-center text-[#444]">CARGANDO...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            {/* Textura de Fondo */}
            {brand.texture && <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")`}}></div>}
            
            <EngineeringToolbar title={brand.title} monitorMode={monitorMode} setMonitorMode={setMonitorMode} metrics={metrics} />

            {isCommentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-[#333] p-6 rounded-xl w-80 shadow-2xl animate-fade-in-up">
                        <h3 className="text-white font-bold mb-2">Nota en {Math.floor(tempTime)}s</h3>
                        <textarea autoFocus className="w-full bg-[#050505] border border-[#333] rounded p-2 text-sm text-white outline-none mb-4 h-24" placeholder="..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={handleSaveComment} style={{backgroundColor: brand.color}} className={`flex-1 text-black font-bold py-2 rounded text-xs`}>GUARDAR</button>
                            <button onClick={()=>setIsCommentModalOpen(false)} className="flex-1 bg-transparent border border-[#333] text-[#666] font-bold py-2 rounded text-xs hover:text-white">CANCELAR</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white">{project.title}</h1>
                    <p className="text-[#555] text-xs font-bold uppercase tracking-widest">{project.artist}</p>
                </div>

                <div className="w-full max-w-4xl space-y-6">
                    {/* Player principal */}
                    <ActiveProjectPlayer 
                        mixUrl={project.mixUrl}
                        masterUrl={project.masterUrl}
                        monitorMode={monitorMode}
                        onMetricsUpdate={setMetrics}
                        isInteractive={true}
                        comments={comments}
                        accentColor={brand.color}
                        hideToggle={true}
                    />

                    {/* Timeline interactiva para comentarios */}
                    <CommentTimeline
                        comments={comments}
                        duration={duration}
                        currentTime={currentTime}
                        onAddComment={(time) => {
                            setTempTime(time);
                            setIsCommentModalOpen(true);
                        }}
                        accentColor={brand.color}
                    />
                </div>

                <div className="mt-8 flex gap-4">
                    <button onClick={() => updateStatus("APPROVED")} style={{backgroundColor: brand.color}} className={`text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform`}>APROBAR MASTER</button>
                    <button onClick={() => updateStatus("REVISION")} className="bg-[#111] text-[#888] font-bold px-8 py-3 rounded-full border border-[#333] hover:text-white">SOLICITAR CAMBIOS</button>
                </div>
                
                {comments.length > 0 && (
                    <div className="mt-12 w-full max-w-xl border-t border-[#222] pt-6">
                        <h4 className="text-xs font-bold text-[#555] uppercase mb-4 tracking-widest">Tus Notas</h4>
                        <div className="space-y-3">
                            {comments.map((c, i) => (
                                <div key={i} className="flex gap-4 p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]"><span style={{color: brand.color}} className={`font-mono font-bold text-xs`}>{Math.floor(c.time)}s</span><p className="text-sm text-[#ccc]">{c.text}</p></div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}