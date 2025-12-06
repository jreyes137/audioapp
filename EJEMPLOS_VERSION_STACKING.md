# 📚 EJEMPLOS DE VERSION STACKING

## 🎯 GUÍA PRÁCTICA DE USO

---

## 📝 EJEMPLO 1: PROYECTO BÁSICO CON 3 VERSIONES

```typescript
import { Project, Version } from '@/lib/db';

const proyecto: Project = {
    id: 'proj-001',
    title: 'Summer Vibes',
    artist: 'The Waves',
    genre: 'Indie Pop',
    category: 'PORTFOLIO',
    isPublic: true,
    status: 'APPROVED',
    type: 'AUDIO',
    date: '2025-12-05',
    comments: [],
    
    // ⭐ Array de versiones
    versions: [
        {
            id: 'v1',
            name: 'V1.0 - Mix Inicial',
            url: 'https://example.com/summer-v1.mp3',
            date: '2025-12-01T10:00:00Z',
            type: 'Mix',
            notes: 'Primera versión enviada al cliente'
        },
        {
            id: 'v2',
            name: 'V1.1 - Voces Arriba',
            url: 'https://example.com/summer-v2.mp3',
            date: '2025-12-02T14:30:00Z',
            type: 'Revision',
            notes: 'Voces +2dB según feedback'
        },
        {
            id: 'v3',
            name: 'V2.0 - Master Final',
            url: 'https://example.com/summer-v3.mp3',
            date: '2025-12-05T09:15:00Z',
            type: 'Master',
            notes: 'Versión final aprobada por cliente'
        }
    ],
    currentVersionId: 'v3',  // Última versión activa
    
    // Legacy (mantener null para nuevos proyectos)
    mixUrl: null,
    masterUrl: null,
};
```

### Uso en el Player

```tsx
<ActiveProjectPlayer
    versions={proyecto.versions}
    projectTitle={proyecto.title}
    accentColor="#D4AF37"
/>
```

---

## 📝 EJEMPLO 2: SESIÓN DE MASTERING PROFESIONAL

```typescript
const masteringSession: Project = {
    id: 'master-042',
    title: 'Album Track 3 - Mastering',
    artist: 'Band XYZ',
    genre: 'Rock',
    category: 'ORDER',
    isPublic: false,
    status: 'PENDING',
    type: 'AUDIO',
    date: '2025-12-05',
    comments: [],
    price: '250',
    clientName: 'John Producer',
    
    versions: [
        {
            id: 'm1',
            name: 'Master V1 - Referencia',
            url: '/audio/master-v1.flac',
            date: '2025-12-01T08:00:00Z',
            type: 'Master',
            notes: 'Basado en referencia del cliente'
        },
        {
            id: 'm2',
            name: 'Master V2 - Menos Compresión',
            url: '/audio/master-v2.flac',
            date: '2025-12-02T10:00:00Z',
            type: 'Master',
            notes: 'Threshold del limiter: -8dB → -6dB'
        },
        {
            id: 'm3',
            name: 'Master V3 - Más Brillo',
            url: '/audio/master-v3.flac',
            date: '2025-12-03T11:30:00Z',
            type: 'Master',
            notes: 'Shelf +1.5dB en 8kHz'
        },
        {
            id: 'm4',
            name: 'Master V4 - Spotify Optimizado',
            url: '/audio/master-v4-spotify.flac',
            date: '2025-12-04T09:00:00Z',
            type: 'Master',
            notes: '-14 LUFS, True Peak -1dBTP'
        },
        {
            id: 'm5',
            name: 'Master Final - APROBADO',
            url: '/audio/master-final.flac',
            date: '2025-12-05T14:00:00Z',
            type: 'Final',
            notes: 'Cliente aprobó V4'
        }
    ],
    currentVersionId: 'm5',
    
    mixUrl: null,
    masterUrl: null,
};
```

---

## 📝 EJEMPLO 3: FEEDBACK LOOP CON CLIENTE

