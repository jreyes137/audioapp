"use client";
import { useState, useRef } from "react";

const GOLD = "#D4AF37";

// Iconos
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#555] group-hover:text-[#fff]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>);
const FileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 text-[${GOLD}]`}><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" /><path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" /></svg>);

export default function NewProjectModal({ isOpen, onClose, onSave }: any) {
    if (!isOpen) return null;

    // Estados del Formulario
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [genre, setGenre] = useState("");
    const [bpm, setBpm] = useState("");
    
    // Estados de Archivos
    const [mixFile, setMixFile] = useState<File | null>(null);
    const [masterFile, setMasterFile] = useState<File | null>(null);

    // Refs para inputs ocultos
    const mixInputRef = useRef<HTMLInputElement>(null);
    const masterInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        // Validamos que haya archivos
        if (!mixFile || !masterFile) {
            alert("Por favor sube el Mix y el Master.");
            return;
        }
        
        onSave({ 
            title, artist, genre, bpm, 
            mixFile, masterFile 
        });
        
        // Limpiar
        setTitle(""); setArtist(""); setGenre(""); setBpm("");
        setMixFile(null); setMasterFile(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-2xl border border-[#222] shadow-[0_0_60px_rgba(0,0,0,0.9)] p-8 relative overflow-hidden">
                
                {/* Decoración */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-[${GOLD}]`}></div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-[#444] hover:text-white transition-colors text-xl">✕</button>

                <h2 className="text-2xl font-black text-white mb-1 tracking-tight">AGREGAR AL PORTAFOLIO</h2>
                <p className="text-[#555] text-xs mb-8 uppercase tracking-widest">Sube tu mejor trabajo. Esto será visible para los clientes.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Fila 1: Datos Básicos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-bold text-[#666] uppercase mb-2">Título del Track</label>
                            <input type="text" className="w-full bg-[#111] border border-[#222] rounded-lg p-3 text-white text-sm focus:border-[${GOLD}] outline-none transition-colors placeholder-[#333]" placeholder="Ej: Éxodo" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-[#666] uppercase mb-2">Artista</label>
                            <input type="text" className="w-full bg-[#111] border border-[#222] rounded-lg p-3 text-white text-sm focus:border-[${GOLD}] outline-none transition-colors placeholder-[#333]" placeholder="Ej: Sebas STC" value={artist} onChange={e => setArtist(e.target.value)} required />
                        </div>
                    </div>

                    {/* Fila 2: Metadatos (Opcionales pero PRO) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-bold text-[#666] uppercase mb-2">Género</label>
                            <input type="text" className="w-full bg-[#111] border border-[#222] rounded-lg p-3 text-white text-sm focus:border-[${GOLD}] outline-none transition-colors placeholder-[#333]" placeholder="Ej: Trap, Reggaeton" value={genre} onChange={e => setGenre(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-[#666] uppercase mb-2">BPM / Key</label>
                            <input type="text" className="w-full bg-[#111] border border-[#222] rounded-lg p-3 text-white text-sm focus:border-[${GOLD}] outline-none transition-colors placeholder-[#333]" placeholder="Ej: 140 BPM - Cm" value={bpm} onChange={e => setBpm(e.target.value)} />
                        </div>
                    </div>

                    {/* Fila 3: Carga de Archivos REAL */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        {/* INPUT MIX */}
                        <div 
                            onClick={() => mixInputRef.current?.click()}
                            className={`border border-dashed rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer transition-all group ${mixFile ? `bg-[${GOLD}]/10 border-[${GOLD}]` : "border-[#333] hover:bg-[#111] hover:border-[#666]"}`}
                        >
                            <input type="file" ref={mixInputRef} className="hidden" accept="audio/*" onChange={(e) => e.target.files && setMixFile(e.target.files[0])} />
                            {mixFile ? (
                                <div className="flex flex-col items-center animate-fade-in"><FileIcon /><span className={`text-[10px] font-bold text-[${GOLD}] mt-2 uppercase`}>{mixFile.name.substring(0, 15)}...</span></div>
                            ) : (
                                <div className="flex flex-col items-center"><UploadIcon /><span className="text-[9px] font-bold text-[#555] group-hover:text-white mt-2 uppercase transition-colors">SUBIR MIX (A)</span></div>
                            )}
                        </div>

                        {/* INPUT MASTER */}
                        <div 
                            onClick={() => masterInputRef.current?.click()}
                            className={`border border-dashed rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer transition-all group ${masterFile ? `bg-[${GOLD}]/10 border-[${GOLD}]` : "border-[#333] hover:bg-[#111] hover:border-[#666]"}`}
                        >
                            <input type="file" ref={masterInputRef} className="hidden" accept="audio/*" onChange={(e) => e.target.files && setMasterFile(e.target.files[0])} />
                            {masterFile ? (
                                <div className="flex flex-col items-center animate-fade-in"><FileIcon /><span className={`text-[10px] font-bold text-[${GOLD}] mt-2 uppercase`}>{masterFile.name.substring(0, 15)}...</span></div>
                            ) : (
                                <div className="flex flex-col items-center"><UploadIcon /><span className="text-[9px] font-bold text-[#555] group-hover:text-white mt-2 uppercase transition-colors">SUBIR MASTER (B)</span></div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className={`w-full bg-[${GOLD}] text-black font-black text-sm tracking-widest py-4 rounded-xl mt-2 hover:scale-[1.01] transition-transform shadow-[0_0_25px_${GOLD}40]`}>
                        PUBLICAR EN PORTAFOLIO
                    </button>
                </form>
            </div>
        </div>
    );
}