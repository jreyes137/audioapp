// src/lib/AudioEngine.ts

// --- MATEMÁTICAS DSP PURAS ---
const calculateMetrics = (timeBuffer: Float32Array, bufferL: Float32Array, bufferR: Float32Array) => {
    let sum = 0; 
    let peak = 0;
    let sumL = 0, sumR = 0, sumProd = 0;

    // 1. RMS & PEAK
    for (let i = 0; i < timeBuffer.length; i++) {
        const val = timeBuffer[i];
        sum += val * val;
        if (Math.abs(val) > peak) peak = Math.abs(val);
    }
    const rms = Math.sqrt(sum / timeBuffer.length);
    const dbRMS = 20 * Math.log10(rms);
    const dbPeak = 20 * Math.log10(peak);

    // 2. FASE / CORRELACIÓN
    for (let i = 0; i < bufferL.length; i++) {
        sumL += bufferL[i] * bufferL[i];
        sumR += bufferR[i] * bufferR[i];
        sumProd += bufferL[i] * bufferR[i];
    }
    const denominator = Math.sqrt(sumL * sumR);
    const correlation = denominator > 0 ? sumProd / denominator : 0;

    return {
        rms: Math.max(-96, isFinite(dbRMS) ? dbRMS : -96),
        peak: Math.max(-96, isFinite(dbPeak) ? dbPeak : -96),
        phase: Math.max(-1, Math.min(1, correlation))
    };
};

// --- CLASE CONTROLADORA (SINGLETON) ---
export class AudioEngine {
    private static instance: AudioEngine;
    
    // Contexto
    private ctx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private analyserL: AnalyserNode | null = null; // Para fase real
    private analyserR: AnalyserNode | null = null; // Para fase real
    private gainNode: GainNode | null = null;
    
    // Nodos de Matrix
    private splitter: ChannelSplitterNode | null = null;
    private merger: ChannelMergerNode | null = null;
    private inverter: GainNode | null = null;

    // Elementos HTML Audio
    private audioA: HTMLAudioElement | null = null;
    private audioB: HTMLAudioElement | null = null;
    
    // Estado interno
    public isPlaying: boolean = false;
    private currentMode: "STEREO" | "MONO" | "SIDE" = "STEREO";
    private activeSource: "A" | "B" = "A";

