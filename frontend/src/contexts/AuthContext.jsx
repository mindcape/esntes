import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

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

    const login = async (email, password, captchaToken = null) => {
        setLoading(true);
        setError(null);
        try {
            const body = { email, password };
            if (captchaToken) body.captcha_token = captchaToken;

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                // Handle 200 OK with business logic error (like captcha requirement) if API returns that way?
                // Backend raises HTTPException for Auth failure, so response.ok will be false.
                // But for "Captcha Required" warning (before lock out?), I implemented it as returning 200 with {captcha_required: true}
                // Wait, let's check backend router again (Step 454).
                // "return { "captcha_required": True ... }" -> This is a 200 response.

                // So if response.ok is false, it's a real error (401/400).
                // If response.ok is true, it could be token OR captcha warning.

                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();

            if (data.mfa_required) {
                return { mfa_required: true, email: data.email };
            }

            if (data.captcha_required) {
                return { captcha_required: true, message: data.message };
            }

            setUser(data.user);
            localStorage.setItem('esntes_token', data.access_token);
            localStorage.setItem('esntes_user', JSON.stringify(data.user));
            return data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyMfa = async (email, code) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/auth/verify-mfa-login?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
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
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const setupAccount = async (email, communityCode, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/auth/setup-account`, {
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
            throw err;
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
