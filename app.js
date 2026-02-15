import { plantsData, stylesInfo } from './data/plants.js';
import { generateGardenProposalsWithAI, isGeminiConfigured } from './gemini-service.js';
import { saveDesign, getAllDesigns, deleteDesign, getDesignById, isSupabaseConfigured } from './supabase-service.js';
import './history-functions.js'; // Funciones del historial

// Array para almacenar las imágenes
let uploadedImages = [];

// Variable global para saber si estamos viendo un diseño guardado
window.currentLoadedDesignId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const form = document.getElementById('garden-form');
    const inputSection = document.getElementById('input-section');
    const resultsSection = document.getElementById('results-section');
    const resetBtn = document.getElementById('reset-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const terrainPhotos = document.getElementById('terrain-photos');
    const previewGallery = document.getElementById('preview-gallery');

    // Selección de Suelo Interactivo
    const soilOptions = document.querySelectorAll('.option-card');
    const soilInput = document.getElementById('soil-input');

    // Medidas del jardín
    const gardenLength = document.getElementById('garden-length');
    const gardenWidth = document.getElementById('garden-width');
    const areaValue = document.querySelector('.area-value');

    // Calcular área cuando cambien las medidas
    function updateArea() {
        const length = parseFloat(gardenLength.value) || 0;
        const width = parseFloat(gardenWidth.value) || 0;

        if (length > 0 && width > 0) {
            const area = (length * width).toFixed(2);
            areaValue.textContent = `${area} m²`;
        } else {
            areaValue.textContent = '-- m²';
        }
    }

    if (gardenLength && gardenWidth) {
        gardenLength.addEventListener('input', updateArea);
        gardenWidth.addEventListener('input', updateArea);
    }

    soilOptions.forEach(card => {
        card.addEventListener('click', () => {
            // Remover clase selected de todos
            soilOptions.forEach(c => c.classList.remove('selected'));
            // Añadir a la actual
            card.classList.add('selected');
            // Guardar valor
            soilInput.value = card.dataset.value;
            // Actualizar indicador de progreso
            updateProgressIndicator(2);
        });
    });

    // Vista Previa de Imágenes
    console.log('🔍 Buscando elemento terrain-photos...');
    if (!terrainPhotos) {
        console.error('❌ ERROR: elemento terrain-photos no encontrado!');
    } else {
        console.log('✅ Elemento terrain-photos encontrado:', terrainPhotos);
    }

    terrainPhotos.addEventListener('change', (e) => {
        console.log('📸 Change event disparado!');
        console.log('Número de archivos seleccionados:', e.target.files.length);

        const files = Array.from(e.target.files);
        console.log('Archivos procesados:', files.length);

        files.forEach((file, index) => {
            console.log(`Procesando archivo ${index + 1}:`, file.name, file.type);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (event) => {
                    uploadedImages.push({
                        file: file,
                        dataUrl: event.target.result
                    });
                    console.log(`✅ Imagen ${index + 1} cargada. Total: ${uploadedImages.length}`);
                    renderImagePreviews();
                    updateProgressIndicator(1);
                };

                reader.readAsDataURL(file);
            } else {
                console.warn(`⚠️ Archivo ${file.name} no es una imagen, omitiendo`);
            }
        });
    });

    // Función para renderizar previews
    function renderImagePreviews() {
        previewGallery.innerHTML = '';

        uploadedImages.forEach((image, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            const img = document.createElement('img');
            img.src = image.dataUrl;
            img.alt = `Terreno ${index + 1}`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.type = 'button';
            deleteBtn.onclick = () => {
                uploadedImages.splice(index, 1);
                renderImagePreviews();
            };

            previewItem.appendChild(img);
            previewItem.appendChild(deleteBtn);
            previewGallery.appendChild(previewItem);
        });

        // Añadir contador de imágenes
        if (uploadedImages.length > 0) {
            const counter = document.createElement('div');
            counter.className = 'image-counter';
            counter.textContent = `${uploadedImages.length} foto${uploadedImages.length !== 1 ? 's' : ''} subida${uploadedImages.length !== 1 ? 's' : ''}`;
            previewGallery.appendChild(counter);
        }
    }

    // Progress Indicator
    const progressSteps = document.querySelectorAll('.progress-step');

    function updateProgressIndicator(step) {
        progressSteps.forEach((stepEl, index) => {
            if (index < step) {
                stepEl.classList.add('active');
            }
        });
    }

    // Actualizar progress con listeners en campos
    document.getElementById('style-input').addEventListener('change', () => {
        updateProgressIndicator(3);
    });

    document.getElementById('budget-input').addEventListener('input', () => {
        updateProgressIndicator(4);
    });

    // Event listeners para historial
    const historyBtn = document.getElementById('history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const createFirstDesignBtn = document.getElementById('create-first-design-btn');

    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.showHistory();
        });
    }

    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            window.closeHistory();
        });
    }

    if (createFirstDesignBtn) {
        createFirstDesignBtn.addEventListener('click', () => {
            window.closeHistory();
        });
    }

    // Manejo del Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar suelo
        if (!soilInput.value) {
            alert('Por favor, selecciona un tipo de suelo estimado.');
            return;
        }

        // Recoger datos del formulario
        const length = parseFloat(gardenLength?.value) || null;
        const width = parseFloat(gardenWidth?.value) || null;
        const area = (length && width) ? (length * width).toFixed(2) : null;

        // Capturar nombre del diseño
        const designName = document.getElementById('design-name-input').value.trim();
        if (!designName) {
            alert('Por favor, ingresa un nombre para el diseño.');
            return;
        }

        // Reset loaded design ID (estamos creando uno nuevo)
        currentLoadedDesignId = null;

        const inputs = {
            soil: soilInput.value,
            style: document.getElementById('style-input').value,
            budget: parseFloat(document.getElementById('budget-input').value),
            length: length,
            width: width,
            area: area
        };

        // Mostrar loading spinner
        loadingOverlay.classList.remove('hidden');

        // Actualizar mensaje de loading según el modo
        const loadingMessage = document.querySelector('.spinner p');
        if (loadingMessage) {
            if (isGeminiConfigured() && uploadedImages.length > 0) {
                loadingMessage.textContent = '🤖 Analizando imágenes con IA y generando propuestas...';
            } else {
                loadingMessage.textContent = 'Generando tus propuestas personalizadas...';
            }
        }

        try {
            // Intentar usar Gemini AI si está configurado y hay imágenes
            if (isGeminiConfigured() && uploadedImages.length > 0) {
                console.log('🤖 Usando Gemini API para generar propuestas');

                // Extraer los archivos File de uploadedImages
                const imageFiles = uploadedImages.map(img => img.file);

                const aiProposals = await generateGardenProposalsWithAI(imageFiles, inputs);

                // Renderizar propuestas de AI
                renderAIProposals(aiProposals, inputs.budget);

                // Guardar diseño en Supabase
                await saveCurrentDesignAsync(designName, inputs, aiProposals);

            } else {
                // Modo local (sin IA)
                if (!isGeminiConfigured()) {
                    console.log('ℹ️ API key no configurada, usando modo local');
                } else {
                    console.log('ℹ️ No hay imágenes subidas, usando modo local');
                }

                // Esperar un poco para simular procesamiento
                await new Promise(resolve => setTimeout(resolve, 1500));
                generateProposals(inputs);

                // Esperar un momento adicional para que proposalData se llene
                await new Promise(resolve => setTimeout(resolve, 500));

                // Guardar diseño en Supabase (modo local)
                const localProposals = {
                    sustainable: window.proposalData?.sustainable || {},
                    aesthetic: window.proposalData?.aesthetic || {}
                };

                console.log('💾 Guardando propuestas locales:', localProposals);
                await saveCurrentDesignAsync(designName, inputs, localProposals);
            }

            // Ocultar loading
            loadingOverlay.classList.add('hidden');

            // Actualizar título y badge para diseño nuevo
            const designTitle = document.getElementById('design-title');
            const designBadge = document.getElementById('design-badge');

            if (designTitle) {
                designTitle.textContent = designName;
            }
            if (designBadge) {
                designBadge.textContent = 'Nuevo';
                designBadge.className = 'design-badge new-badge';
            }

            // Transición de interfaz
            inputSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            // Asegurar que el loading se oculte incluso si hay error
            loadingOverlay.classList.add('hidden');
            console.error('Error generando propuestas:', error);

            // Si falla la AI, intentar con modo local como fallback
            if (isGeminiConfigured()) {
                const retry = confirm('Error al usar IA: ' + error.message + '\n\n¿Quieres generar propuestas en modo local sin IA?');
                if (retry) {
                    loadingOverlay.classList.remove('hidden');
                    try {
                        await new Promise(resolve => setTimeout(resolve, 800));
                        generateProposals(inputs);
                        loadingOverlay.classList.add('hidden');
                        inputSection.classList.add('hidden');
                        resultsSection.classList.remove('hidden');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } catch (localError) {
                        loadingOverlay.classList.add('hidden');
                        alert('Error en modo local: ' + localError.message);
                    }
                }
            } else {
                alert('Hubo un error al generar las propuestas.\n\nError: ' + error.message);
            }
        }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        form.reset();
        soilOptions.forEach(c => c.classList.remove('selected'));
        soilInput.value = '';
        uploadedImages = [];
        renderImagePreviews();

        // Reset progress indicator
        progressSteps.forEach(step => {
            step.classList.remove('active');
        });
        progressSteps[0].classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Comparison Toggle
    const comparisonToggle = document.getElementById('comparison-toggle');
    const comparisonContainer = document.getElementById('comparison-container');
    const proposalsContainer = document.querySelector('.proposals-container');

    if (comparisonToggle) {
        comparisonToggle.addEventListener('click', () => {
            comparisonToggle.classList.toggle('active');
            comparisonContainer.classList.toggle('active');

            if (comparisonContainer.classList.contains('active')) {
                renderComparisonTable();
                proposalsContainer.style.display = 'none';
            } else {
                proposalsContainer.style.display = 'grid';
            }
        });
    }
});

