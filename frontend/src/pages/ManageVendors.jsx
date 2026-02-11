import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function ManageVendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        tax_id: '',
        payment_terms: '',
        is_active: true
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = () => {
        setLoading(true);
        fetch(`${API_URL}/api/vendors`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}` }
        })
            .then(res => res.json())
            .then(data => {
                setVendors(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load vendors');
                setLoading(false);
            });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing
                ? `${API_URL}/api/vendors/${editingId}`
                : `${API_URL}/api/vendors`;

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({
                    name: '', email: '', phone: '', address: '', category: '', tax_id: '', payment_terms: '', is_active: true
                });
                setIsEditing(false);
                setEditingId(null);
                fetchVendors();
            } else {
                const err = await res.json();
                setError(err.detail || 'Operation failed');
            }
        } catch (error) {
            setError('Failed to connect to server');
        }
    };

    const handleEdit = (vendor) => {
        setFormData({
            name: vendor.name,
            email: vendor.email || '',
            phone: vendor.phone || '',
            address: vendor.address || '',
            category: vendor.category || '',
            tax_id: vendor.tax_id || '',
            payment_terms: vendor.payment_terms || '',
            is_active: vendor.is_active
        });
        setEditingId(vendor.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vendor?")) return;
        try {
            const res = await fetch(`${API_URL}/api/vendors/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}` }
            });
            if (res.ok) fetchVendors();
            else setError("Failed to delete");
        } catch (e) {
            setError("Error deleting vendor");
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Vendor Management</h1>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: '', email: '', phone: '', address: '', category: '', tax_id: '', payment_terms: '', is_active: true });
                        setShowModal(true);
                    }}
                    className="btn btn-primary"
                >
                    + Add Vendor
                </button>
            </div>

            {error && <div style={{ padding: '1rem', backgroundColor: '#fde2e2', color: '#9b1c1c', marginBottom: '1rem' }}>{error}</div>}

            {loading ? <p>Loading...</p> : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem' }}>Company</th>
                                <th style={{ padding: '1rem' }}>Contact</th>
                                <th style={{ padding: '1rem' }}>Category</th>
                                <th style={{ padding: '1rem' }}>Docs</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <strong>{v.name}</strong><br />
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>ID: {v.id}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {v.email && <div>{v.email}</div>}
                                        {v.phone && <div>{v.phone}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{v.category || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {/* Placeholder for doc counts */}
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>-</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {v.is_active ? (
                                            <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>Active</span>
                                        ) : (
                                            <span style={{ backgroundColor: '#fde2e2', color: '#9b1c1c', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>Inactive</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button onClick={() => handleEdit(v)} style={{ marginRight: '0.5rem', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(v.id)} style={{ color: 'red', cursor: 'pointer' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {vendors.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>No vendors found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '500' }}>Company Name *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: '500' }}>Category</label>
                                    <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} placeholder="e.g. Plumbing" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: '500' }}>Tax ID</label>
                                    <input type="text" value={formData.tax_id} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: '500' }}>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: '500' }}>Phone</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '500' }}>Address</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '500' }}>Payment Terms</label>
                                <input type="text" value={formData.payment_terms} onChange={e => setFormData({ ...formData, payment_terms: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} placeholder="e.g. Net 30" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Update' : 'Create'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, border: '1px solid #ccc' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
