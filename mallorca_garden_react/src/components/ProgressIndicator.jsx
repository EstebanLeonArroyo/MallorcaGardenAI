export default function ProgressIndicator({ currentStep }) {
    const steps = [
        { number: 1, label: 'Terreno' },
        { number: 2, label: 'Suelo' },
        { number: 3, label: 'Estilo' },
        { number: 4, label: 'Presupuesto' }
    ];

    return (
        <div className="progress-indicator">
            {steps.map(step => (
                <div
                    key={step.number}
                    className={`progress-step${currentStep >= step.number ? ' active' : ''}`}
                    data-step={step.number}
                >
                    <span className="step-number">{step.number}</span>
                    <span className="step-label">{step.label}</span>
                </div>
            ))}
        </div>
    );
}
