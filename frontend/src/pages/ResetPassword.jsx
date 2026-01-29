import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!token) {
            setError("Invalid or missing token");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    new_password: password
                })
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.detail || 'Reset failed');
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
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#111827' }}>Reset Password</h2>

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
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem' }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"} required
                                style={{ width: '100%', padding: '0.5rem', paddingRight: '2.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"} required
                                style={{ width: '100%', padding: '0.5rem', paddingRight: '2.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Resetting...' : 'Set New Password'}
                    </button>

                </form>
            </div>
        </div>
    );
}
