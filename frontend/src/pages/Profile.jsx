import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/user/profile')
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handlePrefChange = (e) => {
        const { name, checked } = e.target;
        setProfile(prev => ({
            ...prev,
            preferences: { ...prev.preferences, [name]: checked }
        }));
    };

    const handleMethodChange = (key, method) => {
        setProfile(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [`${key}_email`]: method === 'email',
                [`${key}_paper`]: method === 'paper'
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Validate required fields
        if (!profile.email || !profile.email.trim()) {
            setMessage('Email is required.');
            return;
        }

        if (!profile.phone || !profile.phone.trim()) {
            setMessage('Phone number is required.');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.email)) {
            setMessage('Please enter a valid email address.');
            return;
        }

        // Validate at least one preference selected per document type
        const docTypes = ['general', 'ccr', 'collection', 'billing'];
        for (const type of docTypes) {
            const emailSelected = profile.preferences[`${type}_email`];
            const paperSelected = profile.preferences[`${type}_paper`];
            if (!emailSelected && !paperSelected) {
                setMessage(`Please select a delivery method (Email or Paper) for ${type.toUpperCase()} documents.`);
                return;
            }
        }

        try {
            const res = await fetch('http://127.0.0.1:8000/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    phone: profile.phone,
                    mailing_address: profile.mailing_address,
                    preferences: profile.preferences
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                setMessage('Profile updated successfully!');
            } else {
                setMessage('Failed to update profile.');
            }
        } catch (err) {
            console.error(err);
            setMessage('Error updating profile.');
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!profile) return <div className="container">Error loading profile.</div>;

    return (
        <div className="container">
            <h2 style={{ marginBottom: '2rem' }}>My Profile</h2>

            {message && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
                    color: message.includes('success') ? '#155724' : '#721c24',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Identity Section (Read-Only) */}
                <div>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>Identity & Residence</h3>
                        <div style={{ display: 'grid', gap: '1rem', color: '#555' }}>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#888' }}>Full Name</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'hsl(215 25% 27%)' }}>{profile.name}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#888' }}>Display Name</label>
                                <div>{profile.display_name}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#888' }}>Residential Address</label>
                                <div>{profile.address}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#888' }}>Status</label>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: '#e2e8f0',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    {profile.status}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Section */}
                <div>
                    <form onSubmit={handleSubmit}>
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3>Contact Information</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleChange}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Mailing Address</label>
                                    <textarea
                                        name="mailing_address"
                                        value={profile.mailing_address}
                                        onChange={handleChange}
                                        rows="3"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd', fontFamily: 'inherit' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3>Communication Preferences</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem', color: '#666', fontWeight: '600', width: '50%' }}>Document Type</th>
                                            <th style={{ padding: '0.75rem', color: '#666', fontWeight: '600', textAlign: 'center' }}>Email</th>
                                            <th style={{ padding: '0.75rem', color: '#666', fontWeight: '600', textAlign: 'center' }}>Paper</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { key: 'general', label: 'General Mailings' },
                                            { key: 'ccr', label: 'CCR Updates' },
                                            { key: 'collection', label: 'Collection Notices' },
                                            { key: 'billing', label: 'Billing Statements' },
                                        ].map((item) => (
                                            <tr key={item.key} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>{item.label}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="radio"
                                                        name={`${item.key}_delivery`}
                                                        checked={profile.preferences[`${item.key}_email`] || false}
                                                        onChange={() => handleMethodChange(item.key, 'email')}
                                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'hsl(215 25% 27%)', cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="radio"
                                                        name={`${item.key}_delivery`}
                                                        checked={profile.preferences[`${item.key}_paper`] || false}
                                                        onChange={() => handleMethodChange(item.key, 'paper')}
                                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'hsl(215 25% 27%)', cursor: 'pointer' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="mgmt_committee_notifications"
                                        checked={profile.preferences.mgmt_committee_notifications || false}
                                        onChange={handlePrefChange}
                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'hsl(215 25% 27%)' }}
                                    />
                                    <span style={{ fontWeight: '500' }}>Receive Management Committee Notifications</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="phone_communications"
                                        checked={profile.preferences.phone_communications || false}
                                        onChange={handlePrefChange}
                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'hsl(215 25% 27%)' }}
                                    />
                                    <span>Allow Phone Communications</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
