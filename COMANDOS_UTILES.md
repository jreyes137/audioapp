# 🛠️ COMANDOS ÚTILES - AUDIO APP

## 🚀 DESARROLLO

### Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre: http://localhost:3000

### Build de producción
```bash
npm run build
npm run start
```

### Verificar TypeScript
```bash
npx tsc --noEmit
```

### Linter
```bash
npm run lint
```

---

## 🔍 DEBUG

### Ver logs del audioManager
Abre la consola del navegador (F12) y filtra por:
```
[AudioManager]
```

### Ver logs del player
```
[Player]
```

### Ver logs de Firebase
```
[DB]
```

### Ver logs del dashboard
```
[Dashboard]
```

---

## 🧹 LIMPIEZA

### Limpiar caché de Next.js
```bash
rm -rf .next
npm run build
```

### Reinstalar dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

### Limpiar build y cache
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

---

## 🔥 FIREBASE

### Login a Firebase
```bash
npm install -g firebase-tools
firebase login
```

### Ver proyectos
```bash
firebase projects:list
```

### Deploy Firebase Functions (si las usas)
```bash
firebase deploy --only functions
```

### Ver logs de Firebase
```bash
firebase functions:log
```

---

## 📦 DEPENDENCIES

### Agregar nueva dependencia
```bash
npm install nombre-paquete
```

### Agregar dependencia de desarrollo
```bash
npm install -D nombre-paquete
```

### Actualizar dependencias
```bash
npm update
```

### Ver dependencias obsoletas
```bash
npm outdated
```

---

## 🐛 TROUBLESHOOTING

### Si el audioManager no funciona:
```javascript
// En la consola del navegador:
window.audioManager = require('@/lib/audioManager').audioManager;
audioManager.play('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 0);
```

### Si Firebase no conecta:
```bash
# Verificar variables de entorno
cat .env.local | grep FIREBASE
```

### Si hay errores de tipos:
```bash
# Regenerar tipos de Next.js
rm -rf .next
npm run dev
```

---

## 📊 ANÁLISIS

### Ver tamaño del bundle
```bash
npm run build
# Busca: "First Load JS shared by all"
```

### Analizar bundle (si tienes @next/bundle-analyzer)
```bash
npm install @next/bundle-analyzer
ANALYZE=true npm run build
```

---

## 🔐 SEGURIDAD

### Auditar dependencias
```bash
npm audit
```

### Arreglar vulnerabilidades automáticamente
```bash
npm audit fix
```

### Arreglar vulnerabilidades (forzado)
```bash
npm audit fix --force
```

---

## 🌐 DEPLOYMENT

### Vercel (recomendado)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Docker (si usas contenedores)
```bash
docker build -t audio-app .
docker run -p 3000:3000 audio-app
```

---

## 🎨 UI/UX

### Ver componentes en desarrollo
1. Crea `/src/app/playground/page.tsx`
2. Importa el componente que quieres probar
3. Navega a `http://localhost:3000/playground`

### Ejemplo de playground:
```tsx
"use client";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";

export default function Playground() {
    return (
        <div className="p-8 bg-black min-h-screen">
            <ActiveProjectPlayer
                mixUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                masterUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            />
        </div>
    );
}
```

---

## 📱 TESTING EN DISPOSITIVOS

### Exponer servidor local a la red
```bash
# Obtén tu IP local
ipconfig getifaddr en0  # Mac
# O
hostname -I  # Linux
# O
ipconfig  # Windows (busca IPv4)

# Luego accede desde tu móvil:
# http://TU_IP:3000
```

### Usar ngrok para testing externo
```bash
npm install -g ngrok
ngrok http 3000
# Te da una URL pública temporal
```

---

## 🗄️ BASE DE DATOS

### Exportar datos de Firestore
```bash
firebase firestore:export gs://[TU_BUCKET]/backups
```

### Importar datos a Firestore
```bash
firebase firestore:import gs://[TU_BUCKET]/backups
```

### Limpiar colección (desarrollo)
```javascript
// En la consola de Firebase o en código:
const deleteCollection = async () => {
    const snapshot = await getDocs(collection(db, 'projects'));
    snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });
};
```

---

## 🎯 QUICK FIXES

### Error: "Cannot find module"
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Error: "Port 3000 already in use"
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Error: "Firebase 'DEFAULT' already exists"
```bash
# Verifica src/lib/firebase.ts
# Debe tener el patrón Singleton:
const app = !getApps().length ? initializeApp(config) : getApp();
```

### Error: "CORS blocked"
```bash
# Agrega en Firebase Storage > CORS config:
gsutil cors set cors.json gs://[TU_BUCKET]

# cors.json:
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 📚 RECURSOS

### Documentación oficial:
- Next.js: https://nextjs.org/docs
- Firebase: https://firebase.google.com/docs
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

### Herramientas útiles:
- Firebase Console: https://console.firebase.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- Chrome DevTools: F12

---

## 💡 TIPS

### Desarrollo rápido:
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Watch de TypeScript
npx tsc --watch --noEmit

# Terminal 3: Logs de Firebase (si usas emulators)
firebase emulators:start
```

### Hot reload de componentes:
- Guarda el archivo (Cmd+S / Ctrl+S)
- El navegador se actualiza automáticamente
- Si no funciona, refresca manualmente (Cmd+R / Ctrl+R)

### Debug de React:
```bash
# Instalar React DevTools en Chrome:
# https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
```

---

**Última actualización:** 5 Dic 2025

