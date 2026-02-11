import React from 'react';
import { Users, Heart, Target } from 'lucide-react';

export default function AboutUs() {
    return (
        <div style={{ fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
            {/* Hero */}
            <section style={{ backgroundColor: 'white', padding: '5rem 2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1.5rem', color: '#0f172a' }}>About Nibrr</h1>
                <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
                    We are dedicated to modernizing home owners associations with transparent, easy-to-use technology that brings neighbors together.
                </p>
            </section>

            {/* Values */}
            <section style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ margin: '0 auto 1.5rem', width: '3.5rem', height: '3.5rem', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={28} color="#2563eb" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Our Mission</h3>
                        <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                            To simplify property management so communities can focus on what matters most: living well together.
                        </p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ margin: '0 auto 1.5rem', width: '3.5rem', height: '3.5rem', backgroundColor: '#fce7f3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart size={28} color="#db2777" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Community First</h3>
                        <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                            We build tools that foster transparency, accountability, and better communication for every resident.
                        </p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ margin: '0 auto 1.5rem', width: '3.5rem', height: '3.5rem', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={28} color="#059669" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Empowerment</h3>
                        <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                            Giving boards and managers the robust data and controls they need to make informed decisions.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
