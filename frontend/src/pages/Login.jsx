import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { login, verifyMfa, error: authError } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [captchaVisible, setCaptchaVisible] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mfaRequired) {
            handleMFA();
            return;
        }

        try {
            const result = await login(email, password, captchaToken);
            if (result?.mfa_required) {
                setMfaRequired(true);
                setError('');
            } else if (result?.captcha_required) {
                setCaptchaVisible(true);
                setFailedAttempts(prev => prev + 1);
                setError(result.message || "Security Verification Required");
            } else if (result) {
                redirectUser(result);
            } else {
                throw new Error("Login failed");
            }
        } catch (err) {
            setFailedAttempts(prev => prev + 1);
            setError(err.message || 'An unexpected error occurred');
        }
    };

    const handleMFA = async () => {
        try {
            const user = await verifyMfa(email, mfaCode);
            if (user) {
                redirectUser(user);
            } else {
                setError('Invalid MFA Code');
            }
        } catch (err) {
            setError('MFA Verification failed');
        }
    };

    const redirectUser = (user) => {
        if (user.role === 'super_admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f3f4f6'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Login to ESNTES</h2>

                {error && <div style={{
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!mfaRequired ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            paddingRight: '2.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#6b7280'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Captcha - Show after 2 failed attempts OR if backend requires it */}
                            {(failedAttempts >= 2 || captchaVisible) && (
                                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                    <ReCAPTCHA
                                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                        onChange={(token) => setCaptchaToken(token)}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Sign In
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                <p>Please enter the functionality code from your authenticator app.</p>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>MFA Code</label>
                                <input
                                    type="text"
                                    required
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value)}
                                    placeholder="e.g. 123456"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        boxSizing: 'border-box',
                                        textAlign: 'center',
                                        letterSpacing: '2px',
                                        fontSize: '1.2rem'
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Verify
                            </button>
                        </>
                    )}
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                        <Link to="/forgot-password" style={{ color: '#2563eb', textDecoration: 'none' }}>Forgot Password?</Link>
                    </div>
                    <div>
                        Don't have an account? <Link to="/setup-account" style={{ color: '#2563eb', textDecoration: 'none' }}>Setup Account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
