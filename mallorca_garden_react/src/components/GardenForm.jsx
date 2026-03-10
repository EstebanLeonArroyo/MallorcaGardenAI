import ProgressIndicator from './ProgressIndicator';
import ImageUploader from './ImageUploader';
import SoilSelector from './SoilSelector';

export default function GardenForm({ form, onSubmit }) {
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.soil) {
            alert('Por favor, selecciona un tipo de suelo estimado.');
            return;
        }
        if (!form.designName.trim()) {
            alert('Por favor, ingresa un nombre para el diseño.');
            return;
        }

        onSubmit();
    };

    return (
        <section id="input-section" className="glass-panel">
            <ProgressIndicator currentStep={form.currentStep} />

            <form id="garden-form" onSubmit={handleSubmit}>
                <div className="form-two-columns">
                    {/* LEFT COLUMN: Steps 1-3 */}
                    <div className="form-column form-column-left">
                        {/* Step 1: Terrain photos */}
                        <ImageUploader
                            images={form.uploadedImages}
                            onAddImages={form.addImages}
                            onRemoveImage={form.removeImage}
                        />

                        {/* Step 1b: Garden measurements */}
                        <div className="form-group">
                            <label>1b. Medidas del Jardin</label>
                            <div className="measurements-grid">
                                <div className="measurement-input">
                                    <label htmlFor="garden-length">Largo (m)</label>
                                    <input
                                        type="number"
                                        id="garden-length"
                                        placeholder="Ej: 20"
                                        min="1"
                                        step="0.1"
                                        value={form.length}
                                        onChange={(e) => form.setLength(e.target.value)}
                                    />
                                </div>
                                <div className="measurement-input">
                                    <label htmlFor="garden-width">Ancho (m)</label>
                                    <input
                                        type="number"
                                        id="garden-width"
                                        placeholder="Ej: 15"
                                        min="1"
                                        step="0.1"
                                        value={form.width}
                                        onChange={(e) => form.setWidth(e.target.value)}
                                    />
                                </div>
                                <div className="measurement-result" id="garden-area">
                                    <span className="area-label">Area estimada:</span>
                                    <span className="area-value">{form.area ? `${form.area} m2` : '-- m2'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Soil */}
                        <SoilSelector value={form.soil} onChange={form.setSoil} />
                    </div>

                    {/* RIGHT COLUMN: Steps 3-6 */}
                    <div className="form-column form-column-right">
                        {/* Step 3: Style */}
                        <div className="form-group">
                            <label>3. Estilo Deseado</label>
                            <select
                                id="style-input"
                                required
                                value={form.style}
                                onChange={(e) => form.setStyle(e.target.value)}
                            >
                                <option value="" disabled>Selecciona un estilo...</option>
                                <option value="mediterranean">Mediterraneo Clasico (Possessio)</option>
                                <option value="modern">Minimalismo Balear</option>
                                <option value="xerogardening">Eco-Xerojardin (Ahorro agua)</option>
                                <option value="tropical">Tropical Contemporaneo</option>
                                <option value="coastal">Costero Resiliente</option>
                                <option value="zen">Contemporaneo/Zen</option>
                            </select>
                        </div>

                        {/* Step 4: Design name */}
                        <div className="form-group">
                            <label>4. Nombre del Diseño</label>
                            <div className="design-name-wrapper">
                                <span className="design-name-icon">*</span>
                                <input
                                    type="text"
                                    id="design-name-input"
                                    className="design-name-input"
                                    placeholder="Ej: Mi Jardin de Primavera 2026"
                                    maxLength="100"
                                    required
                                    value={form.designName}
                                    onChange={(e) => form.setDesignName(e.target.value)}
                                />
                            </div>
                            <small className="input-hint">Este nombre te ayudara a identificar el diseño en el historial</small>
                        </div>

                        {/* Step 5: Budget */}
                        <div className="form-group">
                            <label>5. Presupuesto Estimado (EUR)</label>
                            <input
                                type="number"
                                id="budget-input"
                                placeholder="Ej: 5000"
                                min="200"
                                required
                                value={form.budget}
                                onChange={(e) => form.setBudget(e.target.value)}
                            />
                        </div>

                        {/* Step 6: Extra info (optional) */}
                        <div className="form-group">
                            <label>6. Informacion adicional (Opcional)</label>
                            <textarea
                                id="extra-info-input"
                                className="extra-info-textarea"
                                placeholder="Ej: Quiero una zona de sombra para comer, tengo mascotas, prefiero plantas con flor..."
                                maxLength="500"
                                rows="3"
                                value={form.extraInfo}
                                onChange={(e) => form.setExtraInfo(e.target.value)}
                            />
                            <small className="input-hint">Añade cualquier detalle extra que quieras que la IA tenga en cuenta al generar las propuestas</small>
                        </div>
                    </div>
                </div>

                <button type="submit" className="cta-button">Generar Propuestas</button>
            </form>
        </section>
    );
}
