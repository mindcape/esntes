import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
    const { user, login } = useAuth();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        units_count: 0
    });

    useEffect(() => {
        if (user && user.role === 'super_admin') {
            fetchCommunities();
        }
    }, [user]);

    // Handle Unauthenticated State
    if (!user || user.role !== 'super_admin') {
        return (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <div className="card" style={{ width: '350px', padding: '2rem', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Admin Portal</h1>
                    {user && <div style={{ color: 'red', marginBottom: '1rem' }}>Access Denied: You are logged in as {user.role}</div>}
                    <p style={{ color: '#666', marginBottom: '2rem' }}>Please log in with administrative credentials.</p>
                    <button
                        onClick={() => login('super_admin')}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem', backgroundColor: '#333', borderColor: '#333' }}
                    >
                        Login as Super Admin
                    </button>
                </div>
            </div>
        );
    }

    const fetchCommunities = () => {
        setLoading(true);
        fetch(`${API_URL}/api/admin/communities`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCommunities(data);
                } else {
                    console.error("API Error:", data);
                    setCommunities([]); // Fallback
                }
            })
            .catch(err => {
                console.error(err);
                setCommunities([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/admin/communities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: '', address: '', units_count: 0 });
                fetchCommunities();
                alert('Community created successfully!');
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

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Super Admin Dashboard</h1>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>Overview of all Communities (HOAs)</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    + Onboard New Community
                </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Communities</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{communities.length}</div>
                </div>
                <div className="card">
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Units Managed</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {communities.reduce((acc, curr) => acc + (curr.units_count || 0), 0)}
                    </div>
                </div>
            </div>

            {/* Communities List */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active Communities</h2>
            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem', color: '#666' }}>ID</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Community Name</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Address</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Units</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Status</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {communities.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                    No communities found. Click "Onboard New Community" to start.
                                </td>
                            </tr>
                        ) : communities.map(comm => (
                            <tr key={comm.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                <td style={{ padding: '1rem', color: '#888' }}>#{comm.id}</td>
                                <td style={{ padding: '1rem', fontWeight: '600' }}>{comm.name}</td>
                                <td style={{ padding: '1rem' }}>{comm.address}</td>
                                <td style={{ padding: '1rem' }}>{comm.units_count}</td>
                                <td style={{ padding: '1rem' }}><span className="status-badge status-open">Active</span></td>
                                <td style={{ padding: '1rem' }}>
                                    <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ marginTop: 0 }}>Onboard New Community</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Community Name</label>
                                <input
                                    type="text" required placeholder="e.g. Pine Valley HOA"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address</label>
                                <input
                                    type="text" required placeholder="e.g. 100 Pine Valley Dr"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Number of Units</label>
                                <input
                                    type="number" required min="1"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.units_count} onChange={e => setFormData({ ...formData, units_count: parseInt(e.target.value) })}
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
        </div>
    );
}
