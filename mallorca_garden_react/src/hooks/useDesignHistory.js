import { useState, useCallback } from 'react';
import {
    getDesigns,
    getDesign,
    saveDesign as apiSaveDesign,
    deleteDesign as apiDeleteDesign,
    updateDesignProposals as apiUpdateProposals,
} from '../services/apiService.js';

/**
 * Hook para gestionar el historial de diseños via backend API
 */
export function useDesignHistory() {
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Siempre configurado — el backend gestiona Supabase
    const isConfigured = true;

    const loadDesigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDesigns();
            setDesigns(data);
            return data;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDesign = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const design = await getDesign(id);
            return design;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveCurrentDesign = useCallback(async (designName, inputs, proposals, comparisonData, uploadedImages) => {
        try {
            // Convertir imágenes a base64 para enviar al backend
            const images = await Promise.all(
                (uploadedImages || []).map(img => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                data: reader.result.split(',')[1],
                                mimeType: img.file.type || 'image/jpeg',
                            });
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(img.file);
                    });
                })
            );

            const designData = {
                name: designName,
                inputs,
                proposals: {
                    sustainable: proposals.sustainable,
                    aesthetic: proposals.aesthetic,
                },
                comparisonData,
                images,
            };

            const result = await apiSaveDesign(designData);
            console.log('[History] Diseño guardado con ID:', result.id);
            return result.id;
        } catch (err) {
            console.error('[History] Error al guardar diseño:', err);
            throw err;
        }
    }, []);

    const deleteDesign = useCallback(async (id) => {
        setLoading(true);
        try {
            await apiDeleteDesign(id);
            setDesigns(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateDesignProposals = useCallback(async (designId, proposals) => {
        try {
            await apiUpdateProposals(designId, proposals);
            console.log('[History] Propuestas actualizadas en DB');
        } catch (err) {
            console.error('[History] Error al actualizar propuestas:', err);
            throw err;
        }
    }, []);

    return {
        designs,
        loading,
        error,
        isConfigured,
        loadDesigns,
        loadDesign,
        saveCurrentDesign,
        deleteDesign,
        updateDesignProposals
    };
}