```typescript
const feedbackProject: Project = {
    id: 'feedback-007',
    title: 'Corporate Jingle',
    artist: 'Brand Inc.',
    genre: 'Commercial',
    category: 'ORDER',
    isPublic: false,
    status: 'NEW_FILES',
    type: 'AUDIO',
    date: '2025-12-05',
    price: '500',
    clientName: 'Marketing Team',
    
    versions: [
        {
            id: 'f1',
            name: 'V1.0 - Primera Propuesta',
            url: '/audio/jingle-v1.mp3',
            date: '2025-11-28T10:00:00Z',
            type: 'Mix',
            notes: 'Enviado para aprobación'
        },
        {
            id: 'f2',
            name: 'V1.1 - Música Más Suave',
            url: '/audio/jingle-v2.mp3',
            date: '2025-11-29T15:00:00Z',
            type: 'Revision',
            notes: 'Cliente: "Música muy alta, bajar -3dB"'
        },
        {
            id: 'f3',
            name: 'V1.2 - Logo Más Claro',
            url: '/audio/jingle-v3.mp3',
            date: '2025-11-30T11:00:00Z',
            type: 'Revision',
            notes: 'Voiceover del logo más presente'
        },
        {
            id: 'f4',
            name: 'V2.0 - APROBADO',
            url: '/audio/jingle-final.mp3',
            date: '2025-12-01T09:00:00Z',
            type: 'Final',
            notes: '✅ Cliente satisfecho'
        }
    ],
    currentVersionId: 'f4',
    
    comments: [
        { text: 'Música muy alta aquí', time: 5.2, date: '2025-11-28', author: 'Cliente' },
        { text: 'Logo perfecto ahora', time: 8.5, date: '2025-11-30', author: 'Cliente' },
    ],
    
    mixUrl: null,
    masterUrl: null,
};
```

---

## 📝 EJEMPLO 4: COMPATIBILIDAD LEGACY

```typescript
// Proyecto antiguo (antes del Version Stacking)
const legacyProject: Project = {
    id: 'old-123',
    title: 'Old Project',
    artist: 'Legacy Artist',
    genre: 'Rock',
    category: 'PORTFOLIO',
    isPublic: true,
    status: 'APPROVED',
    type: 'AUDIO',
    date: '2024-06-15',
    comments: [],
    
    // ⚠️ Formato antiguo
    mixUrl: 'https://example.com/old-mix.mp3',
    masterUrl: 'https://example.com/old-master.mp3',
    
    // Sin versiones
    versions: undefined,
    currentVersionId: undefined,
};

// ✅ El player lo convierte automáticamente a:
// versions: [
//     { id: 'mix-legacy', name: 'Mix', url: mixUrl, type: 'Mix' },
//     { id: 'master-legacy', name: 'Master', url: masterUrl, type: 'Master' }
// ]
```

---

## 🔄 MIGRACIÓN DE PROYECTOS LEGACY

### Script de Migración

```typescript
function migrateProjectToVersions(oldProject: Project): Project {
    // Si ya tiene versiones, no hacer nada
    if (oldProject.versions && oldProject.versions.length > 0) {
        return oldProject;
    }

    const versions: Version[] = [];

    // Convertir mixUrl a versión
    if (oldProject.mixUrl) {
        versions.push({
            id: `${oldProject.id}-mix`,
            name: 'Mix',
            url: oldProject.mixUrl,
            date: oldProject.createdAt?.toDate().toISOString() || new Date().toISOString(),
            type: 'Mix',
        });
    }

    // Convertir masterUrl a versión
    if (oldProject.masterUrl) {
        versions.push({
            id: `${oldProject.id}-master`,
            name: 'Master',
            url: oldProject.masterUrl,
            date: oldProject.createdAt?.toDate().toISOString() || new Date().toISOString(),
            type: 'Master',
        });
    }

    return {
        ...oldProject,
        versions,
        currentVersionId: versions.length > 0 ? versions[versions.length - 1].id : undefined,
    };
}

// Uso
const migratedProject = migrateProjectToVersions(legacyProject);
```

---

## 🎨 PERSONALIZACIÓN DE UI

### Cambiar Estilo del Dropdown