function generateProposals(inputs) {
    // Validación defensiva
    if (!plantsData || !Array.isArray(plantsData)) {
        console.error('ERROR: plantsData no está disponible o no es un array');
        throw new Error('Los datos de plantas no están disponibles. Asegúrate de que data/plants.js esté cargado correctamente.');
    }

    if (plantsData.length === 0) {
        console.error('ERROR: plantsData está vacío');
        throw new Error('No hay datos de plantas disponibles.');
    }

    console.log(`Generando propuestas para: suelo=${inputs.soil}, estilo=${inputs.style}, presupuesto=${inputs.budget}`);
    console.log(`Total de plantas disponibles: ${plantsData.length}`);

    // Inicializar datos de comparación ANTES de renderizar (para evitar errores de undefined)
    window.proposalData = {
        sustainable: { plants: [], cost: 0, maintenance: '', water: '' },
        aesthetic: { plants: [], cost: 0, maintenance: '', water: '' }
    };

    // 1. Filtrar plantas viables según suelo
    const viablePlants = plantsData.filter(plant => {
        // Validar que la planta tenga la estructura correcta
        if (!plant.soilType || !Array.isArray(plant.soilType)) {
            console.warn(`Planta ${plant.name || 'desconocida'} no tiene soilType válido`);
            return false;
        }
        // Si el tipo de suelo está en la lista de la planta o la planta acepta 'any'
        return plant.soilType.includes(inputs.soil) || plant.soilType.includes('any');
    });

    console.log(`Plantas viables para suelo ${inputs.soil}: ${viablePlants.length}`);

    // Propuesta A: Sostenible (Prioriza waterNeeds low/very_low)
    const sustainablePlants = viablePlants.filter(p =>
        p.waterNeeds && ['very_low', 'low'].includes(p.waterNeeds)
    );
    console.log(`Plantas sostenibles (low water): ${sustainablePlants.length}`);
    renderProposal(sustainablePlants, inputs.budget, 'proposal-a');

    // Propuesta B: Estética (Prioriza el estilo seleccionado)
    const stylisticPlants = viablePlants.filter(p => {
        if (!p.style || !Array.isArray(p.style)) {
            console.warn(`Planta ${p.name || 'desconocida'} no tiene style válido`);
            return false;
        }
        return p.style.includes(inputs.style);
    });
    console.log(`Plantas estilísticas para ${inputs.style}: ${stylisticPlants.length}`);
    renderProposal(stylisticPlants, inputs.budget, 'proposal-b');

    // Actualizar tabla de comparación después de generar ambas propuestas
    renderComparisonTable();
}

