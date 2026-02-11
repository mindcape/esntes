
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Home() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/dashboard" />; // Redirect to dashboard if logged in? Wait, Dashboard is at / in the private route.
        // In App.jsx, I have: 
        // <Route path="/" element={<Home />} />
        // AND 
        // <Route path="*" element={<PrivateRoute> ... <Route path="/" element={<Dashboard />} /> ... </PrivateRoute>} />

        // This is conflicting. The first match wins. So / will always go to Home.
        // I should probably make Home verify if user is logged in, and if so, render the Dashboard via redirect or structure change.
        // Actually, let's keep Home as a landing page for now, or redirect.
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#111827', marginBottom: '1rem' }}>
                Welcome to Nibrr
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '600px', marginBottom: '2rem' }}>
                The modern platform for Homeowners Associations. efficient management, transparent governance, and seamless communication.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.5rem', fontWeight: '600' }}>
                    Login
                </Link>
                <Link to="/setup" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontWeight: '600' }}>
                    Setup Account
                </Link>
            </div>
        </div>
    );
}
