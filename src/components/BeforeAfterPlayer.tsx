"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    beforeUrl: string;
    afterUrl: string;
}

export default function BeforeAfterPlayer({ beforeUrl, afterUrl }: Props) {
    const beforeRef = useRef<HTMLAudioElement>(null);
    const afterRef = useRef<HTMLAudioElement>(null);
    const [isAfter, setIsAfter] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const active = isAfter ? afterRef.current : beforeRef.current;
            if (active) {
                setCurrentTime(active.currentTime || 0);
                setDuration(active.duration || 0);
            }
        }, 200);
        return () => clearInterval(interval);
    }, [isAfter]);

    const format = (s: number) => {
        if (!isFinite(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${String(sec).padStart(2, "0")}`;
    };

    const handleToggle = () => {
        const from = isAfter ? afterRef.current : beforeRef.current;
        const to = isAfter ? beforeRef.current : afterRef.current;
        const time = from?.currentTime || 0;
        if (to) {
            to.currentTime = time;
            to.play();
        }
        if (from) {
            from.pause();
        }
        setIsAfter(!isAfter);
    };

    return (
        <div className="rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/50">A/B Demo</p>
                    <h4 className="text-sm font-bold text-white">{isAfter ? "Master" : "Mix"}</h4>
                </div>
                <button
                    onClick={handleToggle}
                    className="px-3 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition flex items-center gap-2 text-xs font-bold"
                >
                    <div className={`w-10 h-5 rounded-full transition-all ${isAfter ? "bg-cyan-500" : "bg-slate-700"}`}>
                        <div
                            className={`w-4 h-4 rounded-full bg-white shadow transform transition-all translate-y-[2px] ${isAfter ? "translate-x-[22px]" : "translate-x-[2px]"}`}
                        />
                    </div>
                    <span>{isAfter ? "Master" : "Mix"}</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[11px] text-white/60 font-mono w-12">{format(currentTime)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-yellow-400"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                </div>
                <span className="text-[11px] text-white/60 font-mono w-12 text-right">{format(duration)}</span>
            </div>

            <audio ref={beforeRef} src={beforeUrl} controls className="hidden" preload="auto" />
            <audio ref={afterRef} src={afterUrl} controls className="hidden" preload="auto" />
        </div>
    );
}

