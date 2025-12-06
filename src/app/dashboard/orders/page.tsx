"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { COLORS } from "@/lib/theme";
import { useProjects } from "@/context/ProjectsContext";

type ServiceId = "stereo" | "atmos" | "mastering" | "editing";

const SERVICES: Array<{
    id: ServiceId;
    title: string;
    icon: string;
    description: string;
    badge?: string;
    accent?: string;
}> = [
    {
        id: "stereo",
        title: "Mezcla Estéreo",
        icon: "🎚️",
        description: "Balance quirúrgico, headroom controlado y entrega lista para mastering.",
        badge: "Pro",
        accent: "from-cyan-500/20 to-blue-500/10",
    },
    {
        id: "atmos",
        title: "Mezcla Atmos / Spatial",
        icon: "☁️",
        description: "Render binaural y spatial mix premium. Preparación para delivery Dolby / Apple.",
        badge: "Premium",
        accent: "from-purple-500/20 to-fuchsia-500/10",
    },
    {
        id: "mastering",
        title: "Mastering",
        icon: "🎛️",
        description: "Loudness objetivo, control de dinámica y traducción sólida en cualquier sistema.",
        badge: "Loudness Safe",
        accent: "from-amber-500/20 to-orange-500/10",
    },
    {
        id: "editing",
        title: "Edición & Tuning",
        icon: "✂️",
        description: "Limpieza, afinación vocal precisa y corrección rítmica quirúrgica.",
        badge: "Vocal Lab",
        accent: "from-emerald-500/20 to-lime-500/10",
    },
];

