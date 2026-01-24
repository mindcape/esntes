import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_URL } from '../config';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!captchaToken) {
            setError('Please verify that you are not a robot.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    captcha_token: captchaToken
                })
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
            } else {
                setError(data.detail || 'Request failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#111827' }}>Forgot Password</h2>

                {message && (
                    <div style={{ padding: '0.75rem', backgroundColor: '#def7ec', color: '#03543f', borderRadius: '0.25rem', marginBottom: '1rem' }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: '#fde2e2', color: '#9b1c1c', borderRadius: '0.25rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem' }}>Email Address</label>
                        <input
                            type="email" required
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <ReCAPTCHA
                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                            onChange={setCaptchaToken}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link to="/login" style={{ color: '#2563eb', fontSize: '0.875rem', textDecoration: 'none' }}>Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
