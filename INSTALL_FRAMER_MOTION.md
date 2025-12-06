# 📦 INSTALACIÓN DE FRAMER MOTION

## ⚠️ CRÍTICO

El App Shell requiere **Framer Motion** para las transiciones suaves.

---

## 🔧 INSTALACIÓN

### Opción 1: npm install (Recomendada)
```bash
cd /Users/josafatreyes/audio-app-io
npm install framer-motion
```

### Opción 2: Si hay problemas de permisos
```bash
cd /Users/josafatreyes/audio-app-io
sudo npm install framer-motion
```

### Opción 3: Agregar manualmente a package.json
```json
{
  "dependencies": {
    "framer-motion": "^11.0.0"
  }
}
```

Luego ejecutar:
```bash
npm install
```

---

## ✅ VERIFICAR INSTALACIÓN

```bash
npm list framer-motion
```

**Resultado esperado:**
```
audio-app-io@0.1.0
└── framer-motion@11.x.x
```

---

## 🧪 TESTING POST-INSTALACIÓN

1. **Verificar que el servidor compile:**
   ```bash
   npm run dev
   ```

2. **Verificar en el navegador:**
   ```bash
   # Abrir: http://localhost:3000/dashboard
   ```

3. **Probar transiciones:**
   - Dashboard → Click "📥 Inbox"
   - Verificar fade-in suave (300ms)
   - Verificar desplazamiento Y suave

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'framer-motion'"
**Solución:**
```bash
# Limpiar cache
rm -rf .next node_modules
npm install
npm run dev
```

### Error: "Module not found: ESM vs CommonJS"
**Solución:** Framer Motion 11+ requiere Next.js 13+
```bash
# Verificar versión de Next.js
npm list next
```

Si es < 13, instalar versión compatible:
```bash
npm install framer-motion@10
```

---

## ✅ COMPONENTES QUE USAN FRAMER MOTION

1. **PageTransition.tsx**
   - `motion.div` con animaciones
   - `AnimatePresence` para transiciones entre páginas

2. **DashboardLayout.tsx**
   - Incluye `<PageTransition>` wrapper

3. **dashboard/page.tsx**
   - Envuelto con `<DashboardLayout>`

---

## 🚀 DESPUÉS DE INSTALAR

**Todo debería funcionar automáticamente:**
- ✅ Sidebar visible
- ✅ Breadcrumbs funcionando
- ✅ Transiciones suaves al navegar
- ✅ Sin errores en console

---

**Estado:** ⏳ Instalación pendiente  
**Tiempo estimado:** 1 minuto  
**Comando:** `npm install framer-motion`

