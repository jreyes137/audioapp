/**
 * LOGIN PAGE - Dark Luxury
 * (Movido desde / al path /login para dejar libre la landing)
 */

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GOLD = "#D4AF37";

const DAWS = [
    "Pro Tools",
    "Ableton Live",
    "Logic Pro",
    "FL Studio",
    "Reaper",
    "Cubase",
    "Studio One",
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [daw, setDaw] = useState("Pro Tools");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Guardar DAW en localStorage para personalización futura
        localStorage.setItem("user_daw", daw);
        localStorage.setItem("user_email", email);

        console.log("[Login] Accediendo con:", { email, daw });

        // Simular delay mínimo para feedback visual
        setTimeout(() => {
            router.push('/dashboard');
        }, 500);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Textura sutil de fondo */}
            <div 
                className="fixed inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Gradiente radial sutil */}
            <div 
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${GOLD}10 0%, transparent 50%)`,
                }}
            />

            {/* Contenido principal */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-12">
                    <div 
                        style={{ backgroundColor: GOLD }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-black text-3xl mx-auto mb-6 shadow-2xl"
                    >
                        ♪
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-3">
                        <span 
                            className="bg-gradient-to-r from-white to-yellow-500/80 bg-clip-text text-transparent"
                        >
                            AUDIO APP
                        </span>
                    </h1>
                    <p className="text-white/60 text-sm uppercase tracking-wider">
                        Sistema Operativo para Ingenieros
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Badge de "Acceso Rápido" */}
                    <div className="flex justify-center mb-6">
                        <div 
                            style={{ 
                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                borderColor: GOLD,
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono uppercase tracking-wider"
                        >
                            <span style={{ color: GOLD }}>●</span>
                            <span className="text-yellow-500/80">Acceso Rápido</span>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none focus:border-yellow-500/50 transition-all text-sm"
                        />
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label 
                            htmlFor="password" 
                            className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2"
                        >
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none focus:border-yellow-500/50 transition-all text-sm"
                        />
                    </div>

                    {/* DAW Principal */}
                    <div>
                        <label 
                            htmlFor="daw" 
                            className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2"
                        >
                            DAW Principal
                        </label>
                        <select
                            id="daw"
                            value={daw}
                            onChange={(e) => setDaw(e.target.value)}
                            required
                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-yellow-500/50 transition-all text-sm cursor-pointer appearance-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23888' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 1rem center',
                            }}
                        >
                            {DAWS.map((dawName) => (
                                <option key={dawName} value={dawName}>
                                    {dawName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botón Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ backgroundColor: GOLD }}
                        className="w-full py-4 rounded-xl text-black font-black text-sm hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 shadow-2xl"
                    >
                        {isLoading ? 'CARGANDO...' : 'ENTRAR'}
                    </button>

                    {/* Footer del formulario */}
                    <div className="text-center mt-6">
                        <p className="text-white/40 text-xs">
                            No se requiere cuenta real para desarrollo
                        </p>
                    </div>
                </form>

                {/* Info adicional */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-8 text-xs text-white/40">
                        <div className="flex items-center gap-2">
                            <span style={{ color: GOLD }}>✓</span>
                            <span>Local First</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: GOLD }}>✓</span>
                            <span>Sin Firebase</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: GOLD }}>✓</span>
                            <span>Instantáneo</span>
                        </div>
                    </div>
                </div>

                {/* Shortcut info */}
                <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span>💡</span>
                        Modo Desarrollo
                    </h3>
                    <ul className="space-y-2 text-xs text-white/60">
                        <li className="flex items-start gap-2">
                            <span style={{ color: GOLD }}>•</span>
                            <span>
                                Arrastra archivos de audio directamente al reproductor
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span style={{ color: GOLD }}>•</span>
                            <span>
                                Reproducción instantánea sin subir a la nube
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span style={{ color: GOLD }}>•</span>
                            <span>
                                Todos los datos se guardan localmente
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-6 left-0 right-0 text-center z-10">
                <p className="text-white/30 text-xs">
                    © 2025 Audio App • Modo Desarrollo Local
                </p>
            </div>
        </div>
    );
}

