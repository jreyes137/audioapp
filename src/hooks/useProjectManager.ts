"use client";
import { useState, useEffect } from "react";

const INITIAL_PROJECTS = [
    { id: 1, title: "ÉXODO", artist: "SEBAS STC", date: "Hace 2 horas", genre: "Trap", category: "PORTFOLIO", isPublic: true, status: "APPROVED", type: "AUDIO", mixUrl: null, masterUrl: null, comments: [] }
];

export function useProjectManager() {
    const [projects, setProjects] = useState<any[]>(INITIAL_PROJECTS);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"PORTFOLIO" | "INBOX" | "ORDERS" | "EDITOR">("PORTFOLIO");
    const [inboxFilterId, setInboxFilterId] = useState<number | null>(null);
    
    // Modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Cargar Datos
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("1307_projects");
            if (saved) setProjects(JSON.parse(saved));
            
            // Escuchar cambios externos (Si el cliente sube algo en otra pestaña)
            const handleStorage = () => {
                const updated = localStorage.getItem("1307_projects");
                if (updated) setProjects(JSON.parse(updated));
            };
            window.addEventListener("storage", handleStorage);
            return () => window.removeEventListener("storage", handleStorage);
        }
    }, []);

    // Guardar y Sincronizar
    const commit = (newProjects: any[]) => {
        setProjects(newProjects);
        localStorage.setItem("1307_projects", JSON.stringify(newProjects));
        window.dispatchEvent(new Event("storage"));
    };

    // --- ACCIONES ---
    
    const addProject = (data: any) => {
        // Crear URLs locales inmediatamente para que suenen
        const mixUrl = data.mixFile ? URL.createObjectURL(data.mixFile) : null;
        const masterUrl = data.masterFile ? URL.createObjectURL(data.masterFile) : null;
        
        const newProj = { 
            id: Date.now(), 
            title: data.title, 
            artist: data.artist, 
            genre: data.genre || "N/A", 
            category: "PORTFOLIO", 
            isPublic: true, 
            date: "Hoy", 
            status: "PENDING", 
            type: "AUDIO", 
            mixUrl, 
            masterUrl, 
            comments: [] 
        };
        commit([newProj, ...projects]);
        setIsModalOpen(false);
    };

    const addOrder = (client: string, service: string, price: string) => {
        const id = Date.now();
        const newOrder = { 
            id, title: service, artist: client, genre: "Pendiente", 
            category: "ORDER", isPublic: false, status: "PENDING_PAYMENT", 
            type: "ZIP", comments: [], price, clientName: client, date: "Hoy" 
        };
        commit([...projects, newOrder]);
        
        // También guardar en DB de ordenes para el portal
        const orders = JSON.parse(localStorage.getItem("1307_orders") || "[]");
        localStorage.setItem("1307_orders", JSON.stringify([...orders, newOrder]));
        
        setShowOrderModal(false);
        return id; // Retornar ID para generar link
    };

    const deleteProject = (id: number) => {
        if(confirm("¿Eliminar proyecto?")) {
            const updated = projects.filter(p => p.id !== id);
            commit(updated);
            if(activeId === id) setActiveId(null);
        }
    };

    const togglePublic = (id: number) => {
        const updated = projects.map(p => p.id === id ? { ...p, isPublic: !p.isPublic } : p);
        commit(updated);
    };

    const uploadFile = (id: number, type: 'MIX' | 'MASTER', file: File) => {
        const url = URL.createObjectURL(file);
        const updated = projects.map(p => p.id === id ? (type === 'MIX' ? { ...p, mixUrl: url } : { ...p, masterUrl: url }) : p);
        commit(updated);
        return url; // Retornar URL para confirmar
    };

    // Navegación Inbox
    const openInboxDetail = (id: number) => {
        setInboxFilterId(id);
        setViewMode("INBOX");
    };

    return {
        // Datos
        projects, activeId, viewMode, inboxFilterId, isModalOpen, showOrderModal,
        // Setters Simples
        setActiveId, setViewMode, setInboxFilterId, setIsModalOpen, setShowOrderModal,
        // Acciones Complejas (Lógica encapsulada)
        addProject, addOrder, deleteProject, togglePublic, uploadFile, openInboxDetail
    };
}