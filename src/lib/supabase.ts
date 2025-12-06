import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- DIAGNÓSTICO (Mira la consola del navegador) ---
console.log('--- INTENTANDO CONECTAR A SUPABASE ---');
console.log('URL definida:', supabaseUrl ? 'SÍ' : 'NO');
console.log('KEY definida:', supabaseKey ? 'SÍ' : 'NO');

if (supabaseUrl) {
  console.log('URL valor:', supabaseUrl); // Verifica que empiece por https://
} else {
  console.error('🚨 ERROR CRÍTICO: La variable NEXT_PUBLIC_SUPABASE_URL está vacía o indefinida.');
}
// --------------------------------------------------

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey);