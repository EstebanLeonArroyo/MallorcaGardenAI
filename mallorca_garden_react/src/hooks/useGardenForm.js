import { useState, useMemo, useCallback } from 'react';

/**
 * Hook para gestionar todo el estado del formulario de jardin
 */
export function useGardenForm() {
    const [soil, setSoil] = useState('');
    const [style, setStyle] = useState('');
    const [budget, setBudget] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [designName, setDesignName] = useState('');
    const [extraInfo, setExtraInfo] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);

    // Computed area
    const area = useMemo(() => {
        const l = parseFloat(length) || 0;
        const w = parseFloat(width) || 0;
        return (l > 0 && w > 0) ? (l * w).toFixed(2) : null;
    }, [length, width]);

    // Current progress step
    const currentStep = useMemo(() => {
        if (budget) return 4;
        if (style) return 3;
        if (soil) return 2;
        if (uploadedImages.length > 0) return 1;
        return 0;
    }, [soil, style, budget, uploadedImages]);

    // Image management
    const addImages = useCallback((files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImages(prev => [...prev, {
                    file,
                    dataUrl: e.target.result
                }]);
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const removeImage = useCallback((index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Validation
    const isValid = useMemo(() => {
        return soil && style && budget && designName.trim();
    }, [soil, style, budget, designName]);

    // Get form data object
    const getFormData = useCallback(() => {
        const l = parseFloat(length) || null;
        const w = parseFloat(width) || null;
        return {
            soil,
            style,
            budget: parseFloat(budget),
            length: l,
            width: w,
            area,
            extraInfo: extraInfo.trim() || null
        };
    }, [soil, style, budget, length, width, area, extraInfo]);

    // Reset all form state
    const reset = useCallback(() => {
        setSoil('');
        setStyle('');
        setBudget('');
        setLength('');
        setWidth('');
        setDesignName('');
        setExtraInfo('');
        setUploadedImages([]);
    }, []);

    return {
        // State
        soil, style, budget, length, width, designName, extraInfo, uploadedImages,
        area, currentStep, isValid,
        // Setters
        setSoil, setStyle, setBudget, setLength, setWidth, setDesignName, setExtraInfo,
        // Actions
        addImages, removeImage, getFormData, reset
    };
}
