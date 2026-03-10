/**
 * Servicio API — Comunicación centralizada con el backend
 * Todas las llamadas pasan por aquí. El token JWT se adjunta automáticamente.
 */
import { getAccessToken } from './authService.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper: realiza una petición autenticada al backend
 */
async function apiFetch(endpoint, options = {}) {
    const token = await getAccessToken();

    if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión.');
    }

    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || errorData.message || `Error ${response.status}`;
        const err = new Error(message);
        err.status = response.status;
        err.details = errorData.details || null;
        throw err;
    }

    return response.json();
}

// --- Gemini ---

/**
 * Genera propuestas de jardín mediante IA (Gemini)
 * @param {Object} gardenData - { soil, style, budget, length, width, extraInfo, designName }
 * @param {Array} images - [{ data: base64String, mimeType: string }]
 * @returns {Promise<Object>} - { sustainable: {...}, aesthetic: {...} }
 */
export async function generateDesign(gardenData, images = []) {
    return apiFetch('/api/gemini/generate', {
        method: 'POST',
        body: JSON.stringify({
            ...gardenData,
            images,
        }),
    });
}

// --- Designs CRUD ---

/**
 * Obtener todos los diseños del usuario
 */
export async function getDesigns() {
    return apiFetch('/api/designs');
}

/**
 * Obtener un diseño específico por ID
 */
export async function getDesign(id) {
    return apiFetch(`/api/designs/${id}`);
}

/**
 * Guardar un nuevo diseño
 */
export async function saveDesign(designData) {
    return apiFetch('/api/designs', {
        method: 'POST',
        body: JSON.stringify(designData),
    });
}

/**
 * Actualizar las propuestas de un diseño
 */
export async function updateDesignProposals(id, proposals) {
    return apiFetch(`/api/designs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ proposals }),
    });
}

/**
 * Eliminar un diseño
 */
export async function deleteDesign(id) {
    return apiFetch(`/api/designs/${id}`, {
        method: 'DELETE',
    });
}

// --- Image Design (Fal.ai) ---

/**
 * Genera una imagen de jardín transformada con IA
 * @param {string} designId - ID del diseño
 * @param {string} proposalType - 'sustainable' | 'aesthetic'
 * @returns {Promise<Object>} - { original_url, generated_url, proposalType }
 */
export async function generateImageDesign(designId, proposalType) {
    return apiFetch(`/api/image-design/${designId}/generate`, {
        method: 'POST',
        body: JSON.stringify({ proposalType }),
    });
}