```tsx
// En ActiveProjectPlayer.tsx, modificar el select:
<select
    style={{
        backgroundColor: '#0a0a0a',      // Fondo oscuro
        borderColor: accentColor + '40', // Borde con acento al 40%
        color: accentColor,              // Texto con color de acento
    }}
    className="..."
>
```

### Agregar Íconos por Tipo

```tsx
const getTypeIcon = (type: Version['type']) => {
    switch (type) {
        case 'Mix': return '🎚️';
        case 'Master': return '🎛️';
        case 'Revision': return '🔄';
        case 'Final': return '✅';
        default: return '📁';
    }
};

// En el dropdown
<option>
    {getTypeIcon(version.type)} {version.name}
</option>
```

---

## 📊 ESTADÍSTICAS DE VERSIONES

### Contadores Útiles

```typescript
// Total de versiones
const totalVersions = project.versions?.length || 0;

// Versiones por tipo
const mixCount = project.versions?.filter(v => v.type === 'Mix').length || 0;
const masterCount = project.versions?.filter(v => v.type === 'Master').length || 0;
const revisionCount = project.versions?.filter(v => v.type === 'Revision').length || 0;

// Última actualización
const lastUpdate = project.versions?.length > 0 
    ? new Date(project.versions[project.versions.length - 1].date)
    : null;

// Días desde última actualización
const daysSinceUpdate = lastUpdate 
    ? Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
```

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

### 1. UI para Agregar Versión

```tsx
<button onClick={handleAddVersion}>
    + Agregar Nueva Versión
</button>

// Modal para:
// - Nombre de versión
// - Tipo (Mix/Master/Revision/Final)
// - Upload de archivo
// - Notas opcionales
```

### 2. Timeline de Versiones

```tsx
<div className="version-timeline">
    {versions.map((v, i) => (
        <div key={v.id} className="timeline-item">
            <div className="bullet" />
            <div className="content">
                <h4>{v.name}</h4>
                <p>{v.date}</p>
            </div>
        </div>
    ))}
</div>
```

### 3. Comparador de Versiones

```tsx
// Permitir seleccionar 2 versiones y alternar rápidamente
<VersionComparator 
    versionA={versions[0]}
    versionB={versions[2]}
/>
```

### 4. Export/Download de Todas las Versiones

```tsx
<button onClick={downloadAllVersions}>
    📦 Descargar Todas las Versiones (ZIP)
</button>
```

---

## ✅ TESTING EXHAUSTIVO

### Checklist de QA

```bash
# Crear proyecto con versiones
□ Crear proyecto con 1 versión
□ Crear proyecto con 5 versiones
□ Crear proyecto con 10+ versiones

# Cambio de versión
□ Cambiar de V1 a V2 mientras está pausado
□ Cambiar de V1 a V2 mientras está reproduciendo
□ Verificar que mantiene el tiempo (ej: 1:23)
□ Verificar que mantiene el estado (playing/paused)

# UI
□ Dropdown muestra todas las versiones
□ Versión seleccionada tiene estilo diferente
□ Hover effect funciona
□ Color de acento se aplica correctamente
□ Título del proyecto visible
□ Fecha de versión visible
□ Notas de versión visibles

# Compatibilidad
□ Proyecto legacy (mixUrl/masterUrl) funciona
□ Proyecto nuevo (versions) funciona
□ Proyecto sin audio muestra fallback

# Edge Cases
□ Proyecto con 0 versiones
□ Proyecto con 1 versión (dropdown no muestra cambio)
□ Versión con URL inválida
□ Versión sin notas
□ Versión sin tipo
```

---

## 💡 MEJORES PRÁCTICAS

### Nomenclatura de Versiones

**✅ Buena:**
- "V1.0 - Mix Inicial"
- "V1.1 - Feedback Cliente (Voces +2dB)"
- "V2.0 - Master Spotify (-14 LUFS)"
- "Rev 3 - Ajuste de EQ"
- "Final Master - Aprobado 05/12"

**❌ Mala:**
- "audio_final_v2_FINAL.mp3"
- "master"
- "version2"
- "nuevo"

### Tipos de Versiones

