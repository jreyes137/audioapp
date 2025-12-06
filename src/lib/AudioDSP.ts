// src/lib/AudioDSP.ts

export class AudioDSP {
    private ctx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private gain: GainNode | null = null;
    private splitter: ChannelSplitterNode | null = null;
    private merger: ChannelMergerNode | null = null;
    private sideInvert: GainNode | null = null;
    private source: MediaElementAudioSourceNode | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new Ctx();
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            this.gain = this.ctx.createGain();
            this.splitter = this.ctx.createChannelSplitter(2);
            this.merger = this.ctx.createChannelMerger(2);
            this.sideInvert = this.ctx.createGain();
            this.sideInvert.gain.value = -1;

            // Por defecto Stereo: Gain -> Analyser -> Destination
            this.gain.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);
        }
    }

    public connectSource(audioElement: HTMLAudioElement) {
        if (!this.ctx || !this.gain) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Evitar reconectar si ya existe
        if ((audioElement as any)._dspConnected) return;

        try {
            this.source = this.ctx.createMediaElementSource(audioElement);
            this.source.connect(this.gain);
            (audioElement as any)._dspConnected = true;
        } catch (e) {
            console.log("DSP: Fuente ya conectada o CORS.");
        }
    }

    public setMode(mode: "STEREO" | "MONO" | "MID" | "SIDE") {
        if (!this.ctx || !this.gain) return;

        // 1. Desconectar todo
        try {
            this.gain.disconnect();
            this.splitter?.disconnect();
            this.merger?.disconnect();
            this.sideInvert?.disconnect();
        } catch (e) {}

        // Siempre el analizador va al destino final
        this.analyser?.connect(this.ctx.destination);

        // 2. Enrutamiento
        if (mode === "STEREO") {
            // Normal: Stereo completo
            this.gain.connect(this.analyser!);
        } 
        else if (mode === "MONO") {
            // Mono: Suma L+R en ambos canales
            this.gain.connect(this.splitter!);
            this.splitter!.connect(this.merger!, 0, 0); // L -> L
            this.splitter!.connect(this.merger!, 1, 0); // R -> L
            this.splitter!.connect(this.merger!, 0, 1); // L -> R
            this.splitter!.connect(this.merger!, 1, 1); // R -> R
            this.merger!.connect(this.analyser!);
        } 
        else if (mode === "MID") {
            // Mid: Solo el centro (L+R)/2 en ambos canales
            // Es como MONO pero lo llamamos MID para claridad
            this.gain.connect(this.splitter!);
            this.splitter!.connect(this.merger!, 0, 0); // L -> L
            this.splitter!.connect(this.merger!, 1, 0); // R -> L (suma)
            this.splitter!.connect(this.merger!, 0, 1); // L -> R
            this.splitter!.connect(this.merger!, 1, 1); // R -> R (suma)
            this.merger!.connect(this.analyser!);
        }
        else if (mode === "SIDE") {
            // Side: Diferencia L-R (información estéreo)
            this.gain.connect(this.splitter!);
            
            // L + (-R) para extraer SIDE
            this.splitter!.connect(this.merger!, 0, 0); // L normal
            this.splitter!.connect(this.sideInvert!, 1); // R invertido
            this.sideInvert!.connect(this.merger!, 0, 0); // R invertido suma a L
            
            // Duplicar al canal derecho para escuchar en estéreo
            this.splitter!.connect(this.merger!, 0, 1);
            this.sideInvert!.connect(this.merger!, 0, 1);
            
            this.merger!.connect(this.analyser!);
        }
    }

    public getAnalysis() {
        if (!this.analyser) return null;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeArray = new Float32Array(bufferLength);

        this.analyser.getByteFrequencyData(dataArray);
        this.analyser.getFloatTimeDomainData(timeArray);

        // Calcular RMS Real
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < timeArray.length; i++) {
            const val = timeArray[i];
            sum += val * val;
            if (Math.abs(val) > peak) peak = Math.abs(val);
        }
        const rms = Math.sqrt(sum / timeArray.length);
        const db = 20 * Math.log10(rms);

        return {
            freq: dataArray,
            rms: Math.max(-96, isFinite(db) ? db : -96),
            peak: Math.max(-96, 20 * Math.log10(peak))
        };
    }

    /**
     * ⭐ NUEVO: Obtener AudioContext (para compartir con audioManager)
     */
    public getContext(): AudioContext | null {
        return this.ctx;
    }

    /**
     * ⭐ NUEVO: Obtener nodo de salida (analyser, que ya está conectado a destination)
     */
    public getOutputNode(): AnalyserNode | null {
        return this.analyser;
    }

    /**
     * ⭐ NUEVO: Obtener GainNode de entrada (para insertar nodos antes del DSP)
     */
    public getInputNode(): GainNode | null {
        return this.gain;
    }
}