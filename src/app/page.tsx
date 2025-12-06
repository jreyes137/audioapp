/**
 * HOME (Landing SaaS) - Dark SaaS / Vercel-like
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Music, Waves, Check } from "lucide-react";

const features = [
    { title: "Reproductor A/B sin pérdidas", icon: <Waves className="w-5 h-5 text-cyan-400" /> },
    { title: "Pagos y Stems bloqueados", icon: <Lock className="w-5 h-5 text-yellow-400" /> },
    { title: "Portafolio Automático con Spotify", icon: <Music className="w-5 h-5 text-green-400" /> },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-black text-white">
            {/* Navbar */}
            <header className="sticky top-0 z-30 backdrop-blur-md bg-black/30 border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="text-lg font-black tracking-tight">AudioApp</div>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
                        <a href="#features" className="hover:text-white transition">Características</a>
                        <a href="#pricing" className="hover:text-white transition">Precios</a>
                        <a href="#blog" className="hover:text-white transition">Blog</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm text-white/80 hover:text-white px-3 py-2">Log In</Link>
                        <Link
                            href="/register"
                            className="text-sm font-bold px-4 py-2 rounded-lg bg-cyan-500 text-black hover:scale-105 transition"
                        >
                            Comenzar Gratis
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">SaaS para Ingenieros</p>
                    <h1 className="text-4xl md:text-5xl font-black leading-tight">
                        Tu estudio, profesionalizado.
                    </h1>
                    <p className="text-lg text-white/70">
                        La plataforma todo-en-uno para gestionar clientes, entregas de audio y pagos. Deja de usar WeTransfer y WhatsApp.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/register"
                            className="px-5 py-3 rounded-xl bg-cyan-500 text-black font-black text-sm hover:scale-105 transition"
                        >
                            Crear Cuenta de Ingeniero
                        </Link>
                        <Link
                            href="/login"
                            className="px-5 py-3 rounded-xl border border-white/15 text-white/80 text-sm hover:text-white hover:border-white/40 transition"
                        >
                            Ver Demo
                        </Link>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-2"><span className="text-cyan-400">●</span> Dashboard listo para clientes</span>
                        <span className="flex items-center gap-2"><span className="text-yellow-400">●</span> Pagos y entrega segura</span>
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0, rotate: -2, y: 20 }}
                    animate={{ opacity: 1, rotate: 0, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative"
                >
                    <div className="absolute -inset-6 bg-gradient-to-br from-cyan-500/20 via-transparent to-yellow-500/10 blur-3xl" />
                    <div className="relative rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur shadow-2xl overflow-hidden">
                        <div className="h-8 bg-gradient-to-r from-cyan-500/40 to-yellow-500/30 opacity-60" />
                        <img
                            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80"
                            alt="Dashboard Mock"
                            className="w-full object-cover"
                            style={{ transform: "perspective(1200px) rotateX(2deg) rotateY(-4deg)" }}
                        />
                        <div className="p-4 text-xs text-white/60 border-t border-white/10">
                            Vista previa del Dashboard con reproductor A/B, órdenes y portafolio integrado.
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Feature Bento */}
            <section id="features" className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-3 gap-4">
                    {features.map((f, idx) => (
                        <div key={f.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                {f.icon}
                                <h3 className="text-lg font-bold">{f.title}</h3>
                            </div>
                            <p className="text-sm text-white/60">
                                {idx === 0 && "Comparación instantánea de Mix vs Master sin pérdidas ni cortes."}
                                {idx === 1 && "Entrega segura: bloquea descargas hasta pago confirmado."}
                                {idx === 2 && "Embebe Spotify y genera tu portafolio sin re-subir audio."}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="max-w-6xl mx-auto px-6 pb-16">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Precios</p>
                        <h2 className="text-2xl font-black">Elige tu plan</h2>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold">Free</h3>
                            <span className="text-lg font-black text-white">$0</span>
                        </div>
                        <ul className="space-y-2 text-sm text-white/70 mb-6">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 3 proyectos activos</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Reproductor web</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Portafolio básico</li>
                        </ul>
                        <Link href="/register" className="block text-center px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-sm font-bold hover:bg-white/15 transition">
                            Empieza Gratis
                        </Link>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/80 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold">Pro</h3>
                            <span className="text-lg font-black text-cyan-300">$29/mo</span>
                        </div>
                        <ul className="space-y-2 text-sm text-white/70 mb-6">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Proyectos ilimitados</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Entrega segura con bloqueo de stems</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Portafolio automático + Spotify</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> A/B sin pérdidas y métricas pro</li>
                        </ul>
                        <Link href="/register" className="block text-center px-4 py-3 rounded-lg bg-cyan-500 text-black text-sm font-black hover:scale-105 transition">
                            Pasar a Pro
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
