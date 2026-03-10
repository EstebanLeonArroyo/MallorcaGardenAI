import { getWaterLabel, getMaintenanceLabel } from '../services/proposalEngine';

function PlantTooltip({ plant }) {
    const hasWarnings = plant.warnings && plant.warnings.length > 0;
    const hasCompatibility = plant.compatibleWith && plant.compatibleWith.length > 0;
    const hasDetails = hasWarnings || hasCompatibility || plant.sunExposure;

    if (!hasDetails) return null;

    return (
        <span className="tooltip-wrapper">
            <span className="tooltip-icon">i</span>
            <div className="tooltip-content">
                <h4>{plant.name}</h4>
                <p><strong>Agua:</strong> {getWaterLabel(plant.waterNeeds)}</p>
                <p><strong>Mantenimiento:</strong> {getMaintenanceLabel(plant.maintenance)}</p>
                {plant.sunExposure && (
                    <p><strong>Exposicion:</strong> {plant.sunExposure}</p>
                )}
                {plant.bloomSeason && (
                    <p><strong>Floracion:</strong> {plant.bloomSeason}</p>
                )}
                {hasCompatibility && (
                    <p className="compatible">
                        <strong>Compatible con:</strong> {plant.compatibleWith.join(', ')}
                    </p>
                )}
                {hasWarnings && (
                    <div className="warning">
                        {plant.warnings.map((w, i) => <p key={i}>{w}</p>)}
                    </div>
                )}
            </div>
        </span>
    );
}

export default function ProposalCard({ proposal, type, isEditing, onChangeQuantity, onDeletePlant }) {
    const isAesthetic = type === 'aesthetic';
    const cardId = isAesthetic ? 'proposal-b' : 'proposal-a';
    const badgeText = isAesthetic ? 'Opcion Estetica' : 'Opcion Sostenible';
    const defaultTitle = isAesthetic ? 'Jardin de Impacto Visual' : 'Jardin Nativo Resiliente';
    const defaultDesc = isAesthetic
        ? 'Diseño enfocado en la belleza y el estilo seleccionado.'
        : 'Optimizado para el clima de Mallorca con el menor mantenimiento posible.';

    const plants = proposal?.plants || [];
    const totalCost = proposal?.totalCost || 0;

    return (
        <article className={`proposal-card${isEditing ? ' editing' : ''}`} id={cardId}>
            <div className="card-header">
                <span className={`badge${isAesthetic ? ' aesthetic' : ''}`}>{badgeText}</span>
                <h3>{proposal?.title || defaultTitle}</h3>
            </div>
            <div className="proposal-content">
                <p className="description">{proposal?.description || defaultDesc}</p>
                <ul className="plant-list">
                    {plants.length === 0 ? (
                        <li className="plant-empty-msg">No se encontraron plantas para esta propuesta.</li>
                    ) : (
                        plants.map((plant, index) => {
                            const qty = plant.quantity || plant.qty || 0;
                            return (
                                <li key={index} className={`plant-item${isEditing ? ' plant-item-editing' : ''}`}>
                                    {isEditing ? (
                                        <>
                                            <div className="plant-edit-controls">
                                                <div className="qty-stepper">
                                                    <button
                                                        className="qty-stepper-btn decrease"
                                                        onClick={() => onChangeQuantity(index, -1)}
                                                        disabled={qty <= 0}
                                                        title="Disminuir"
                                                    >
                                                        ‹
                                                    </button>
                                                    <span className="qty-display">{qty}</span>
                                                    <button
                                                        className="qty-stepper-btn increase"
                                                        onClick={() => onChangeQuantity(index, 1)}
                                                        title="Aumentar"
                                                    >
                                                        ›
                                                    </button>
                                                </div>
                                                <span className="plant-name-edit">{plant.name}</span>
                                                <small className="plant-cost-edit">({plant.cost} EUR/ud)</small>
                                                <button
                                                    className="plant-delete-btn"
                                                    onClick={() => onDeletePlant(index)}
                                                    title="Eliminar planta"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <strong>{qty}x</strong> {plant.name}{' '}
                                            <small>({plant.cost} EUR/ud)</small>
                                            <PlantTooltip plant={plant} />
                                        </>
                                    )}
                                </li>
                            );
                        })
                    )}
                </ul>

                {proposal?.additionalNotes && (
                    <div className="additional-notes" style={{ display: 'block' }}>
                        <div className="notes-header">
                            <h4>Notas Importantes para Palma (Mallorca)</h4>
                        </div>
                        <div className="notes-content">
                            <p>{proposal.additionalNotes}</p>
                        </div>
                    </div>
                )}

                <div className="cost-breakdown">
                    <span>Estimacion:</span>
                    <span className={`cost-value${isEditing ? ' cost-editing' : ''}`}>{totalCost} EUR</span>
                </div>
            </div>
        </article>
    );
}
