import { useState, useCallback, useEffect } from 'react';
import { getDesigns, generateImageDesign } from '../services/apiService.js';

/**
 * Hook para gestionar la funcionalidad de Diseño en Imagen
 */
export function useImageDesign() {
    const [designs, setDesigns] = useState([]);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null); // { original_url, generated_url, proposalType }

    // Cargar todos los diseños al montar
    const loadDesigns = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDesigns();
            setDesigns(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDesigns();
    }, [loadDesigns]);

    // Seleccionar un diseño
    const selectDesign = useCallback((design) => {
        setSelectedDesign(design);
        setResult(null);
        setError(null);
    }, []);

    // Generar imagen para una propuesta
    const generate = useCallback(async (proposalType) => {
        if (!selectedDesign) return;

        setGenerating(true);
        setError(null);
        setResult(null);

        try {
            const data = await generateImageDesign(selectedDesign.id, proposalType);
            setResult(data);

            // Actualizar el diseño seleccionado con las imágenes generadas
            setSelectedDesign(prev => ({
                ...prev,
                generated_images: {
                    ...prev.generated_images,
                    [proposalType]: {
                        original_url: data.original_url,
                        generated_url: data.generated_url,
                        created_at: new Date().toISOString(),
                    },
                },
            }));

            // Actualizar en la lista también
            setDesigns(prev => prev.map(d =>
                d.id === selectedDesign.id
                    ? {
                        ...d,
                        generated_images: {
                            ...d.generated_images,
                            [proposalType]: {
                                original_url: data.original_url,
                                generated_url: data.generated_url,
                                created_at: new Date().toISOString(),
                            },
                        },
                    }
                    : d
            ));

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setGenerating(false);
        }
    }, [selectedDesign]);

    return {
        designs,
        selectedDesign,
        loading,
        generating,
        error,
        result,
        selectDesign,
        generate,
        loadDesigns,
    };
}
