/**
 * Rate Limiter — Protege las rutas API contra abuso
 * Dos niveles: estricto para Gemini, general para el resto.
 */
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter estricto para la ruta de generación IA (Gemini).
 * 5 peticiones por ventana de 15 minutos por IP.
 */
export const geminiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Demasiadas solicitudes de generación. Por favor, espera 15 minutos antes de intentarlo de nuevo.',
    },
    keyGenerator: (req) => {
        // Usa el user ID si está autenticado, sino la IP
        return req.user?.id || req.ip;
    },
});

/**
 * Rate limiter general para rutas CRUD.
 * 100 peticiones por ventana de 15 minutos por IP.
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Demasiadas solicitudes. Por favor, espera antes de intentarlo de nuevo.',
    },
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    },
});
