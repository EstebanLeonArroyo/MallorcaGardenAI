export default function Header({ onHistoryClick }) {
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="logo">Mallorca Garden AI</div>
                <button
                    className="history-button"
                    type="button"
                    onClick={onHistoryClick}
                >
                    <span>Historial</span>
                </button>
            </div>
            <h1>Diseña tu oasis mediterraneo</h1>
            <p className="subtitle">Ciencia y estetica unidas para crear jardines que prosperan en la isla.</p>
        </header>
    );
}
