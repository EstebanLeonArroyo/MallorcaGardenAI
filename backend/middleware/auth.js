/**
 * Middleware de autenticación — Verifica JWT de Supabase Auth
 * Extrae el token Bearer del header Authorization y valida contra Supabase.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        // Adjuntar usuario al request para uso en las rutas
        req.user = {
            id: user.id,
            email: user.email,
        };

        next();
    } catch (err) {
        console.error('[Auth] Error verificando token:', err.message);
        return res.status(401).json({ error: 'Error de autenticación' });
    }
}

/**
 * Exporta el cliente Supabase con service role para uso en las rutas
 */
export { supabase };
