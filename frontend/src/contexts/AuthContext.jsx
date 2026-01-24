import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial check
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('esntes_token');
            const storedUser = localStorage.getItem('esntes_user');

            if (storedToken && storedUser) {
                setUser(JSON.parse(storedUser));
                // Optionally verify token validity with backend here
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();

            if (data.mfa_required) {
                return { mfa_required: true, email: data.email };
            }

            setUser(data.user);
            localStorage.setItem('esntes_token', data.access_token);
            localStorage.setItem('esntes_user', JSON.stringify(data.user));
            return data.user;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const verifyMfa = async (email, code) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/auth/verify-mfa-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Note: backend expects query params for email and code? 
                // Let's check router.py. @router.post("/verify-mfa-login")
                // async def verify_mfa_login(email: str, code: str, ...)
                // These are query params by default in FastAPI if not body model.
                // I should probably change backend to expect body or send as query params.
                // Query params easier here:
            } // Wait, I need to check how I defined current backend endpoint.
                // It was `async def verify_mfa_login(email: str, code: str, ...)`
                // This expects query params. So URL should be:
            );
            // Let's use fetch with query params
            const res = await fetch(`http://localhost:8000/api/auth/verify-mfa-login?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'MFA verification failed');
            }

            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('esntes_token', data.access_token);
            localStorage.setItem('esntes_user', JSON.stringify(data.user));
            return data.user;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const setupAccount = async (email, communityCode, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/auth/setup-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, community_code: communityCode, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Account setup failed');
            }

            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('esntes_token', data.access_token);
            localStorage.setItem('esntes_user', JSON.stringify(data.user));
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('esntes_user');
        localStorage.removeItem('esntes_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, setupAccount, verifyMfa, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
