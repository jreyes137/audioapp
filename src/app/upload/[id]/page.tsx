"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const GOLD = "#D4AF37";

export default function ClientPortal() {
    const params = useParams();
    const [order, setOrder] = useState<any>(null);
    const [step, setStep] = useState(1); // 1: Revisar, 2: Pagar, 3: Subir, 4: Fin
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        // Cargar la orden que creaste en el Dashboard
        const savedOrders = localStorage.getItem("1307_orders");
        if (savedOrders) {
            const found = JSON.parse(savedOrders).find((o: any) => o.id == params.id);
            setOrder(found);
        }
    }, [params.id]);

    const handlePayment = () => {
        // Simulación de pago
        const btn = document.getElementById("pay-btn");
        if(btn) btn.innerText = "PROCESANDO...";
        setTimeout(() => {
            setStep(3); // Pasar a subir archivos
        }, 1500);
    };

    const handleFileUpload = (e: any) => {
        const selected = Array.from(e.target.files as FileList);
        setFiles(selected);
    };

    const finishOrder = () => {
        setIsUploading(true);
        
        setTimeout(() => {
            // --- AQUÍ ESTÁ EL ARREGLO: GUARDAR EN EL SISTEMA DEL INGENIERO ---
            
            // 1. Crear URLs temporales para los archivos subidos (Simulación)
            // En producción esto serían URLs de Firebase Storage
            const demoMixUrl = files.length > 0 ? URL.createObjectURL(files[0]) : null;

            // 2. Crear el Objeto Proyecto
            const newProject = {
                id: Date.now(),
                title: `${order.serviceType} - ${order.clientName}`, // Ej: Mezcla - Bad Bunny
                artist: order.clientName,
                genre: "Por Clasificar",
                date: new Date().toLocaleDateString(),
                isPublic: false, // Privado por defecto
                status: "PENDING",
                mixUrl: demoMixUrl, // El archivo del cliente
                masterUrl: null, // Tú subirás el master después
                comments: [
                    {
                        time: 0, // 0 significa Mensaje de Sistema
                        text: `✅ PAGO RECIBIDO ($${order.price}). El cliente ha subido ${files.length} archivos.`,
                        date: new Date().toLocaleTimeString()
                    }
                ]
            };

            // 3. Inyectar en la Base de Datos Local (Dashboard)
            const currentProjects = JSON.parse(localStorage.getItem("1307_projects") || "[]");
            const updatedProjects = [newProject, ...currentProjects];
            localStorage.setItem("1307_projects", JSON.stringify(updatedProjects));
            
            // 4. Avisar a otras pestañas (Para que el Dashboard se actualice si está abierto)
            window.dispatchEvent(new Event("storage"));

            setIsUploading(false);
            setStep(4); // Pantalla final
        }, 2000);
    };

    if (!order) return <div className="h-screen bg-black flex items-center justify-center text-[#444] font-mono text-xs">BUSCANDO ORDEN #{params.id}...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-6">
            
            <div className="mb-8 text-center animate-fade-in">
                <h1 className="text-3xl font-black tracking-tighter">1307 STUDIO<span style={{color: GOLD}}>.</span></h1>
                <p className="text-[#444] text-[10px] font-bold uppercase tracking-[0.3em]">Secure Client Portal</p>
            </div>

            <div className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden shadow-2xl relative">
                
                {/* Barra de Progreso */}
                <div className="h-1 w-full bg-[#111] flex">
                    <div className="h-full transition-all duration-500" style={{width: step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%', backgroundColor: GOLD}}></div>
                </div>

                {/* PASO 1: RESUMEN */}
                {step === 1 && (
                    <div className="p-8 animate-fade-in">
                        <h2 className="text-lg font-bold text-white mb-6">Resumen de la Orden</h2>
                        <div className="space-y-4 mb-8 border-t border-b border-[#222] py-4">
                            <div className="flex justify-between"><span className="text-xs text-[#666]">Cliente</span><span className="text-xs font-bold text-white uppercase">{order.clientName}</span></div>
                            <div className="flex justify-between"><span className="text-xs text-[#666]">Servicio</span><span className="text-xs font-bold text-white uppercase">{order.serviceType}</span></div>
                        </div>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-xs text-[#888]">Total a Pagar</span>
                            <span className="text-3xl font-black" style={{color: GOLD}}>${order.price}</span>
                        </div>
                        <button onClick={() => setStep(2)} style={{backgroundColor: GOLD}} className="w-full text-black font-black text-xs py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg uppercase tracking-widest">Continuar al Pago</button>
                    </div>
                )}

                {/* PASO 2: PAGO */}
                {step === 2 && (
                    <div className="p-8 animate-fade-in">
                        <h2 className="text-lg font-bold text-white mb-2">Método de Pago</h2>
                        <p className="text-xs text-[#555] mb-6">Transacción encriptada de extremo a extremo.</p>
                        <div className="space-y-3 mb-8">
                            <button onClick={handlePayment} id="pay-btn" className="w-full bg-[#151515] border border-[#333] hover:border-white py-3 rounded-xl flex items-center justify-center gap-3 transition-all group">
                                <span className="text-lg">💳</span> <span className="text-xs font-bold text-[#ccc] group-hover:text-white uppercase">Tarjeta de Crédito</span>
                            </button>
                            <button onClick={handlePayment} className="w-full bg-[#151515] border border-[#333] hover:border-[#0070BA] py-3 rounded-xl flex items-center justify-center gap-3 transition-all group">
                                <span className="text-lg">🅿️</span> <span className="text-xs font-bold text-[#ccc] group-hover:text-[#0070BA] uppercase">PayPal</span>
                            </button>
                        </div>
                        <button onClick={() => setStep(1)} className="text-[10px] text-[#444] hover:text-white w-full text-center uppercase font-bold">← Volver</button>
                    </div>
                )}

                {/* PASO 3: SUBIDA */}
                {step === 3 && (
                    <div className="p-8 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">Sube tus Tracks</h2>
                            <span className="bg-green-500/10 text-green-500 text-[8px] font-black px-2 py-1 rounded border border-green-500/20 uppercase">Pagado</span>
                        </div>
                        <label className={`border-2 border-dashed border-[#222] rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#111] hover:border-[${GOLD}] mb-6 relative group`}>
                            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                            {files.length > 0 ? (
                                <div className="text-center"><span className="text-2xl mb-2 block">📄</span><span className="text-xs font-bold text-white">{files.length} Archivos</span></div>
                            ) : (
                                <div className="text-center text-[#444] group-hover:text-[#666]"><span className="text-xl mb-2 block opacity-50">☁️</span><span className="text-[9px] font-bold uppercase tracking-widest">Arrastra o Click</span></div>
                            )}
                        </label>
                        <button onClick={finishOrder} disabled={files.length === 0 || isUploading} style={{backgroundColor: files.length > 0 ? GOLD : '#222', color: files.length > 0 ? 'black' : '#555'}} className="w-full font-black text-xs py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                            {isUploading ? "Enviando..." : "Finalizar Pedido"}
                        </button>
                    </div>
                )}

                {/* PASO 4: FIN */}
                {step === 4 && (
                    <div className="p-12 text-center animate-fade-in flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-black"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" /></svg>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">¡Listo!</h2>
                        <p className="text-xs text-[#666] leading-relaxed max-w-[200px]">
                            Hemos recibido tus archivos.<br/>
                            Tu ingeniero comenzará a trabajar pronto.
                        </p>
                        <button onClick={() => window.close()} className="mt-8 text-[9px] font-bold text-[#444] hover:text-white border-b border-transparent hover:border-white transition-all">CERRAR VENTANA</button>
                    </div>
                )}
            </div>
            
            <div className="mt-8 text-[8px] text-[#333] font-black uppercase tracking-[0.2em] flex gap-4">
                <span>Privacidad</span> • <span>Ayuda</span>
            </div>
        </div>
    );
}