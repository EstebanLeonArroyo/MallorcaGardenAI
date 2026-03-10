const SOIL_OPTIONS = [
    { value: 'clay', icon: 'A', name: 'Arcilloso', description: 'Rojizo, pesado, retiene agua.' },
    { value: 'limestone', icon: 'C', name: 'Calcareo', description: 'Blanquecino, pedregoso, comun en la isla.' },
    { value: 'sandy', icon: 'S', name: 'Arenoso', description: 'Drena muy rapido, cerca de costa.' }
];

export default function SoilSelector({ value, onChange }) {
    return (
        <div className="form-group">
            <label>2. Tipo de Suelo (Estimado)</label>
            <div className="options-grid" id="soil-options">
                {SOIL_OPTIONS.map(opt => (
                    <div
                        key={opt.value}
                        className={`option-card${value === opt.value ? ' selected' : ''}`}
                        data-value={opt.value}
                        onClick={() => onChange(opt.value)}
                    >
                        <span className="icon">{opt.icon}</span>
                        <h3>{opt.name}</h3>
                        <p>{opt.description}</p>
                    </div>
                ))}
            </div>
            <input type="hidden" id="soil-input" value={value} required />
        </div>
    );
}
