import { useState } from 'react';
import { useImageDesign } from '../hooks/useImageDesign';

export default function ImageDesignPage() {
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const {
        designs,
        selectedDesign,
        loading,
        generating,
        error,
        selectDesign,
        generate,
    } = useImageDesign();

    const hasGeneratedImage = (design, type) =>
        design?.generated_images?.[type]?.generated_url;

    const hasAnyGeneratedImage = (design) =>
        hasGeneratedImage(design, 'sustainable') || hasGeneratedImage(design, 'aesthetic');

    if (!selectedDesign) {
        return (
            <div className="imgdesign-empty">
                <div className="imgdesign-empty-icon">🖼️</div>
                <h2>Diseño en Imagen</h2>
                <p>Genera una imagen de cómo quedaría tu jardín con IA</p>

                {loading && <p className="imgdesign-sidebar-loading">Cargando diseños...</p>}

                {!loading && designs.length === 0 && (
                    <p className="imgdesign-sidebar-empty">
                        No tienes diseños aún. Crea uno primero en "Crear Jardín".
                    </p>
                )}

                {!loading && designs.length > 0 && (
                    <div className="imgdesign-design-grid">
                        {designs.map(design => (
                            <button
                                key={design.id}
                                className="imgdesign-design-card"
                                onClick={() => selectDesign(design)}
                            >
                                <span className="imgdesign-design-card-name">{design.name}</span>
                                {hasAnyGeneratedImage(design) && (
                                    <span className="imgdesign-sidebar-badge">✓ Imagen</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="imgdesign-layout">
            {/* Sidebar con lista de diseños */}
            <aside className="imgdesign-sidebar">
                <h3 className="imgdesign-sidebar-title">Mis Diseños</h3>

                <div className="imgdesign-sidebar-list">
                    {designs.map(design => (
                        <button
                            key={design.id}
                            className={`imgdesign-sidebar-item${selectedDesign?.id === design.id ? ' active' : ''}`}
                            onClick={() => selectDesign(design)}
                        >
                            <span className="imgdesign-sidebar-item-name">{design.name}</span>
                            {hasAnyGeneratedImage(design) && (
                                <span className="imgdesign-sidebar-badge">✓ Imagen</span>
                            )}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Área principal */}
            <main className="imgdesign-main">
                <div className="imgdesign-content">
                    <h2 className="imgdesign-title">{selectedDesign.name}</h2>

                    {error && (
                        <div className="imgdesign-error">{error}</div>
                    )}

                    {/* Pantalla de carga durante generación */}
                    {generating && (
                        <div className="imgdesign-generating">
                            <div className="imgdesign-spinner"></div>
                            <p>Generando imagen con IA...</p>
                            <small>Esto puede tardar 30-60 segundos</small>
                        </div>
                    )}

                    {!generating && (
                        <div className="imgdesign-proposals">
                            {/* Propuesta Sostenible */}
                            {selectedDesign.proposal_sustainable && (
                                <ProposalCard
                                    title="Propuesta Sostenible"
                                    badge="🌿 Sostenible"
                                    proposal={selectedDesign.proposal_sustainable}
                                    generatedData={selectedDesign.generated_images?.sustainable}
                                    onGenerate={() => generate('sustainable')}
                                    generating={generating}
                                    onImageClick={setLightboxUrl}
                                />
                            )}

                            {/* Propuesta Estética */}
                            {selectedDesign.proposal_aesthetic && (
                                <ProposalCard
                                    title="Propuesta Estética"
                                    badge="🎨 Estética"
                                    proposal={selectedDesign.proposal_aesthetic}
                                    generatedData={selectedDesign.generated_images?.aesthetic}
                                    onGenerate={() => generate('aesthetic')}
                                    generating={generating}
                                    onImageClick={setLightboxUrl}
                                />
                            )}
                        </div>
                    )}

                    {/* Lightbox modal para ver imagen ampliada */}
                    {lightboxUrl && (
                        <div className="imgdesign-lightbox" onClick={() => setLightboxUrl(null)}>
                            <button className="imgdesign-lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
                            <img
                                src={lightboxUrl}
                                alt="Imagen ampliada del jardín"
                                className="imgdesign-lightbox-img"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

/**
 * Tarjeta de propuesta con antes/después o botón de generar
 */
function ProposalCard({ title, badge, proposal, generatedData, onGenerate, generating, onImageClick }) {
    const hasImage = generatedData?.generated_url;

    // Añadir cache-buster a generated_url para evitar que el navegador muestre la imagen antigua tras regenerar
    const generatedUrl = hasImage
        ? `${generatedData.generated_url}${generatedData.generated_url.includes('?') ? '&' : '?'}t=${new Date(generatedData.created_at).getTime()}`
        : null;

    return (
        <div className="imgdesign-proposal-card">
            <div className="imgdesign-proposal-header">
                <span className="imgdesign-proposal-badge">{badge}</span>
                <h3>{title}</h3>
                <p className="imgdesign-proposal-plants">
                    {(proposal.plants || []).slice(0, 5).map(p => p.name).join(', ')}
                    {(proposal.plants || []).length > 5 && '...'}
                </p>
            </div>

            {hasImage ? (
                /* Vista antes/después */
                <div className="imgdesign-comparison">
                    <div className="imgdesign-comparison-item">
                        <span className="imgdesign-comparison-label">Antes</span>
                        <img
                            src={generatedData.original_url}
                            alt="Foto original del jardín"
                            className="imgdesign-comparison-img"
                            onClick={() => onImageClick(generatedData.original_url)}
                        />
                    </div>
                    <div className="imgdesign-comparison-arrow">→</div>
                    <div className="imgdesign-comparison-item">
                        <span className="imgdesign-comparison-label imgdesign-comparison-label--after">Después</span>
                        <img
                            src={generatedUrl}
                            alt="Jardín transformado con IA"
                            className="imgdesign-comparison-img"
                            onClick={() => onImageClick(generatedUrl)}
                        />
                        <button
                            className="imgdesign-enlarge-btn"
                            onClick={() => onImageClick(generatedUrl)}
                            title="Ver imagen ampliada"
                        >
                            🔍 Ampliar
                        </button>
                    </div>
                </div>
            ) : (
                /* Botón para generar */
                <div className="imgdesign-generate-area">
                    <p className="imgdesign-generate-text">
                        Transforma tu foto del jardín con las plantas de esta propuesta
                    </p>
                    <button
                        className="imgdesign-generate-btn"
                        onClick={onGenerate}
                        disabled={generating}
                    >
                        🎨 Convertir en Imagen
                    </button>
                </div>
            )}

            {/* Botón de regenerar si ya tiene imagen */}
            {hasImage && (
                <button
                    className="imgdesign-regenerate-btn"
                    onClick={onGenerate}
                    disabled={generating}
                >
                    ↻ Regenerar imagen
                </button>
            )}
        </div>
    );
}