| Tipo | Cuándo Usar |
|------|-------------|
| **Mix** | Primera versión de mezcla |
| **Revision** | Ajustes menores durante iteración |
| **Master** | Versión masterizada |
| **Final** | Versión aprobada y entregada |

### Organización

```typescript
// Orden cronológico (más viejo → más nuevo)
versions: [
    { name: 'V1.0 - ...', date: '2025-12-01' },  // Primera
    { name: 'V1.1 - ...', date: '2025-12-02' },  // Revisión
    { name: 'V2.0 - ...', date: '2025-12-05' },  // Última (seleccionada por defecto)
]
```

---

## 🔧 SNIPPETS ÚTILES

### Agregar Versión a Proyecto Existente

```typescript
async function addNewVersion(
    projectId: string,
    file: File,
    name: string,
    type: Version['type'],
    notes?: string
) {
    // 1. Subir archivo
    const url = await uploadFileToCloud(file, 'tracks');
    if (!url) throw new Error('Upload failed');

    // 2. Crear objeto Version
    const newVersion: Version = {
        id: `v-${Date.now()}`,
        name,
        url,
        date: new Date().toISOString(),
        type,
        notes,
    };

    // 3. Actualizar proyecto en DB
    const project = await getProjectFromDB(projectId);
    const updatedVersions = [...(project.versions || []), newVersion];

    await updateProjectInDB(projectId, {
        versions: updatedVersions,
        currentVersionId: newVersion.id,
    });

    console.log('✓ Nueva versión agregada:', name);
    return newVersion;
}
```

### Eliminar Versión

```typescript
async function deleteVersion(projectId: string, versionId: string) {
    const project = await getProjectFromDB(projectId);
    if (!project.versions) return;

    // Filtrar versión
    const updatedVersions = project.versions.filter(v => v.id !== versionId);

    // Si la versión eliminada era la actual, cambiar a la última
    const newCurrentId = project.currentVersionId === versionId
        ? updatedVersions[updatedVersions.length - 1]?.id
        : project.currentVersionId;

    await updateProjectInDB(projectId, {
        versions: updatedVersions,
        currentVersionId: newCurrentId,
    });

    console.log('✓ Versión eliminada:', versionId);
}
```

### Renombrar Versión

```typescript
async function renameVersion(
    projectId: string,
    versionId: string,
    newName: string
) {
    const project = await getProjectFromDB(projectId);
    if (!project.versions) return;

    const updatedVersions = project.versions.map(v =>
        v.id === versionId ? { ...v, name: newName } : v
    );

    await updateProjectInDB(projectId, {
        versions: updatedVersions,
    });

    console.log('✓ Versión renombrada:', newName);
}
```

---

## 📱 INTEGRACIÓN EN DASHBOARD

### Mostrar Total de Versiones

```tsx
{project.versions && project.versions.length > 0 && (
    <span className="text-xs text-white/40">
        {project.versions.length} versiones
    </span>
)}
```

### Botón "Ver Historial"

```tsx
<button onClick={() => setShowVersionHistory(true)}>
    📋 Ver Historial de Versiones
</button>

{showVersionHistory && (
    <div className="version-history">
        {project.versions?.map((v) => (
            <div key={v.id} className="version-item">
                <h4>{v.name}</h4>
                <p>{v.type} • {new Date(v.date).toLocaleDateString()}</p>
                {v.notes && <p className="notes">{v.notes}</p>}
            </div>
        ))}
    </div>
)}
```

---

## ✅ CONCLUSIÓN

**Version Stacking** transforma tu plataforma en un sistema profesional de gestión de audio donde:

- ✅ Cada proyecto tiene **historial completo**
- ✅ Cambio entre versiones **sin fricción**
- ✅ Metadatos ricos (nombre, tipo, fecha, notas)
- ✅ **Compatibilidad legacy** preservada
- ✅ **Escalable** a proyectos complejos

**Próximo paso:** Probar con proyectos reales de 5-10 versiones 🗂️✨

---

**Creado:** Diciembre 5, 2025  
**Tipo:** Guía de Ejemplos  
**Categoría:** Version Stacking  

🗂️📋🔄

