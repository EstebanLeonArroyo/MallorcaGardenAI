import logoImg from '/logo.png';

export default function Sidebar({ activeView, onNavigate, userEmail, onSignOut }) {
    const navItems = [
        { id: 'form', label: 'Crear Jardin', icon: 'leaf' },
        { id: 'history', label: 'Historial', icon: 'clock' },
        { id: 'imageDesign', label: 'Diseño en imagen', icon: 'image' }
    ];

    const iconSvg = {
        leaf: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.5 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
        ),
        clock: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        image: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
        )
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <img src={logoImg} alt="Mallorca Garden AI" className="sidebar-logo-img" />
                <span className="sidebar-logo-text">Mallorca Garden AI</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`sidebar-nav-item${activeView === item.id || (item.id === 'form' && activeView === 'results') ? ' active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="sidebar-nav-icon">{iconSvg[item.icon]}</span>
                        <span className="sidebar-nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-logo-showcase">
                <img src={logoImg} alt="Mallorca Garden AI" className="sidebar-logo-showcase-img" />
            </div>

            {userEmail && (
                <div className="sidebar-user">
                    <div className="sidebar-user-email" title={userEmail}>
                        {userEmail}
                    </div>
                    <button className="sidebar-logout" onClick={onSignOut}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar sesión
                    </button>
                </div>
            )}

            <div className="sidebar-footer">
                <small>Mallorca Garden AI v2.0</small>
            </div>
        </aside>
    );
}
