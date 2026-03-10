export default function LoadingOverlay({ visible, message }) {
    if (!visible) return null;

    return (
        <div className="loading-overlay">
            <div className="spinner">
                <div className="leaf">...</div>
                <p>{message || 'Generando tus propuestas personalizadas...'}</p>
            </div>
        </div>
    );
}
