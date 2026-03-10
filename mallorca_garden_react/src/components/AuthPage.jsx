import { useState } from 'react';

/**
 * Página de autenticación — Login y Registro con email/contraseña
 */
export default function AuthPage({ onSignIn, onSignUp, loading, error }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');

        if (!email || !password) {
            setLocalError('Email y contraseña son obligatorios');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setLocalError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            if (isLogin) {
                await onSignIn(email, password);
            } else {
                await onSignUp(email, password);
                setSuccessMessage('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
                setIsLogin(true);
            }
        } catch (err) {
            setLocalError(err.message);
        }
    };

    const displayError = localError || error;

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">🌿</div>
                    <h1 className="auth-title">Mallorca Garden AI</h1>
                    <p className="auth-subtitle">Diseña tu jardín mediterráneo ideal</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2 className="auth-form-title">
                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>

                    {displayError && (
                        <div className="auth-error">{displayError}</div>
                    )}

                    {successMessage && (
                        <div className="auth-success">{successMessage}</div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="auth-email">Email</label>
                        <input
                            id="auth-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="auth-password">Contraseña</label>
                        <input
                            id="auth-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            disabled={loading}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {!isLogin && (
                        <div className="auth-field">
                            <label htmlFor="auth-confirm-password">Confirmar Contraseña</label>
                            <input
                                id="auth-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite la contraseña"
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Cargando...'
                            : (isLogin ? 'Entrar' : 'Crear Cuenta')
                        }
                    </button>

                    <button
                        type="button"
                        className="auth-toggle"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setLocalError('');
                            setSuccessMessage('');
                        }}
                        disabled={loading}
                    >
                        {isLogin
                            ? '¿No tienes cuenta? Regístrate'
                            : '¿Ya tienes cuenta? Inicia sesión'
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
