/**
 * Funciones del sistema de historial de diseños
 * Para integrar en app.js
 */

import { saveDesign, getAllDesigns, deleteDesign, getDesignById, isSupabaseConfigured } from './supabase-service.js';

// Utility: Mostrar notificación
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="notification-message">${message}</span>
    `;
    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Utility: Formatear fecha
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// Utility: Obtener etiqueta de estilo
function getStyleLabel(style) {
    const labels = {
        'mediterranean': 'Mediterráneo',
        'modern': 'Minimalismo',
        'xerogardening': 'Xerojardín',
        'tropical': 'Tropical',
        'coastal': 'Costero',
        'zen': 'Zen'
    };
    return labels[style] || style;
}

// Guardar diseño en Supabase
async function saveCurrentDesign(designName, inputs, proposals, comparisonData) {
    if (!isSupabaseConfigured()) {
        console.log('ℹ️ Supabase no configurado, diseño no guardado');
        return null;
    }

    try {
        const designData = {
            name: designName,
            inputs: inputs,
            proposals: proposals,
            comparisonData: comparisonData
        };

        // Guardar en Supabase (con imágenes)
        const designId = await saveDesign(designData, uploadedImages);

        showNotification(`✅ Diseño guardado como: ${designName}`, 'success');
        return designId;

    } catch (error) {
        console.error('Error al guardar diseño:', error);
        showNotification(`Error al guardar diseño: ${error.message}`, 'error');
        return null;
    }
}

// Mostrar historial
async function showHistory() {
    console.log('📚 Mostrando historial...');

    const inputSection = document.getElementById('input-section');
    const resultsSection = document.getElementById('results-section');
    const historySection = document.getElementById('history-section');
    const historyContent = document.getElementById('history-content');
    const emptyHistory = document.getElementById('empty-history');

    // Ocultar otras secciones
    inputSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    historySection.classList.remove('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        // Intentar cargar diseños (esto inicializará Supabase si es necesario)
        const designs = await getAllDesigns();

        if (designs.length === 0) {
            emptyHistory.classList.remove('hidden');
            historyContent.innerHTML = '';
        } else {
            emptyHistory.classList.add('hidden');
            renderHistoryCards(designs);
        }

    } catch (error) {
        console.error('Error al cargar historial:', error);

        // Verificar si el error es por configuración
        if (error.message.includes('no está configurado')) {
            emptyHistory.classList.remove('hidden');
            historyContent.innerHTML = `
                <div class="warning-message">
                    <p>⚠️ Supabase no está configurado. Por favor, sigue las instrucciones en SUPABASE_SETUP.md</p>
                </div>
            `;
        } else {
            // Otro tipo de error
            emptyHistory.classList.remove('hidden');
            historyContent.innerHTML = `
                <div class="error-message">
                    <p>❌ Error al cargar historial: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Renderizar tarjetas de historial
function renderHistoryCards(designs) {
    const historyContent = document.getElementById('history-content');
    historyContent.innerHTML = '';

    designs.forEach(design => {
        const card = document.createElement('div');
        card.className = 'design-card';

        card.innerHTML = `
            <div class="design-card-header">
                <div class="design-card-title">
                    🌿 ${design.name}
                </div>
                <div class="design-card-date">
                    📅 ${formatDate(design.created_at)}
                </div>
            </div>
            <div class="design-card-body">
                <div class="design-card-meta">
                    <div class="design-meta-item">
                        <span class="design-meta-label">Estilo:</span>
                        <span class="design-meta-value">${getStyleLabel(design.style)}</span>
                    </div>
                    <div class="design-meta-item">
                        <span class="design-meta-label">Presupuesto:</span>
                        <span class="design-meta-value">${design.budget}€</span>
                    </div>
                    <div class="design-meta-item">
                        <span class="design-meta-label">Tipo de suelo:</span>
                        <span class="design-meta-value">${design.soil_type}</span>
                    </div>
                </div>
            </div>
            <div class="design-card-actions">
                <button class="design-card-btn btn-view" onclick="loadDesign('${design.id}')">
                    👁️ Ver Diseño
                </button>
                <button class="design-card-btn btn-delete" onclick="confirmDeleteDesign('${design.id}', '${design.name}')">
                    🗑️
                </button>
            </div>
        `;

        historyContent.appendChild(card);
    });
}

// Cargar diseño desde historial
async function loadDesign(designId) {
    console.log(`📂 Cargando diseño: ${designId}`);

    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.remove('hidden');

    try {
        const design = await getDesignById(designId);

        // Actualizar variable global
        window.currentLoadedDesignId = designId;

        // Preparar datos para renderizado
        const proposals = {
            sustainable: design.proposal_sustainable,
            aesthetic: design.proposal_aesthetic
        };

        const comparisonData = design.comparison_data;

        // Actualizar window.proposalData
        window.proposalData = comparisonData || {
            sustainable: { plants: [], cost: 0, maintenance: '', water: '' },
            aesthetic: { plants: [], cost: 0, maintenance: '', water: '' }
        };

        // Renderizar propuestas (reutilizar función existente)
        renderLoadedProposals(proposals, design.name);

        // Ocultar loading y mostrar resultados
        loadingOverlay.classList.add('hidden');

        const historySection = document.getElementById('history-section');
        const resultsSection = document.getElementById('results-section');

        historySection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error al cargar diseño:', error);
        loadingOverlay.classList.add('hidden');
        showNotification(`Error al cargar diseño: ${error.message}`, 'error');
    }
}

// Renderizar propuestas cargadas
function renderLoadedProposals(proposals, designName) {
    const designTitle = document.getElementById('design-title');
    const designBadge = document.getElementById('design-badge');

    // Actualizar título y badge
    designTitle.textContent = designName;
    designBadge.textContent = 'Guardado';
    designBadge.className = 'design-badge loaded-badge';

    // Renderizar propuesta sostenible
    if (proposals.sustainable) {
        window.renderAIProposal(proposals.sustainable, 'proposal-a');
    }

    // Renderizar propuesta estética
    if (proposals.aesthetic) {
        window.renderAIProposal(proposals.aesthetic, 'proposal-b');
    }

    // Actualizar tabla de comparación
    if (typeof window.renderComparisonTable === 'function') {
        window.renderComparisonTable();
    }
}

// Confirmar eliminación
function confirmDeleteDesign(designId, designName) {
    if (confirm(`¿Estás seguro de que quieres eliminar "${designName}"?\n\nEsta acción no se puede deshacer.`)) {
        deleteDesignFromHistory(designId);
    }
}

// Eliminar diseño
async function deleteDesignFromHistory(designId) {
    console.log(`🗑️ Eliminando diseño: ${designId}`);

    try {
        await deleteDesign(designId);
        showNotification('Diseño eliminado correctamente', 'success');

        // Recargar historial
        await showHistory();

    } catch (error) {
        console.error('Error al eliminar diseño:', error);
        showNotification(`Error al eliminar diseño: ${error.message}`, 'error');
    }
}

// Cerrar historial
function closeHistory() {
    const historySection = document.getElementById('history-section');
    const inputSection = document.getElementById('input-section');

    historySection.classList.add('hidden');
    inputSection.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Exponer funciones globalmente para onclick
window.loadDesign = loadDesign;
window.confirmDeleteDesign = confirmDeleteDesign;
window.deleteDesignFromHistory = deleteDesignFromHistory;
window.showHistory = showHistory;
window.closeHistory = closeHistory;
