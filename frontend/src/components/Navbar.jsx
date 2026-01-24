
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{ backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#111827' }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>ESNTES HOA</Link>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {!user ? (
                    <>
                        <Link to="/login" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500' }}>Login</Link>
                        <Link to="/setup" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '500' }}>Setup Account</Link>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Hello, {user.name}</span>
                        <button
                            onClick={handleLogout}
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #d1d5db',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                cursor: 'pointer'
                            }}
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
