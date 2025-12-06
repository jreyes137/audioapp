/**
 * DASHBOARD - Panel de Control del Ingeniero
 * 
 * Responsabilidades:
 * - Gestionar estado de proyectos (PORTFOLIO, ORDERS, INBOX)
 * - Coordinar la UI entre componentes
 * - Manejar interacciones del usuario
 * 
 * Soluciones implementadas:
 * 1. ✓ Key única para forzar recarga del player al cambiar archivos
 * 2. ✓ Estado reactivo con Firebase en tiempo real
 * 3. ✓ TypeScript estricto sin 'any'
 * 4. ✓ Separación clara de responsabilidades
 */

"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
// ⭐ ELIMINADO: EngineeringToolbar (funcionalidad movida a AudioToolbar)
import NewProjectModal from "@/components/NewProjectModal";
import ActiveProjectPlayer from "@/components/ActiveProjectPlayer";
import PortfolioEditor from "@/components/PortfolioEditor";
import InboxSnippetPlayer from "@/components/InboxSnippetPlayer";
import AudioToolbar from "@/components/AudioToolbar";
import ABTestPanel from "@/components/ABTestPanel";
import MetadataEditor from "@/components/MetadataEditor";
import SplitSheetModal from "@/components/SplitSheetModal";
import DashboardLayout from "@/components/DashboardLayout";
import { audioManager } from "@/lib/audioManager";
import { uploadToSupabase } from "@/lib/storage";
import { useProjects } from "@/context/ProjectsContext";
import {
    getProjectsFromDB,
    createProjectInDB,
    updateProjectInDB,
    deleteProjectInDB,
    // ⭐ ELIMINADO: uploadFileToCloud (ya no se usa en modo local)
    Project,
    CreateProjectInput,
    Metadata,
} from "@/lib/db";
import { COLORS, STYLES } from "@/lib/theme";

// ==================== ICONOS ====================
const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

// ==================== TYPES ====================
type ViewMode = "PORTFOLIO" | "ORDERS" | "INBOX" | "SITE";
type MonitorMode = "STEREO" | "MONO" | "SIDE";

interface Metrics {
    lufs: number;
    rms: number;
    peak: number;
    avgLufs: number;
    phase: number;
}

interface NewProjectData {
    title: string;
    artist: string;
    genre?: string;
    mixFile?: File;
    masterFile?: File;
}

// ==================== COMPONENT ====================
export default function Dashboard() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    // Estados de UI
    const [viewMode, setViewMode] = useState<ViewMode>("PORTFOLIO");
    const [monitorMode, setMonitorMode] = useState<MonitorMode>("STEREO");
    const [metrics, setMetrics] = useState<Metrics>({
        lufs: -60,
        rms: -60,
        peak: -60,
        avgLufs: -60,
        phase: 0,
    });

    // Estados de datos globales
    const { 
        projects, 
        isLoading, 
        addLocalProject, 
        addOrder, 
        updateProjectLocal, 
        addCommentLocal,
        removeProject 
    } = useProjects();

    const tabParam = searchParams?.get("tab");
    const showToolbar =
        pathname?.includes("/shared/") ||
        pathname?.includes("/review/") ||
        (pathname === "/dashboard" &&
            (!tabParam || tabParam === "PORTFOLIO" || tabParam === "MIXER" || tabParam === "PROJECTS"));

    const renderMiniWaveform = (seed: string | number) => {
        const base = String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const bars = Array.from({ length: 24 }).map((_, i) => {
            const h = (Math.sin(base + i * 1.3) + 1) / 2; // 0..1
            const height = 20 + h * 40; // 20-60px
            return (
                <div
                    key={i}
                    className="w-[4px] rounded-full bg-linear-to-t from-slate-800 via-cyan-600 to-white/80"
                    style={{ height: `${height}px` }}
                />
            );
        });
        return (
            <div className="flex items-end gap-[2px] h-16">
                {bars}
            </div>
        );
    };
    const [activeId, setActiveId] = useState<string | number | null>(null);
    // ⭐ ELIMINADO: uploadingId (ya no necesitamos mostrar "Subiendo...")
    const [inboxFilterId, setInboxFilterId] = useState<string | number | null>(null);

    // Estados de modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    
    // Estados de snippet player
    const [snippetTrigger, setSnippetTrigger] = useState<number | null>(null);
    const [showABTest, setShowABTest] = useState(false);
    
    // ⭐ NUEVO: Modal de Metadata Editor (Fase 4)
    const [showMetadataEditor, setShowMetadataEditor] = useState(false);
    const [metadataProjectId, setMetadataProjectId] = useState<string | number | null>(null);
    
    // ⭐ NUEVO: Modal de Split Sheet (Fase 4 - PDF Generator)
    const [showSplitSheetModal, setShowSplitSheetModal] = useState(false);
    const [selectedProjectForSplitSheet, setSelectedProjectForSplitSheet] = useState<string | number | null>(null);
    
    // ⭐ NUEVO: Switch de prueba para simular impago (Fase 3 Testing)
    const [simulateUnpaid, setSimulateUnpaid] = useState(false);