export default function OrdersWizardPage() {
    const [selectedService, setSelectedService] = useState<ServiceId>("stereo");
    const { projects, addOrder } = useProjects();
    const activeOrders = useMemo(() => projects.filter((p) => p.category === "ORDER"), [projects]);

    // Mezcla (Stereo / Atmos)
    const [stems, setStems] = useState(24);
    const [includeVocalEditing, setIncludeVocalEditing] = useState(true);

    // Mastering
    const [masterVinyl, setMasterVinyl] = useState(false);
    const [masterApple, setMasterApple] = useState(false);
    const [masterReference, setMasterReference] = useState("");

    // Edición
    const [editingScope, setEditingScope] = useState<"vocal" | "drums" | "band">("vocal");

    const summary = useMemo(() => {
        const serviceLabel = SERVICES.find((s) => s.id === selectedService)?.title || "Selecciona un servicio";
        const lines: string[] = [serviceLabel];

        if (selectedService === "stereo" || selectedService === "atmos") {
            lines.push(`Stems: ${stems}`);
            if (includeVocalEditing) lines.push("Incluye edición vocal");
        }

        if (selectedService === "mastering") {
            if (masterVinyl) lines.push("Master para vinilo");
            if (masterApple) lines.push("Apple Digital Master (MFiT)");
            if (masterReference.trim()) lines.push(`Ref: ${masterReference.trim()}`);
        }

        if (selectedService === "editing") {
            const map: Record<typeof editingScope, string> = {
                vocal: "Solo Voces",
                drums: "Baterías",
                band: "Full Band",
            };
            lines.push(map[editingScope]);
        }

        return lines;
    }, [selectedService, stems, includeVocalEditing, masterVinyl, masterApple, masterReference, editingScope]);

    const handleSubmitOrder = (mode: "quote" | "start") => {
        const title = summary[0] || "Servicio Técnico";
        const order = addOrder({
            title,
            artist: "Cliente",
            genre: "Servicio",
            category: "ORDER",
            isPublic: false,
            status: mode === "start" ? "NEW_FILES" : "PENDING_PAYMENT",
            type: "ZIP",
            price: mode === "start" ? "Por definir" : "Cotizar",
            comments: [],
            clientName: "Cliente",
            date: new Date().toLocaleDateString(),
            mixUrl: null,
            masterUrl: null,
        });

        alert(`✓ ${mode === "quote" ? "Cotización generada" : "Proyecto iniciado"} (${order.id})`);
    };

    const renderFormByService = () => {
        if (selectedService === "stereo" || selectedService === "atmos") {
            return (
                <div className="space-y-4">
                    <label className="block text-sm text-white/70">
                        ¿Número de Stems/Pistas?
                        <input
                            type="number"
                            min={2}
                            max={120}
                            value={stems}
                            onChange={(e) => setStems(Number(e.target.value) || 0)}
                            className="mt-2 w-full rounded-lg bg-black border border-white/10 px-4 py-3 text-white focus:border-white/30 outline-none transition"
                            placeholder="Ej. 32"
                        />
                    </label>

                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-white">¿Incluir Edición Vocal?</p>
                            <p className="text-xs text-white/50">Afinación, limpieza y alineación de tomas.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIncludeVocalEditing((prev) => !prev)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                                includeVocalEditing ? "bg-emerald-500/80" : "bg-white/20"
                            }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-black shadow-lg transition ${
                                    includeVocalEditing ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            );
        }

        if (selectedService === "mastering") {
            return (
                <div className="space-y-4">
                    <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={masterVinyl}
                            onChange={(e) => setMasterVinyl(e.target.checked)}
                            className="mt-1 h-4 w-4 accent-amber-400"
                        />
                        <div>
                            <p className="text-sm font-semibold text-white">Mastering para Vinilo</p>
                            <p className="text-xs text-white/50">Curva optimizada y headroom seguro.</p>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={masterApple}
                            onChange={(e) => setMasterApple(e.target.checked)}
                            className="mt-1 h-4 w-4 accent-cyan-400"
                        />
                        <div>
                            <p className="text-sm font-semibold text-white">Apple Digital Master (MFiT)</p>
                            <p className="text-xs text-white/50">Entrega con compliance para Apple Music.</p>
                        </div>
                    </label>

                    <label className="block text-sm text-white/70">
                        Link de Referencia (Spotify/YouTube)
                        <input
                            type="url"
                            value={masterReference}
                            onChange={(e) => setMasterReference(e.target.value)}
                            placeholder="https://open.spotify.com/track/..."
                            className="mt-2 w-full rounded-lg bg-black border border-white/10 px-4 py-3 text-white focus:border-white/30 outline-none transition"
                        />
                    </label>
                </div>
            );
        }

        // Editing
        return (
            <div className="space-y-3">
                {[
                    { id: "vocal", label: "Solo Voces", detail: "Afinación, de-essing, limpieza de respiraciones." },
                    { id: "drums", label: "Baterías", detail: "Edición rítmica y refuerzo de transientes." },
                    { id: "band", label: "Full Band", detail: "Corrección global, comping y limpieza multicanal." },
                ].map((option) => (
                    <label
                        key={option.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:border-white/20 transition"
                    >
                        <input
                            type="radio"
                            name="editing-scope"
                            value={option.id}
                            checked={editingScope === option.id}
                            onChange={() => setEditingScope(option.id as typeof editingScope)}
                            className="mt-1 h-4 w-4 accent-emerald-400"
                        />
                        <div>
                            <p className="text-sm font-semibold text-white">{option.label}</p>
                            <p className="text-xs text-white/50">{option.detail}</p>
                        </div>
                    </label>
                ))}
            </div>
        );
    };

    return (
        <DashboardLayout showBreadcrumbs projectName="Orders">
            <div className="min-h-screen bg-black text-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row">
                    {/* Column: Wizard + Formularios */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Órdenes • Servicios Técnicos</p>
                            <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
                                Configura tu Servicio de Ingeniería
                            </h1>
                            <p className="mt-2 text-sm text-white/60 max-w-2xl">
                                Selecciona el tipo de servicio y define los detalles clave. El panel de la derecha se
                                actualizará en tiempo real como un ticket de compra técnico.
                            </p>
                        </div>

                        {/* Wizard Cards */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {SERVICES.map((service) => {
                                const isActive = selectedService === service.id;
                                return (
                                    <motion.button
                                        key={service.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setSelectedService(service.id)}
                                        className={`relative overflow-hidden rounded-2xl border px-5 py-6 text-left transition-all ${
                                            isActive
                                                ? "border-amber-400/60 bg-white/5 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                                                : "border-white/10 bg-white/5 hover:border-white/20"
                                        }`}
                                    >
                                        <div
                                            className={`pointer-events-none absolute inset-0 opacity-70 bg-gradient-to-br ${
                                                service.accent || "from-white/5 to-white/0"
                                            }`}
                                        />
                                        <div className="relative z-10 flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{service.icon}</span>
                                                    <p className="text-sm font-black uppercase tracking-tight">
                                                        {service.title}
                                                    </p>
                                                </div>
                                                <p className="mt-3 text-sm text-white/60">{service.description}</p>
                                            </div>
                                            {service.badge && (
                                                <span
                                                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white/70"
                                                    style={{
                                                        boxShadow: isActive
                                                            ? `0 0 15px ${COLORS.gold}40`
                                                            : "none",
                                                    }}
                                                >
                                                    {service.badge}
                                                </span>
                                            )}
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-glow"
                                                className="absolute inset-0 rounded-2xl border border-amber-400/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Dynamic Form */}
                        <motion.div
                            key={selectedService}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/40 backdrop-blur"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Requerimientos</p>
                                    <h2 className="text-xl font-bold text-white">
                                        {SERVICES.find((s) => s.id === selectedService)?.title}
                                    </h2>
                                </div>
                                <span className="rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-200">
                                    Configuración
                                </span>
                            </div>
                            {renderFormByService()}
                        </motion.div>
                    </div>

                    {/* Column: Summary */}
                    <div className="lg:w-[360px]">
                        <div className="sticky top-8 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#0b0b0b] to-[#050505] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/70">
                                        Ticket Técnico
                                    </p>
                                    <h3 className="text-lg font-black text-white">Resumen en tiempo real</h3>
                                </div>
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-200">
                                    Live
                                </span>
                            </div>

                            <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
                                {summary.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                                        <p className="text-sm text-white/80">{item}</p>
                                    </div>
                                ))}
                                {summary.length === 0 && (
                                    <p className="text-sm text-white/50">Selecciona un servicio para comenzar.</p>
                                )}
                            </div>

                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => handleSubmitOrder("quote")}
                                    className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:scale-[1.01] transition-transform"
                                >
                                    Solicitar Cotización
                                </button>
                                <button
                                    onClick={() => handleSubmitOrder("start")}
                                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-wide text-white/80 hover:border-white/30 transition"
                                >
                                    Iniciar Proyecto
                                </button>
                            </div>

                            <p className="mt-4 text-[11px] leading-relaxed text-white/50">
                                Este ticket se guarda en tu sesión local. Usa el botón de cotización para enviar el
                                brief con todas las opciones seleccionadas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Órdenes activas */}
            <div className="mx-auto max-w-7xl px-6 pb-12">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Órdenes Activas</p>
                            <h3 className="text-xl font-bold text-white">Embudo vivo</h3>
                        </div>
                        <span className="text-sm text-white/50">{activeOrders.length} órdenes</span>
                    </div>
                    <div className="mt-4 divide-y divide-white/5">
                        {activeOrders.length === 0 && (
                            <p className="py-4 text-sm text-white/50">Aún no hay pedidos. Crea uno con el wizard.</p>
                        )}
                        {activeOrders.map((order) => (
                            <div key={order.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-white">{order.title}</p>
                                    <p className="text-xs text-white/50">
                                        {order.clientName || "Cliente"} • {order.status}
                                    </p>
                                </div>
                                <span className="text-xs rounded-full border border-white/10 px-3 py-1 text-white/70">
                                    {order.price || "Pendiente"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

