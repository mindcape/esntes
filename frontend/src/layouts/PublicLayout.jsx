import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

export default function PublicLayout() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <PublicNavbar />
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            <footer style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem' }}>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem' }}>Nibrr HOA</div>
                        <p style={{ maxWidth: '300px', lineHeight: '1.6' }}>
                            Modernizing community management with transparency, efficiency, and ease of use.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                        <div>
                            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Product</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Security</a>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Company</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</a>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Careers</a>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Legal</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
                                <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ maxWidth: '1200px', margin: '3rem auto 0', paddingTop: '2rem', borderTop: '1px solid #334155', textAlign: 'center', fontSize: '0.9rem' }}>
                    © 2026 Nibrr. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
