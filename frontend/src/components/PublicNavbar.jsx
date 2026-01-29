import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicNavbar() {
    return (
        <nav style={{ backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 1000 }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#0066cc', letterSpacing: '-0.5px' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>ESNTES HOA</Link>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500', transition: 'color 0.2s' }}>Home</Link>
                    <Link to="/about" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500', transition: 'color 0.2s' }}>About Us</Link>
                    <Link to="/pricing" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500', transition: 'color 0.2s' }}>Pricing</Link>
                    <Link to="/contact" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500', transition: 'color 0.2s' }}>Contact</Link>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/login" style={{ textDecoration: 'none', color: '#0066cc', fontWeight: '600' }}>Login</Link>
                    <Link to="/setup" style={{
                        textDecoration: 'none',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '0.375rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                    }}>
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}
