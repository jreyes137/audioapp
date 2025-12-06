/**
 * INBOX SNIPPET PLAYER
 * 
 * Mini reproductor para previsualizar comentarios del inbox.
 * Reproduce un fragmento de 5 segundos desde un tiempo específico.
 * 
 * Actualizado para usar el nuevo audioManager (Singleton HTML5)
 */

"use client";
import { useState, useEffect } from "react";
import { audioManager } from "@/lib/audioManager";

const GOLD = "#D4AF37";

interface Props {
    url: string | null;
    time: number;
}

export default function InboxSnippetPlayer({ url, time }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);

    // Suscribirse al estado global del audioManager
    useEffect(() => {
        const unsubscribe = audioManager.subscribe((state) => {
            // Si el audio se detuvo, actualizar UI local
            if (state === 'stopped' || state === 'paused') {
                setIsPlaying(false);
            }
        });

        return unsubscribe;
    }, []);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!url) {
            alert("⚠️ Sin audio disponible");
            return;
        }

        if (isPlaying) {
            // Detener el snippet actual
            audioManager.pause();
            setIsPlaying(false);
        } else {
            // Reproducir snippet de 5 segundos
            try {
                setIsPlaying(true);
                await audioManager.playSnippet(url, time, 5);
                
                // Auto-apagar el indicador después de 5 segundos
                setTimeout(() => {
                    setIsPlaying(false);
                }, 5000);
            } catch (error) {
                console.error('[InboxSnippet] Error al reproducir:', error);
                setIsPlaying(false);
            }
        }
    };

    return (
        <button
            onClick={handleClick}
            style={{
                backgroundColor: isPlaying ? GOLD : 'transparent',
                borderColor: isPlaying ? GOLD : '#333',
                color: isPlaying ? 'black' : '#555',
            }}
            className={`w-8 h-8 flex items-center justify-center rounded border transition-all hover:text-white hover:border-[#555] ${
                isPlaying ? 'scale-110' : ''
            }`}
        >
            {isPlaying ? (
                <span className="font-black text-[10px] animate-pulse">❚❚</span>
            ) : (
                <span className="text-[10px]">▶</span>
            )}
        </button>
    );
}
