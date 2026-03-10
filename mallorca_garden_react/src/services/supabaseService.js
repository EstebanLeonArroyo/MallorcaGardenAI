/**
 * Servicio Supabase (Legacy) — Solo compatibilidad
 * La autenticación ahora se gestiona en authService.js
 * Las operaciones de DB ahora pasan por el backend via apiService.js
 * 
 * Este archivo se mantiene vacío para no romper imports existentes.
 */

export function isSupabaseConfigured() {
    return true;
}
