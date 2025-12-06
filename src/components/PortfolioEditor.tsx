/**
 * PORTFOLIO EDITOR - Editor Visual Avanzado
 * 
 * Permite personalizar:
 * - Identidad (nombre, bio, foto)
 * - Colores y tipografía
 * - Secciones opcionales
 * - Layout y estilo
 * 
 * Con preview en tiempo real estilo Dark Luxury
 */

"use client";
import { useState, useEffect } from "react";

const GOLD = "#D4AF37";

const THEMES = [
    { name: "Gold", hex: "#D4AF37", style: "Clásico" },
    { name: "Neon Green", hex: "#22c55e", style: "Vibrante" },
    { name: "Electric Blue", hex: "#3b82f6", style: "Moderno" },
    { name: "Purple", hex: "#a855f7", style: "Artístico" },
    { name: "Red", hex: "#ef4444", style: "Intenso" },
    { name: "Cyan", hex: "#06b6d4", style: "Fresco" },
];

const FONTS = [
    { name: "Modern Sans", value: "ui-sans-serif, system-ui, sans-serif" },
    { name: "Elegant Serif", value: "ui-serif, Georgia, serif" },
    { name: "Tech Mono", value: "ui-monospace, monospace" },
];

const LAYOUTS = [
    { name: "Grid", value: "grid", description: "Rejilla de proyectos" },
    { name: "List", value: "list", description: "Lista vertical" },
    { name: "Masonry", value: "masonry", description: "Estilo Pinterest" },
];

interface Settings {
    title: string;
    bio: string;
    primaryColor: string;
    fontFamily: string;
    showGear: boolean;
    showHistory: boolean;
    texture: boolean;
    layout: string;
    showSpectrum: boolean;
}

