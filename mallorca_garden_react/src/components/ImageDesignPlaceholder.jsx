export default function ImageDesignPlaceholder() {
    return (
        <section className="placeholder-page">
            <div className="placeholder-content">
                <div className="placeholder-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                </div>
                <h2>Diseño en Imagen</h2>
                <p className="placeholder-text">Proximamente...</p>
                <p className="placeholder-description">
                    Genera imagenes de como quedaria tu jardin usando inteligencia artificial.
                </p>
            </div>
        </section>
    );
}
