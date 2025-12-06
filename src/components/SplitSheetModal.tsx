"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Participant {
    id: string;
    name: string;
    role: string;
    percentage: number;
}

interface SplitSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName?: string;
}

const ROLES = [
    "Productor",
    "Compositor",
    "Letrista",
    "Intérprete",
    "Arreglista",
    "Ingeniero de Mezcla",
    "Ingeniero de Master",
    "Músico Sesionista",
    "Beatmaker",
    "Otro",
];

export default function SplitSheetModal({ isOpen, onClose, projectName = "Untitled Track" }: SplitSheetModalProps) {
    // Datos del track
    const [trackName, setTrackName] = useState(projectName);
    const [isrc, setIsrc] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Lista de participantes
    const [participants, setParticipants] = useState<Participant[]>([
        { id: "1", name: "", role: "Productor", percentage: 100 }
    ]);

    // Estados de UI
    const [totalPercentage, setTotalPercentage] = useState(100);
    const [isValid, setIsValid] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Calcular porcentaje total y validar
    useEffect(() => {
        const total = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
        setTotalPercentage(total);
        
        const allFieldsFilled = participants.every(p => 
            p.name.trim() !== "" && 
            p.role.trim() !== "" && 
            p.percentage > 0
        );
        
        setIsValid(total === 100 && allFieldsFilled && trackName.trim() !== "");
    }, [participants, trackName]);

    // Agregar participante
    const addParticipant = () => {
        const newId = (Math.max(...participants.map(p => parseInt(p.id)), 0) + 1).toString();
        setParticipants([
            ...participants,
            { id: newId, name: "", role: "Productor", percentage: 0 }
        ]);
    };

    // Eliminar participante
    const removeParticipant = (id: string) => {
        if (participants.length > 1) {
            setParticipants(participants.filter(p => p.id !== id));
        }
    };

    // Actualizar participante
    const updateParticipant = (id: string, field: keyof Participant, value: string | number) => {
        setParticipants(participants.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    // Distribuir porcentaje equitativamente
    const distributeEqually = () => {
        const equal = Math.floor(100 / participants.length);
        const remainder = 100 - (equal * participants.length);
        
        setParticipants(participants.map((p, index) => ({
            ...p,
            percentage: index === 0 ? equal + remainder : equal
        })));
    };

    // Generar PDF
    const generatePDF = () => {
        setIsGenerating(true);
        
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // ═══════════════════════════════════════════════════════════
            // HEADER
            // ═══════════════════════════════════════════════════════════
            
            // Logo/Branding (placeholder - puedes reemplazar con tu logo)
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("SPLIT SHEET", pageWidth / 2, 18, { align: "center" });
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Hoja de Distribución de Regalías", pageWidth / 2, 28, { align: "center" });
            
            // ═══════════════════════════════════════════════════════════
            // TRACK INFORMATION
            // ═══════════════════════════════════════════════════════════
            
            let yPos = 55;
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("INFORMACIÓN DEL TRACK", 20, yPos);
            
            yPos += 10;
            
            // Box con info del track
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'FD');
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 60);
            doc.text("Título:", 25, yPos + 10);
            doc.setFont("helvetica", "normal");
            doc.text(trackName, 50, yPos + 10);
            
            doc.setFont("helvetica", "bold");
            doc.text("ISRC:", 25, yPos + 20);
            doc.setFont("helvetica", "normal");
            doc.text(isrc || "No especificado", 50, yPos + 20);
            
            doc.setFont("helvetica", "bold");
            doc.text("Fecha:", pageWidth - 80, yPos + 10);
            doc.setFont("helvetica", "normal");
            doc.text(date, pageWidth - 50, yPos + 10);
            
            yPos += 45;
            
            // ═══════════════════════════════════════════════════════════
            // TABLA DE PARTICIPANTES
            // ═══════════════════════════════════════════════════════════
            
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("DISTRIBUCIÓN DE REGALÍAS", 20, yPos);
            
            yPos += 5;
            
            // Preparar datos para la tabla
            const tableData = participants.map(p => [
                p.name,
                p.role,
                `${p.percentage}%`
            ]);
            
            // Generar tabla con autoTable
            autoTable(doc, {
                startY: yPos,
                head: [['Nombre', 'Rol', 'Porcentaje']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [212, 175, 55], // Gold
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 11,
                    halign: 'center',
                },
                bodyStyles: {
                    fontSize: 10,
                    cellPadding: 6,
                },
                columnStyles: {
                    0: { halign: 'left', cellWidth: 60 },
                    1: { halign: 'left', cellWidth: 70 },
                    2: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
                margin: { left: 20, right: 20 },
            });
            
            // Obtener posición después de la tabla
            const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
            
            // Total
            yPos = finalY + 10;
            doc.setFillColor(10, 10, 10);
            doc.rect(20, yPos, pageWidth - 40, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("TOTAL:", pageWidth - 90, yPos + 8);
            doc.setFontSize(14);
            doc.text(`${totalPercentage}%`, pageWidth - 45, yPos + 8, { align: "right" });
            
            yPos += 25;
            
            // ═══════════════════════════════════════════════════════════
            // FIRMAS
            // ═══════════════════════════════════════════════════════════
            
            if (yPos > pageHeight - 80) {
                doc.addPage();
                yPos = 30;
            }
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("FIRMAS Y CONFORMIDAD", 20, yPos);
            
            yPos += 8;
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(
                "Los abajo firmantes aceptan los términos de esta distribución de regalías:",
                20,
                yPos
            );
            
            yPos += 15;
            
            // Generar líneas de firma para cada participante
            const signaturesPerRow = 2;
            const signatureWidth = (pageWidth - 60) / signaturesPerRow;
            
            participants.forEach((participant, index) => {
                const col = index % signaturesPerRow;
                const row = Math.floor(index / signaturesPerRow);
                const xPos = 20 + (col * signatureWidth) + (col * 10);
                const currentYPos = yPos + (row * 35);
                
                // Línea de firma
                doc.setDrawColor(150, 150, 150);
                doc.line(xPos, currentYPos + 15, xPos + signatureWidth - 10, currentYPos + 15);
                
                // Nombre del participante
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0);
                doc.text(participant.name, xPos, currentYPos + 20);
                
                // Rol y porcentaje
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`${participant.role} (${participant.percentage}%)`, xPos, currentYPos + 25);
            });
            
            // ═══════════════════════════════════════════════════════════
            // FOOTER
            // ═══════════════════════════════════════════════════════════
            
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "italic");
            doc.text(
                "Este documento es un acuerdo preliminar. Se recomienda consultar con un abogado antes de firmar.",
                pageWidth / 2,
                pageHeight - 20,
                { align: "center" }
            );
            
            doc.setFont("helvetica", "normal");
            doc.text(
                `Generado el ${new Date().toLocaleDateString('es-ES')} - Audio App Studio`,
                pageWidth / 2,
                pageHeight - 15,
                { align: "center" }
            );
            
            // ═══════════════════════════════════════════════════════════
            // GUARDAR PDF
            // ═══════════════════════════════════════════════════════════
            
            const fileName = `SplitSheet_${trackName.replace(/[^a-z0-9]/gi, '_')}_${date}.pdf`;
            doc.save(fileName);
            
            console.log('[SplitSheet] ✅ PDF generado:', fileName);
            
            // Cerrar modal después de generar
            setTimeout(() => {
                setIsGenerating(false);
                onClose();
            }, 500);
            
        } catch (error) {
            console.error('[SplitSheet] ❌ Error al generar PDF:', error);
            setIsGenerating(false);
            alert('Error al generar el PDF. Por favor intenta de nuevo.');
        }
    };

    // Handler para generar
    const handleGenerate = () => {
        if (!isValid) {
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }
        generatePDF();
    };

    // Reset al cerrar
    const handleClose = () => {
        if (!isGenerating) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                            style={{
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 100px rgba(212, 175, 55, 0.1)',
                            }}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-white/10 px-8 py-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight">
                                            📄 Generar Split Sheet
                                        </h2>
                                        <p className="text-sm text-white/60 mt-1 font-mono">
                                            Hoja de Distribución de Regalías Profesional
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        disabled={isGenerating}
                                        className="text-white/50 hover:text-white transition-colors disabled:opacity-30"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-8">
                                {/* Track Info */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="text-amber-500">●</span>
                                        Información del Track
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-white/50 font-mono uppercase tracking-wider mb-2">
                                                Nombre del Track *
                                            </label>
                                            <input
                                                type="text"
                                                value={trackName}
                                                onChange={(e) => setTrackName(e.target.value)}
                                                placeholder="Título de la canción"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/50 font-mono uppercase tracking-wider mb-2">
                                                ISRC (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={isrc}
                                                onChange={(e) => setIsrc(e.target.value.toUpperCase())}
                                                placeholder="US-XXX-XX-XXXXX"
                                                maxLength={15}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-mono placeholder:text-white/30 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Participants */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <span className="text-amber-500">●</span>
                                            Participantes ({participants.length})
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={distributeEqually}
                                                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-xs font-bold text-cyan-400 transition-all"
                                            >
                                                ⚖️ Distribuir Igual
                                            </button>
                                            <button
                                                onClick={addParticipant}
                                                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-xs font-bold text-amber-400 transition-all"
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {participants.map((participant, index) => (
                                            <motion.div
                                                key={participant.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                                            >
                                                <div className="grid grid-cols-12 gap-3">
                                                    {/* Nombre */}
                                                    <div className="col-span-12 md:col-span-5">
                                                        <label className="block text-xs text-white/50 font-mono mb-1.5">
                                                            Nombre *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={participant.name}
                                                            onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                                                            placeholder="Nombre completo"
                                                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:border-amber-500/50 transition-all"
                                                        />
                                                    </div>

                                                    {/* Rol */}
                                                    <div className="col-span-12 md:col-span-4">
                                                        <label className="block text-xs text-white/50 font-mono mb-1.5">
                                                            Rol *
                                                        </label>
                                                        <select
                                                            value={participant.role}
                                                            onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)}
                                                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500/50 transition-all"
                                                        >
                                                            {ROLES.map(role => (
                                                                <option key={role} value={role}>{role}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Porcentaje */}
                                                    <div className="col-span-10 md:col-span-2">
                                                        <label className="block text-xs text-white/50 font-mono mb-1.5">
                                                            % *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={participant.percentage || ''}
                                                            onChange={(e) => updateParticipant(participant.id, 'percentage', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center font-bold focus:border-amber-500/50 transition-all"
                                                        />
                                                    </div>

                                                    {/* Eliminar */}
                                                    <div className="col-span-2 md:col-span-1 flex items-end">
                                                        <button
                                                            onClick={() => removeParticipant(participant.id)}
                                                            disabled={participants.length === 1}
                                                            className="w-full p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Eliminar participante"
                                                        >
                                                            <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Percentage */}
                                <div 
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        totalPercentage === 100 
                                            ? 'bg-green-500/10 border-green-500/50' 
                                            : totalPercentage > 100
                                            ? 'bg-red-500/10 border-red-500/50'
                                            : 'bg-yellow-500/10 border-yellow-500/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white">Total de Porcentajes:</span>
                                        <span className={`text-2xl font-black font-mono ${
                                            totalPercentage === 100 
                                                ? 'text-green-400' 
                                                : totalPercentage > 100
                                                ? 'text-red-400'
                                                : 'text-yellow-400'
                                        }`}>
                                            {totalPercentage}%
                                        </span>
                                    </div>
                                    {totalPercentage !== 100 && (
                                        <p className="text-xs text-white/60 mt-2">
                                            {totalPercentage > 100 
                                                ? `⚠️ Excede el 100% por ${totalPercentage - 100}%` 
                                                : `⚠️ Falta ${100 - totalPercentage}% para completar`}
                                        </p>
                                    )}
                                </div>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {showError && !isValid && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
                                        >
                                            <p className="text-sm text-red-400 font-bold">
                                                ⚠️ Por favor completa todos los campos y asegúrate de que la suma sea 100%
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-white/10 px-8 py-6 bg-black/40">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-white/50">
                                        * Todos los campos marcados son obligatorios
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleClose}
                                            disabled={isGenerating}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all disabled:opacity-30"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={!isValid || isGenerating}
                                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                                                isValid
                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black'
                                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                            }`}
                                            style={isValid ? {
                                                boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                                            } : {}}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Generando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Descargar Contrato PDF
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

