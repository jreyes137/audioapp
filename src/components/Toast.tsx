'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    onClose: () => void;
}

const ICONS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '🔒',
};

const COLORS = {
    info: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
    },
    success: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-400',
    },
    warning: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
    },
    error: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
    },
};

export default function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        setTimeout(() => setIsVisible(true), 10);

        // Auto close
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Esperar animación de salida
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const colors = COLORS[type];

    return (
        <div
            className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
        >
            <div
                className={`${colors.bg} ${colors.border} border rounded-lg p-4 shadow-2xl backdrop-blur-sm min-w-[320px] max-w-md`}
            >
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{ICONS[type]}</span>
                    <div className="flex-1">
                        <p className={`${colors.text} font-bold text-sm leading-relaxed`}>
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="text-white/40 hover:text-white transition-colors text-xs"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}

