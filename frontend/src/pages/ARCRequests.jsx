import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function ARCRequests() {
    const { user, fetchWithAuth } = useAuth();
    // ... (imports)
    const [requests, setRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // UI State
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [modalError, setModalError] = useState(null);

    const [formData, setFormData] = useState({
        resident_address: '',
        description: '',
        contractor_name: '',
        projected_start: '',
        anticipated_end: '',
        terms_accepted: false
    });

    useEffect(() => {
        fetchRequests();
    }, [user]);

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

    const fetchRequests = async () => {
        if (!user?.community_id) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communities/${user.community_id}/arc/my`);
            if (!res.ok) throw new Error('Failed to fetch requests');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                setRequests([]);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load ARC requests.");
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setModalError(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError(null);

        // Client-side validation
        if (!formData.contractor_name || !formData.contractor_name.trim()) {
            setModalError("Contractor name is required. Enter 'Self' for DIY projects.");
            return;
        }

        if (!formData.projected_start) {
            setModalError("Projected start date is required.");
            return;
        }

        // Validate end date is after start date
        if (formData.anticipated_end && formData.projected_start) {
            const startDate = new Date(formData.projected_start);
            const endDate = new Date(formData.anticipated_end);
            if (endDate <= startDate) {
                setModalError("Anticipated end date must be after the projected start date.");
                return;
            }
        }

        try {
            const res = await fetchWithAuth(`${API_URL}/api/communities/${user.community_id}/arc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resident_id: 0, // Placeholder, backend uses token
                    ...formData
                })
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({
                    resident_address: '',
                    description: '',
                    contractor_name: '',
                    projected_start: '',
                    anticipated_end: '',
                    terms_accepted: false
                });
                setSuccess("ARC Request submitted successfully.");
                fetchRequests();
            } else {
                const error = await res.json();
                setModalError(error.detail || 'Failed to submit request.');
            }
        } catch (err) {
            console.error(err);
            setModalError('Error submitting ARC request.');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': '#ffc107',
            'Under Review': '#17a2b8',
            'Approved': '#28a745',
            'Denied': '#dc3545',
            'More Info Needed': '#fd7e14'
        };
        return colors[status] || '#6c757d';
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>My ARC Requests</h1>
                <button onClick={handleOpenModal} className="btn btn-primary">
                    + New Request
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

            <div style={{ display: 'grid', gap: '1rem' }}>
                {requests.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        <p>No requests submitted yet.</p>
                        <p style={{ fontSize: '0.9rem' }}>Click "New Request" to submit your first ARC request.</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: '0.5rem' }}>{req.description}</h3>
                                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <strong>Address:</strong> {req.resident_address}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <strong>Contractor:</strong> {req.contractor_name || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                        <strong>Timeline:</strong> {req.projected_start || 'N/A'} to {req.anticipated_end || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                                        Submitted: {new Date(req.submission_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    backgroundColor: getStatusColor(req.status) + '20',
                                    color: getStatusColor(req.status),
                                    border: `2px solid ${getStatusColor(req.status)}`
                                }}>
                                    {req.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Submit ARC Request</h2>

                        {modalError && (
                            <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Property Address *
                                </label>
                                <input
                                    type="text"
                                    value={formData.resident_address}
                                    onChange={(e) => setFormData({ ...formData, resident_address: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="Your property address"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Project Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows="4"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="Describe the proposed changes..."
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Contractor Name * <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}>(Enter "Self" for DIY projects)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.contractor_name}
                                    onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="Contractor name or 'Self'"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Anticipated End Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.anticipated_end}
                                    onChange={(e) => setFormData({ ...formData, anticipated_end: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffc107',
                                borderRadius: '0.5rem'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.terms_accepted}
                                        onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                                        required
                                        style={{ marginRight: '0.75rem', marginTop: '0.25rem', width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>
                                        <strong>I acknowledge and agree:</strong> I understand that I must NOT begin any work
                                        until this request is approved by the ARC. Starting work before approval may result
                                        in violation fees and mandatory reversal of changes at my expense.
                                    </span>
                                </label>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Projected Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.projected_start}
                                    onChange={(e) => setFormData({ ...formData, projected_start: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn"
                                    style={{ border: '1px solid #ddd' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={!formData.terms_accepted}>
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
