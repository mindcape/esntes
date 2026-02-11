import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
    const { user, login } = useAuth();
    const canManageCommunities = user?.permissions?.includes('manage_communities');
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        units_count: 0,
        community_code: ''
    });


    useEffect(() => {
        if (canManageCommunities) {
            fetchCommunities();
        }
    }, [user]);

    const formatRoleTitle = (role) => {
        if (!role) return 'Admin Dashboard';
        return role.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Dashboard';
    }

    // Handle Unauthenticated State
    if (!canManageCommunities) {
        return (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <div className="card" style={{ width: '350px', padding: '2rem', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Admin Portal</h1>
                    {user && <div style={{ color: 'red', marginBottom: '1rem' }}>Access Denied: You do not have permission to manage communities.</div>}
                    <p style={{ color: '#666', marginBottom: '2rem' }}>Please sign in with administrative credentials to continue.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem' }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // ... inside AdminDashboard component
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [modalError, setModalError] = useState(null);

    // Auto-dismiss notifications
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const fetchCommunities = () => {
        setLoading(true);
        const token = localStorage.getItem('nibrr_token');
        fetch(`${API_URL}/api/admin/communities`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.status === 401) {
                    throw new Error("Unauthorized");
                }
                return res.json();
            })
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
                if (err.message === "Unauthorized") {
                    // Maybe redirect to login or show error
                    setModalError("Session expired. Please login again.");
                }
                setCommunities([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

        if (!emailRegex.test(formData.poc_email)) {
            setModalError('Invalid email format');
            return false;
        }

        if (!phoneRegex.test(formData.poc_phone)) {
            setModalError('Invalid phone format (e.g. 123-456-7890)');
            return false;
        }
        return true;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setModalError(null);
        setSuccess(null);

        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('nibrr_token');
            const res = await fetch(`${API_URL}/api/admin/communities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: '', address: '', units_count: 0, community_code: '' });
                fetchCommunities();
                setSuccess('Community created successfully!');
            } else {
                const err = await res.json();
                setModalError(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            setModalError('Failed to connect to server');
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>{formatRoleTitle(user?.role)}</h1>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>Overview of all Communities (HOAs)</p>
                </div>
                <button onClick={() => { setModalError(null); setShowModal(true); }} className="btn btn-primary">
                    + Onboard New Community
                </button>
            </div>

            {/* Inline Notifications */}
            {error && (
                <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', border: '1px solid #fecaca' }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                    {success}
                </div>
            )}

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
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active Communities</h2>
            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Address</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Units</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Subdomain</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Actions</th>
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
                                <td style={{ padding: '1rem' }}>
                                    {comm.subdomain ? <span className="status-badge status-open">{comm.subdomain}</span> : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => navigate(`/admin/community/${comm.id}`)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* Create Modal */}
            {
                showModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '400px', maxWidth: '90%' }}>
                            <h2 style={{ marginTop: 0 }}>Onboard New Community</h2>

                            {/* Modal-specific Error (in case creation fails while modal is open) */}
                            {modalError && <div style={{ marginBottom: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>{modalError}</div>}

                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
                                {/* Section 1: Community Details */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>Community Details</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Community Name</label>
                                            <input
                                                type="text" required placeholder="e.g. Pine Valley HOA"
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Community Code</label>
                                            <input
                                                type="text" required placeholder="e.g. PVH123"
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                value={formData.community_code} onChange={e => setFormData({ ...formData, community_code: e.target.value })}
                                            />
                                            <small style={{ color: '#666', fontSize: '0.75rem' }}>Unique code for residents.</small>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Total Units</label>
                                        <input
                                            type="number" required min="1"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                            value={formData.units_count} onChange={e => setFormData({ ...formData, units_count: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Address */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>Location</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>Address Line 1</label>
                                            <input
                                                type="text" required placeholder="Street Address"
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>Address Line 2</label>
                                            <input
                                                type="text" placeholder="Suite, Bldg, etc. (Optional)"
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                value={formData.address2 || ''} onChange={e => setFormData({ ...formData, address2: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>City</label>
                                                <input
                                                    type="text" required
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>State</label>
                                                <input
                                                    type="text" required
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>County</label>
                                                <input
                                                    type="text"
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    value={formData.county || ''} onChange={e => setFormData({ ...formData, county: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>Zip Code</label>
                                                <input
                                                    type="text" required
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    value={formData.zip_code || ''} onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Point of Contact */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>Point of Contact</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>Full Name</label>
                                            <input
                                                type="text" required placeholder="Manager or Board President"
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                value={formData.poc_name || ''} onChange={e => setFormData({ ...formData, poc_name: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label htmlFor="poc_email" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
                                                <input
                                                    id="poc_email"
                                                    type="email" required
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    value={formData.poc_email || ''} onChange={e => setFormData({ ...formData, poc_email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="poc_phone" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: '500' }}>Phone</label>
                                                <input
                                                    id="poc_phone"
                                                    type="tel" required
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    value={formData.poc_phone || ''} onChange={e => setFormData({ ...formData, poc_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Community</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, border: '1px solid #ccc' }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );

}
