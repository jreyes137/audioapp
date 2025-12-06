import { useState, useRef, useEffect } from "react";

export function useAudioEngine(mixUrl: string | null, masterUrl: string | null) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showMaster, setShowMaster] = useState(false); // false = MIX, true = MASTER

    // Referencias de Audio HTML5 (Los que suenan de verdad)
    const audioRefA = useRef<HTMLAudioElement | null>(null);
    const audioRefB = useRef<HTMLAudioElement | null>(null);
    
    // Referencias de Análisis (DSP)
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRefA = useRef<MediaElementAudioSourceNode | null>(null);
    const sourceRefB = useRef<MediaElementAudioSourceNode | null>(null);

    // 1. DETECTAR CAMBIO DE ARCHIVOS (EL FIX PRINCIPAL)
    useEffect(() => {
        if (audioRefA.current && mixUrl) {
            audioRefA.current.src = mixUrl;
            audioRefA.current.load();
        }
        if (audioRefB.current && masterUrl) {
            audioRefB.current.src = masterUrl;
            audioRefB.current.load();
        }
    }, [mixUrl, masterUrl]);

    // 2. INICIALIZAR DSP (SOLO UNA VEZ)
    const initDSP = () => {
        if (!audioContextRef.current) {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new Ctx();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            
            // Conectar el analizador a NADA (para no duplicar audio), 
            // el audio ya sale por el elemento HTML <audio>
            // Solo lo usamos para "leer" los datos visuales.
            
            if (audioRefA.current && audioRefB.current) {
                try {
                    // Intentamos conectar para visuales
                    const srcA = audioContextRef.current.createMediaElementSource(audioRefA.current);
                    const srcB = audioContextRef.current.createMediaElementSource(audioRefB.current);
                    srcA.connect(analyserRef.current);
                    srcB.connect(analyserRef.current);
                    sourceRefA.current = srcA;
                    sourceRefB.current = srcB;
                } catch (e) {
                    // Si falla por CORS, no importa, el audio sonará igual
                    console.log("Modo DSP Visual Limitado (CORS)");
                }
            }
        }
        if (audioContextRef.current?.state === "suspended") audioContextRef.current.resume();
    };

    // 3. CONTROL PLAY/PAUSE
    const togglePlay = () => {
        initDSP();
        const active = showMaster ? audioRefB.current : audioRefA.current;
        const inactive = showMaster ? audioRefA.current : audioRefB.current;

        if (isPlaying) {
            active?.pause();
            inactive?.pause();
            setIsPlaying(false);
        } else {
            // Sincronizar
            if (active && inactive) {
                active.currentTime = inactive.currentTime || active.currentTime;
            }
            active?.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.error("Error Play:", e));
        }
    };

    // 4. CONTROL A/B
    useEffect(() => {
        const prev = showMaster ? audioRefA.current : audioRefB.current;
        const next = showMaster ? audioRefB.current : audioRefA.current;
        
        if (isPlaying && prev && next) {
            const t = prev.currentTime;
            prev.pause();
            next.currentTime = t;
            next.play();
        }
    }, [showMaster]);

    // 5. SYNC DE TIEMPO
    const handleTimeUpdate = () => {
        const active = showMaster ? audioRefB.current : audioRefA.current;
        if (active) {
            setCurrentTime(active.currentTime);
            setDuration(active.duration || 0);
            if (active.ended) setIsPlaying(false);
        }
    };

    const seek = (time: number) => {
        if (audioRefA.current) audioRefA.current.currentTime = time;
        if (audioRefB.current) audioRefB.current.currentTime = time;
        setCurrentTime(time);
    };

    return {
        audioRefA, audioRefB,
        analyser: analyserRef.current, // Exportamos el analizador para el gráfico
        isPlaying, togglePlay,
        showMaster, setShowMaster,
        currentTime, duration, seek,
        handleTimeUpdate
    };
}