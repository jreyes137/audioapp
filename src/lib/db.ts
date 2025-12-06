import { supabase } from './supabase';

// --- DEFINICIONES DE TIPOS ---

export interface Metadata {
  duration?: number;
  format?: string;
  size?: number;
  [key: string]: any; 
}

export interface Project {
  id?: string;
  title: string;
  artist?: string;
  bpm?: number;
  key?: string;
  tags?: string[];
  audioUrl?: string;     // En Supabase será 'audio_url'
  imageUrl?: string;     // En Supabase será 'image_url'
  createdAt?: string;    // En Supabase será 'created_at'
  metadata?: Metadata;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  version?: number;
}

export type CreateProjectInput = Omit<Project, 'id' | 'createdAt'>;

// --- FUNCIONES (Nombres corregidos para tu Dashboard) ---

// 1. Obtener proyectos
export const getProjectsFromDB = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener proyectos:', error);
    return [];
  }

  // Mapeamos snake_case (BD) a camelCase (App)
  return (data || []).map((item) => ({
    ...item,
    createdAt: item.created_at,
    audioUrl: item.audio_url || item.audioUrl, 
    imageUrl: item.image_url || item.imageUrl,
  })) as Project[];
};

// 2. Crear proyecto
export const createProjectInDB = async (project: CreateProjectInput): Promise<Project | null> => {
  const dbPayload = {
    ...project,
    audio_url: project.audioUrl,
    image_url: project.imageUrl,
    // Eliminamos los camelCase para evitar errores si la tabla es estricta
    audioUrl: undefined,
    imageUrl: undefined,
  };

  const cleanPayload = JSON.parse(JSON.stringify(dbPayload));

  const { data, error } = await supabase
    .from('projects')
    .insert([cleanPayload])
    .select();

  if (error) {
    console.error('Error al crear proyecto:', error);
    throw error;
  }
  
  const createdItem = data?.[0];
  if (!createdItem) return null;

  return {
    ...createdItem,
    createdAt: createdItem.created_at,
    audioUrl: createdItem.audio_url,
    imageUrl: createdItem.image_url,
  } as Project;
};

// 3. Actualizar proyecto
export const updateProjectInDB = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
  const dbUpdates: any = { ...updates };
  
  if (updates.audioUrl) dbUpdates.audio_url = updates.audioUrl;
  if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
  
  delete dbUpdates.audioUrl;
  delete dbUpdates.imageUrl;
  delete dbUpdates.createdAt; 

  const { data, error } = await supabase
    .from('projects')
    .update(dbUpdates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error al actualizar proyecto:', error);
    throw error;
  }

  const updatedItem = data?.[0];
  if (!updatedItem) return null;

  return {
    ...updatedItem,
    createdAt: updatedItem.created_at,
    audioUrl: updatedItem.audio_url,
    imageUrl: updatedItem.image_url,
  } as Project;
};

// 4. Eliminar proyecto
export const deleteProjectInDB = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar proyecto:', error);
    throw error;
  }
  return true;
};