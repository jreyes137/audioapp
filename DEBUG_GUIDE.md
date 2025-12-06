# 🔍 GUÍA DE DEBUGGING - ERRORES DE SUBIDA Y REPRODUCCIÓN

## 🚨 PROBLEMA: NotSupportedError en audioManager

### Causa
El `audioManager` intenta cargar una URL vacía, nula o inválida.

### Solución Implementada
✅ **Guard Clauses** en `audioManager.play()`:
- Valida que la URL no sea vacía/null
- Valida formato de URL
- Lanza error específico con mensaje claro

### Cómo Verificarlo

Abre la consola del navegador (F12) y busca:

```
[AudioManager] ⚠️ URL inválida o vacía. No se puede reproducir: null
```

O:

```
[AudioManager] ⚠️ URL con formato inválido: undefined
```

### Posibles Causas
1. **La subida falló** → URL quedó como `null`
2. **Firebase no está configurado** → No se obtuvo URL
3. **Error de red durante subida** → Upload incompleto

---

## 🚨 PROBLEMA: Firebase Storage - "Subiendo..." pero nada pasa

### Diagnóstico Paso a Paso

#### 1. Verificar Variables de Entorno

En la consola del navegador, ejecuta:

```javascript
console.log({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(0, 10) + '...',
    bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
});
```

**Resultado esperado:**
```javascript
{
    apiKey: "AIzaSyBXXX...",
    bucket: "tu-proyecto.appspot.com"
}
```

**Si ves `undefined`:**
- ❌ Falta crear `.env.local` en la raíz del proyecto
- ❌ O las variables no tienen el prefijo `NEXT_PUBLIC_`

**Solución:**
```bash
# Crear .env.local
cat > .env.local << EOF
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
EOF

# Reiniciar servidor
npm run dev
```

---

#### 2. Verificar Configuración Firebase

En la consola del navegador, ejecuta:

```javascript
import { verifyFirebaseConfig } from '@/lib/db';
verifyFirebaseConfig();
```

**Resultado esperado:**
```
[DB] ═══════════════════════════════════════
[DB] 🔍 VERIFICANDO CONFIGURACIÓN FIREBASE
[DB] ═══════════════════════════════════════
[DB] ✓ Firebase Storage: OK
[DB] ✓ Firestore: OK
[DB] ✓ NEXT_PUBLIC_FIREBASE_API_KEY: Presente
...
[DB] ✅ CONFIGURACIÓN VÁLIDA
```

**Si ves errores:**
- Sigue las instrucciones en la consola
- Verifica que `.env.local` existe
- Reinicia el servidor después de crear `.env.local`

---

#### 3. Verificar Reglas de Firebase Storage

**Ve a Firebase Console:**
1. https://console.firebase.google.com
2. Selecciona tu proyecto
3. **Storage** (menú izquierdo)
4. Pestaña **Rules**

**Reglas correctas para desarrollo:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;  // ⚠️ Solo para desarrollo
    }
  }
}
```

**Reglas correctas para producción:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tracks/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;  // Solo usuarios autenticados
    }
  }
}
```

**Después de cambiar las reglas:**
- Click en **Publish**
- Espera 30 segundos
- Intenta subir de nuevo

---

#### 4. Verificar Reglas de Firestore

**Ve a Firebase Console:**
1. https://console.firebase.google.com
2. Selecciona tu proyecto
3. **Firestore Database** (menú izquierdo)
4. Pestaña **Rules**

**Reglas correctas para desarrollo:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ Solo para desarrollo
    }
  }
}
```

**Reglas correctas para producción:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🔍 LOGGING DETALLADO

### Subida de Archivo

Cuando subes un archivo, deberías ver en la consola:

```
[DB] ═══════════════════════════════════════
[DB] 🚀 INICIO DE SUBIDA A FIREBASE STORAGE
[DB] ═══════════════════════════════════════
[DB] PASO 1: Validando archivo...
[DB] ✓ Archivo recibido: {nombre: "audio.mp3", tamaño: "5.23 MB", tipo: "audio/mpeg"}
[DB] ✓ Tipo de archivo válido
[DB] PASO 2: Verificando conexión Firebase...
[DB] ✓ Firebase Storage inicializado
[DB] PASO 3: Creando referencia en Storage...
[DB] Ruta destino: tracks/1733425678901-audio.mp3
[DB] ✓ Referencia creada
[DB] PASO 4: Preparando metadata...
[DB] ✓ Metadata preparada
[DB] PASO 5: Subiendo archivo a Firebase Storage...
[DB] ⏳ Esto puede tardar unos segundos...
[DB] ✓✓✓ ARCHIVO SUBIDO EXITOSAMENTE ✓✓✓
[DB] Tiempo de subida: 2.34s
[DB] PASO 6: Obteniendo URL pública...
[DB] ✓✓✓ URL OBTENIDA EXITOSAMENTE ✓✓✓
[DB] URL completa: https://firebasestorage.googleapis.com/v0/b/...
[DB] ✅ SUBIDA COMPLETADA CON ÉXITO
```

### Si la Subida Falla

Verás algo como:

```
[DB] 🔥🔥🔥 ERROR DURANTE LA SUBIDA 🔥🔥🔥
[DB] Código: storage/unauthorized
[DB] 🔐 ERROR DE PERMISOS: Revisa las reglas de Firebase Storage
```

**Código de Error** | **Causa** | **Solución**
---|---|---
`storage/unauthorized` | Reglas de Storage demasiado restrictivas | Ve a Firebase Console > Storage > Rules > Cambia a `allow read, write: if true;`
`storage/retry-limit-exceeded` | Sin conexión a Internet o CORS bloqueado | Verifica tu conexión. Si persiste, configura CORS en Google Cloud
`storage/unknown` | Firebase no configurado correctamente | Verifica `.env.local` y reinicia el servidor
`permission-denied` (Firestore) | Reglas de Firestore restrictivas | Ve a Firebase Console > Firestore > Rules > Cambia a `allow read, write: if true;`

---

## 🎵 REPRODUCCIÓN DE AUDIO

### Flujo Correcto

```
1. Usuario sube archivo
   ↓
