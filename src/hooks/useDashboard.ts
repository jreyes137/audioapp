/**
 * CUSTOM HOOK: useDashboard
 * 
 * Hook para gestionar el estado del dashboard.
 * Puedes usar este hook en lugar de repetir lógica en múltiples páginas.
 * 
 * Actualizado para usar los nuevos tipos de db.ts
 */

"use client";
import { useState, useEffect } from "react";
import {
    getProjectsFromDB,
    createProjectInDB,
    updateProjectInDB,
    deleteProjectInDB,
    uploadFileToCloud,
    Project,
    CreateProjectInput,
} from "@/lib/db";
import { INITIAL_PROJECTS } from "@/lib/data";

type ViewMode = "PORTFOLIO" | "ORDERS" | "INBOX" | "EDITOR";

interface NewProjectData {
    title: string;
    artist: string;
    genre?: string;
    mixFile?: File;
    masterFile?: File;
}

export function useDashboard() {
    // Estados
    const [projects, setProjects] = useState<Project[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>("PORTFOLIO");
    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [inboxFilterId, setInboxFilterId] = useState<string | number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Carga inicial desde Firebase
     */
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await getProjectsFromDB();
                
                if (data && data.length > 0) {
                    console.log('[useDashboard] ✓ Datos cargados desde Firebase');
                    setProjects(data);
                } else {
                    console.log('[useDashboard] Usando datos iniciales');
                    setProjects(INITIAL_PROJECTS || []);
                }
            } catch (error) {
                console.error('[useDashboard] Error al cargar:', error);
                setProjects(INITIAL_PROJECTS || []);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, []);

    /**
     * Sincronizar UI (helper interno)
     */
    const syncUI = (data: Project[]) => setProjects(data);

    /**
     * HANDLER: Crear nuevo proyecto
     */
    const handleSaveProject = async (data: NewProjectData) => {
        setIsModalOpen(false);

        try {
            // Subir archivos en paralelo
            const [mixUrl, masterUrl] = await Promise.all([
                data.mixFile ? uploadFileToCloud(data.mixFile, "tracks") : Promise.resolve(null),
                data.masterFile ? uploadFileToCloud(data.masterFile, "tracks") : Promise.resolve(null),
            ]);

            // Crear proyecto
            const newProj: CreateProjectInput = {
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
                comments: [],
            };

            const saved = await createProjectInDB(newProj);
            syncUI([saved, ...projects]);
            
            console.log('[useDashboard] ✓ Proyecto creado');
            alert("✓ Proyecto creado exitosamente");
        } catch (error) {
            console.error('[useDashboard] Error al crear proyecto:', error);
            alert("❌ Error al crear proyecto");
        }
    };

    /**
     * HANDLER: Subir archivo (Mix o Master)
     */
    const handleFileUpload = async (
        id: string | number,
        type: "MIX" | "MASTER",
        file: File
    ) => {
        alert("⏳ Subiendo archivo...");

        try {
            const url = await uploadFileToCloud(file, "tracks");

            if (url) {
                const updateData = type === "MIX" ? { mixUrl: url } : { masterUrl: url };
                await updateProjectInDB(String(id), updateData);

                const updated = projects.map((p) =>
                    p.id === id ? { ...p, ...updateData } : p
                );
                syncUI(updated);

                alert(`✓ ${type} subido correctamente`);
                console.log('[useDashboard] ✓ Archivo actualizado');
            } else {
                alert("❌ Error al subir archivo");
            }
        } catch (error) {
            console.error('[useDashboard] Error en subida:', error);
            alert("❌ Error al subir archivo");
        }
    };

    /**
     * HANDLER: Cambiar visibilidad pública
     */
    const togglePublic = async (
        id: string | number,
        currentValue: boolean,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();

        // Update local
        const updated = projects.map((p) =>
            p.id === id ? { ...p, isPublic: !currentValue } : p
        );
        syncUI(updated);

        // Update Firebase
        try {
            await updateProjectInDB(String(id), { isPublic: !currentValue });
            console.log('[useDashboard] ✓ Visibilidad actualizada');
        } catch (error) {
            console.error('[useDashboard] Error al actualizar visibilidad:', error);
            // Revertir si falla
            syncUI(projects);
        }
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
        syncUI(projects.filter((p) => p.id !== id));

        // Delete from Firebase
        try {
            await deleteProjectInDB(String(id));
            console.log('[useDashboard] ✓ Proyecto eliminado');
        } catch (error) {
            console.error('[useDashboard] Error al eliminar:', error);
        }
    };

    return {
        // Estados
        projects,
        viewMode,
        activeId,
        inboxFilterId,
        isModalOpen,
        showOrderModal,
        isLoading,

        // Setters
        setViewMode,
        setActiveId,
        setInboxFilterId,
        setIsModalOpen,
        setShowOrderModal,

        // Handlers
        handleSaveProject,
        handleFileUpload,
        togglePublic,
        handleDelete,
    };
}
