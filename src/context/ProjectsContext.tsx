"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { CreateProjectInput, Project, Comment, getProjectsFromDB, updateProjectInDB, deleteProjectInDB } from "@/lib/db";

type ProjectWithoutId = Omit<CreateProjectInput, "id" | "createdAt">;

interface ProjectsContextValue {
    projects: Project[];
    isLoading: boolean;
    refreshFromDB: () => Promise<void>;
    addLocalProject: (data: ProjectWithoutId) => Project;
    addOrder: (data: ProjectWithoutId) => Project;
    updateProjectLocal: (id: string | number, updates: Partial<Project>) => void;
    addCommentLocal: (projectId: string | number, comment: Comment) => void;
    removeProject: (id: string | number) => void;
    getProjectById: (id: string | number) => Project | undefined;
}

const STORAGE_KEY = "audioapp_projects_v2";

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

function persistToStorage(projects: Project[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.warn("[ProjectsContext] No se pudo persistir en localStorage", e);
    }
}

function loadFromStorage(): Project[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as Project[];
    } catch (e) {
        console.warn("[ProjectsContext] No se pudo leer de localStorage", e);
        return [];
    }
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            setIsLoading(true);
            const local = loadFromStorage();
            if (local.length > 0) {
                setProjects(local);
            }

            try {
                const fromDb = await getProjectsFromDB();
                if (fromDb.length > 0) {
                    setProjects(fromDb);
                    persistToStorage(fromDb);
                } else if (local.length === 0) {
                    setProjects([]);
                }
            } catch (error) {
                console.warn("[ProjectsContext] DB fallback a localStorage", error);
                if (local.length > 0) setProjects(local);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrap();
    }, []);

    const refreshFromDB = async () => {
        setIsLoading(true);
        try {
            const data = await getProjectsFromDB();
            setProjects(data);
            persistToStorage(data);
        } finally {
            setIsLoading(false);
        }
    };

    const addLocalProject = (data: ProjectWithoutId): Project => {
        const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `local-${Date.now()}`;
        const project: Project = {
            ...data,
            id,
            date: data.date || new Date().toLocaleDateString(),
            comments: data.comments || [],
        };
        setProjects((prev) => {
            const next = [project, ...prev];
            persistToStorage(next);
            return next;
        });
        return project;
    };

    const addOrder = (data: ProjectWithoutId): Project => {
        const base: ProjectWithoutId = {
            ...data,
            category: "ORDER",
            status: data.status || "PENDING_PAYMENT",
            isPublic: false,
        };
        return addLocalProject(base);
    };

    const updateProjectLocal = (id: string | number, updates: Partial<Project>) => {
        setProjects((prev) => {
            const next = prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p));
            persistToStorage(next);
            // Mejor esfuerzo: sincronizar cuando existe en Firestore
            if (updates && typeof window !== "undefined") {
                updateProjectInDB(String(id), updates).catch(() => {
                    // modo offline: silencioso
                });
            }
            return next;
        });
    };

    const addCommentLocal = (projectId: string | number, comment: Comment) => {
        setProjects((prev) => {
            const next = prev.map((p) =>
                String(p.id) === String(projectId)
                    ? { ...p, comments: [...(p.comments || []), comment] }
                    : p
            );
            persistToStorage(next);
            updateProjectInDB(String(projectId), { comments: next.find((p) => String(p.id) === String(projectId))?.comments }).catch(() => {});
            return next;
        });
    };

    const removeProject = (id: string | number) => {
        setProjects((prev) => {
            const next = prev.filter((p) => String(p.id) !== String(id));
            persistToStorage(next);
            deleteProjectInDB(String(id)).catch(() => {});
            return next;
        });
    };

    const getProjectById = (id: string | number) => projects.find((p) => String(p.id) === String(id));

    const value = useMemo<ProjectsContextValue>(
        () => ({
            projects,
            isLoading,
            refreshFromDB,
            addLocalProject,
            addOrder,
            updateProjectLocal,
            addCommentLocal,
            removeProject,
            getProjectById,
        }),
        [projects, isLoading]
    );

    return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error("useProjects debe usarse dentro de ProjectsProvider");
    return ctx;
}

