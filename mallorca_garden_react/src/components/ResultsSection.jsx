import { useState, useCallback, useEffect, useRef } from 'react';
import ProposalCard from './ProposalCard';
import ComparisonTable from './ComparisonTable';

const MIN_GARDEN_PRICE = 75;

function recalcTotalCost(plants) {
    return plants.reduce((sum, p) => {
        const qty = p.quantity || p.qty || 0;
        const cost = p.cost || 0;
        return sum + qty * cost;
    }, 0);
}

function cloneProposals(proposals) {
    if (!proposals) return null;
    return {
        sustainable: proposals.sustainable ? {
            ...proposals.sustainable,
            plants: (proposals.sustainable.plants || []).map(p => ({ ...p })),
        } : null,
        aesthetic: proposals.aesthetic ? {
            ...proposals.aesthetic,
            plants: (proposals.aesthetic.plants || []).map(p => ({ ...p })),
        } : null,
    };
}

export default function ResultsSection({ proposals, designName, isLoaded, onReset, onUpdateProposals }) {
    const [showComparison, setShowComparison] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Local copy of proposals that persists edits
    const [localProposals, setLocalProposals] = useState(() => cloneProposals(proposals));
    const prevProposalsRef = useRef(proposals);

    // Sync local state when the parent passes a completely new proposals object
    // (e.g. new design generated or loaded from history)
    useEffect(() => {
        if (proposals !== prevProposalsRef.current) {
            setLocalProposals(cloneProposals(proposals));
            setIsEditing(false);
            prevProposalsRef.current = proposals;
        }
    }, [proposals]);

    const handleStartEdit = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleConfirm = useCallback(() => {
        if (!localProposals) return;

        // Filter out plants with 0 quantity and enforce minimum cost
        const confirmed = cloneProposals(localProposals);

        if (confirmed.sustainable) {
            confirmed.sustainable.plants = (confirmed.sustainable.plants || []).filter(p => (p.quantity || p.qty || 0) > 0);
            const rawCost = recalcTotalCost(confirmed.sustainable.plants);
            confirmed.sustainable.totalCost = Math.max(rawCost, MIN_GARDEN_PRICE);
        }

        if (confirmed.aesthetic) {
            confirmed.aesthetic.plants = (confirmed.aesthetic.plants || []).filter(p => (p.quantity || p.qty || 0) > 0);
            const rawCost = recalcTotalCost(confirmed.aesthetic.plants);
            confirmed.aesthetic.totalCost = Math.max(rawCost, MIN_GARDEN_PRICE);
        }

        // Persist locally
        setLocalProposals(confirmed);
        setIsEditing(false);

        // Also notify parent (optional, for syncing back)
        if (onUpdateProposals) {
            onUpdateProposals(confirmed);
        }
    }, [localProposals, onUpdateProposals]);

    const handleChangeQuantity = useCallback((type, plantIndex, delta) => {
        setLocalProposals(prev => {
            if (!prev || !prev[type]) return prev;
            const updated = { ...prev };
            updated[type] = { ...updated[type] };
            updated[type].plants = updated[type].plants.map((p, i) => {
                if (i !== plantIndex) return p;
                const currentQty = p.quantity || p.qty || 0;
                const newQty = Math.max(0, currentQty + delta);
                return { ...p, quantity: newQty, qty: newQty };
            });
            updated[type].totalCost = Math.max(recalcTotalCost(updated[type].plants), MIN_GARDEN_PRICE);
            return updated;
        });
    }, []);

    const handleDeletePlant = useCallback((type, plantIndex) => {
        setLocalProposals(prev => {
            if (!prev || !prev[type]) return prev;
            const updated = { ...prev };
            updated[type] = { ...updated[type] };
            updated[type].plants = updated[type].plants.filter((_, i) => i !== plantIndex);
            updated[type].totalCost = Math.max(recalcTotalCost(updated[type].plants), MIN_GARDEN_PRICE);
            return updated;
        });
    }, []);

    // Always render from local state
    const displayProposals = localProposals;

    const proposalData = displayProposals ? {
        sustainable: displayProposals.sustainable,
        aesthetic: displayProposals.aesthetic
    } : null;

    return (
        <section id="results-section">
            <div className="results-header">
                <div className="results-title-group">
                    <h2 id="design-title">{designName || 'Tus Propuestas Personalizadas'}</h2>
                    <span
                        id="design-badge"
                        className={`design-badge ${isLoaded ? 'loaded-badge' : 'new-badge'}`}
                    >
                        {isLoaded ? 'Guardado' : 'Nuevo'}
                    </span>
                </div>
                <div className="results-header-actions">
                    <button
                        className={`edit-toggle-btn${isEditing ? ' confirming' : ''}`}
                        onClick={isEditing ? handleConfirm : handleStartEdit}
                    >
                        {isEditing ? '✓ Confirmar' : '✎ Editar'}
                    </button>
                    <button
                        className={`comparison-toggle${showComparison ? ' active' : ''}`}
                        onClick={() => setShowComparison(!showComparison)}
                    >
                        <span className="toggle-icon">vs</span>
                        <span className="toggle-text">Modo Comparacion</span>
                    </button>
                </div>
            </div>

            {/* Comparison Table */}
            <div className={`comparison-container${showComparison ? ' active' : ''}`}>
                <ComparisonTable proposalData={proposalData} />
            </div>

            {/* Proposal Cards */}
            <div className="proposals-container" style={{ display: showComparison ? 'none' : 'grid' }}>
                <ProposalCard
                    proposal={displayProposals?.sustainable}
                    type="sustainable"
                    isEditing={isEditing}
                    onChangeQuantity={(idx, delta) => handleChangeQuantity('sustainable', idx, delta)}
                    onDeletePlant={(idx) => handleDeletePlant('sustainable', idx)}
                />
                <ProposalCard
                    proposal={displayProposals?.aesthetic}
                    type="aesthetic"
                    isEditing={isEditing}
                    onChangeQuantity={(idx, delta) => handleChangeQuantity('aesthetic', idx, delta)}
                    onDeletePlant={(idx) => handleDeletePlant('aesthetic', idx)}
                />
            </div>

            <button className="secondary-button" onClick={onReset}>Diseñar otro jardin</button>
        </section>
    );
}