function renderProposal(plantsPool, totalBudget, elementId) {
    const listElement = document.querySelector(`#${elementId} .plant-list`);
    const costElement = document.querySelector(`#${elementId} .cost-value`);

    // Validación defensiva de elementos DOM
    if (!listElement) {
        console.error(`ERROR: No se encontró el elemento .plant-list para #${elementId}`);
        throw new Error(`Elemento DOM no encontrado: #${elementId} .plant-list`);
    }

    if (!costElement) {
        console.error(`ERROR: No se encontró el elemento .cost-value para #${elementId}`);
        throw new Error(`Elemento DOM no encontrado: #${elementId} .cost-value`);
    }

    listElement.innerHTML = ''; // Limpiar

    if (plantsPool.length === 0) {
        listElement.innerHTML = '<li>No encontramos plantas exactas para esta combinación estricta.</li>';
        costElement.textContent = '0 €';
        console.warn(`No se encontraron plantas para ${elementId}`);
        return;
    }

    // Algoritmo simple de selección: Llenar el presupuesto
    let currentCost = 0;
    const selectedMix = [];

    // Intentamos seleccionar al menos 3 árboles/arbustos grandes si el presupuesto permite
    // Y rellenar con plantas pequeñas.

    // Mezclar array para variedad
    const shuffled = plantsPool.sort(() => 0.5 - Math.random());

    for (const plant of shuffled) {
        // Validar que la planta tenga precio
        if (!plant.cost || typeof plant.cost !== 'number') {
            console.warn(`Planta ${plant.name} no tiene precio válido, omitiendo`);
            continue;
        }

        // Estimamos cantidad basada en precio (simplificado)
        // Ejemplo: Si quedan 500€ y la planta vale 50, ponemos 2...
        if (currentCost + plant.cost <= totalBudget) {
            const qty = Math.max(1, Math.floor((totalBudget * 0.15) / plant.cost));
            const totalItemCost = qty * plant.cost;

            if (currentCost + totalItemCost <= totalBudget) {
                selectedMix.push({ ...plant, qty });
                currentCost += totalItemCost;
            }
        }
    }

    // Renderizar con tooltips
    selectedMix.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${item.qty}x</strong> ${item.name} <small>(${item.cost}€/ud)</small>
            ${createTooltip(item)}
        `;
        listElement.appendChild(li);
    });

    costElement.textContent = `${currentCost} €`;

    // Guardar datos para comparación
    if (elementId === 'proposal-a') {
        window.proposalData.sustainable.cost = currentCost;
        window.proposalData.sustainable.plants = selectedMix;
        window.proposalData.sustainable.maintenance = calculateMaintenanceLevel(selectedMix);
        window.proposalData.sustainable.water = calculateWaterNeeds(selectedMix);
    } else {
        window.proposalData.aesthetic.cost = currentCost;
        window.proposalData.aesthetic.plants = selectedMix;
        window.proposalData.aesthetic.maintenance = calculateMaintenanceLevel(selectedMix);
        window.proposalData.aesthetic.water = calculateWaterNeeds(selectedMix);
    }
}

function createTooltip(plant) {
    const hasWarnings = plant.warnings && plant.warnings.length > 0;
    const hasCompatibility = plant.compatibleWith && plant.compatibleWith.length > 0;

    if (!hasWarnings && !hasCompatibility && !plant.sunExposure) {
        return '';
    }

    let tooltipContent = `
        <div class="tooltip-content">
            <h4>${plant.name}</h4>
            <p><strong>💧 Agua:</strong> ${getWaterLabel(plant.waterNeeds)}</p>
            <p><strong>🛠️ Mantenimiento:</strong> ${getMaintenanceLabel(plant.maintenance)}</p>
    `;

    if (plant.sunExposure) {
        tooltipContent += `<p><strong>☀️ Exposición:</strong> ${plant.sunExposure}</p>`;
    }

    if (plant.bloomSeason) {
        tooltipContent += `<p><strong>🌸 Floración:</strong> ${plant.bloomSeason}</p>`;
    }

    if (hasCompatibility) {
        tooltipContent += `<p class="compatible"><strong>✓ Compatible con:</strong> ${plant.compatibleWith.join(', ')}</p>`;
    }

    if (hasWarnings) {
        tooltipContent += `<div class="warning">`;
        plant.warnings.forEach(warning => {
            tooltipContent += `<p>${warning}</p>`;
        });
        tooltipContent += `</div>`;
    }

    tooltipContent += `</div>`;

    return `
        <span class="tooltip-wrapper">
            <span class="tooltip-icon">i</span>
            ${tooltipContent}
        </span>
    `;
}

function getWaterLabel(level) {
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

function getMaintenanceLabel(level) {
    const labels = {
        'very_low': 'Muy bajo',
        'low': 'Bajo',
        'medium': 'Medio',
        'high': 'Alto'
    };
    return labels[level] || level;
}

function calculateMaintenanceLevel(plants) {
    const maintenanceLevels = { 'very_low': 1, 'low': 2, 'medium': 3, 'high': 4 };
    const avg = plants.reduce((sum, p) => sum + (maintenanceLevels[p.maintenance] || 2), 0) / plants.length;

    if (avg <= 1.5) return 'low';
    if (avg <= 2.5) return 'medium';
    return 'high';
}

function calculateWaterNeeds(plants) {
    const waterLevels = { 'none': 0, 'very_low': 1, 'low': 2, 'medium_low': 2.5, 'medium': 3, 'high': 4 };
    const avg = plants.reduce((sum, p) => sum + (waterLevels[p.waterNeeds] || 2), 0) / plants.length;

    if (avg <= 1.5) return 'low';
    if (avg <= 2.5) return 'medium';
    return 'high';
}

function renderComparisonTable() {
    const tbody = document.getElementById('comparison-tbody');
    if (!tbody || !window.proposalData) return;

    const { sustainable, aesthetic } = window.proposalData;

    tbody.innerHTML = `
        <tr>
            <td class="metric-name">💰 Coste Total</td>
            <td class="metric-value highlight">${sustainable.cost || 0} €</td>
            <td class="metric-value highlight">${aesthetic.cost || 0} €</td>
        </tr>
        <tr>
            <td class="metric-name">🌱 Número de Plantas</td>
            <td class="metric-value">${sustainable.plants?.reduce((sum, p) => sum + p.qty, 0) || 0}</td>
            <td class="metric-value">${aesthetic.plants?.reduce((sum, p) => sum + p.qty, 0) || 0}</td>
        </tr>
        <tr>
            <td class="metric-name">🛠️ Mantenimiento</td>
            <td class="metric-value">
                <span class="badge-mini ${sustainable.maintenance || 'low'}">${getMaintenanceLabel(sustainable.maintenance || 'low')}</span>
            </td>
            <td class="metric-value">
                <span class="badge-mini ${aesthetic.maintenance || 'medium'}">${getMaintenanceLabel(aesthetic.maintenance || 'medium')}</span>
            </td>
        </tr>
        <tr>
            <td class="metric-name">💧 Necesidades de Agua</td>
            <td class="metric-value">
                <span class="badge-mini ${sustainable.water || 'low'}">${getWaterLabel(sustainable.water || 'low')}</span>
            </td>
            <td class="metric-value">
                <span class="badge-mini ${aesthetic.water || 'medium'}">${getWaterLabel(aesthetic.water || 'medium')}</span>
            </td>
        </tr>
        <tr>
            <td class="metric-name">🌿 Especies Únicas</td>
            <td class="metric-value">${sustainable.plants?.length || 0} tipos</td>
            <td class="metric-value">${aesthetic.plants?.length || 0} tipos</td>
        </tr>
        <tr>
            <td class="metric-name">🏆 Recomendación</td>
            <td class="metric-value">${sustainable.cost < aesthetic.cost ? '✓ Más económica' : ''}</td>
            <td class="metric-value">${aesthetic.cost < sustainable.cost ? '✓ Más económica' : ''}</td>
        </tr>
    `;
}

// Exponer globalmente para que history-functions.js pueda usarla  
window.renderComparisonTable = renderComparisonTable;

/**
 * Renderiza propuestas generadas por Gemini AI
 */
function renderAIProposals(aiProposals, targetBudget) {
    console.log('Renderizando propuestas de AI:', aiProposals);

    // Renderizar propuesta sostenible
    if (aiProposals.sustainable) {
        renderAIProposal(aiProposals.sustainable, 'proposal-a');
    }

    // Renderizar propuesta estética
    if (aiProposals.aesthetic) {
        renderAIProposal(aiProposals.aesthetic, 'proposal-b');
    }

    // Guardar datos para comparación
    window.proposalData = {
        sustainable: {
            plants: aiProposals.sustainable?.plants || [],
            cost: aiProposals.sustainable?.totalCost || 0,
            maintenance: aiProposals.sustainable?.estimatedMaintenance || 'low',
            water: aiProposals.sustainable?.estimatedWaterConsumption || 'low'
        },
        aesthetic: {
            plants: aiProposals.aesthetic?.plants || [],
            cost: aiProposals.aesthetic?.totalCost || 0,
            maintenance: aiProposals.aesthetic?.estimatedMaintenance || 'medium',
            water: aiProposals.aesthetic?.estimatedWaterConsumption || 'medium'
        }
    };

    // Actualizar tabla de comparación
    renderComparisonTable();
}

function renderAIProposal(proposal, elementId) {
    const listElement = document.querySelector(`#${elementId} .plant-list`);
    const costElement = document.querySelector(`#${elementId} .cost-value`);
    const descriptionElement = document.querySelector(`#${elementId} .description`);
    const notesElement = document.querySelector(`#${elementId} .additional-notes`);

    if (!listElement || !costElement) {
        console.error(`ERROR: No se encontraron elementos para #${elementId}`);
        return;
    }

    // Actualizar descripción si está disponible
    if (descriptionElement && proposal.description) {
        descriptionElement.textContent = proposal.description;
    }

    // Limpiar lista
    listElement.innerHTML = '';

    // Renderizar plantas
    if (proposal.plants && proposal.plants.length > 0) {
        proposal.plants.forEach(plant => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${plant.quantity}x</strong> ${plant.name} <small>(${plant.cost}€/ud)</small>
                ${createTooltipForAIPlant(plant)}
            `;
            listElement.appendChild(li);
        });
    } else {
        listElement.innerHTML = '<li>No se generaron plantas para esta propuesta.</li>';
    }

    // Renderizar notas adicionales si están disponibles
    if (notesElement && proposal.additionalNotes) {
        notesElement.innerHTML = `
            <div class="notes-header">
                <h4>📝 Notas Importantes para Palma (Mallorca)</h4>
            </div>
            <div class="notes-content">
                <p>${proposal.additionalNotes}</p>
            </div>
        `;
        notesElement.style.display = 'block';
    } else if (notesElement) {
        notesElement.style.display = 'none';
    }

    // Actualizar coste
    costElement.textContent = `${proposal.totalCost || 0} €`;
}

// Exponer globalmente para que history-functions.js pueda usarla
window.renderAIProposal = renderAIProposal;

function createTooltipForAIPlant(plant) {
    let tooltipContent = `
        <div class="tooltip-content">
            <h4>${plant.name}</h4>
            <p><strong>💧 Agua:</strong> ${getWaterLabel(plant.waterNeeds)}</p>
            <p><strong>🛠️ Mantenimiento:</strong> ${getMaintenanceLabel(plant.maintenance)}</p>
        </div>
    `;

    return `
        <span class="tooltip-wrapper">
            <span class="tooltip-icon">i</span>
            ${tooltipContent}
        </span>
    `;
}

/**
 * Funci�n auxiliar para guardar dise�o de forma as�ncrona
 */
async function saveCurrentDesignAsync(designName, inputs, proposals) {
    // No intentar guardar si Supabase no está configurado
    if (!isSupabaseConfigured()) {
        console.log('ℹ️ Supabase no configurado, diseño no guardado');
        return;
    }

    try {
        console.log('💾 Guardando diseño:', designName);

        const comparisonData = window.proposalData || {
            sustainable: { plants: [], cost: 0, maintenance: '', water: '' },
            aesthetic: { plants: [], cost: 0, maintenance: '', water: '' }
        };

        console.log('📊 Comparison data:', comparisonData);

        const designData = {
            name: designName,
            inputs: inputs,
            proposals: {
                sustainable: proposals.sustainable || proposals.proposalData?.sustainable,
                aesthetic: proposals.aesthetic || proposals.proposalData?.aesthetic
            },
            comparisonData: comparisonData
        };

        console.log('📦 Design data to save:', designData);

        // Guardar en Supabase
        const designId = await saveDesign(designData, uploadedImages);

        console.log('✅ Diseño guardado con ID:', designId);

        // Mostrar notificación
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <span class="notification-icon">✅</span>
            <span class="notification-message">Diseño guardado como: ${designName}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);

    } catch (error) {
        console.error('❌ Error al guardar diseño:', error);

        // Mostrar notificación de error
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <span class="notification-icon">❌</span>
            <span class="notification-message">Error al guardar: ${error.message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}
