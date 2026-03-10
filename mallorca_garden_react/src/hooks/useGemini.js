import { useState, useCallback, useMemo } from 'react';
import { generateDesign } from '../services/apiService.js';
import { generateLocalProposals } from '../services/proposalEngine.js';

/**
 * Hook para gestionar la generación de propuestas (IA via backend o local)
 */
export function useGemini() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [proposals, setProposals] = useState(null);
    const [mode, setMode] = useState(null); // 'ai' | 'local'

    // Siempre configurado — el backend gestiona la API key
    const isConfigured = useMemo(() => true, []);

    /**
     * Convierte un archivo de imagen a base64 para enviar al backend
     */
    const convertImageToBase64 = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve({
                    data: base64String,
                    mimeType: file.type || 'image/jpeg',
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    const generateProposals = useCallback(async (images, gardenData) => {
        setLoading(true);
        setError(null);
        setProposals(null);

        try {
            // Convertir imágenes a base64
            const imageFiles = images.map(img => img.file);
            const imagesBase64 = await Promise.all(
                imageFiles.map(file => convertImageToBase64(file))
            );

            console.log('[API] Enviando al backend para generar propuestas');
            const aiProposals = await generateDesign(gardenData, imagesBase64);
            setProposals(aiProposals);
            setMode('ai');
            return aiProposals;
        } catch (err) {
            console.error('Error generando propuestas:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [convertImageToBase64]);

    const generateLocalFallback = useCallback(async (gardenData) => {
        setLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const localProposals = generateLocalProposals(gardenData);
            setProposals(localProposals);
            setMode('local');
            return localProposals;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const resetProposals = useCallback(() => {
        setProposals(null);
        setError(null);
        setMode(null);
    }, []);

    const setProposalsDirectly = useCallback((updatedProposals) => {
        setProposals(updatedProposals);
    }, []);

    return {
        isConfigured,
        loading,
        error,
        proposals,
        mode,
        generateProposals,
        generateLocalFallback,
        resetProposals,
        setProposalsDirectly
    };
}
