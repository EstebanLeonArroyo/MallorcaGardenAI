import { useEffect, useState } from 'react';

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

function getStyleLabel(style) {
    const labels = {
        'mediterranean': 'Mediterraneo',
        'modern': 'Minimalismo',
        'xerogardening': 'Xerojardin',
        'tropical': 'Tropical',
        'coastal': 'Costero',
        'zen': 'Zen'
    };
    return labels[style] || style;
}

function getSoilLabel(soil) {
    const labels = {
        'clay': 'Arcilloso',
        'limestone': 'Calcareo',
        'sandy': 'Arenoso'
    };
    return labels[soil] || soil;
}

function DesignImages({ imageUrls }) {
    if (!imageUrls || imageUrls.length === 0) return null;

    return (
        <div className="design-card-images">
            {imageUrls.map((url, index) => (
                <div key={index} className="design-card-image-item">
                    <img src={url} alt={`Foto terreno ${index + 1}`} loading="lazy" />
                </div>
            ))}
        </div>
    );
}

export default function HistoryPanel({ history, onClose, onLoadDesign }) {
    const [expandedCard, setExpandedCard] = useState(null);

    useEffect(() => {
        history.loadDesigns();
    }, []);

    const handleDelete = async (id, name) => {
        if (confirm(`¿Estás seguro de que quieres eliminar "${name}"?\n\nEsta acción no se puede deshacer.`)) {
            try {
                await history.deleteDesign(id);
            } catch {
                // Error handled in hook
            }
        }
    };

    const toggleExpand = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    return (
        <section id="history-section">
            <div className="history-header">
                <h2>Historial de Diseños</h2>
                <button className="secondary-button" onClick={onClose}>Volver</button>
            </div>

            {history.error && (
                <div className="error-message">
                    <p>Error: {history.error}</p>
                </div>
            )}

            <div id="history-content">
                {history.designs.map(design => (
                    <div key={design.id} className={`design-card${expandedCard === design.id ? ' expanded' : ''}`}>
                        <div className="design-card-header">
                            <div className="design-card-title">{design.name}</div>
                            <div className="design-card-date">{formatDate(design.created_at)}</div>
                        </div>

                        {/* Image gallery */}
                        <DesignImages imageUrls={design.imageUrls} />

                        <div className="design-card-body">
                            <div className="design-card-meta">
                                <div className="design-meta-item">
                                    <span className="design-meta-label">Estilo:</span>
                                    <span className="design-meta-value">{getStyleLabel(design.style)}</span>
                                </div>
                                <div className="design-meta-item">
                                    <span className="design-meta-label">Presupuesto:</span>
                                    <span className="design-meta-value">{design.budget} EUR</span>
                                </div>
                                <div className="design-meta-item">
                                    <span className="design-meta-label">Tipo de suelo:</span>
                                    <span className="design-meta-value">{getSoilLabel(design.soil_type)}</span>
                                </div>
                                {design.garden_length && design.garden_width && (
                                    <div className="design-meta-item">
                                        <span className="design-meta-label">Dimensiones:</span>
                                        <span className="design-meta-value">{design.garden_length}m x {design.garden_width}m</span>
                                    </div>
                                )}
                                {design.garden_area && (
                                    <div className="design-meta-item">
                                        <span className="design-meta-label">Area:</span>
                                        <span className="design-meta-value">{design.garden_area} m2</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="design-card-actions">
                            <button
                                className="design-card-btn btn-view"
                                onClick={() => onLoadDesign(design.id)}
                            >
                                Ver Diseño
                            </button>
                            <button
                                className="design-card-btn btn-delete"
                                onClick={() => handleDelete(design.id, design.name)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {history.designs.length === 0 && !history.error && !history.loading && (
                <div className="empty-state">
                    <div className="empty-icon">Sin diseños</div>
                    <h3>No hay diseños guardados aun</h3>
                    <p>Crea tu primer diseño de jardin y aparecera aqui</p>
                    <button className="cta-button" onClick={onClose}>Crear mi primer diseño</button>
                </div>
            )}
        </section>
    );
}
