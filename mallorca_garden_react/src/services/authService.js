/**
 * Servicio de autenticación — Cliente Supabase para Auth solamente
 * Solo usa la anon key (pública y segura) para login/registro.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;

function getClient() {
    if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

/**
 * Verifica si Supabase Auth está configurado
 */
export function isAuthConfigured() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Registrar nuevo usuario con email y contraseña
 */
export async function signUp(email, password) {
    const client = getClient();
    if (!client) throw new Error('Supabase Auth no configurado');

    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
}

/**
 * Iniciar sesión con email y contraseña
 */
export async function signIn(email, password) {
    const client = getClient();
    if (!client) throw new Error('Supabase Auth no configurado');

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
}

/**
 * Cerrar sesión
 */
export async function signOut() {
    const client = getClient();
    if (!client) return;

    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
}

/**
 * Obtener la sesión actual
 */
export async function getSession() {
    const client = getClient();
    if (!client) return null;

    const { data: { session } } = await client.auth.getSession();
    return session;
}

/**
 * Obtener el token de acceso actual (para enviar al backend)
 */
export async function getAccessToken() {
    const session = await getSession();
    return session?.access_token || null;
}

/**
 * Escuchar cambios en el estado de autenticación
 */
export function onAuthStateChange(callback) {
    const client = getClient();
    if (!client) return { data: { subscription: { unsubscribe: () => { } } } };

    return client.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
}
