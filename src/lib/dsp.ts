// CLASE DSP (DIGITAL SIGNAL PROCESSING)
export class AudioDSP {
    private ctx: AudioContext;
    private analyser: AnalyserNode;
    private gain: GainNode;
    private splitter: ChannelSplitterNode;
    private merger: ChannelMergerNode;
    private sideInvert: GainNode;
    
    // Nodos fuente
    private source: MediaElementAudioSourceNode | null = null;

    constructor() {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new Ctx();
        
        // Cadena de Procesamiento
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85; // Suavizado nativo

        this.gain = this.ctx.createGain();
        this.splitter = this.ctx.createChannelSplitter(2);
        this.merger = this.ctx.createChannelMerger(2);
        
        this.sideInvert = this.ctx.createGain();
        this.sideInvert.gain.value = -1;

        // Conexión por defecto (Stereo)
        this.gain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
    }

    // Conectar elemento <audio> al DSP
    public connectSource(audioElement: HTMLAudioElement) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        // Evitar reconexión doble
        if ((audioElement as any)._isConnected) return;
        
        try {
            this.source = this.ctx.createMediaElementSource(audioElement);
            this.source.connect(this.gain);
            (audioElement as any)._isConnected = true;
        } catch (e) {
            console.warn("DSP: Fuente ya conectada o CORS error.", e);
        }
    }

    public setMode(mode: "STEREO" | "MONO" | "SIDE") {
        // 1. Desconectar todo
        this.gain.disconnect();
        this.splitter.disconnect();
        this.merger.disconnect();
        this.sideInvert.disconnect();
        
        // El analizador siempre va al destino final
        this.analyser.connect(this.ctx.destination);

        if (mode === "STEREO") {
            this.gain.connect(this.analyser);
        } 
        else if (mode === "MONO") {
            // L+R
            this.gain.connect(this.splitter);
            this.splitter.connect(this.merger, 0, 0);
            this.splitter.connect(this.merger, 1, 0);
            // Duplicar a canal derecho
            this.splitter.connect(this.merger, 0, 1);
            this.splitter.connect(this.merger, 1, 1);
            this.merger.connect(this.analyser);
        } 
        else if (mode === "SIDE") {
            // L + (-R)
            this.gain.connect(this.splitter);
            
            // Izquierda (L)
            this.splitter.connect(this.merger, 0, 0); 
            
            // Derecha invertida (-R)
            this.splitter.connect(this.sideInvert, 1);
            this.sideInvert.connect(this.merger, 0, 0);

            // Duplicar resultado a ambos oídos
            this.splitter.connect(this.merger, 0, 1);
            this.sideInvert.connect(this.merger, 0, 1);
            
            this.merger.connect(this.analyser);
        }
    }

    public getAnalysisData(dataArray: Uint8Array) {
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calcular RMS Matemático
        // (Simplificado para rendimiento en tiempo real)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        
        // Simular DBfs
        const rms = (avg / 255) * 100; // 0 a 100 de energía
        const db = -60 + (rms * 0.6);  // Mapeo aproximado a DB
        
        return { db, raw: dataArray };
    }
}