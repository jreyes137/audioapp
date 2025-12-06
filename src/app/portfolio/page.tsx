"use client";
import { useState, useEffect } from "react";
import { COLORS, STYLES, ICONS } from "@/lib/theme"; // <--- AQUI ESTA LA MAGIA
import EngineeringToolbar from "@/components/EngineeringToolbar";
import NewProjectModal from "@/components/NewProjectModal";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";
import PortfolioEditor from "@/components/PortfolioEditor";
import InboxSnippetPlayer from "@/components/InboxSnippetPlayer";
import { getProjectsFromDB, createProjectInDB, updateProjectInDB, deleteProjectInDB, uploadFileToCloud } from "@/lib/db";

// Estado Inicial por seguridad
const INITIAL = [{ id: 1, title: "ÉXODO", artist: "SEBAS STC", date: "Hoy", genre: "Trap", category: "PORTFOLIO", isPublic: true, status: "APPROVED", type: "AUDIO", mixUrl: null, masterUrl: null, comments: [] }];

export default function Dashboard() {
    const [monitorMode, setMonitorMode] = useState<any>("STEREO");
    const [metrics, setMetrics] = useState({ lufs: -60, rms: -60, peak: -60, avgLufs: -60, phase: 0 });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [viewMode, setViewMode] = useState<"PORTFOLIO" | "ORDERS" | "EDITOR">("PORTFOLIO");
    const [inboxFilterId, setInboxFilterId] = useState<string | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Snippet Controls
    const [snippetTrigger, setSnippetTrigger] = useState<number | null>(null);
    const [playingSnippetId, setPlayingSnippetId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const data = await getProjectsFromDB();
            setProjects(data.length > 0 ? data : INITIAL);
            setIsLoading(false);
        };
        loadData();
    }, []);

    // Handlers (Resumidos para ahorrar espacio, son los mismos de tu lógica de negocio)
    const updateAndSync = (newProjs: any) => { setProjects(newProjs); }; // Simplificado
    const togglePublic = async (id: string, isPublic: boolean, e: any) => { e.stopPropagation(); const updated = projects.map(p => p.id === id ? { ...p, isPublic: !isPublic } : p); setProjects(updated); await updateProjectInDB(id, { isPublic: !isPublic }); };
    const handleLink = (id: string, e: any) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/studio/${id}`); alert("Link copiado"); };
    const handleDelete = async (id: string, e: any) => { e.stopPropagation(); if(confirm("¿Eliminar?")) { setProjects(projects.filter(p => p.id !== id)); await deleteProjectInDB(id); } };
    const handleFileUpload = async (id: string, type: 'MIX' | 'MASTER', file: File) => { const url = await uploadFileToCloud(file, 'tracks'); if(url) { const updateData = type === 'MIX' ? { mixUrl: url } : { masterUrl: url }; await updateProjectInDB(id, updateData); const updated = projects.map(p => p.id === id ? { ...p, ...updateData } : p); setProjects(updated); alert("✓ Subido"); } };
    const handleSaveProject = async (data: any) => { setIsModalOpen(false); let mix=null, mst=null; if(data.mixFile) mix = await uploadFileToCloud(data.mixFile, 'tracks'); if(data.masterFile) mst = await uploadFileToCloud(data.masterFile, 'tracks'); const p = { title: data.title, artist: data.artist, genre: data.genre, category: "PORTFOLIO", isPublic: true, date: "Hoy", status: "PENDING", type: "AUDIO", mixUrl: mix, masterUrl: mst, comments: [] }; const saved = await createProjectInDB(p); setProjects([saved, ...projects]); };
    const handlePlaySnippet = (url: string, time: number, id: string) => { if(!url) return; setSnippetTrigger(time); setPlayingSnippetId(id); setTimeout(()=>setPlayingSnippetId(null), 5000); };

    // Modal Orden (Simplificado)
    const OrderModal = () => {
        const [client, setClient] = useState(""); const [price, setPrice] = useState("150");
        const create = async () => { 
            const p = { title: `Pedido ${client}`, artist: client, category: "ORDER", isPublic: false, status: "PENDING", type: "ZIP", price, comments: [] }; 
            const saved = await createProjectInDB(p); 
            setProjects([saved, ...projects]); 
            setShowOrderModal(false); 
        };
        if(!showOrderModal) return null;
        return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"><div className="bg-[#111] p-8 rounded border border-[#333]"><h3 className="text-white font-bold mb-4">Crear Orden</h3><input className={STYLES.input} placeholder="Cliente" onChange={e=>setClient(e.target.value)} /><button onClick={create} style={{backgroundColor: COLORS.gold}} className="mt-4 w-full p-3 rounded font-bold text-black">CREAR</button><button onClick={()=>setShowOrderModal(false)} className="text-xs text-gray-500 mt-2 w-full">Cancelar</button></div></div>
    };

    if (isLoading) return <div className="h-screen bg-black text-white flex items-center justify-center font-mono">CARGANDO STUDIO...</div>;

    return (
        <div className={`min-h-screen bg-[${COLORS.bg}] text-white font-sans`} style={{ backgroundColor: COLORS.bg }}>
            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProject} />
            <OrderModal />
            <EngineeringToolbar title="ADMIN PANEL" monitorMode={monitorMode} setMonitorMode={setMonitorMode} metrics={metrics} />

            <main className={STYLES.container}>
                {/* NAVBAR */}
                <div className="flex justify-between items-end mb-8 border-b border-[#222] pb-4">
                    <div className="flex gap-6">
                        <button onClick={()=>setViewMode("PORTFOLIO")} className={`text-xs font-black tracking-widest pb-4 border-b-2 ${viewMode === "PORTFOLIO" ? `border-white text-white` : "border-transparent text-gray-500"}`}>PORTAFOLIO</button>
                        <button onClick={()=>setViewMode("ORDERS")} className={`text-xs font-black tracking-widest pb-4 border-b-2 ${viewMode === "ORDERS" ? `border-white text-white` : "border-transparent text-gray-500"}`}>PEDIDOS</button>
                        <button onClick={()=>setViewMode("EDITOR")} className={`text-xs font-black tracking-widest pb-4 border-b-2 ${viewMode === "EDITOR" ? `border-white text-white` : "border-transparent text-gray-500"}`}>EDITOR</button>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={()=>setShowOrderModal(true)} className={STYLES.btnSecondary}>$ CREAR ORDEN</button>
                        {viewMode === "PORTFOLIO" && <button onClick={() => setIsModalOpen(true)} style={{backgroundColor: COLORS.gold}} className={STYLES.btnPrimary}>+ SUBIR TRACK</button>}
                    </div>
                </div>

                {/* --- PORTFOLIO VIEW --- */}
                {viewMode === "PORTFOLIO" && (
                    <div className="space-y-4">
                        {projects.filter(p => p.category === 'PORTFOLIO').map((proj) => (
                            <div key={proj.id} className={STYLES.card}>
                                <div onClick={() => setActiveId(activeId === proj.id ? null : proj.id)} className={`flex items-center justify-between p-4 ${STYLES.cardHover}`}>
                                    <div className="flex items-center gap-4">
                                        <div style={{backgroundColor: activeId === proj.id ? COLORS.gold : 'white', color: 'black'}} className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all">{activeId === proj.id ? "II" : "▶"}</div>
                                        <div><h3 className="font-bold text-sm text-white">{proj.title}</h3><p className="text-[10px] text-gray-500 font-bold uppercase">{proj.artist}</p></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={(e) => togglePublic(proj.id, proj.isPublic, e)} className={`text-[9px] border px-2 py-1 rounded ${proj.isPublic ? "border-green-900 text-green-500" : "border-red-900 text-red-500"}`}>{proj.isPublic ? "PUBLIC" : "PRIV"}</button>
                                        <button onClick={(e) => handleLink(proj.id, e)} className={STYLES.btnIcon}>{ICONS.Link}</button>
                                        <button onClick={(e) => handleDelete(proj.id, e)} className={`${STYLES.btnIcon} text-red-500 hover:text-red-400`}>{ICONS.Trash}</button>
                                    </div>
                                </div>
                                {activeId === proj.id && (
                                    <div className="border-t border-[#222] p-4 bg-black" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2 mb-2">
                                            <label className={STYLES.btnSecondary + " cursor-pointer"}>CAMBIAR MIX<input type="file" className="hidden" onChange={(e) => e.target.files && handleFileUpload(proj.id, 'MIX', e.target.files[0])} /></label>
                                            <label className={STYLES.btnSecondary + " cursor-pointer"}>CAMBIAR MASTER<input type="file" className="hidden" onChange={(e) => e.target.files && handleFileUpload(proj.id, 'MASTER', e.target.files[0])} /></label>
                                        </div>
                                        {/* Player usa la variable global de color */}
                                        <ActiveProjectPlayer mixUrl={proj.mixUrl} masterUrl={proj.masterUrl} monitorMode={monitorMode} onMetricsUpdate={setMetrics} accentColor={COLORS.gold} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* --- ORDERS VIEW --- */}
                {viewMode === "ORDERS" && (
                    <div className="grid gap-4">
                         {projects.filter(p => p.category === 'ORDER').map(proj => (
                             <div key={proj.id} className={STYLES.card + " p-6 flex justify-between items-center"}>
                                 <div className="flex items-center gap-4">
                                     <span className="text-cyan-500">{ICONS.Zip}</span>
                                     <div><h3 className="font-bold text-white">{proj.title}</h3><p className="text-xs text-gray-500">{proj.status}</p></div>
                                 </div>
                                 <button className="text-xs bg-cyan-900 text-cyan-200 px-4 py-2 rounded font-bold">VER ARCHIVOS</button>
                             </div>
                         ))}
                    </div>
                )}

                {viewMode === "EDITOR" && <PortfolioEditor />}
            </main>
        </div>
    );
}