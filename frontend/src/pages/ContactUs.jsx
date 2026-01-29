import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactUs() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Thank you for contacting us! We will get back to you shortly.');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', color: '#1e293b', minHeight: '80vh', backgroundColor: '#f8fafc' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: '#0f172a' }}>Get in Touch</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Have questions about our platform? We'd love to hear from you.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '4rem', backgroundColor: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    {/* Contact Info */}
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem' }}>Contact Information</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Mail color="#0066cc" size={20} />
                                <span style={{ color: '#64748b' }}>support@esntes.com</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Phone color="#0066cc" size={20} />
                                <span style={{ color: '#64748b' }}>+1 (555) 123-4567</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <MapPin color="#0066cc" size={20} />
                                <span style={{ color: '#64748b' }}>123 Innovation Dr.<br />Austin, TX 78701</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Name</label>
                            <input
                                type="text"
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Email</label>
                            <input
                                type="email"
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Message</label>
                            <textarea
                                rows={4}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                backgroundColor: '#0066cc',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '0.375rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                width: '100%'
                            }}
                        >
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
