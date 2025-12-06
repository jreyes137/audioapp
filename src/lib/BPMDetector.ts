/**
 * BPM DETECTOR - Análisis de Tempo en Web Audio API
 * 
 * Algoritmo simplificado basado en:
 * - Peak Detection en el espectro de frecuencias bajas (kick drum)
 * - Autocorrelación de picos para encontrar el intervalo más común
 * - Conversión de intervalos a BPM
 * 
 * Sin dependencias externas (solo Web Audio API nativa)
 */

export class BPMDetector {
    private audioContext: AudioContext;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
    }

    /**
     * Analiza un buffer de audio y retorna el BPM estimado
     * @param audioBuffer - Buffer de audio decodificado
     * @returns BPM estimado (o null si no se pudo detectar)
     */
    async detectBPM(audioBuffer: AudioBuffer): Promise<number | null> {
        try {
            console.log('[BPMDetector] 🎵 Iniciando análisis de tempo...');

            // 1. Extraer canal mono (promedio de L+R si es stereo)
            const channelData = this.getMixedChannel(audioBuffer);
            
            // 2. Aplicar filtro pasa-bajos para aislar kick drum (60-120Hz)
            const filteredData = this.applyLowPassFilter(channelData, audioBuffer.sampleRate);
            
            // 3. Detectar picos (onset detection)
            const peaks = this.detectPeaks(filteredData, audioBuffer.sampleRate);
            
            if (peaks.length < 8) {
                console.warn('[BPMDetector] ⚠️ Muy pocos picos detectados:', peaks.length);
                return null;
            }

            // 4. Calcular intervalos entre picos
            const intervals = this.calculateIntervals(peaks);
            
            // 5. Encontrar el intervalo más común (clustering)
            const commonInterval = this.findCommonInterval(intervals);
            
            if (!commonInterval) {
                console.warn('[BPMDetector] ⚠️ No se pudo encontrar un patrón de tempo');
                return null;
            }

            // 6. Convertir intervalo a BPM
            const bpm = Math.round(60 / commonInterval);
            
            // Validar rango razonable (60-200 BPM)
            if (bpm < 60 || bpm > 200) {
                console.warn('[BPMDetector] ⚠️ BPM fuera de rango:', bpm);
                
                // Intentar ajustar (podría ser doble/mitad del tempo real)
                if (bpm > 200) {
                    const adjustedBPM = Math.round(bpm / 2);
                    console.log('[BPMDetector] 🔧 Ajustando BPM (halftime):', adjustedBPM);
                    return adjustedBPM;
                } else if (bpm < 60) {
                    const adjustedBPM = Math.round(bpm * 2);
                    console.log('[BPMDetector] 🔧 Ajustando BPM (doubletime):', adjustedBPM);
                    return adjustedBPM;
                }
                
                return null;
            }

            console.log('[BPMDetector] ✅ BPM detectado:', bpm);
            return bpm;

        } catch (error) {
            console.error('[BPMDetector] ❌ Error al detectar BPM:', error);
            return null;
        }
    }

    /**
     * Mezcla canales stereo en mono
     */
    private getMixedChannel(audioBuffer: AudioBuffer): Float32Array {
        const length = audioBuffer.length;
        const mixed = new Float32Array(length);
        
        if (audioBuffer.numberOfChannels === 1) {
            // Ya es mono
            return audioBuffer.getChannelData(0);
        }
        
        // Mezclar L+R
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            mixed[i] = (left[i] + right[i]) / 2;
        }
        
        return mixed;
    }

    /**
     * Filtro pasa-bajos simple (promedio móvil) para aislar frecuencias bajas
     */
    private applyLowPassFilter(data: Float32Array, sampleRate: number): Float32Array {
        const filtered = new Float32Array(data.length);
        const windowSize = Math.floor(sampleRate / 200); // ~200Hz cutoff
        
        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let count = 0;
            
            for (let j = Math.max(0, i - windowSize); j < Math.min(data.length, i + windowSize); j++) {
                sum += Math.abs(data[j]);
                count++;
            }
            
            filtered[i] = sum / count;
        }
        
        return filtered;
    }

    /**
     * Detecta picos en la señal (onset detection)
     */
    private detectPeaks(data: Float32Array, sampleRate: number): number[] {
        const peaks: number[] = [];
        const minDistance = Math.floor(sampleRate * 0.3); // Mínimo 300ms entre picos (200 BPM máximo)
        
        // Calcular umbral dinámico (70% del valor máximo)
        let maxValue = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i] > maxValue) maxValue = data[i];
        }
        const threshold = maxValue * 0.7;
        
        let lastPeakIndex = -minDistance;
        
        for (let i = 1; i < data.length - 1; i++) {
            // Es un pico local si es mayor que sus vecinos y supera el umbral
            if (data[i] > data[i - 1] && 
                data[i] > data[i + 1] && 
                data[i] > threshold &&
                i - lastPeakIndex >= minDistance) {
                
                peaks.push(i / sampleRate); // Convertir a segundos
                lastPeakIndex = i;
            }
        }
        
        console.log('[BPMDetector] 🎯 Picos detectados:', peaks.length);
        return peaks;
    }

    /**
     * Calcula intervalos entre picos consecutivos
     */
    private calculateIntervals(peaks: number[]): number[] {
        const intervals: number[] = [];
        
        for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i - 1]);
        }
        
        return intervals;
    }

    /**
     * Encuentra el intervalo más común usando clustering simple
     */
    private findCommonInterval(intervals: number[]): number | null {
        if (intervals.length === 0) return null;
        
        // Crear histograma con bins de 0.05 segundos
        const binSize = 0.05;
        const histogram: { [key: number]: number } = {};
        
        intervals.forEach(interval => {
            const bin = Math.round(interval / binSize) * binSize;
            histogram[bin] = (histogram[bin] || 0) + 1;
        });
        
        // Encontrar el bin con más ocurrencias
        let maxCount = 0;
        let mostCommonBin = 0;
        
        for (const [bin, count] of Object.entries(histogram)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonBin = parseFloat(bin);
            }
        }
        
        // Calcular promedio de intervalos cercanos al bin más común
        const similarIntervals = intervals.filter(
            interval => Math.abs(interval - mostCommonBin) < binSize * 2
        );
        
        if (similarIntervals.length === 0) return null;
        
        const averageInterval = similarIntervals.reduce((sum, val) => sum + val, 0) / similarIntervals.length;
        
        return averageInterval;
    }
}

/**
 * Key Detection (Tonalidad) - PLACEHOLDER
 * 
 * Implementar detección de tonalidad requiere análisis espectral más complejo:
 * - FFT para extraer componentes frecuenciales
 * - Chromagram (mapeo a las 12 notas musicales)
 * - Comparación con perfiles de tonalidades mayores/menores (Krumhansl-Schmuckler)
 * 
 * Por ahora, retornamos null. Se puede agregar en el futuro con essentia.js o librería similar.
 */
export class KeyDetector {
    async detectKey(audioBuffer: AudioBuffer): Promise<string | null> {
        // TODO: Implementar detección de tonalidad
        console.log('[KeyDetector] ⚠️ Detección de tonalidad no implementada (requiere análisis espectral)');
        return null;
    }
}