    // SINGLETON: Garantiza que solo exista UN motor en toda la app
    public static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    // CONFIGURACIÓN INICIAL
    public init(audioElA: HTMLAudioElement, audioElB: HTMLAudioElement) {
        // Si ya estaba inicializado con otros audios, limpiar
        if (this.audioA && this.audioA !== audioElA) {
            this.stop();
        }

        this.audioA = audioElA;
        this.audioB = audioElB;

        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
            
            // Crear Analizadores
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            this.analyserL = this.ctx.createAnalyser();
            this.analyserR = this.ctx.createAnalyser();

            // Crear Nodos
            this.gainNode = this.ctx.createGain();
            this.splitter = this.ctx.createChannelSplitter(2);
            this.merger = this.ctx.createChannelMerger(2);
            this.inverter = this.ctx.createGain();
            this.inverter.gain.value = -1;

            // Conectar HTML Audio al Grafo (Solo si no están conectados ya)
            this.connectSource(this.audioA);
            this.connectSource(this.audioB);
        }
    }

    private connectSource(audioEl: HTMLAudioElement) {
        try {
            const src = this.ctx!.createMediaElementSource(audioEl);
            // Referencia oculta para desconectar después si es necesario
            (audioEl as any)._sourceNode = src;
            // Por defecto no conectamos al gain hasta darle play
        } catch (e) {
            // Ignorar si ya estaba conectado
        }
    }

    // --- CONTROL DE REPRODUCCIÓN ---
    public async play() {
        if (this.ctx?.state === "suspended") await this.ctx.resume();
        
        this.connectActiveSource();
        this.updateRouting(); // Asegurar modo correcto

        // Sync Tiempos
        if (this.audioA && this.audioB) {
            const targetTime = this.activeSource === "A" ? this.audioA.currentTime : this.audioB.currentTime;
            if (Math.abs(this.audioA.currentTime - this.audioB.currentTime) > 0.1) {
                 this.audioA.currentTime = targetTime;
                 this.audioB.currentTime = targetTime;
            }
            
            const activeEl = this.activeSource === "A" ? this.audioA : this.audioB;
            activeEl.play().catch(e => console.error("Play blocked", e));
            this.isPlaying = true;
        }
    }

    public pause() {
        this.audioA?.pause();
        this.audioB?.pause();
        this.isPlaying = false;
    }

    public stop() {
        this.pause();
        if(this.audioA) this.audioA.currentTime = 0;
        if(this.audioB) this.audioB.currentTime = 0;
    }

    // --- RUTEO DE SEÑAL (ESPAGUETI DE CABLES) ---
    public setMonitorMode(mode: "STEREO" | "MONO" | "SIDE") {
        this.currentMode = mode;
        this.updateRouting();
    }

    public toggleSource(isMaster: boolean) {
        this.activeSource = isMaster ? "B" : "A";
        
        // Sync y Cambio instantáneo
        if (this.isPlaying && this.audioA && this.audioB) {
            const prev = isMaster ? this.audioA : this.audioB;
            const next = isMaster ? this.audioB : this.audioA;
            
            const time = prev.currentTime;
            prev.pause();
            next.currentTime = time;
            next.play();
        }
        this.connectActiveSource();
    }

    private connectActiveSource() {
        if (!this.gainNode || !this.audioA || !this.audioB) return;
        
        const srcA = (this.audioA as any)._sourceNode;
        const srcB = (this.audioB as any)._sourceNode;

        // Desconectar ambos del Gain
        try { srcA?.disconnect(this.gainNode); } catch(e){}
        try { srcB?.disconnect(this.gainNode); } catch(e){}

        // Conectar solo el activo
        const activeSrc = this.activeSource === "A" ? srcA : srcB;
        try { activeSrc?.connect(this.gainNode); } catch(e){}
    }

    private updateRouting() {
        if (!this.ctx || !this.gainNode) return;

        const { gainNode, splitter, merger, inverter, analyser, analyserL, analyserR, ctx } = this;
        if(!splitter || !merger || !inverter || !analyser || !analyserL || !analyserR) return;

        // 1. Resetear todo
        gainNode.disconnect();
        splitter.disconnect();
        merger.disconnect();
        inverter.disconnect();

        // 2. Conectar Analizadores de Fase (Siempre leen la señal cruda del gain splitteada)
        gainNode.connect(splitter);
        splitter.connect(analyserL, 0);
        splitter.connect(analyserR, 1);

        // 3. Ruteo de Salida
        if (this.currentMode === "STEREO") {
            gainNode.connect(analyser);
            analyser.connect(ctx.destination);
        } 
        else if (this.currentMode === "MONO") {
            // Suma L+R
            gainNode.connect(splitter);
            splitter.connect(merger, 0, 0); splitter.connect(merger, 1, 0); // L+R en L
            splitter.connect(merger, 0, 1); splitter.connect(merger, 1, 1); // L+R en R
            merger.connect(analyser);
            analyser.connect(ctx.destination);
        } 
        else if (this.currentMode === "SIDE") {
            // L + (-R)
            gainNode.connect(splitter);
            splitter.connect(merger, 0, 0); // L normal
            splitter.connect(merger, 0, 1); // L normal
            
            splitter.connect(inverter, 1); // R -> Invert
            inverter.connect(merger, 0, 0); // -R
            inverter.connect(merger, 0, 1); // -R
            
            merger.connect(analyser);
            analyser.connect(ctx.destination);
        }
    }

    // --- OBTENCIÓN DE DATOS PARA LA UI ---
    public getData() {
        if (!this.analyser || !this.analyserL || !this.analyserR) return null;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeArray = new Float32Array(bufferLength);
        const timeL = new Float32Array(bufferLength);
        const timeR = new Float32Array(bufferLength);

        this.analyser.getByteFrequencyData(dataArray);
        this.analyser.getFloatTimeDomainData(timeArray); // Para RMS general
        
        // Para Fase (Necesitamos canales separados)
        this.analyserL.getFloatTimeDomainData(timeL);
        this.analyserR.getFloatTimeDomainData(timeR);

        const metrics = calculateMetrics(timeArray, timeL, timeR);

        return {
            freqData: dataArray,
            metrics
        };
    }
    
    // Método especial para snippets (Reproducir y matar a los 5s)
    public playSnippet(url: string, time: number, cb: () => void) {
        this.stop(); // Detener main player
        // Aquí iría la lógica del snippet aislado si fuera necesario,
        // pero por ahora el snippet player usa su propio audio.
        // Esta función sirve para asegurar que el MAIN player se calle.
    }
}

export const engine = AudioEngine.getInstance();