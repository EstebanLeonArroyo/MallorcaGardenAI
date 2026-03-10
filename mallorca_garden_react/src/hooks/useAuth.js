import { useState, useEffect, useCallback } from 'react';
import {
    signIn as authSignIn,
    signUp as authSignUp,
    signOut as authSignOut,
    getSession,
    onAuthStateChange,
    isAuthConfigured,
} from '../services/authService.js';

/**
 * Hook para gestionar el estado de autenticación
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isConfigured = isAuthConfigured();

    // Comprobar sesión existente al montar
    useEffect(() => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }

        getSession().then(session => {
            setUser(session?.user || null);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });

        // Escuchar cambios de autenticación
        const { data: { subscription } } = onAuthStateChange((session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [isConfigured]);

    const signIn = useCallback(async (email, password) => {
        setError(null);
        setLoading(true);
        try {
            const data = await authSignIn(email, password);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const signUp = useCallback(async (email, password) => {
        setError(null);
        setLoading(true);
        try {
            const data = await authSignUp(email, password);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        setError(null);
        try {
            await authSignOut();
            setUser(null);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    return {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isConfigured,
        signIn,
        signUp,
        signOut,
    };
}
