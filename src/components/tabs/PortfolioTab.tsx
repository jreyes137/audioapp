"use client";
import { useState } from "react";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";

const GOLD = "#D4AF37";

// Iconos simples integrados
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

export default function PortfolioTab({ projects = [], togglePublic, handleDelete, handleFileUpload, handleLink, setMetrics, monitorMode }: any) {
    const [activeId, setActiveId] = useState<number | null>(null);

    // FILTRO DE SEGURIDAD: Si projects es null, usa array vacío
    const safeProjects = Array.isArray(projects) ? projects : [];
    const portfolioItems = safeProjects.filter((p: any) => !p.category || p.category === 'PORTFOLIO');

    if (portfolioItems.length === 0) return <div className="text-center text-gray-500 py-10">No hay proyectos en el portafolio.</div>;

    return (
        <div className="space-y-4">
            {portfolioItems.map((proj: any) => (
                <div key={proj.id} className="bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden">
                    <div onClick={() => setActiveId(activeId === proj.id ? null : proj.id)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#111] transition-colors">
                        <div className="flex items-center gap-4">
                            <div style={{backgroundColor: activeId === proj.id ? GOLD : 'white', color: 'black'}} className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-lg">
                                <span className="font-black text-sm ml-0.5">{activeId === proj.id ? "II" : "▶"}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white">{proj.title}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">{proj.artist}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={(e) => togglePublic(proj.id, proj.isPublic, e)} className={`text-[9px] border px-2 py-1 rounded ${proj.isPublic ? "border-green-900 text-green-500" : "border-red-900 text-red-500"}`}>{proj.isPublic ? "PUBLIC" : "PRIV"}</button>
                            <button onClick={(e) => handleLink(proj.id, e)} className="text-gray-500 hover:text-white"><LinkIcon /></button>
                            <button onClick={(e) => handleDelete(proj.id, e)} className="text-gray-500 hover:text-red-500"><TrashIcon /></button>
                        </div>
                    </div>
                    
                    {/* Renderizado Condicional Seguro */}
                    {activeId === proj.id && (
                        <div className="border-t border-[#222] p-4 bg-black" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2 mb-2">
                                <label className="text-[8px] font-bold border border-[#333] px-2 py-1 rounded cursor-pointer hover:text-white uppercase">CAMBIAR MIX<input type="file" className="hidden" accept="audio/*" onChange={(e) => e.target.files && handleFileUpload(proj.id, 'MIX', e.target.files[0])} /></label>
                                <label className="text-[8px] font-bold border border-[#333] px-2 py-1 rounded cursor-pointer hover:text-white uppercase">CAMBIAR MASTER<input type="file" className="hidden" accept="audio/*" onChange={(e) => e.target.files && handleFileUpload(proj.id, 'MASTER', e.target.files[0])} /></label>
                            </div>
                            <ActiveProjectPlayer 
                                mixUrl={proj.mixUrl} 
                                masterUrl={proj.masterUrl} 
                                monitorMode={monitorMode} 
                                onMetricsUpdate={setMetrics} 
                                autoPlay={false} 
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}