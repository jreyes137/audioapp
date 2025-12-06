/**
 * AUDIO MANAGER - SINGLETON GLOBAL
 * 
 * Arquitectura:
 * - Un ÚNICO elemento <audio> global fuera de React
 * - Controla Play/Pause/Stop en toda la app
 * - Evita el bug de "Audio Fantasma" (múltiples instancias superpuestas)
 * 
 * USO:
 * import { audioManager } from '@/lib/audioManager';
 * audioManager.play(url, startTime);
 * audioManager.pause();
 * audioManager.stop();
 */

import { AudioDSP } from './AudioDSP';
import { BPMDetector } from './BPMDetector';

type AudioState = 'playing' | 'paused' | 'stopped';
type StateCallback = (state: AudioState) => void;
type AudioMode = 'STEREO' | 'MONO' | 'MID' | 'SIDE';

// ⭐ FALLBACK URL (Modo Test - Bypass Firebase)
// Cambiado a URL más robusta y simple
const FALLBACK_AUDIO_URL = 'https://www.w3schools.com/html/horse.mp3';

class AudioManager {
    private static instance: AudioManager;
    private audioElement: HTMLAudioElement | null = null;
    private currentUrl: string | null = null;
    private stateListeners: Set<StateCallback> = new Set();
    private currentState: AudioState = 'stopped';
    
    // ⭐ DSP Engine para Mono/Mid/Side
    private dspEngine: AudioDSP | null = null;
    private currentMode: AudioMode = 'STEREO';

    // ⭐ NUEVO: Equal Loudness (Gain Match)
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private analyserNode: AnalyserNode | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private equalLoudnessEnabled: boolean = false;
    private targetLUFS: number = -14; // Estándar de streaming
    private currentRMS: number = 0;

    // ⭐ NUEVO: Watermark (Marca de Agua)
    private watermarkEnabled: boolean = false;
    private watermarkOscillator: OscillatorNode | null = null;
    private watermarkGain: GainNode | null = null;
    private watermarkInterval: number | null = null;
    private watermarkIntervalTime: number = 45000; // 45 segundos

    // ⭐ NUEVO: Audio Quality Metadata
    private audioMetadata: {
        sampleRate: number | null;
        channelCount: number | null;
        format: string | null;
        bitDepth: string | null;
        bpm: number | null;
        key: string | null;
    } = {
        sampleRate: null,
        channelCount: null,
        format: null,
        bitDepth: null,
        bpm: null,
        key: null,
    };

    // ⭐ NUEVO: Environment Simulation (Car Test)
    private environmentFilters: {
        lowShelf: BiquadFilterNode | null;
        midCut: BiquadFilterNode | null;
        highShelf: BiquadFilterNode | null;
        highPass: BiquadFilterNode | null;
        lowPass: BiquadFilterNode | null;
        peakFilter: BiquadFilterNode | null;
    } = {
        lowShelf: null,
        midCut: null,
        highShelf: null,
        highPass: null,
        lowPass: null,
        peakFilter: null,
    };
    private currentEnvironment: 'studio' | 'car' | 'phone' | 'laptop' = 'studio';
    private filtersConnected: boolean = false;

