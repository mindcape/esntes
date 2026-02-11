import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function BoardViolations() {
    const { user } = useAuth();
    // ... (imports)
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // UI State
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [modalError, setModalError] = useState(null);

    const [formData, setFormData] = useState({
        resident_id: '',
        resident_name: '',
        resident_address: '',
        description: '',
        bylaw_reference: '',
        action: 'warning',
        fine_amount: 100
    });
    const [editModal, setEditModal] = useState(null);
    const [editData, setEditData] = useState({
        status: '',
        fine_amount: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });

    useEffect(() => {
        fetchViolations();
    }, [user]);

    // Auto-dismiss main notifications
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const fetchViolations = () => {
        if (!user?.community_id) return;

        const token = localStorage.getItem('nibrr_token');
        fetch(`${API_URL}/api/communities/${user.community_id}/violations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setViolations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load violations.");
                setLoading(false);
            });
    };

    const handleOpenModal = () => {
        setModalError(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (violation) => {
        setModalError(null);
        setEditModal(violation);
        setEditData({
            status: violation.status,
            fine_amount: violation.fine_amount || 0
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError(null);

        // Validation
        if (!formData.resident_name || !formData.resident_name.trim()) {
            setModalError('Resident name is required.');
            return;
        }

        if (!formData.description || !formData.description.trim()) {
            setModalError('Violation description is required.');
            return;
        }

        try {
            const token = localStorage.getItem('nibrr_token');
            const res = await fetch(`${API_URL}/api/communities/${user.community_id}/violations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resident_id: formData.resident_id ? parseInt(formData.resident_id) : 0,
                    resident_name: formData.resident_name,
                    resident_address: formData.resident_address,
                    description: formData.description,
                    bylaw_reference: formData.bylaw_reference,
                    action: formData.action,
                    fine_amount: formData.fine_amount
                })
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({
                    resident_id: '',
                    resident_name: '',
                    resident_address: '',
                    description: '',
                    bylaw_reference: '',
                    action: 'warning',
                    fine_amount: 100
                });
                setSuccess("Violation logged successfully.");
                fetchViolations();
            } else {
                try {
                    const error = await res.json();
                    setModalError(typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail || error));
                } catch {
                    setModalError(`Failed to create violation. Status: ${res.status}`);
                }
            }
        } catch (err) {
            console.error('Error creating violation:', err);
            setModalError(`Error creating violation: ${err.message || 'Network error'}`);
        }
    };

    const handleEditSubmit = async () => {
        setModalError(null);
        try {
            // Validate fine amount if status is Fined
            if (editData.status === 'Fined' && (!editData.fine_amount || editData.fine_amount <= 0)) {
                setModalError('Fine amount must be greater than 0 when status is Fined.');
                return;
            }

            // Build query params
            let url = `${API_URL}/api/communities/${user.community_id}/violations/${editModal.id}/status?status=${editData.status}`;
            if (editData.status === 'Fined' && editData.fine_amount) {
                url += `&fine_amount=${editData.fine_amount}`;
            }

            const token = localStorage.getItem('nibrr_token');
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setEditModal(null);
                setSuccess("Violation updated successfully.");
                fetchViolations();
            } else {
                const error = await res.json();
                setModalError(error.detail || 'Failed to update violation.');
            }
        } catch (err) {
            console.error(err);
            setModalError('Error updating violation.');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Open': '#6c757d',
            'Warning': '#ffc107',
            'Fined': '#dc3545',
            'Paid': '#28a745',
            'Closed': '#17a2b8'
        };
        return colors[status] || '#6c757d';
    };

    const filteredViolations = violations.filter(v => {
        const matchesSearch = filters.search === '' ||
            v.resident_name.toLowerCase().includes(filters.search.toLowerCase()) ||
            v.description.toLowerCase().includes(filters.search.toLowerCase()) ||
            v.resident_address.toLowerCase().includes(filters.search.toLowerCase());

        const matchesStatus = filters.status === 'all' || v.status === filters.status;

        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Violations Management</h1>
                <button onClick={handleOpenModal} className="btn btn-primary">
                    + Log New Violation
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

            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                {/* ... (Search filters) ... */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Search by resident name, address, or description..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                            Filter by Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Warning">Warning</option>
                            <option value="Fined">Fined</option>
                            <option value="Paid">Paid</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Resident</th>
                            <th style={{ padding: '1rem' }}>Description</th>
                            <th style={{ padding: '1rem' }}>Fine</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredViolations.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                <td style={{ padding: '1rem' }}>#{v.id}</td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                    {new Date(v.date).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{v.resident_name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{v.resident_address}</div>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                    <div style={{ fontSize: '0.9rem' }}>{v.description}</div>
                                    {v.bylaw_reference && (
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                            {v.bylaw_reference}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>
                                    {v.fine_amount > 0 ? `$${v.fine_amount.toFixed(2)}` : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        backgroundColor: getStatusColor(v.status) + '20',
                                        color: getStatusColor(v.status),
                                        border: `2px solid ${getStatusColor(v.status)}`
                                    }}>
                                        {v.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => handleOpenEditModal(v)}
                                        className="btn"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Log New Violation</h2>

                        {modalError && (
                            <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Resident Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.resident_name}
                                    onChange={(e) => setFormData({ ...formData, resident_name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Resident Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.resident_address}
                                    onChange={(e) => setFormData({ ...formData, resident_address: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Violation Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows="4"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="Describe the violation..."
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Bylaw/CC&R Reference
                                </label>
                                <input
                                    type="text"
                                    value={formData.bylaw_reference}
                                    onChange={(e) => setFormData({ ...formData, bylaw_reference: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="e.g., Section 4.2 - Landscaping"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Action *
                                </label>
                                <select
                                    value={formData.action}
                                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                >
                                    <option value="warning">Send Warning</option>
                                    <option value="fine">Issue Fine</option>
                                </select>
                            </div>
                            {formData.action === 'fine' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Fine Amount ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.fine_amount}
                                        onChange={(e) => setFormData({ ...formData, fine_amount: parseFloat(e.target.value) })}
                                        min="0"
                                        max="999999"
                                        step="0.01"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn"
                                    style={{ border: '1px solid #ddd' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Log Violation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Edit Violation</h2>

                        {modalError && (
                            <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                {modalError}
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.5rem' }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>Resident:</strong> {editModal.resident_name}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                {editModal.description}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Status *
                            </label>
                            <select
                                value={editData.status}
                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                            >
                                <option value="Open">Open</option>
                                <option value="Warning">Warning</option>
                                <option value="Fined">Fined</option>
                                <option value="Paid">Paid</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        {editData.status === 'Fined' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Fine Amount ($) *
                                </label>
                                <input
                                    type="number"
                                    value={editData.fine_amount}
                                    onChange={(e) => setEditData({ ...editData, fine_amount: parseFloat(e.target.value) })}
                                    min="0"
                                    max="999999"
                                    step="0.01"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setEditModal(null)}
                                className="btn"
                                style={{ border: '1px solid #ddd' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className="btn btn-primary"
                            >
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
