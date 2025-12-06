"use client";
import { useState } from "react";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";
import InboxSnippetPlayer from "@/components/InboxSnippetPlayer";

const GOLD = "#D4AF37";
const CYAN = "#06b6d4";

export default function InboxTab({ projects = [], monitorMode, setMetrics }: any) {
    const [filterId, setFilterId] = useState<number | null>(null);
    const [snippetTrigger, setSnippetTrigger] = useState<number | null>(null);

    const safeProjects = Array.isArray(projects) ? projects : [];

    // VISTA DETALLE (MENSAJE ABIERTO)
    if (filterId) {
        return (
            <div>
                <button onClick={() => setFilterId(null)} className="text-xs text-gray-500 mb-4 hover:text-white font-bold">← VOLVER A LISTA</button>
                {safeProjects.filter((p: any) => p.id === filterId).map((proj: any) => (
                    <div key={proj.id} className={`border rounded-xl p-6 ${proj.type === 'ZIP' ? 'border-cyan-900 bg-cyan-950/10' : 'border-[#222] bg-[#0a0a0a]'}`}>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            {proj.title} 
                            {proj.type === 'ZIP' && <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 rounded">ARCHIVOS</span>}
                        </h3>
                        
                        {proj.type === 'ZIP' ? (
                            <div className="text-center p-8 bg-black/30 rounded-xl border border-white/5">
                                <p className="text-gray-400 text-xs mb-4">El cliente ha enviado archivos para descargar.</p>
                                <a href={proj.mixUrl} download style={{backgroundColor: CYAN}} className="text-black font-bold text-xs px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform">DESCARGAR ZIP</a>
                            </div>
                        ) : (
                            <div className="mb-4 p-2 border border-[#222] rounded bg-black">
                                <ActiveProjectPlayer 
                                    mixUrl={proj.mixUrl} 
                                    masterUrl={proj.masterUrl} 
                                    monitorMode={monitorMode} 
                                    onMetricsUpdate={setMetrics} 
                                    triggerSnippet={snippetTrigger} 
                                />
                            </div>
                        )}

                        <div className="space-y-2 mt-4">
                            {proj.comments?.map((c: any, i: number) => (
                                <div key={i} className="flex gap-4 p-3 border border-[#222] rounded bg-[#111] items-center">
                                    {c.time > 0 && proj.type !== 'ZIP' ? (
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            <InboxSnippetPlayer url={proj.masterUrl} time={c.time} />
                                        </div>
                                    ) : <div className="w-8 h-8 flex items-center justify-center text-gray-600">ℹ️</div>}
                                    <div className="flex-1">
                                        <div className="flex justify-between"><span style={{color: GOLD}} className="text-xs font-bold">{Math.floor(c.time)}s</span><span className="text-[9px] text-[#555]">{c.date}</span></div>
                                        <p className="text-sm text-gray-300">{c.text}</p>
                                    </div>
                                    <button onClick={() => setSnippetTrigger(c.time)} className="text-[9px] border border-[#333] px-2 py-1 rounded hover:bg-[#222] text-gray-400">VER</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // VISTA LISTA GENERAL
    return (
        <div className="grid gap-4">
            {safeProjects.filter((p: any) => p.category === 'ORDER' || p.comments?.length > 0).map((proj: any) => (
                <div key={proj.id} onClick={() => setFilterId(proj.id)} className={`p-4 border rounded mb-2 cursor-pointer hover:bg-[#111] flex justify-between items-center ${proj.type === 'ZIP' ? 'border-cyan-900/50 bg-cyan-950/5' : 'border-[#222] bg-[#0a0a0a]'}`}>
                    <div>
                        <span className="font-bold text-sm text-white block">{proj.title}</span>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{proj.comments?.[0]?.text || "Nuevo pedido"}</p>
                    </div>
                    {proj.type === 'ZIP' && <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 py-1 rounded font-bold">ZIP</span>}
                    {proj.comments?.length > 0 && <span className="text-[9px] bg-red-900 text-red-200 px-2 py-1 rounded font-bold">{proj.comments.length} MSGS</span>}
                </div>
            ))}
            {safeProjects.filter((p: any) => p.category === 'ORDER' || p.comments?.length > 0).length === 0 && (
                <div className="text-center py-10 border border-dashed border-[#222] rounded text-gray-500 text-xs">Buzón vacío</div>
            )}
        </div>
    );
}