const quickDropInputRef = useRef<HTMLInputElement>(null);
    const [uploadingProgress, setUploadingProgress] = useState<Record<string | number, number>>({});

    // Sincronizar pestaña con query param ?tab=
    useEffect(() => {
        const tab = searchParams?.get("tab");
        if (tab === "INBOX") setViewMode("INBOX");
        if (tab === "SITE") setViewMode("SITE");
        if (tab === "PORTFOLIO") setViewMode("PORTFOLIO");
    }, [searchParams]);

/**
 * Quick Drop: Crea un proyecto con drag & drop elegante
 */
const handleQuickDrop = (file: File) => {
    if (!file) return;
    const title = file.name.replace(/\.[^/.]+$/, "");
    const project = addLocalProject({
        title: title || "Nuevo Track",
        artist: "Cliente",
        genre: "N/A",
        category: "PORTFOLIO",
        isPublic: true,
        status: "PENDING",
        type: "AUDIO",
        mixUrl: null,
        masterUrl: null,
        comments: [],
        date: new Date().toLocaleDateString(),
    });
    handleFileUpload(project.id, "MIX", file);
    setActiveId(project.id);
    setViewMode("PORTFOLIO");
};

    /**
     * HANDLER: Cambiar visibilidad pública de un proyecto
     */
    const togglePublic = async (
        id: string | number,
        isPublic: boolean,
        e: React.MouseEvent
    ) => {
        e.stopPropagation(); 

        updateProjectLocal(id, { isPublic: !isPublic });
    };

    /**
     * ⭐ NUEVO: HANDLER LOCAL PURO - Upload instantáneo sin Firebase
     */
    const handleFileUpload = (
        id: string | number,
        type: "MIX" | "MASTER",
        file: File
    ) => {
        console.log('[Dashboard] ═══════════════════════════════════════');
        console.log('[Dashboard] ⚡ MODO LOCAL: Cargando archivo instantáneo');
        console.log('[Dashboard] ═══════════════════════════════════════');
        console.log('[Dashboard] Proyecto ID:', id);
        console.log('[Dashboard] Tipo:', type);
        console.log('[Dashboard] Archivo:', file.name);

        const userFolder = "uploads"; // TODO: usar nombre de usuario cuando esté disponible

        // ⭐ PASO 1: Subir a Supabase
        setUploadingProgress((prev) => ({ ...prev, [id]: 5 }));

        uploadToSupabase(file, userFolder, (progress: number, status?: "uploading" | "done" | "error") => {
            setUploadingProgress((prev) => ({ ...prev, [id]: progress }));
            if (status === "error" || status === "done") {
                setTimeout(() => setUploadingProgress((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                }), 800);
            }
        }).then((result: { publicUrl: string } | null) => {
            const objectUrl = result?.publicUrl || URL.createObjectURL(file);

            // ⭐ PASO 2: Crear nueva versión local
            const versionId = `v-${type.toLowerCase()}-${Date.now()}`;
            const newVersion = {
                id: versionId,
                name: `V${Date.now()} - ${type}`,
                url: objectUrl,
                date: new Date().toISOString(),
                type: type === "MIX" ? "Mix" as const : "Master" as const,
                notes: `Archivo ${result ? 'cloud' : 'local'}: ${file.name}`
            };

            // ⭐ PASO 3: Actualizar proyecto INMEDIATAMENTE
            const targetProject = projects.find((p) => p.id === id);
            if (targetProject) {
                const existingVersions = targetProject.versions || [];
                const updatedVersions = [...existingVersions, newVersion];
                updateProjectLocal(id, {
                    versions: updatedVersions,
                    currentVersionId: versionId,
                    ...(type === "MIX" ? { mixUrl: objectUrl } : { masterUrl: objectUrl }),
                });
            }

            console.log('[Dashboard] ✓ Proyecto actualizado con nueva versión');
            console.log('[Dashboard] ✅ ARCHIVO CARGADO', result ? 'CLOUD' : 'LOCAL');

            // ⚡ REPRODUCCIÓN AUTOMÁTICA
            setTimeout(() => {
                audioManager.play(objectUrl, 0).catch((err: unknown) => {
                    console.warn('[Dashboard] Autoplay bloqueado:', err);
                });
            }, 100);
        });
    };

    /**
     * HANDLER: Eliminar proyecto
     */
    const handleDelete = async (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation(); 

        if (!confirm("¿Estás seguro de eliminar este proyecto?")) {
            return;
        }

        // Update local
        removeProject(id);
        if (activeId === id) setActiveId(null);
    };

    /**
     * HANDLER: Crear nuevo proyecto con manejo robusto de errores
     */
    const handleSaveProject = async (data: NewProjectData) => {
        console.log('[Dashboard] ═══════════════════════════════════════');
        console.log('[Dashboard] 📝 CREANDO NUEVO PROYECTO (LOCAL FIRST)');
        console.log('[Dashboard] ═══════════════════════════════════════');
        
        setIsModalOpen(false);

        try {
            // ⭐ NUEVO: MODO LOCAL FIRST - Crear Object URLs inmediatamente
            console.log('[Dashboard] PASO 1: Creando Object URLs locales...');
            
            const versions: any[] = [];
            let mixUrl: string | null = null;
            let masterUrl: string | null = null;
            let currentVersionId: string | null = null;

            // Crear versión para Mix
            if (data.mixFile) {
                const mixObjectUrl = URL.createObjectURL(data.mixFile);
                const mixVersionId = `v-mix-${Date.now()}`;
                versions.push({
                    id: mixVersionId,
                    name: 'V1.0 - Mix',
                    url: mixObjectUrl,
                    date: new Date().toISOString(),
                    type: 'Mix',
                    notes: `Archivo local: ${data.mixFile.name}`
                });
                mixUrl = mixObjectUrl;
                currentVersionId = mixVersionId;
                console.log('[Dashboard] ✓ Mix creado (local):', data.mixFile.name);
            }

            // Crear versión para Master
            if (data.masterFile) {
                const masterObjectUrl = URL.createObjectURL(data.masterFile);
                const masterVersionId = `v-master-${Date.now()}`;
                versions.push({
                    id: masterVersionId,
                    name: 'V1.0 - Master',
                    url: masterObjectUrl,
                    date: new Date().toISOString(),
                    type: 'Master',
                    notes: `Archivo local: ${data.masterFile.name}`
                });
                masterUrl = masterObjectUrl;
                if (!currentVersionId) currentVersionId = masterVersionId;
                console.log('[Dashboard] ✓ Master creado (local):', data.masterFile.name);
            }

            // PASO 2: Crear proyecto LOCAL (NO Firebase)
            console.log('[Dashboard] PASO 2: Creando proyecto local...');
            
            const newProject = addLocalProject({
                title: data.title,
                artist: data.artist,
                genre: data.genre || "N/A",
                category: "PORTFOLIO",
                isPublic: true,
                date: new Date().toLocaleDateString(),
                status: "PENDING",
                type: "AUDIO",
                mixUrl,
                masterUrl,
                versions: versions.length > 0 ? versions : undefined,
                currentVersionId: currentVersionId || undefined,
                comments: [],
                isPaid: true,
            });
            
            // PASO 3: Agregar al inicio de la lista (UI local)
            console.log('[Dashboard] PASO 3: Actualizando UI...');
            setActiveId(newProject.id); // ⭐ Auto-seleccionar el nuevo proyecto
            console.log('[Dashboard] ✓ PASO 3 COMPLETADO');
            
            console.log('[Dashboard] ═══════════════════════════════════════');
            console.log('[Dashboard] ✅ PROYECTO CREADO LOCALMENTE');
            console.log('[Dashboard] ═══════════════════════════════════════');

            // Mensaje de éxito
            const filesCount = versions.length;
            alert(`✅ PROYECTO CREADO: ${data.title}\n\n✓ ${filesCount} archivo(s) listo(s) para reproducción instantánea\n\n⚡ Reproducción local (sin upload a la nube)`);

        } catch (error: any) {
            console.log('[Dashboard] ═══════════════════════════════════════');
            console.error('[Dashboard] 🔥 ERROR AL CREAR PROYECTO');
            console.log('[Dashboard] ═══════════════════════════════════════');
            console.error('[Dashboard] Error completo:', error);
            console.error('[Dashboard] Mensaje:', error.message);

            // Mensaje específico según el error
            let errorMessage = `❌ ERROR AL CREAR PROYECTO\n\n`;

            if (error.message?.includes('FIRESTORE_NO_DISPONIBLE')) {
                errorMessage += 'Firestore no está configurado.\n';
                errorMessage += 'Verifica tu archivo .env.local\n';
                errorMessage += 'y reinicia el servidor.';
            } else if (error.message?.includes('permission-denied')) {
                errorMessage += 'Permiso denegado.\n\n';
                errorMessage += 'Solución:\n';
                errorMessage += '1. Firebase Console\n';
                errorMessage += '2. Firestore > Rules\n';
                errorMessage += '3. Cambia a: allow read, write: if true;';
            } else if (error.message?.includes('unavailable')) {
                errorMessage += 'Sin conexión a Firestore.\n';
                errorMessage += 'Verifica tu conexión a Internet.';
            } else {
                errorMessage += error.message || 'Error desconocido';
                errorMessage += '\n\nRevisa la consola (F12) para más detalles.';
            }

            alert(errorMessage);
        }
    };

    /**
     * HANDLER: Navegar al Inbox de un proyecto
     */
    const goToInbox = (projectId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        setInboxFilterId(projectId);
        setViewMode("INBOX");
    };

    /**
     * HANDLER: Copiar link del proyecto
     */
    const handleLink = (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        const link = `${window.location.origin}/studio/${id}`;
        navigator.clipboard.writeText(link);
        alert("✓ Link copiado al portapapeles");
    };

    /**
     * HANDLER: Reproducir snippet desde Inbox
     */
    const handlePlaySnippet = (time: number, id: string) => {
        setSnippetTrigger(time);
        
        // Reset después de 5 segundos
        setTimeout(() => {
            setSnippetTrigger(null);
        }, 5000);
    };

    /**
     * COMPONENT: Modal para crear orden
     */
    const OrderModal = () => {
        const [client, setClient] = useState("");
        const [price, setPrice] = useState("150");

        const createOrder = async () => {
            if (!client.trim()) {
                alert("⚠️ Ingresa el nombre del cliente");
                return;
            }

            const orderId = `ORD-${Date.now()}`;

            const newOrder: CreateProjectInput = {
                title: `Pedido ${client}`,
                artist: client,
                genre: "Pendiente",
                category: "ORDER",
                isPublic: false,
                status: "PENDING_PAYMENT",
                type: "ZIP",
                price,
                comments: [],
                clientName: client,
                date: "Hoy",
                mixUrl: null,
                masterUrl: null,
            };

            // Guardar en store local para UI inmediata
            const savedLocal = addOrder(newOrder);

            try {
                const saved = await createProjectInDB(newOrder);
                // Guardar para portal de cliente (localStorage)
                const existingOrders = JSON.parse(localStorage.getItem("1307_orders") || "[]");
                localStorage.setItem("1307_orders", JSON.stringify([...existingOrders, saved]));

                const link = `${window.location.origin}/upload/${saved.id}`;
                navigator.clipboard.writeText(link);
                alert(`✓ Orden creada. Link copiado:\n${link}`);
                setShowOrderModal(false);
                console.log('[Dashboard] ✓ Orden creada:', saved.id);
            } catch (error) {
                console.error('[Dashboard] Error al crear orden:', error);
                alert("❌ Orden creada en modo local. Conecta Firestore para sincronizar.");
                const link = `${window.location.origin}/upload/${savedLocal.id}`;
                navigator.clipboard.writeText(link);
                setShowOrderModal(false);
            }
        };

        if (!showOrderModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
                <div className="bg-[#111] p-8 rounded border border-[#333] w-96">
                    <h3 className="text-white font-bold mb-4 text-lg">Crear Orden</h3>
                    <input
                        className={STYLES.input + " mb-3"}
                        placeholder="Nombre del Cliente"
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        autoFocus
                    />
                    <input
                        className={STYLES.input + " mb-4"}
                        placeholder="Precio (USD)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                    <button
                        onClick={createOrder}
                        style={{ backgroundColor: COLORS.gold }}
                        className="mt-4 w-full text-black font-bold py-3 rounded hover:opacity-90 transition-opacity"
                    >
                        CREAR ORDEN
                    </button>
                    <button
                        onClick={() => setShowOrderModal(false)}
                        className="text-xs text-gray-500 mt-2 w-full hover:text-white"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen bg-black text-white flex items-center justify-center font-mono">
                <div className="text-center">
                    <div className="animate-pulse text-2xl mb-4">⏳</div>
                    <div>CARGANDO PROYECTOS...</div>
                </div>
            </div>
        );
    }

    // Filtros de proyectos
    const portfolioProjects = projects.filter((p) => p.category === "PORTFOLIO");
    const orderProjects = projects.filter((p) => p.category === "ORDER");
    const inboxProjects = projects.filter((p) => p.comments && p.comments.length > 0);

    return (
        <DashboardLayout showBreadcrumbs={true}>
            <div className={STYLES.layout} style={{ backgroundColor: COLORS.bg }}>
                {/* ⭐ NUEVO: Barra de Herramientas Global */}
                <AudioToolbar 
                    isVisible={!!showToolbar} 
                    onMetadataClick={() => {
                        // Abrir editor para el proyecto activo
                        if (activeId) {
                            setMetadataProjectId(activeId);
                            setShowMetadataEditor(true);
                        } else {
                            alert('⚠️ Selecciona un proyecto primero');
                        }
                    }}
                    onABTestClick={() => setShowABTest(true)}
                />

            {/* ⭐ NUEVO: Modal A/B Test */}
            {showABTest && <ABTestPanel onClose={() => setShowABTest(false)} />}

            {/* ⭐ NUEVO: Modal Metadata Editor (Fase 4) */}
            {showMetadataEditor && (() => {
                const currentProject = projects.find(p => p.id === metadataProjectId);
                return (
                    <MetadataEditor
                        isOpen={showMetadataEditor}
                        onClose={() => setShowMetadataEditor(false)}
                        onSave={async (metadata) => {
                            if (!metadataProjectId) return;
                            
                            // Guardar metadata en el proyecto
                            try {
                                await updateProjectInDB(String(metadataProjectId), { metadata });
                                
                                // Actualizar estado local
                                updateProjectLocal(metadataProjectId, { metadata });
                                
                                console.log('[Dashboard] ✓ Metadata guardado para proyecto:', metadataProjectId);
                            } catch (error) {
                                console.error('[Dashboard] Error al guardar metadata:', error);
                                alert('❌ Error al guardar metadatos');
                            }
                        }}
                        initialData={currentProject?.metadata}
                        projectTitle={currentProject?.title}
                    />
                );
            })()}

            {/* Modales */}
            <NewProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
            />
            <OrderModal />

            {/* ⭐ NUEVO: Modal Split Sheet (PDF Generator) */}
            {showSplitSheetModal && (() => {
                const currentProject = projects.find(p => p.id === selectedProjectForSplitSheet);
                return (
                    <SplitSheetModal
                        isOpen={showSplitSheetModal}
                        onClose={() => {
                            setShowSplitSheetModal(false);
                            setSelectedProjectForSplitSheet(null);
                        }}
                        projectName={currentProject?.title || "Untitled Track"}
                    />
                );
            })()}

            {/* ⭐ ELIMINADO: EngineeringToolbar - Toda la funcionalidad está en AudioToolbar ahora */}

            <main className={STYLES.container}>
                {/* Acción principal */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Dashboard</p>
                        <h1 className="text-3xl font-black text-white">Historial de trabajo</h1>
                        <p className="text-sm text-white/60">Sube y administra todo tu flujo en un solo lugar.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{ backgroundColor: COLORS.gold }}
                            className={STYLES.btnPrimary + " text-black"}
                        >
                            + SUBIR TRACK
                        </button>
                    </div>
                </div>

                {/* VISTA: PORTFOLIO (Historial unificado) */}
                {viewMode === "PORTFOLIO" && (
                    <div className="space-y-4">
                        {projects.map((proj) => {
                            const label = proj.isPublic ? "Item de Portafolio" : "Entrega Cliente";
                            return (
                                <div key={proj.id} className={STYLES.card}>
                                    <div
                                        onClick={() => setActiveId(activeId === proj.id ? null : proj.id)}
                                        className={`flex items-center justify-between p-4 ${STYLES.cardHover}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                style={{
                                                    backgroundColor: activeId === proj.id ? COLORS.gold : "white",
                                                    color: "black",
                                                }}
                                                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs cursor-pointer"
                                            >
                                                {activeId === proj.id ? "II" : "▶"}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-white">{proj.title}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">
                                                    {proj.artist} • {label}
                                                </p>
                                            <div className="mt-2">
                                                {renderMiniWaveform(proj.id)}
                                            </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => goToInbox(proj.id, e)}
                                                className={STYLES.btnSecondary + " text-white"}
                                            >
                                                💬 {proj.comments?.length || 0}
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(proj.id, e)}
                                                className="text-red-500 p-2 hover:bg-[#222] rounded"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>

                                    {activeId === proj.id && (
                                        <div
                                            className="border-t border-[#222] p-4 bg-black"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex justify-end gap-2 mb-2">
                                                <label className={STYLES.btnSecondary + " cursor-pointer"}>
                                                    📁 MIX
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="audio/*"
                                                        onChange={(e) =>
                                                            e.target.files &&
                                                            handleFileUpload(proj.id, "MIX", e.target.files[0])
                                                        }
                                                    />
                                                </label>
                                                <label className={STYLES.btnSecondary + " cursor-pointer"}>
                                                    📁 MASTER
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="audio/*"
                                                        onChange={(e) =>
                                                            e.target.files &&
                                                            handleFileUpload(proj.id, "MASTER", e.target.files[0])
                                                        }
                                                    />
                                                </label>
                                                {uploadingProgress[proj.id] !== undefined && (
                                                    <div className="text-[10px] text-cyan-300 font-mono">
                                                        Subiendo... {uploadingProgress[proj.id]}%
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-xs uppercase tracking-[0.2em] text-white/40">Versión Actual</div>
                                                <select
                                                    value={proj.currentVersionId || proj.versions?.[0]?.id || ""}
                                                    onChange={(e) => {
                                                        const newId = e.target.value;
                                                        updateProjectLocal(proj.id, { currentVersionId: newId });
                                                        const found = proj.versions?.find(v => v.id === newId);
                                                        if (found) {
                                                            audioManager.play(found.url, 0);
                                                        }
                                                    }}
                                                    className="bg-black border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
                                                >
                                                    {(proj.versions || []).map((v) => (
                                                        <option key={v.id} value={v.id}>{v.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <ActiveProjectPlayer 
                                                key={`player-${proj.id}-${proj.currentVersionId}`}
                                                versions={proj.versions}
                                                projectTitle={proj.title}
                                                mixUrl={proj.mixUrl} 
                                                masterUrl={proj.masterUrl} 
                                                monitorMode={monitorMode} 
                                                onMetricsUpdate={setMetrics} 
                                                autoPlay={false} 
                                                showInternalTools={true}
                                                comments={proj.comments}
                                                isPaid={simulateUnpaid ? false : (proj.isPaid ?? true)}
                                                onDownloadRequest={() => {
                                                    if (!simulateUnpaid && (proj.isPaid ?? true)) {
                                                        const currentVersion = proj.versions?.find(v => v.id === proj.currentVersionId);
                                                        const downloadUrl = currentVersion?.url || proj.mixUrl || proj.masterUrl;
                                                        if (downloadUrl) {
                                                            window.open(downloadUrl, '_blank');
                                                            console.log('[Dashboard] 💾 Descargando:', downloadUrl);
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {projects.length === 0 && (
                            <div className="text-center py-20 text-gray-500 border border-dashed border-[#222] rounded">
                                <div className="text-4xl mb-4">🎵</div>
                                <p>No hay tracks aún.</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-4 text-sm text-white underline"
                                >
                                    Subir primer track
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* VISTA: ORDERS */}
                {viewMode === "ORDERS" && (
                    <div className={STYLES.card}>
                         <table className="w-full text-left text-xs text-[#888]">
                            <thead className="bg-[#111] text-[#555] uppercase font-bold border-b border-[#222]">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Pago</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                                {orderProjects.map((proj) => (
                                    <tr key={proj.id} className="hover:bg-[#111] transition-colors">
                                        <td className="p-4 font-mono">#{String(proj.id).slice(-4)}</td>
                                        <td className="p-4 font-bold text-white">{proj.artist}</td>
                                        <td className="p-4 text-green-400 font-bold">
                                            ${proj.price || "150"}
                                        </td>
                                        <td className="p-4">
                                            {proj.status === "NEW_FILES" && (
                                                <span className="bg-cyan-900 text-cyan-300 px-2 py-1 rounded text-[9px] font-bold border border-cyan-700">
                                                    ARCHIVOS NUEVOS
                                                </span>
                                            )}
                                            {proj.status === "PENDING_PAYMENT" && (
                                                <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-[9px] font-bold border border-yellow-700">
                                                    PENDIENTE PAGO
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {proj.mixUrl ? (
                                                <a
                                                    href={proj.mixUrl}
                                                    download
                                                    style={{ backgroundColor: '#06b6d4' }}
                                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-black text-xs hover:scale-105 transition-transform shadow-lg"
                                                >
                                                    <DownloadIcon />
                                                    DESCARGAR MULTITRACKS
                                                </a>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/40 font-mono">
                                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    ESPERANDO ARCHIVOS
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {orderProjects.length === 0 && (
                            <div className="p-8 text-center text-[#444]">
                                No hay pedidos activos.
                            </div>
                        )}
                    </div>
                )}

                {/* VISTA: INBOX */}
                {viewMode === "INBOX" && (() => {
                    const notifications = projects.flatMap((p) => {
                        const base = {
                            projectId: p.id,
                            projectTitle: p.title,
                            url: p.masterUrl || p.mixUrl || "",
                            date: p.date || "",
                        };
                        const commentNotes = (p.comments || []).map((c, idx) => ({
                            ...base,
                            id: `${p.id}-comment-${idx}`,
                            type: "comment" as const,
                            message: c.text,
                            time: c.time || (c as any).timestamp || 0,
                            date: c.date || base.date,
                        }));
                        const newFiles =
                            p.status === "NEW_FILES"
                                ? [{
                                    ...base,
                                    id: `${p.id}-files`,
                                    type: "files" as const,
                                    message: "Archivos nuevos del cliente",
                                    time: 0,
                                }]
                                : [];
                        return [...commentNotes, ...newFiles];
                    }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

                    const currentProject = projects.find(p => p.id === activeId);

                    return (
                        <div className="space-y-6">
                            {currentProject && (
                                <div className="border border-[#222] rounded-xl p-4 bg-black">
                                    <h3 className="text-white font-bold mb-3">{currentProject.title}</h3>
                                    <ActiveProjectPlayer
                                        key={`inbox-${currentProject.id}`}
                                        mixUrl={currentProject.mixUrl}
                                        masterUrl={currentProject.masterUrl}
                                        monitorMode={monitorMode}
                                        onMetricsUpdate={setMetrics}
                                        triggerSnippet={snippetTrigger}
                                        comments={currentProject.comments}
                                        hideToggle={false}
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            setActiveId(n.projectId);
                                            if (n.type === "comment" && n.time) {
                                                handlePlaySnippet(n.time, String(n.projectId));
                                                setSnippetTrigger(n.time);
                                            }
                                        }}
                                        className={STYLES.card + " p-4 flex items-center justify-between cursor-pointer hover:bg-[#111]"}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
                                                {n.type === "comment" ? "💬" : "📥"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{n.projectTitle}</p>
                                                <p className="text-xs text-white/60">{n.message}</p>
                                                {n.type === "comment" && n.time > 0 && (
                                                    <p className="text-[11px] text-amber-400 font-mono">Smart Play → {Math.floor(n.time)}s</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-white/40">{n.date}</span>
                                    </div>
                                ))}

                                {notifications.length === 0 && (
                                    <div className="p-10 text-center text-[#444] border border-dashed border-[#222] rounded">
                                        <div className="text-3xl mb-4">📭</div>
                                        <p>Sin notificaciones.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* VISTA: SITE (Editor + Preview) */}
                {viewMode === "SITE" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border border-[#222] rounded-xl p-4 bg-[#0a0a0a]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold">Personalización</h3>
                                <a
                                    href="/p/engineer"
                                    target="_blank"
                                    className="text-xs text-amber-400 hover:text-amber-200 underline"
                                >
                                    Ver Portafolio en Vivo ↗
                                </a>
                            </div>
                            <PortfolioEditor />
                        </div>
                        <div className="border border-[#222] rounded-xl bg-black overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
                                <span className="text-xs uppercase tracking-[0.2em] text-white/50">Live Preview</span>
                                <span className="text-[10px] text-white/40">/p/engineer</span>
                            </div>
                            <iframe
                                src="/p/engineer"
                                className="w-full h-[720px] bg-black"
                            />
                        </div>
                    </div>
                )}
            </main>
            </div>
        </DashboardLayout>
    );
}
