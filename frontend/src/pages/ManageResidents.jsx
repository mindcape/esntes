import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function ManageResidents() {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        phone: '',
        role_name: 'resident'
    });

    useEffect(() => {
        fetchResidents();
    }, []);

    const fetchResidents = () => {
        setLoading(true);
        fetch(`${API_URL}/api/community/all-residents`)
            .then(res => res.json())
            .then(data => {
                setResidents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/community/residents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: '', email: '', address: '', phone: '', role_name: 'resident' });
                fetchResidents();
                alert('Resident created successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to server');
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    const PreferenceIcon = ({ type, email, paper }) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: '500', width: '80px' }}>{type}:</span>
                {email && <span title="Email">📧</span>}
                {paper && <span title="Paper">📄</span>}
                {!email && !paper && <span style={{ color: '#ccc' }}>-</span>}
            </div>
        );
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Manage Residents</h1>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    + Add Resident
                </button>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ marginTop: 0 }}>Add New Resident</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name</label>
                                <input
                                    type="text" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                                <input
                                    type="email" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address</label>
                                <input
                                    type="text" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone</label>
                                <input
                                    type="tel"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, border: '1px solid #ccc' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem', color: '#666' }}>Name</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Contact</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Communication Preferences</th>
                            <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Mgmt Notif.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {residents.map(resident => (
                            <tr key={resident.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '600', color: 'hsl(215 25% 27%)' }}>{resident.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{resident.address}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem' }}>{resident.email}</div>
                                    {resident.phone && <div style={{ fontSize: '0.85rem', color: '#666' }}>{resident.phone}</div>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {resident.preferences ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <PreferenceIcon type="General" email={resident.preferences.general_email} paper={resident.preferences.general_paper} />
                                            <PreferenceIcon type="CCR" email={resident.preferences.ccr_email} paper={resident.preferences.ccr_paper} />
                                            <PreferenceIcon type="Collection" email={resident.preferences.collection_email} paper={resident.preferences.collection_paper} />
                                            <PreferenceIcon type="Billing" email={resident.preferences.billing_email} paper={resident.preferences.billing_paper} />
                                        </div>
                                    ) : (
                                        <span style={{ color: '#999', fontStyle: 'italic' }}>Not set</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {resident.preferences?.mgmt_committee_notifications ? '✅' : '❌'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
