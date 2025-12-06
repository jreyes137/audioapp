# 🎧 Features para Ingenieros de Audio

> Documentación de herramientas profesionales implementadas

---

## 📊 Table of Contents

1. [Environment Simulator (Car Test)](#environment-simulator)
2. [Auto-Tagging (BPM Detection)](#auto-tagging)
3. [Audio Quality Monitor](#audio-quality-monitor)
4. [Equal Loudness](#equal-loudness)
5. [Mid/Side Processing](#midside-processing)
6. [Phase Correlation Meter](#phase-correlation)

---

## 🚗 Environment Simulator (Car Test)

### Descripción
Simula cómo sonará tu mezcla en diferentes dispositivos de consumo sin necesidad de exportar.

### Cómo usar
1. Carga un archivo de audio en el reproductor
2. En la **AudioToolbar**, busca los botones de entorno:
   - 🎧 **Studio** (Bypass - sin simulación)
   - 🚗 **Car** (Estéreo de coche)
   - 📱 **Phone** (Speaker de celular)
   - 💻 **Laptop** (Speakers de laptop)
3. Click en cualquier botón para activar la simulación
4. ⚠️ Aparecerá un aviso amarillo recordándote que la simulación está activa

### Perfiles de simulación

#### 🚗 Coche (V-Shape)
Simula la curva de "sonrisa" típica de los estéreos de coche:
- **Bajos**: +8dB @ 80Hz (boost agresivo)
- **Medios**: -6dB @ 300Hz (corta "mud")
- **Agudos**: +6dB @ 10kHz (brillos)

**Uso**: Verifica que tu mezcla no suene "chillona" en el coche.

#### 📱 Celular (Speaker Pequeño)
Simula un speaker pequeño sin capacidad de bajos:
- **HighPass**: 400Hz (elimina TODO el bajo)
- **LowPass**: 10kHz (recorta aire)

**Uso**: Asegúrate de que la vocal y los elementos principales se escuchen claros incluso sin bajos.

#### 💻 Laptop (Resonancia Plástica)
Simula los speakers plásticos de una laptop:
- **HighPass**: 200Hz (recorte suave de bajos)
- **Peak**: +5dB @ 2kHz (resonancia molesta)

**Uso**: Detecta problemas de harsh en medios-altos que se amplifican en laptops.

### ⚠️ Importante
- **Siempre** vuelve a 🎧 Studio antes de exportar
- El aviso amarillo te recordará desactivar la simulación
- Los filtros NO afectan el archivo original, solo la escucha en tiempo real

---

## 🎵 Auto-Tagging (BPM Detection)

### Descripción
Detecta automáticamente el tempo (BPM) de cualquier archivo de audio que cargues.

### Cómo funciona
1. Arrastra un archivo al reproductor
2. El análisis BPM se ejecuta automáticamente en background
3. En 1-3 segundos, verás el BPM en el **Monitor de Calidad** de la AudioToolbar

### Ejemplo de visualización
```
WAV • 48kHz • Stereo • 124 BPM
```

### Tecnología
- **100% Web Audio API** (sin dependencias externas)
- **Algoritmo**: Onset detection + Clustering de intervalos
- **Precisión**: ±2-3 BPM
- **Rango**: 60-200 BPM con auto-ajuste (halftime/doubletime)

### Beneficios
- ❌ **Antes**: Abrir DAW → Importar → Analizar → 2-3 minutos
- ✅ **Ahora**: BPM visible en 1-3 segundos (automático)

---

## 📊 Audio Quality Monitor

### Descripción
Chip técnico en la AudioToolbar que muestra las especificaciones del audio en tiempo real.

### Información mostrada
- **Formato**: WAV, MP3, AAC, FLAC, OGG
- **Sample Rate**: 44.1kHz, 48kHz, 96kHz, etc.
- **Canales**: Mono, Stereo, 5.1CH
- **BPM**: Tempo detectado automáticamente
- **HQ Badge**: Aparece si el sample rate > 48kHz

### Ejemplo
```
WAV • 96kHz • Stereo • 128 BPM [HQ]
🎵 Tempo: 128 BPM
```

---

## ⚖️ Equal Loudness

### Descripción
Normaliza el volumen de reproducción a -14 LUFS (estándar de streaming) para comparar mezclas a igual volumen percibido.

### Cómo usar
1. Click en el botón **EQUAL** en la AudioToolbar
2. El sistema ajusta automáticamente el gain para alcanzar -14 LUFS
3. El porcentaje de gain se muestra en el botón (ej: "95%")

### ¿Por qué es útil?
- **Problema**: Una mezcla más fuerte siempre suena "mejor" al oído
- **Solución**: Equal Loudness permite comparar mezclas de forma justa
- **Estándar**: -14 LUFS es el objetivo de Spotify, Apple Music, YouTube

---

## 🎛️ Mid/Side Processing

### Descripción
Escucha selectivamente el centro (MID) o los lados (SIDE) de una mezcla stereo.

### Controles
- **OFF** (📻): Stereo normal (L+R)
- **MID** (◉): Solo el centro (L+R)
- **SIDE** (◎): Solo los lados (L-R)

### Uso práctico
- **MID**: Verifica que la vocal esté centrada y clara
- **SIDE**: Detecta bleeding de reverb/delay, width artificial

---

## 📐 Phase Correlation Meter

### Descripción
Muestra la correlación de fase entre el canal izquierdo y derecho.

### Escala
- **+1.00**: Perfectamente en fase (mono)
- **0.00**: Decorrelación total (stereo amplio)
- **-1.00**: Completamente fuera de fase (problemático en mono)

### Interpretación
- ✅ **> +0.80**: "✓ In Phase" (seguro para mono)
- ⚠️ **< -0.30**: "⚠ Out of Phase" (problemas potenciales)
- ≈ **0.00 - 0.80**: "≈ Stereo" (imagen stereo saludable)

### ⚠️ Advertencia
Si el medidor está constantemente en rojo (< -0.30), tu mezcla sonará débil o desaparecerá en sistemas mono (clubes, algunos altavoces Bluetooth).

---

## 🎯 Workflow Recomendado

### 1. Carga inicial
```
Arrastrar archivo → Monitor muestra: WAV • 48kHz • 124 BPM
```

### 2. Escucha crítica
```
🎧 Studio → Referencia plana
📐 Phase Correlation → Verificar que está > 0.3
🎛️ MID → Verificar claridad de vocal
🎛️ SIDE → Verificar width y reverb
```

### 3. Validación de traducción
```
🚗 Car → ¿Se escuchan los bajos?
📱 Phone → ¿Se entiende la vocal?
💻 Laptop → ¿Hay harsh en 2kHz?
```

### 4. Comparación A/B
```
⚖️ Equal Loudness ON → Comparar con referencia a igual volumen
```

### 5. Export
```
🎧 Volver a Studio (sin simulación)
✅ Exportar
```

---

## 🔬 Detalles Técnicos

### Cadena de Audio
```
Source → DSP.Gain → Analyser → [Environment Filters*] → Destination

* Solo cuando env !== 'studio'
```

### BPM Detection Algorithm
```
1. Mezcla L+R → Mono
2. LowPass Filter (aislar kick)
3. Detectar picos (onset detection)
4. Calcular intervalos entre picos
5. Clustering (encontrar intervalo más común)
6. Convertir a BPM (60 / intervalo)
7. Validar rango + auto-ajuste
```

---

## 📱 Soporte de Navegadores

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Environment Simulator | ✅ | ✅ | ✅ | ✅ |
| BPM Detection | ✅ | ✅ | ⚠️* | ✅ |
| Phase Meter | ✅ | ✅ | ✅ | ✅ |
| Equal Loudness | ✅ | ✅ | ✅ | ✅ |

*Safari iOS puede requerir interacción del usuario para Web Audio API

---

## 🚀 Roadmap Futuro

### Próximas Features
- [ ] **Key Detection** (Tonalidad automática: Cm, F#M, etc.)
- [ ] **Más perfiles de entornos** (AirPods, Bluetooth Speaker, Club PA)
- [ ] **Cache de análisis** (BPM guardado en localStorage)
- [ ] **Export de metadatos** (JSON con BPM, Key, LUFS)
- [ ] **True Peak Limiter** (prevenir clipping digital)
- [ ] **Loudness History** (gráfica de LUFS en timeline)

---

## 💡 Tips Pro

### Mixing
1. **Usa MID mode** para asegurar que la vocal corte bien
2. **Usa SIDE mode** para detectar reverb/delay excesivo
3. **Car Test** frecuentemente - es donde la mayoría escuchará tu música

### Mastering
1. **Equal Loudness ON** para todas las comparaciones A/B
2. **Phase Meter** debe estar verde (> 0.3) en todo momento
3. **Laptop Test** detecta problemas de harsh antes que monitores caros

### Pre-Export Checklist
- [ ] Phase Meter verde
- [ ] Car Test suena balanceado
- [ ] Phone Test vocal clara
- [ ] Laptop Test sin harsh
- [ ] Equal Loudness vs referencia
- [ ] **Desactivar** Environment Simulator (🎧 Studio)

---

**Autor**: Audio-App Team  
**Versión**: 2.0  
**Última actualización**: Diciembre 2025