export default function PortfolioEditor() {
    const [settings, setSettings] = useState<Settings>({
        title: "AUDIO STUDIO",
        bio: "Mixing & Mastering Engineer",
        primaryColor: GOLD,
        fontFamily: FONTS[0].value,
        showGear: false,
        showHistory: false,
        texture: false,
        layout: "grid",
        showSpectrum: true,
    });

    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

    // Cargar configuración guardada
    useEffect(() => {
        const saved = localStorage.getItem("1307_settings");
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Error al cargar settings:', e);
            }
        }
    }, []);

    // Guardar cambios
    const updateSettings = (updates: Partial<Settings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        localStorage.setItem("1307_settings", JSON.stringify(newSettings));
        window.dispatchEvent(new Event("storage"));
        console.log('[Editor] Settings guardados:', newSettings);
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black text-white mb-2">Editor de Portafolio</h2>
                <p className="text-sm text-white/60">
                    Personaliza la apariencia de tu portafolio público. Los cambios se guardan automáticamente.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Panel de Controles */}
            <div className="space-y-6">
                {/* IDENTIDAD */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 style={{ color: settings.primaryColor }} className="font-black text-sm mb-4 uppercase tracking-wider">
                            Identidad & Branding
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-wider">
                                    Nombre del Estudio
                                </label>
                                <input
                                    type="text"
                                    value={settings.title}
                                    onChange={(e) => updateSettings({ title: e.target.value })}
                                    placeholder="Ej: 1307 STUDIO"
                                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-sm outline-none focus:border-white/40 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-wider">
                                    Bio / Tagline
                                </label>
                                <textarea
                                    value={settings.bio}
                                    onChange={(e) => updateSettings({ bio: e.target.value })}
                                    placeholder="Ej: Mixing & Mastering Engineer"
                                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-sm h-24 outline-none focus:border-white/40 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ESTILO VISUAL */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 style={{ color: settings.primaryColor }} className="font-black text-sm mb-4 uppercase tracking-wider">
                            Estilo Visual
                        </h3>

                        {/* Colores */}
                        <div className="mb-6">
                            <label className="block text-[10px] font-bold text-white/40 mb-3 uppercase tracking-wider">
                                Color de Acento
                            </label>
                            <div className="grid grid-cols-6 gap-3">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.hex}
                                        onClick={() => updateSettings({ primaryColor: theme.hex })}
                                        style={{ backgroundColor: theme.hex }}
                                        className={`aspect-square rounded-xl border-4 transition-all hover:scale-110 ${
                                            settings.primaryColor === theme.hex
                                                ? "border-white scale-110"
                                                : "border-transparent"
                                        }`}
                                        title={theme.name}
                                    />
                                ))}
                            </div>
                            <p className="text-[9px] text-white/40 mt-2 text-center font-mono">
                                {THEMES.find((t) => t.hex === settings.primaryColor)?.name || "Custom"}
                            </p>
                </div>
                
                        {/* Tipografía */}
                        <div className="mb-6">
                            <label className="block text-[10px] font-bold text-white/40 mb-3 uppercase tracking-wider">
                                Tipografía
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {FONTS.map((font) => (
                                    <button
                                        key={font.value}
                                        onClick={() => updateSettings({ fontFamily: font.value })}
                                        style={{
                                            fontFamily: font.value,
                                            backgroundColor: settings.fontFamily === font.value ? settings.primaryColor : 'transparent',
                                            color: settings.fontFamily === font.value ? 'black' : 'white',
                                            borderColor: settings.fontFamily === font.value ? settings.primaryColor : 'rgba(255,255,255,0.2)',
                                        }}
                                        className="px-3 py-2 rounded-lg border text-xs font-bold transition-all hover:bg-white/5"
                                    >
                                        {font.name}
                            </button>
                        ))}
                            </div>
                    </div>

                        {/* Layout */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 mb-3 uppercase tracking-wider">
                                Layout de Proyectos
                            </label>
                            <div className="space-y-2">
                                {LAYOUTS.map((layout) => (
                                    <button
                                        key={layout.value}
                                        onClick={() => updateSettings({ layout: layout.value })}
                                        style={{
                                            backgroundColor: settings.layout === layout.value ? settings.primaryColor : 'transparent',
                                            color: settings.layout === layout.value ? 'black' : 'white',
                                            borderColor: settings.layout === layout.value ? settings.primaryColor : 'rgba(255,255,255,0.2)',
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border text-left transition-all hover:bg-white/5"
                                    >
                                        <div className="font-bold text-sm">{layout.name}</div>
                                        <div className="text-xs opacity-60">{layout.description}</div>
                                    </button>
                        ))}
                    </div>
                </div>
            </div>

                    {/* CARACTERÍSTICAS */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 style={{ color: settings.primaryColor }} className="font-black text-sm mb-4 uppercase tracking-wider">
                            Características
                        </h3>
                    <div className="space-y-3">
                            {[
                                { key: 'showHistory', label: 'Sección "Mi Historia"', icon: '📖' },
                                { key: 'showGear', label: 'Mostrar Equipo/Gear', icon: '🎚️' },
                                { key: 'texture', label: 'Textura de Fondo', icon: '✨' },
                                { key: 'showSpectrum', label: 'Visualizador de Espectro', icon: '📊' },
                            ].map((option) => (
                                <label
                                    key={option.key}
                                    className="flex items-center justify-between p-4 bg-black/50 border border-white/5 rounded-lg cursor-pointer hover:bg-black/80 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{option.icon}</span>
                                        <span className="text-sm text-white group-hover:text-white/90">
                                            {option.label}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={(settings[option.key as keyof Settings] as boolean) ?? false}
                                        onChange={(e) => updateSettings({ [option.key]: e.target.checked })}
                                        style={{ accentColor: settings.primaryColor }}
                                        className="w-5 h-5"
                                    />
                        </label>
                            ))}
                        </div>
                    </div>

                    {/* Botón Publicar */}
                    <a
                        href="/p/engineer"
                        target="_blank"
                        style={{ backgroundColor: settings.primaryColor }}
                        className="block w-full text-center px-6 py-4 rounded-xl font-black text-black hover:scale-105 transition-transform shadow-lg"
                    >
                        VER PORTAFOLIO PÚBLICO ↗
                    </a>
                </div>

                {/* Panel de Preview */}
                <div className="space-y-6">
                    {/* Selector de dispositivo */}
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => setPreviewMode("desktop")}
                            style={{
                                backgroundColor: previewMode === "desktop" ? settings.primaryColor : 'transparent',
                                color: previewMode === "desktop" ? 'black' : 'white',
                                borderColor: previewMode === "desktop" ? settings.primaryColor : 'rgba(255,255,255,0.2)',
                            }}
                            className="px-4 py-2 border rounded-lg text-xs font-black transition-all"
                        >
                            🖥️ Desktop
                        </button>
                        <button
                            onClick={() => setPreviewMode("mobile")}
                            style={{
                                backgroundColor: previewMode === "mobile" ? settings.primaryColor : 'transparent',
                                color: previewMode === "mobile" ? 'black' : 'white',
                                borderColor: previewMode === "mobile" ? settings.primaryColor : 'rgba(255,255,255,0.2)',
                            }}
                            className="px-4 py-2 border rounded-lg text-xs font-black transition-all"
                        >
                            📱 Mobile
                        </button>
                    </div>

                    {/* Preview en tiempo real */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <div className="mb-4 text-center">
                            <span className="text-xs text-white/40 font-mono uppercase tracking-wider">
                                Preview en Tiempo Real
                            </span>
                        </div>

                        {/* Simulación del portafolio */}
                        <div
                            style={{
                                maxWidth: previewMode === "mobile" ? "375px" : "100%",
                                fontFamily: settings.fontFamily,
                            }}
                            className="mx-auto bg-black border border-white/10 rounded-xl overflow-hidden relative"
                        >
                            {/* Textura */}
                            {settings.texture && (
                                <div
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                    }}
                                />
                            )}

                            {/* Header */}
                            <div className="border-b border-white/10 p-6 text-center relative z-10">
                                <h1 className="text-2xl font-black text-white mb-2">
                                    {settings.title || "AUDIO STUDIO"}
                                </h1>
                                <p className="text-sm text-white/60 uppercase tracking-wider">
                                    {settings.bio || "Mixing & Mastering Engineer"}
                                </p>
                            </div>

                            {/* Proyecto simulado */}
                            <div className="p-6 relative z-10">
                                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                    <div className="p-4 flex items-center gap-4">
                                        <div
                                            style={{ backgroundColor: settings.primaryColor }}
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-black font-black"
                                        >
                                            ▶
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">Proyecto Ejemplo</h3>
                                            <p className="text-xs text-white/50">Artista • Género</p>
                                        </div>
                                    </div>

                                    {/* Visualizador simulado */}
                                    {settings.showSpectrum && (
                                        <div className="h-24 bg-black border-t border-white/10 flex items-end justify-around p-2">
                                            {Array.from({ length: 32 }).map((_, i) => {
                                                const height = Math.random() * 80 + 10;
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            height: `${height}%`,
                                                            backgroundColor: settings.primaryColor,
                                                            opacity: 0.6,
                                                        }}
                                                        className="w-1 rounded-t"
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Botón simulado */}
                                    <div className="p-4 border-t border-white/10">
                                        <button
                                            style={{ backgroundColor: settings.primaryColor }}
                                            className="w-full text-center px-4 py-2 rounded-lg font-black text-black text-xs"
                                        >
                                            ESCUCHAR PROYECTO
                                        </button>
                                    </div>
                                </div>

                                {/* Sección Historia (si está activada) */}
                                {settings.showHistory && (
                                    <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
                                        <h4 className="font-bold text-white text-sm mb-2">Mi Historia</h4>
                                        <p className="text-xs text-white/60">
                                            Tu biografía aparecerá aquí...
                                        </p>
                                    </div>
                                )}

                                {/* Sección Gear (si está activada) */}
                                {settings.showGear && (
                                    <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
                                        <h4 className="font-bold text-white text-sm mb-2">Mi Equipo</h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {['Neumann U87', 'UAD Apollo', 'Pro Tools'].map((gear, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-white/5 px-2 py-1 rounded text-white/60"
                                                >
                                                    {gear}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info del preview */}
                        <div className="mt-4 text-center">
                            <p className="text-[9px] text-white/40 font-mono">
                                {previewMode === "desktop" ? "Vista Desktop (1920px)" : "Vista Mobile (375px)"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tips y Ayuda */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="font-black text-sm mb-4 text-white uppercase tracking-wider">
                        💡 Tips Profesionales
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Paleta de Color",
                                tip: "Usa GOLD para elegancia clásica, CYAN para moderno y tech."
                            },
                            {
                                title: "Tipografía",
                                tip: "Sans-serif es universal. Serif para estudio boutique. Mono para tech."
                            },
                            {
                                title: "Layout",
                                tip: "Grid funciona mejor para 6+ proyectos. List para 3-5 proyectos destacados."
                            },
                            {
                                title: "Secciones",
                                tip: "Activa 'Mi Historia' si eres freelance. 'Gear' si trabajas con hardware premium."
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="bg-black/50 border border-white/5 rounded-lg p-4"
                            >
                                <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                                <p className="text-xs text-white/50">{item.tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
