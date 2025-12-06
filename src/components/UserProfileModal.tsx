/**
 * USER PROFILE MODAL - Panel de Perfil y Facturación
 * 
 * Modal flotante elegante con:
 * - Pestaña General (Foto, Nombre, Email)
 * - Pestaña Facturación (CLABE, Banco, Nombre Fiscal)
 * - Botón Cerrar Sesión
 * 
 * Estilo: Dark Luxury con animaciones Framer Motion
 */

"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#D4AF37";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = "general" | "billing";

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>("general");
    const [profileData, setProfileData] = useState({
        name: "Engineer",
        email: "contact@audioapp.io",
        photo: null as string | null,
        clabe: "1234 5678 9012 3456 78",
        bank: "BBVA México",
        fiscalName: "Audio Studio S.A. de C.V.",
    });

    const handleLogout = () => {
        // Aquí iría la lógica de cerrar sesión
        console.log("[UserProfile] Cerrando sesión...");
        localStorage.clear();
        window.location.href = "/";
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData({ ...profileData, photo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div
                            className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                            style={{
                                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px ${GOLD}15`,
                            }}
                        >
                            {/* Header */}
                            <div className="relative px-8 pt-8 pb-6">
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <div
                                        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
                                        style={{ background: `radial-gradient(circle, ${GOLD}, transparent)` }}
                                    />
                                </div>

                                <div className="relative flex items-center justify-between">
                                    <h2 className="text-2xl font-black tracking-tight text-white">
                                        Mi Perfil
                                    </h2>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                                    >
                                        <span className="text-white/60 text-xl">✕</span>
                                    </motion.button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 mt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveTab("general")}
                                        style={{
                                            backgroundColor: activeTab === "general" ? GOLD : "rgba(255,255,255,0.05)",
                                            color: activeTab === "general" ? "black" : "white",
                                            boxShadow: activeTab === "general" ? `0 0 20px ${GOLD}60` : "none",
                                        }}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
                                    >
                                        👤 General
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveTab("billing")}
                                        style={{
                                            backgroundColor: activeTab === "billing" ? GOLD : "rgba(255,255,255,0.05)",
                                            color: activeTab === "billing" ? "black" : "white",
                                            boxShadow: activeTab === "billing" ? `0 0 20px ${GOLD}60` : "none",
                                        }}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
                                    >
                                        💳 Facturación
                                    </motion.button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-8 pb-8">
                                <AnimatePresence mode="wait">
                                    {activeTab === "general" ? (
                                        <motion.div
                                            key="general"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-6"
                                        >
                                            {/* Foto de perfil */}
                                            <div className="text-center">
                                                <div className="relative inline-block">
                                                    <div
                                                        className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-4xl font-bold border-4 border-white/10 overflow-hidden"
                                                        style={{
                                                            boxShadow: `0 0 30px ${GOLD}30`,
                                                        }}
                                                    >
                                                        {profileData.photo ? (
                                                            <img
                                                                src={profileData.photo}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            "👤"
                                                        )}
                                                    </div>

                                                    {/* Botón cambiar foto */}
                                                    <label className="absolute bottom-0 right-0 cursor-pointer">
                                                        <motion.div
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            style={{ backgroundColor: GOLD }}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                                                        >
                                                            <span className="text-black text-sm">📷</span>
                                                        </motion.div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handlePhotoChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Nombre */}
                                            <div>
                                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                                                    Nombre
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileData.name}
                                                    onChange={(e) =>
                                                        setProfileData({ ...profileData, name: e.target.value })
                                                    }
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                                    placeholder="Tu nombre"
                                                />
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) =>
                                                        setProfileData({ ...profileData, email: e.target.value })
                                                    }
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                                    placeholder="tu@email.com"
                                                />
                                            </div>

                                            {/* Botón Guardar */}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    backgroundColor: GOLD,
                                                    boxShadow: `0 8px 20px ${GOLD}40`,
                                                }}
                                                className="w-full px-6 py-3 rounded-xl text-black font-black tracking-wide transition-all"
                                            >
                                                Guardar Cambios
                                            </motion.button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="billing"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-6"
                                        >
                                            {/* CLABE */}
                                            <div>
                                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                                                    CLABE Interbancaria
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileData.clabe}
                                                    onChange={(e) =>
                                                        setProfileData({ ...profileData, clabe: e.target.value })
                                                    }
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                                    placeholder="1234 5678 9012 3456 78"
                                                />
                                            </div>

                                            {/* Banco */}
                                            <div>
                                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                                                    Banco
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileData.bank}
                                                    onChange={(e) =>
                                                        setProfileData({ ...profileData, bank: e.target.value })
                                                    }
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                                    placeholder="Nombre del banco"
                                                />
                                            </div>

                                            {/* Nombre Fiscal */}
                                            <div>
                                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                                                    Nombre Fiscal / Razón Social
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileData.fiscalName}
                                                    onChange={(e) =>
                                                        setProfileData({ ...profileData, fiscalName: e.target.value })
                                                    }
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                                    placeholder="Tu nombre fiscal o razón social"
                                                />
                                            </div>

                                            {/* Info adicional */}
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                <p className="text-xs text-white/60 leading-relaxed">
                                                    💡 <span className="font-bold">Tip:</span> Esta información es útil para generar
                                                    facturas y recibir pagos. Se guarda localmente de forma segura.
                                                </p>
                                            </div>

                                            {/* Botón Guardar */}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    backgroundColor: GOLD,
                                                    boxShadow: `0 8px 20px ${GOLD}40`,
                                                }}
                                                className="w-full px-6 py-3 rounded-xl text-black font-black tracking-wide transition-all"
                                            >
                                                Guardar Datos Bancarios
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer - Cerrar Sesión */}
                            <div className="px-8 pb-8 pt-4 border-t border-white/10">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLogout}
                                    className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-bold tracking-wide transition-all flex items-center justify-center gap-2"
                                >
                                    <span>🚪</span>
                                    Cerrar Sesión
                                </motion.button>
                            </div>

                            {/* Decorative scan lines */}
                            <div
                                className="absolute inset-0 pointer-events-none opacity-5"
                                style={{
                                    background:
                                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                                }}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