2. uploadFileToCloud() → URL
   ↓
3. updateProjectInDB(id, {mixUrl: URL})
   ↓
4. Dashboard actualiza estado local
   ↓
5. ActiveProjectPlayer recibe nueva prop
   ↓
6. useEffect detecta cambio en activeSrc
   ↓
7. audioManager.play(activeSrc)
   ↓
8. Guard Clause: Valida URL
   ↓
9. Si URL válida → Audio suena
   ↓
10. Si URL inválida → Error claro en consola
```

### Logs Esperados en audioManager

**Al reproducir:**
```
[AudioManager] 🔄 Cargando nueva fuente: https://firebasestorage.googleapis.com...
[AudioManager] ✓ Fuente cargada correctamente
[AudioManager] ▶ Reproduciendo
```

**Si URL inválida:**
```
[AudioManager] ⚠️ URL inválida o vacía. No se puede reproducir: null
```

**Si formato no soportado:**
```
[AudioManager] 🔥 NotSupportedError: El formato de audio no es compatible
[AudioManager] URL problemática: http://example.com/invalid.xyz
```

---

## 🛠️ COMANDOS DE DEBUGGING

### En la Consola del Navegador (F12)

```javascript
// 1. Verificar Firebase
import { verifyFirebaseConfig } from '@/lib/db';
verifyFirebaseConfig();

// 2. Probar subida manual
const input = document.createElement('input');
input.type = 'file';
input.onchange = async (e) => {
    const file = e.target.files[0];
    const { uploadFileToCloud } = await import('@/lib/db');
    const url = await uploadFileToCloud(file, 'tracks');
    console.log('URL obtenida:', url);
};
input.click();

// 3. Probar reproducción manual
import { audioManager } from '@/lib/audioManager';
await audioManager.play('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 0);

// 4. Ver estado del audioManager
console.log({
    isPlaying: audioManager.isPlaying(),
    currentTime: audioManager.getCurrentTime(),
    duration: audioManager.getDuration()
});
```

---

## 🚀 CHECKLIST DE RESOLUCIÓN

Si tienes problemas, sigue este checklist en orden:

- [ ] **1. Variables de entorno**
  - [ ] Existe `.env.local` en la raíz
  - [ ] Todas las variables tienen prefijo `NEXT_PUBLIC_`
  - [ ] Servidor reiniciado después de crear `.env.local`

- [ ] **2. Configuración Firebase**
  - [ ] `verifyFirebaseConfig()` retorna ✅
  - [ ] No hay errores en la consola al cargar la página

- [ ] **3. Reglas de Firebase**
  - [ ] Storage Rules: `allow read, write: if true;`
  - [ ] Firestore Rules: `allow read, write: if true;`
  - [ ] Reglas publicadas (botón "Publish")

- [ ] **4. Conexión a Internet**
  - [ ] Ping a `firebasestorage.googleapis.com` funciona
  - [ ] No hay firewall bloqueando Firebase

- [ ] **5. Formato de archivo**
  - [ ] Archivo es `.mp3`, `.wav`, o `.flac`
  - [ ] Archivo < 500MB
  - [ ] Archivo no está corrupto

- [ ] **6. Consola del navegador**
  - [ ] No hay errores rojos
  - [ ] Logs de `[DB]` muestran ✓✓✓
  - [ ] Logs de `[AudioManager]` muestran ▶

---

## 📞 ÚLTIMO RECURSO

Si nada funciona, ejecuta esto en la terminal:

```bash
# Limpiar todo y empezar de cero
rm -rf .next node_modules
npm install
npm run dev
```

Y en la consola del navegador:

```javascript
// Limpiar localStorage
localStorage.clear();

// Recargar (hard refresh)
location.reload(true);
```

---

## ✅ CAMBIOS IMPLEMENTADOS

### audioManager.ts
- ✅ Guard Clauses para URLs vacías/inválidas
- ✅ Validación de formato de URL
- ✅ Manejo robusto de errores (NotSupportedError, NotAllowedError, etc.)
- ✅ Logging detallado en cada paso
- ✅ Mensajes de error específicos

### db.ts
- ✅ Logging ultra detallado en uploadFileToCloud (6 pasos)
- ✅ Validación de Firebase Storage antes de subir
- ✅ Verificación de URL obtenida
- ✅ Mensajes de error específicos por código
- ✅ Función verifyFirebaseConfig() para diagnóstico
- ✅ Logging mejorado en createProjectInDB y updateProjectInDB
- ✅ Manejo de errores de permisos con instrucciones claras

---

**Última actualización:** 5 Dic 2025  
**Autor:** Senior Backend Developer (Claude Sonnet 4.5)

