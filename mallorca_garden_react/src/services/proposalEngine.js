/**
 * Motor de generación de propuestas local (sin IA)
 * Lógica pura sin acceso al DOM
 */

import { plantsData } from '../data/plants.js';

/**
 * Genera propuestas de jardín basadas en los datos del usuario
 * @returns {{ sustainable: Object, aesthetic: Object }}
 */
export function generateLocalProposals(inputs) {
    if (!plantsData || !Array.isArray(plantsData) || plantsData.length === 0) {
        throw new Error('Los datos de plantas no están disponibles.');
    }

    // 1. Filter viable plants by soil type
    const viablePlants = plantsData.filter(plant => {
        if (!plant.soilType || !Array.isArray(plant.soilType)) return false;
        return plant.soilType.includes(inputs.soil) || plant.soilType.includes('any');
    });

    // Proposal A: Sustainable (prioritize low water needs)
    const sustainablePlants = viablePlants.filter(p =>
        p.waterNeeds && ['very_low', 'low'].includes(p.waterNeeds)
    );
    const sustainableResult = selectPlants(sustainablePlants, inputs.budget);

    // Proposal B: Aesthetic (prioritize selected style)
    const stylisticPlants = viablePlants.filter(p => {
        if (!p.style || !Array.isArray(p.style)) return false;
        return p.style.includes(inputs.style);
    });
    const aestheticResult = selectPlants(stylisticPlants, inputs.budget);

    return {
        sustainable: {
            plants: sustainableResult.plants,
            totalCost: sustainableResult.cost,
            estimatedMaintenance: calculateMaintenanceLevel(sustainableResult.plants),
            estimatedWaterConsumption: calculateWaterNeeds(sustainableResult.plants),
            title: 'Jardín Nativo Resiliente',
            description: 'Optimizado para el clima de Mallorca con el menor mantenimiento posible.'
        },
        aesthetic: {
            plants: aestheticResult.plants,
            totalCost: aestheticResult.cost,
            estimatedMaintenance: calculateMaintenanceLevel(aestheticResult.plants),
            estimatedWaterConsumption: calculateWaterNeeds(aestheticResult.plants),
            title: 'Jardín de Impacto Visual',
            description: 'Diseño enfocado en la belleza y el estilo seleccionado.'
        }
    };
}

/**
 * Selects plants fitting within a budget
 */
function selectPlants(plantsPool, totalBudget) {
    if (plantsPool.length === 0) {
        return { plants: [], cost: 0 };
    }

    let currentCost = 0;
    const selectedMix = [];

    // Shuffle for variety
    const shuffled = [...plantsPool].sort(() => 0.5 - Math.random());

    for (const plant of shuffled) {
        if (!plant.cost || typeof plant.cost !== 'number') continue;

        if (currentCost + plant.cost <= totalBudget) {
            const qty = Math.max(1, Math.floor((totalBudget * 0.15) / plant.cost));
            const totalItemCost = qty * plant.cost;

            if (currentCost + totalItemCost <= totalBudget) {
                selectedMix.push({ ...plant, quantity: qty });
                currentCost += totalItemCost;
            }
        }
    }

    return { plants: selectedMix, cost: currentCost };
}

/**
 * Calculate average maintenance level from a list of plants
 */
export function calculateMaintenanceLevel(plants) {
    if (!plants || plants.length === 0) return 'low';
    const levels = { 'very_low': 1, 'low': 2, 'medium': 3, 'high': 4 };
    const avg = plants.reduce((sum, p) => sum + (levels[p.maintenance] || 2), 0) / plants.length;
    if (avg <= 1.5) return 'low';
    if (avg <= 2.5) return 'medium';
    return 'high';
}

/**
 * Calculate average water needs from a list of plants
 */
export function calculateWaterNeeds(plants) {
    if (!plants || plants.length === 0) return 'low';
    const levels = { 'none': 0, 'very_low': 1, 'low': 2, 'medium_low': 2.5, 'medium': 3, 'high': 4 };
    const avg = plants.reduce((sum, p) => sum + (levels[p.waterNeeds] || 2), 0) / plants.length;
    if (avg <= 1.5) return 'low';
    if (avg <= 2.5) return 'medium';
    return 'high';
}

/**
 * Helper: get human-readable label for water level
 */
export function getWaterLabel(level) {
    const labels = {
        'none': 'Ninguna',
        'very_low': 'Muy baja',
        'low': 'Baja',
        'medium_low': 'Media-baja',
        'medium': 'Media',
        'high': 'Alta'
    };
    return labels[level] || level;
}

/**
 * Helper: get human-readable label for maintenance level
 */
export function getMaintenanceLabel(level) {
    const labels = {
        'very_low': 'Muy bajo',
        'low': 'Bajo',
        'medium': 'Medio',
        'high': 'Alto'
    };
    return labels[level] || level;
}
