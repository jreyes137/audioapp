import { supabase } from './supabase';

// --- FUNCIONES DE STORAGE ---

// Renombrado a 'uploadToSupabase' para coincidir con tu Dashboard
export const uploadToSupabase = async (file: File, folder: string = 'uploads') => {
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('projects') // Asegúrate de tener este bucket 'projects' público en Supabase
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error subiendo archivo a Supabase:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('projects')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

export const deleteFile = async (pathOrUrl: string) => {
  let path = pathOrUrl;
  if (pathOrUrl.includes('/projects/')) {
    path = pathOrUrl.split('/projects/')[1];
  }

  const { error } = await supabase.storage
    .from('projects')
    .remove([path]);

  if (error) {
    console.error('Error eliminando archivo:', error);
  }
};