// Configuración de la aplicación
// Este archivo contiene la configuración por defecto (sin API key)

export const config = {
    // Deja vacío para usar modo local sin IA
    GEMINI_API_KEY: '',

    // Si quieres usar Gemini AI:
    // 1. Crea un archivo config.local.js (copiando este archivo)
    // 2. Reemplaza el valor vacío con tu API key
    // 3. Importa desde config.local.js en lugar de config.js

    // URL de la API de Gemini
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',

    // Configuraciones adicionales
    USE_AI: false // Cambia a true cuando tengas API key configurada
};