    // ⭐ NUEVO: Spatial Audio (3D Mode)
    private spatialAudioEnabled: boolean = false;
    private pannerNode: PannerNode | null = null;
    private listenerPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    private soundPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: -1 }; // Frente por defecto

    private constructor() {
        // Solo se ejecuta una vez en toda la vida de la app
        if (typeof window !== 'undefined') {
            this.audioElement = new Audio();
            
            // ⭐ FORZAR CORS (Crítico para Web Audio API)
            this.audioElement.crossOrigin = 'anonymous';
            this.audioElement.preload = 'metadata';
            
            // Eventos nativos del navegador
            this.audioElement.addEventListener('play', () => this.updateState('playing'));
            this.audioElement.addEventListener('pause', () => this.updateState('paused'));
            this.audioElement.addEventListener('ended', () => this.updateState('stopped'));
            
            this.audioElement.addEventListener('error', (e: any) => {
                // ⭐ SILENCIAR AbortError (normal al cambiar rápido de track)
                if (e.target?.error?.code === 20) {
                    console.warn('[AudioManager] ⚠️ AbortError silenciado (cambio rápido de track)');
                    return;
                }
                console.error('[AudioManager] Error de carga:', e);
                this.updateState('stopped');
            });

            // ⭐ NUEVO: Capturar metadatos de audio
            this.audioElement.addEventListener('loadedmetadata', () => {
                this.captureAudioMetadata();
                
                // ⭐ NUEVO: Analizar BPM automáticamente
                this.analyzeAudioFeatures();
            });

            // ⭐ Inicializar DSP Engine
            try {
                this.dspEngine = new AudioDSP();
                this.dspEngine.connectSource(this.audioElement);
                console.log('[AudioManager] ✓ DSP Engine inicializado');
            } catch (error) {
                console.warn('[AudioManager] DSP Engine no disponible:', error);
            }

            // ⭐ NUEVO: Inicializar Web Audio API para Equal Loudness
            this.initializeAudioContext();

            console.log('[AudioManager] ✓ Singleton inicializado');
        }
    }

    /**
     * ⭐ NUEVO: Inicializar Web Audio API - INTEGRACIÓN CON DSP ENGINE
     */
    private initializeAudioContext(): void {
        try {
            // ⭐ CRÍTICO: Usar el AudioContext del DSP engine si existe
            if (this.dspEngine) {
                const dspContext = this.dspEngine.getContext();
                const dspAnalyser = this.dspEngine.getOutputNode();
                const dspInput = this.dspEngine.getInputNode();
                
                if (dspContext && dspAnalyser && dspInput) {
                    this.audioContext = dspContext;
                    this.analyserNode = dspAnalyser; // ⭐ Reutilizar el analyser del DSP
                    
                    console.log('[AudioManager] ✓ Usando AudioContext del DSP Engine');
                    
                    // ⭐ Crear GainNode para Equal Loudness
                    this.gainNode = this.audioContext.createGain();
                    this.gainNode.gain.value = 1.0; // Volumen al 100%
                    
                    // ⭐ INSERTAR GainNode ANTES del DSP input
                    // Cadena: Source → audioManager.GainNode → DSP.Gain → DSP.Analyser → Destination
                    // (El DSP ya conectó Source → DSP.Gain, así que necesitamos reconectar)
                    
                    // Por ahora, solo usar el analyser del DSP
                    // El GainNode se usará cuando toggleEqualLoudness() esté activo
                    
                    console.log('[AudioManager] ✓ Cadena: Source → DSP → Analyser → SPEAKERS 🔊');
                    
                    // ⭐ NUEVO: Inicializar filtros de entorno
                    this.initializeEnvironmentFilters();
                    
                    // Iniciar monitoreo de volumen
                    this.startVolumeMonitoring();
                    return;
                }
            }

            // ⭐ FALLBACK: Si no hay DSP, crear contexto simple
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) {
                console.warn('[AudioManager] Web Audio API no soportada');
                return;
            }

            this.audioContext = new AudioContext();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.0;
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 2048;
            this.analyserNode.smoothingTimeConstant = 0.8;

            // Conectar: Source → GainNode → AnalyserNode → Destination
            if (this.audioElement) {
                this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
                this.sourceNode.connect(this.gainNode);
                this.gainNode.connect(this.analyserNode);
                this.analyserNode.connect(this.audioContext.destination);
                console.log('[AudioManager] ✓ Cadena simple: Source → Gain → Analyser → SPEAKERS 🔊');
            }

            this.startVolumeMonitoring();
        } catch (error: any) {
            console.error('[AudioManager] ❌ Error crítico al inicializar audio:', error.message);
            console.error('[AudioManager] SIN SONIDO - Revisa la consola');
        }
    }

    /**
     * ⭐ NUEVO: Inicializar filtros para simulación de entornos
     */
    private initializeEnvironmentFilters(): void {
        if (!this.audioContext) return;

        try {
            // Crear todos los filtros necesarios
            this.environmentFilters.lowShelf = this.audioContext.createBiquadFilter();
            this.environmentFilters.lowShelf.type = 'lowshelf';
            
            this.environmentFilters.midCut = this.audioContext.createBiquadFilter();
            this.environmentFilters.midCut.type = 'peaking';
            
            this.environmentFilters.highShelf = this.audioContext.createBiquadFilter();
            this.environmentFilters.highShelf.type = 'highshelf';
            
            this.environmentFilters.highPass = this.audioContext.createBiquadFilter();
            this.environmentFilters.highPass.type = 'highpass';
            
            this.environmentFilters.lowPass = this.audioContext.createBiquadFilter();
            this.environmentFilters.lowPass.type = 'lowpass';
            
            this.environmentFilters.peakFilter = this.audioContext.createBiquadFilter();
            this.environmentFilters.peakFilter.type = 'peaking';

            console.log('[AudioManager] ✓ Filtros de entorno inicializados');
        } catch (error) {
            console.error('[AudioManager] Error al inicializar filtros:', error);
        }
    }

    /**
     * ⭐ NUEVO: Obtener metadatos de audio para mostrar en UI
     */
    public getAudioMetadata() {
        return {
            ...this.audioMetadata,
            isHiRes: (this.audioMetadata.sampleRate || 0) > 48000,
            channelLabel: this.audioMetadata.channelCount === 1 ? 'Mono' : 
                          this.audioMetadata.channelCount === 2 ? 'Stereo' : 
                          `${this.audioMetadata.channelCount}CH`,
        };
    }

    /**
     * ⭐ NUEVO: Analizar características musicales (BPM, Key)
     * Se ejecuta automáticamente al cargar un archivo
     */
    private async analyzeAudioFeatures(): Promise<void> {
        if (!this.audioContext || !this.audioElement || !this.currentUrl) return;

        try {
            console.log('[AudioManager] 🎵 Iniciando análisis de características musicales...');

            // Fetch del archivo de audio
            const response = await fetch(this.currentUrl);
            const arrayBuffer = await response.arrayBuffer();

            // Decodificar audio
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Detectar BPM
            const bpmDetector = new BPMDetector(this.audioContext);
            const bpm = await bpmDetector.detectBPM(audioBuffer);

            if (bpm) {
                this.audioMetadata.bpm = bpm;
                console.log('[AudioManager] ✅ BPM detectado:', bpm);
            } else {
                console.log('[AudioManager] ⚠️ No se pudo detectar BPM');
            }

            // TODO: Detectar Key (tonalidad) - requiere análisis espectral más complejo
            // const keyDetector = new KeyDetector();
            // const key = await keyDetector.detectKey(audioBuffer);
            // this.audioMetadata.key = key;

        } catch (error) {
            console.error('[AudioManager] ❌ Error al analizar características:', error);
            
            // Si es un blob:// URL (archivo local), intentar analizar de forma diferente
            if (this.currentUrl?.startsWith('blob:')) {
                console.log('[AudioManager] 📎 Archivo local detectado, análisis BPM limitado');
            }
        }
    }

    /**
     * ⭐ NUEVO: Cambiar entorno de simulación acústica
     */
    public setEnvironment(env: 'studio' | 'car' | 'phone' | 'laptop'): void {
        if (!this.audioContext || !this.dspEngine) {
            console.warn('[AudioManager] AudioContext no disponible para simulación');
            return;
        }

        try {
            // Si los filtros no están inicializados, crearlos
            if (!this.environmentFilters.lowShelf) {
                this.initializeEnvironmentFilters();
            }

            // Desconectar filtros anteriores si estaban conectados
            if (this.filtersConnected) {
                this.disconnectEnvironmentFilters();
            }

            this.currentEnvironment = env;

            if (env === 'studio') {
                // Bypass (sin filtros)
                console.log('[AudioManager] 🎧 Modo Studio (Bypass)');
                return;
            }

            // Reconectar con la configuración del nuevo entorno
            this.connectEnvironmentFilters(env);
            
            console.log(`[AudioManager] ✓ Entorno cambiado a: ${env.toUpperCase()}`);
        } catch (error) {
            console.error('[AudioManager] Error al cambiar entorno:', error);
        }
    }

    /**
     * ⭐ NUEVO: Conectar filtros según el entorno
     */
    private connectEnvironmentFilters(env: 'car' | 'phone' | 'laptop'): void {
        if (!this.audioContext || !this.dspEngine) return;

        const dspOutput = this.dspEngine.getOutputNode(); // Analyser del DSP
        const destination = this.audioContext.destination;

        if (!dspOutput) {
            console.warn('[AudioManager] DSP output no disponible');
            return;
        }

        try {
            // Desconectar el DSP del destino temporalmente
            dspOutput.disconnect();

            if (env === 'car') {
                // 🚗 COCHE: Curva de "Sonrisa" (V-shaped)
                // Boost bajos + Recorte medios + Boost brillos
                
                const lowShelf = this.environmentFilters.lowShelf!;
                const midCut = this.environmentFilters.midCut!;
                const highShelf = this.environmentFilters.highShelf!;

                // Boost en bajos (60-100Hz)
                lowShelf.frequency.value = 80;
                lowShelf.gain.value = 8; // +8dB (agresivo)

                // Corte en medios-bajos (300Hz - mud)
                midCut.frequency.value = 300;
                midCut.Q.value = 1.5;
                midCut.gain.value = -6; // -6dB

                // Boost en brillos (10kHz)
                highShelf.frequency.value = 10000;
                highShelf.gain.value = 6; // +6dB

                // Cadena: DSP → LowShelf → MidCut → HighShelf → Destination
                dspOutput.connect(lowShelf);
                lowShelf.connect(midCut);
                midCut.connect(highShelf);
                highShelf.connect(destination);

                console.log('[AudioManager] 🚗 Filtros CAR: Boost bajos (+8dB @80Hz), Corte medios (-6dB @300Hz), Boost brillos (+6dB @10kHz)');

            } else if (env === 'phone') {
                // 📱 CELULAR: Drástico recorte de bajos y agudos
                // Simula speaker pequeño (latoso)
                
                const highPass = this.environmentFilters.highPass!;
                const lowPass = this.environmentFilters.lowPass!;

                // High Pass drástico en 400Hz (elimina TODO el bajo)
                highPass.frequency.value = 400;
                highPass.Q.value = 0.7;

                // Low Pass en 10kHz (recorta aire/brillos)
                lowPass.frequency.value = 10000;
                lowPass.Q.value = 0.7;

                // Cadena: DSP → HighPass → LowPass → Destination
                dspOutput.connect(highPass);
                highPass.connect(lowPass);
                lowPass.connect(destination);

                console.log('[AudioManager] 📱 Filtros PHONE: HPF @400Hz, LPF @10kHz (speaker pequeño)');

            } else if (env === 'laptop') {
                // 💻 LAPTOP: High Pass suave + pico feo en 2kHz
                // Simula resonancia plástica de laptop
                
                const highPass = this.environmentFilters.highPass!;
                const peakFilter = this.environmentFilters.peakFilter!;

                // High Pass suave en 200Hz
                highPass.frequency.value = 200;
                highPass.Q.value = 0.5;

                // Pico feo en 2kHz (resonancia plástica)
                peakFilter.frequency.value = 2000;
                peakFilter.Q.value = 3; // Q alto = pico estrecho
                peakFilter.gain.value = 5; // +5dB (molesto)

                // Cadena: DSP → HighPass → PeakFilter → Destination
                dspOutput.connect(highPass);
                highPass.connect(peakFilter);
                peakFilter.connect(destination);

                console.log('[AudioManager] 💻 Filtros LAPTOP: HPF @200Hz, Peak @2kHz (+5dB Q3)');
            }

            this.filtersConnected = true;

        } catch (error) {
            console.error('[AudioManager] Error al conectar filtros:', error);
        }
    }

    /**
     * ⭐ NUEVO: Desconectar filtros de entorno
     */
    private disconnectEnvironmentFilters(): void {
        if (!this.audioContext || !this.dspEngine) return;

        try {
            const dspOutput = this.dspEngine.getOutputNode();
            const destination = this.audioContext.destination;

            if (!dspOutput) return;

            // Desconectar todos los filtros
            Object.values(this.environmentFilters).forEach(filter => {
                if (filter) {
                    try {
                        filter.disconnect();
                    } catch (e) {
                        // Ignorar errores de desconexión
                    }
                }
            });

            // Reconectar DSP directamente al destino
            dspOutput.disconnect();
            dspOutput.connect(destination);

            this.filtersConnected = false;

            console.log('[AudioManager] ✓ Filtros desconectados (Bypass)');
        } catch (error) {
            console.error('[AudioManager] Error al desconectar filtros:', error);
        }
    }

    /**
     * ⭐ NUEVO: Obtener entorno actual
     */
    public getCurrentEnvironment(): 'studio' | 'car' | 'phone' | 'laptop' {
        return this.currentEnvironment;
    }

    /**
     * ⭐ NUEVO: Activar/Desactivar Spatial Audio (3D Mode)
     */
    public toggleSpatialAudio(enable: boolean): boolean {
        if (!this.audioContext || !this.dspEngine) {
            console.warn('[AudioManager] AudioContext no disponible para 3D Audio');
            return false;
        }

        try {
            if (enable && !this.spatialAudioEnabled) {
                // Crear PannerNode
                this.pannerNode = this.audioContext.createPanner();
                
                // ⭐ CRÍTICO: HRTF es la clave para audio binaural
                this.pannerNode.panningModel = 'HRTF';
                this.pannerNode.distanceModel = 'inverse';
                this.pannerNode.refDistance = 1;
                this.pannerNode.maxDistance = 10000;
                this.pannerNode.rolloffFactor = 1;
                this.pannerNode.coneInnerAngle = 360;
                this.pannerNode.coneOuterAngle = 360;
                this.pannerNode.coneOuterGain = 0;

                // Configurar listener (la cabeza del oyente)
                if (this.audioContext.listener.positionX) {
                    // Usar AudioParam (más moderno)
                    this.audioContext.listener.positionX.setValueAtTime(0, this.audioContext.currentTime);
                    this.audioContext.listener.positionY.setValueAtTime(0, this.audioContext.currentTime);
                    this.audioContext.listener.positionZ.setValueAtTime(0, this.audioContext.currentTime);
                    
                    // Orientación: mirando hacia -Z (frente)
                    this.audioContext.listener.forwardX.setValueAtTime(0, this.audioContext.currentTime);
                    this.audioContext.listener.forwardY.setValueAtTime(0, this.audioContext.currentTime);
                    this.audioContext.listener.forwardZ.setValueAtTime(-1, this.audioContext.currentTime);
                    
                    // Up vector
                    this.audioContext.listener.upX.setValueAtTime(0, this.audioContext.currentTime);
                    this.audioContext.listener.upY.setValueAtTime(1, this.audioContext.currentTime);
                    this.audioContext.listener.upZ.setValueAtTime(0, this.audioContext.currentTime);
                } else {
                    // Fallback para navegadores antiguos
                    this.audioContext.listener.setPosition(0, 0, 0);
                    this.audioContext.listener.setOrientation(0, 0, -1, 0, 1, 0);
                }

                // Posición inicial del sonido (frente, 2 metros)
                this.soundPosition = { x: 0, y: 0, z: -2 };
                this.updateSoundPosition(0, 0, -2);

                // Reconectar cadena de audio
                const dspOutput = this.dspEngine.getOutputNode();
                const destination = this.audioContext.destination;

                if (dspOutput) {
                    // Desconectar cadena normal
                    dspOutput.disconnect();
                    
                    // Conectar: DSP → PannerNode → Destination
                    dspOutput.connect(this.pannerNode);
                    this.pannerNode.connect(destination);
                    
                    this.spatialAudioEnabled = true;
                    console.log('[AudioManager] ✓ 3D Audio activado (HRTF)');
                    return true;
                }
            } else if (!enable && this.spatialAudioEnabled) {
                // Desactivar 3D Audio
                const dspOutput = this.dspEngine.getOutputNode();
                const destination = this.audioContext.destination;

                if (dspOutput && this.pannerNode) {
                    // Desconectar PannerNode
                    this.pannerNode.disconnect();
                    dspOutput.disconnect();
                    
                    // Reconectar directo
                    dspOutput.connect(destination);
                    
                    this.pannerNode = null;
                    this.spatialAudioEnabled = false;
                    console.log('[AudioManager] ✓ 3D Audio desactivado');
                    return true;
                }
            }

            return this.spatialAudioEnabled;
        } catch (error) {
            console.error('[AudioManager] Error al toggle 3D Audio:', error);
            return false;
        }
    }

    /**
     * ⭐ NUEVO: Actualizar posición del sonido en espacio 3D
     */
    public updateSoundPosition(x: number, y: number, z: number): void {
        if (!this.pannerNode || !this.spatialAudioEnabled || !this.audioContext) return;

        this.soundPosition = { x, y, z };

        // Actualizar posición del PannerNode
        if (this.pannerNode.positionX) {
            // Usar AudioParam (más preciso)
            this.pannerNode.positionX.setValueAtTime(x, this.audioContext.currentTime);
            this.pannerNode.positionY.setValueAtTime(y, this.audioContext.currentTime);
            this.pannerNode.positionZ.setValueAtTime(z, this.audioContext.currentTime);
        } else {
            // Fallback
            this.pannerNode.setPosition(x, y, z);
        }
    }

    /**
     * ⭐ NUEVO: Obtener posición actual del sonido
     */
    public getSoundPosition(): { x: number; y: number; z: number } {
        return { ...this.soundPosition };
    }

    /**
     * ⭐ NUEVO: Verificar si 3D Audio está activo
     */
    public isSpatialAudioEnabled(): boolean {
        return this.spatialAudioEnabled;
    }

    /**
     * ⭐ NUEVO: Monitorear volumen en tiempo real
     */
    private startVolumeMonitoring(): void {
        if (!this.analyserNode) return;

        const dataArray = new Uint8Array(this.analyserNode.fftSize);

        const monitor = () => {
            if (!this.analyserNode) return;

            this.analyserNode.getByteTimeDomainData(dataArray);

            // Calcular RMS (Root Mean Square)
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const normalized = (dataArray[i] - 128) / 128;
                sum += normalized * normalized;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            
            // Convertir a dB (aproximado)
            this.currentRMS = rms > 0 ? 20 * Math.log10(rms) : -100;

            // Si Equal Loudness está activo, ajustar ganancia
            if (this.equalLoudnessEnabled && this.currentState === 'playing') {
                this.adjustGainForEqualLoudness();
            }

            requestAnimationFrame(monitor);
        };

        monitor();
    }

    /**
     * ⭐ NUEVO: Ajustar ganancia automáticamente para mantener -14 LUFS
     */
    private adjustGainForEqualLoudness(): void {
        if (!this.gainNode) return;

        // Estimar LUFS basándose en RMS (simplificado)
        const estimatedLUFS = this.currentRMS - 3; // Aproximación

        // Si supera el target, reducir ganancia
        if (estimatedLUFS > this.targetLUFS) {
            const difference = estimatedLUFS - this.targetLUFS;
            const targetGain = Math.max(0.1, 1.0 - (difference / 20)); // No reducir más del 90%

            // Aplicar ganancia con smoothing para evitar clicks
            this.gainNode.gain.setTargetAtTime(
                targetGain,
                this.audioContext?.currentTime || 0,
                0.1 // 100ms de transición suave
            );
        } else {
            // Restaurar ganancia a 100% si está por debajo del target
            this.gainNode.gain.setTargetAtTime(
                1.0,
                this.audioContext?.currentTime || 0,
                0.1
            );
        }
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * PLAY - Carga y reproduce un audio
     * Con FALLBACK automático si URL inválida (Modo Test)
     */
    public async play(url: string, startTime: number = 0): Promise<void> {
        if (!this.audioElement) {
            console.warn('[AudioManager] No disponible en SSR');
            return;
        }

        // ⭐ BYPASS FIREBASE: Si URL inválida, usar fallback automático
        let finalUrl = url;
        
        if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
            console.warn('[AudioManager] ⚠️ URL inválida. Usando FALLBACK:', FALLBACK_AUDIO_URL);
            finalUrl = FALLBACK_AUDIO_URL;
        } else {
            // Validar formato URL
            try {
                new URL(url);
            } catch {
                console.warn('[AudioManager] ⚠️ URL con formato inválido. Usando FALLBACK:', FALLBACK_AUDIO_URL);
                finalUrl = FALLBACK_AUDIO_URL;
            }
        }

        try {
            // Si es diferente URL, forzar recarga completa
            if (this.currentUrl !== finalUrl) {
                console.log('[AudioManager] 🔄 Cargando nueva fuente:', finalUrl.slice(0, 60) + '...');
                
                // ⭐ RE-FORZAR CORS antes de cada carga (por si acaso)
                this.audioElement.crossOrigin = 'anonymous';
                this.audioElement.src = finalUrl;
                this.audioElement.load();
                this.currentUrl = finalUrl;
                
                console.log('[AudioManager] ✓ Fuente cargada correctamente');
            }

            // Saltar al tiempo especificado
            if (startTime > 0) {
                this.audioElement.currentTime = startTime;
                console.log('[AudioManager] ⏩ Saltando a:', startTime, 'segundos');
            }

            // ⭐ CRÍTICO: Asegurar que AudioContext esté en estado 'running'
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('[AudioManager] 🔊 AudioContext resumido (medidores activados)');
            }

            // Reproducir (con manejo de autoplay bloqueado)
            await this.audioElement.play();
            console.log('[AudioManager] ▶ Reproduciendo');
        } catch (error: any) {
            // ⭐ MANEJO ROBUSTO: Silenciar AbortError, manejar NotSupportedError sin romper
            if (error.name === 'AbortError') {
                // SILENCIAR: Es normal al cambiar rápido de track
                console.warn('[AudioManager] ⚠️ AbortError silenciado (cambio rápido)');
                return; // No lanzar error
            } else if (error.name === 'NotAllowedError') {
                console.warn('[AudioManager] ⚠️ Autoplay bloqueado. Requiere interacción del usuario.');
                throw new Error('AUTOPLAY_BLOQUEADO');
            } else if (error.name === 'NotSupportedError') {
                console.warn('[AudioManager] ⚠️ NotSupportedError. Intentando con FALLBACK...');
                
                // ⭐ RECUPERACIÓN: Intentar con fallback si no lo estábamos usando ya
                if (finalUrl !== FALLBACK_AUDIO_URL) {
                    console.log('[AudioManager] 🔄 Reintentando con audio de prueba...');
                    try {
                        this.audioElement.src = FALLBACK_AUDIO_URL;
                        this.audioElement.load();
                        if (startTime > 0) this.audioElement.currentTime = startTime;
                        await this.audioElement.play();
                        console.log('[AudioManager] ✓ Fallback funcionó');
                        return;
                    } catch (fallbackError) {
                        console.warn('[AudioManager] ⚠️ Ni siquiera el fallback funciona. La app continuará.', fallbackError);
                    }
                }
                // ⭐ NO lanzar error, solo advertir y actualizar estado para que la UI sobreviva
                console.warn('[AudioManager] ⚠️ Formato no soportado. La aplicación continuará funcionando.');
            } else {
                console.warn('[AudioManager] ⚠️ Error al reproducir:', error.name, error.message);
                // ⭐ NO lanzar error, la UI debe sobrevivir
            }
            
            // ⭐ Actualizar estado a stopped para que la UI refleje que no se está reproduciendo
            this.updateState('stopped');
        }
    }

    /**
     * PAUSE - Pausa sin perder la posición
     */
    public pause(): void {
        if (!this.audioElement) return;
        this.audioElement.pause();
        console.log('[AudioManager] || Pausado');
    }

    /**
     * STOP - Detiene y resetea a 0
     */
    public stop(): void {
        if (!this.audioElement) return;
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.currentUrl = null;
        this.updateState('stopped');
        console.log('[AudioManager] ■ Detenido');
    }

    /**
     * SEEK - Salta a un tiempo específico
     */
    public seek(time: number): void {
        if (!this.audioElement) return;
        this.audioElement.currentTime = Math.max(0, time);
    }

    /**
     * GET CURRENT TIME - Lee el tiempo actual
     */
    public getCurrentTime(): number {
        return this.audioElement?.currentTime || 0;
    }

    /**
     * GET DURATION - Lee la duración total
     */
    public getDuration(): number {
        return this.audioElement?.duration || 0;
    }

    /**
     * GET URL ACTUAL
     */
    public getCurrentUrl(): string | null {
        return this.currentUrl;
    }

    /**
     * SET VOLUME - Control de salida (0 a 1)
     */
    public setVolume(volume: number): void {
        const v = Math.min(1, Math.max(0, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = v;
        }
        if (this.audioElement) {
            this.audioElement.volume = v;
        }
    }

    /**
     * GET VOLUME - Devuelve volumen actual (0 a 1)
     */
    public getVolume(): number {
        if (this.gainNode) return this.gainNode.gain.value;
        if (this.audioElement) return this.audioElement.volume;
        return 1;
    }

    /**
     * IS PLAYING - Estado actual
     */
    public isPlaying(): boolean {
        return this.currentState === 'playing';
    }

    /**
     * GET AUDIO ELEMENT - Acceso directo (para WebAudio API)
     */
    public getAudioElement(): HTMLAudioElement | null {
        return this.audioElement;
    }

    /**
     * SUBSCRIBE - Escuchar cambios de estado
     */
    public subscribe(callback: StateCallback): () => void {
        this.stateListeners.add(callback);
        // Retorna función de cleanup
        return () => this.stateListeners.delete(callback);
    }

    /**
     * Actualiza estado y notifica a todos los listeners
     */
    private updateState(newState: AudioState): void {
        this.currentState = newState;
        this.stateListeners.forEach(listener => {
            try {
                listener(newState);
            } catch (error) {
                console.error('[AudioManager] Error en listener:', error);
            }
        });
    }

    /**
     * PLAY SNIPPET - Reproduce un fragmento de 5 segundos
     * Útil para previsualización rápida (Inbox)
     */
    public async playSnippet(url: string, startTime: number, duration: number = 5): Promise<void> {
        // ⚠️ GUARD CLAUSE: Validar URL antes de intentar reproducir
        if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
            console.warn('[AudioManager] ⚠️ playSnippet: URL inválida, abortando');
            throw new Error('URL_INVALIDA');
        }

        console.log('[AudioManager] 🎵 Reproduciendo snippet:', startTime, 's por', duration, 's');
        
        await this.play(url, startTime);
        
        // Auto-stop después de la duración
            setTimeout(() => {
            if (this.isPlaying() && this.getCurrentTime() >= startTime + duration) {
                console.log('[AudioManager] ⏹️ Snippet finalizado');
                this.pause();
            }
        }, duration * 1000);
    }

    /**
     * ⭐ SET AUDIO MODE - Cambiar entre STEREO/MONO/MID/SIDE
     */
    public setAudioMode(mode: AudioMode): void {
        if (!this.dspEngine) {
            console.warn('[AudioManager] DSP Engine no disponible');
            return;
        }

        try {
            console.log('[AudioManager] 🔄 Cambiando modo de audio a:', mode);
            
            if (mode === 'MID' || mode === 'SIDE') {
                // MID y SIDE usan el mismo procesamiento pero diferente output
                this.dspEngine.setMode(mode);
            } else {
                this.dspEngine.setMode(mode);
            }
            
            this.currentMode = mode;
            console.log('[AudioManager] ✓ Modo cambiado a:', mode);
        } catch (error) {
            console.error('[AudioManager] Error al cambiar modo:', error);
        }
    }

    /**
     * GET AUDIO MODE - Obtener modo actual
     */
    public getAudioMode(): AudioMode {
        return this.currentMode;
    }

    /**
     * GET ANALYSIS - Obtener análisis de audio (RMS, Peak, Frecuencias)
     */
    public getAnalysis() {
        if (!this.dspEngine) return null;
        return this.dspEngine.getAnalysis();
    }

    /**
     * GET DSP ENGINE - Acceso directo para análisis avanzado
     */
    public getDSPEngine(): AudioDSP | null {
        return this.dspEngine;
    }

    /**
     * ⭐ NUEVO: EQUAL LOUDNESS - Toggle
     */
    public toggleEqualLoudness(): boolean {
        this.equalLoudnessEnabled = !this.equalLoudnessEnabled;
        
        if (!this.equalLoudnessEnabled && this.gainNode) {
            // Si se desactiva, restaurar ganancia a 100%
            this.gainNode.gain.setTargetAtTime(
                1.0,
                this.audioContext?.currentTime || 0,
                0.1
            );
        }

        console.log('[AudioManager] 🎚️ Equal Loudness:', this.equalLoudnessEnabled ? 'ON' : 'OFF');
        return this.equalLoudnessEnabled;
    }

    /**
     * ⭐ NUEVO: GET EQUAL LOUDNESS STATUS
     */
    public isEqualLoudnessEnabled(): boolean {
        return this.equalLoudnessEnabled;
    }

    /**
     * ⭐ NUEVO: GET CURRENT RMS (para UI)
     */
    public getCurrentRMS(): number {
        return this.currentRMS;
    }

    /**
     * ⭐ NUEVO: GET CURRENT GAIN (para UI)
     */
    public getCurrentGain(): number {
        return this.gainNode?.gain.value || 1.0;
    }

    /**
     * ⭐ NUEVO: SET TARGET LUFS (personalizable)
     */
    public setTargetLUFS(lufs: number): void {
        this.targetLUFS = lufs;
        console.log('[AudioManager] 🎯 Target LUFS ajustado a:', lufs);
    }

    /**
     * ⭐ NUEVO: GET ANALYSER NODE (para medidores externos)
     */
    public getAnalyserNode(): AnalyserNode | null {
        return this.analyserNode;
    }

    /**
     * ⭐ NUEVO: GET AUDIO CONTEXT (para verificar estado)
     */
    public getAudioContext(): AudioContext | null {
        return this.audioContext;
    }

    /**
     * ⭐ NUEVO: WATERMARK - Activar marca de agua dinámica
     * Inyecta un tono suave cada 45 segundos si isPaid=false
     */
    public enableWatermark(enable: boolean = true): void {
        if (!this.audioContext || !this.gainNode) {
            console.warn('[AudioManager] AudioContext no disponible para watermark');
            return;
        }

        this.watermarkEnabled = enable;

        if (enable) {
            console.log('[AudioManager] 🔒 Watermark activado (cada 45s)');
            this.startWatermarkTimer();
        } else {
            console.log('[AudioManager] 🔓 Watermark desactivado');
            this.stopWatermarkTimer();
        }
    }

    /**
     * Iniciar timer para inyectar watermark periódicamente
     */
    private startWatermarkTimer(): void {
        // Limpiar timer anterior si existe
        this.stopWatermarkTimer();

        // Inyectar watermark cada 45 segundos
        this.watermarkInterval = window.setInterval(() => {
            if (this.currentState === 'playing') {
                this.injectWatermark();
            }
        }, this.watermarkIntervalTime);

        console.log('[AudioManager] ⏱️ Timer de watermark iniciado');
    }

    /**
     * Detener timer de watermark
     */
    private stopWatermarkTimer(): void {
        if (this.watermarkInterval) {
            clearInterval(this.watermarkInterval);
            this.watermarkInterval = null;
        }
    }

    /**
     * Inyectar watermark (beep sutil) en tiempo real
     */
    private injectWatermark(): void {
        if (!this.audioContext || !this.gainNode) return;

        try {
            console.log('[AudioManager] 🔊 Inyectando watermark...');

            // Crear oscilador (tono de 1kHz, 200ms de duración)
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 1000; // 1kHz (audible pero no molesto)

            // Crear ganancia para el watermark (muy bajo)
            const watermarkGain = this.audioContext.createGain();
            watermarkGain.gain.value = 0.08; // 8% de volumen (sutil pero audible)

            // Conectar: Oscillator → Gain → Destination
            osc.connect(watermarkGain);
            watermarkGain.connect(this.audioContext.destination);

            // Reproducir por 200ms
            const now = this.audioContext.currentTime;
            osc.start(now);
            osc.stop(now + 0.2); // 200ms

            // Fade in/out para evitar clicks
            watermarkGain.gain.setValueAtTime(0, now);
            watermarkGain.gain.linearRampToValueAtTime(0.08, now + 0.05); // 50ms fade in
            watermarkGain.gain.linearRampToValueAtTime(0, now + 0.2); // 150ms fade out

            // Cleanup después de reproducir
            osc.onended = () => {
                osc.disconnect();
                watermarkGain.disconnect();
            };

            console.log('[AudioManager] ✓ Watermark inyectado');
        } catch (error) {
            console.error('[AudioManager] Error al inyectar watermark:', error);
        }
    }

    /**
     * ⭐ NUEVO: IS WATERMARK ENABLED
     */
    public isWatermarkEnabled(): boolean {
        return this.watermarkEnabled;
    }

    /**
     * ⭐ NUEVO: Capturar metadatos de audio cuando se carga
     */
    private captureAudioMetadata(): void {
        try {
            // Detectar formato desde la URL
            let format = 'UNKNOWN';
            let bitDepth = null;
            
            if (this.currentUrl) {
                const url = this.currentUrl.toLowerCase();
                if (url.includes('.wav') || url.includes('wav')) {
                    format = 'WAV';
                    bitDepth = '16/24-bit'; // Asumimos Hi-Res
                } else if (url.includes('.flac')) {
                    format = 'FLAC';
                    bitDepth = '16/24-bit';
                } else if (url.includes('.mp3')) {
                    format = 'MP3';
                    bitDepth = '320kbps';
                } else if (url.includes('.m4a') || url.includes('.aac')) {
                    format = 'AAC';
                    bitDepth = '256kbps';
                } else if (url.includes('.ogg')) {
                    format = 'OGG';
                } else {
                    // Intentar detectar desde MIME type si está disponible
                    format = 'AUDIO';
                }
            }

            // Capturar info del AudioContext (si está disponible)
            if (this.audioContext) {
                this.audioMetadata = {
                    sampleRate: this.audioContext.sampleRate,
                    channelCount: this.audioContext.destination.channelCount || 2,
                    format: format,
                    bitDepth: bitDepth,
                };
            } else {
                // Fallback sin AudioContext
                this.audioMetadata = {
                    sampleRate: 48000, // Asumimos 48kHz estándar
                    channelCount: 2, // Asumimos estéreo
                    format: format,
                    bitDepth: bitDepth,
                };
            }

            console.log('[AudioManager] 📊 Metadatos capturados:', this.audioMetadata);
        } catch (error) {
            console.error('[AudioManager] Error al capturar metadatos:', error);
        }
    }

    /**
     * ⭐ NUEVO: Obtener metadatos de audio para mostrar en UI
     */
    public getAudioMetadata() {
        return {
            ...this.audioMetadata,
            isHiRes: (this.audioMetadata.sampleRate || 0) > 48000,
            channelLabel: this.audioMetadata.channelCount === 1 ? 'Mono' : 
                          this.audioMetadata.channelCount === 2 ? 'Stereo' : 
                          `${this.audioMetadata.channelCount}CH`,
        };
    }
}



// Exportar instancia única (Singleton)
export const audioManager = AudioManager.getInstance();

// Helper para React Hooks
export const useAudioState = (callback: StateCallback) => {
    if (typeof window !== 'undefined') {
        const unsubscribe = audioManager.subscribe(callback);
        return unsubscribe;
    }
    return () => {};
};
