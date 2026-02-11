import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function BoardARC() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        description: '',
        contractor_name: '',
        projected_start: '',
        anticipated_end: '',
        terms_accepted: false
    });

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const fetchRequests = () => {
        if (!user?.community_id) return;
        const token = localStorage.getItem('nibrr_token');
        fetch(`${API_URL}/api/communities/${user.community_id}/arc`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRequests(data);
                else setRequests([]);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const updateStatus = async (requestId, newStatus) => {
        try {
            const token = localStorage.getItem('nibrr_token');
            const res = await fetch(`${API_URL}/api/communities/${user.community_id}/arc/${requestId}/status?status=${newStatus}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchRequests();
                setSelectedRequest(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const groupByStatus = () => {
        const groups = {
            'Pending': [],
            'Under Review': [],
            'Approved': [],
            'Denied': [],
            'More Info Needed': []
        };
        requests.forEach(req => {
            if (groups[req.status]) {
                groups[req.status].push(req);
            }
        });
        return groups;
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

    const grouped = groupByStatus();



    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('nibrr_token');
            const res = await fetch(`${API_URL}/api/communities/${user.community_id}/arc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setFormData({
                    description: '',
                    contractor_name: '',
                    projected_start: '',
                    anticipated_end: '',
                    terms_accepted: false
                });
                fetchRequests(); // Refresh
                // alert('Request created successfully!');
            } else {
                const err = await res.json();
                setError(err.detail || 'Failed to create request');
            }
        } catch (err) {
            console.error(err);
            setError('Error creating request');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>ARC Approvals</h1>
                <button onClick={() => {
                    setError('');
                    setShowCreateModal(true);
                }} className="btn btn-primary">
                    + New Request
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {Object.entries(grouped).map(([status, items]) => (
                    <div key={status}>
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: getStatusColor(status),
                            color: 'white',
                            borderRadius: '0.5rem 0.5rem 0 0',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{status}</span>
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '1rem',
                                fontSize: '0.85rem'
                            }}>
                                {items.length}
                            </span>
                        </div>
                        <div style={{
                            border: `2px solid ${getStatusColor(status)}`,
                            borderTop: 'none',
                            borderRadius: '0 0 0.5rem 0.5rem',
                            minHeight: '200px',
                            padding: '0.5rem',
                            backgroundColor: '#f9f9f9'
                        }}>
                            {items.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    style={{
                                        backgroundColor: 'white',
                                        padding: '1rem',
                                        marginBottom: '0.5rem',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        border: '1px solid #ddd',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                        {req.description.substring(0, 50)}{req.description.length > 50 ? '...' : ''}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                        Submitted: {new Date(req.submission_date).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {selectedRequest && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Request Details</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Property Address:</strong>
                                <p style={{ marginTop: '0.5rem' }}>{selectedRequest.resident_address}</p>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Description:</strong>
                                <p style={{ marginTop: '0.5rem' }}>{selectedRequest.description}</p>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Contractor:</strong> {selectedRequest.contractor_name || 'N/A'}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Timeline:</strong> {selectedRequest.projected_start || 'N/A'} to {selectedRequest.anticipated_end || 'N/A'}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Submitted:</strong> {new Date(selectedRequest.submission_date).toLocaleDateString()}
                            </div>
                            <div>
                                <strong>Current Status:</strong>{' '}
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    backgroundColor: getStatusColor(selectedRequest.status) + '20',
                                    color: getStatusColor(selectedRequest.status)
                                }}>
                                    {selectedRequest.status}
                                </span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Update Status</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {['Pending', 'Under Review', 'Approved', 'Denied', 'More Info Needed'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(selectedRequest.id, status)}
                                        className="btn"
                                        style={{
                                            backgroundColor: status === 'Denied' ? '#dc3545' : getStatusColor(status), // Ensure red for Denied if not already
                                            color: 'white',
                                            opacity: selectedRequest.status === status ? 1 : 0.8,
                                            transform: selectedRequest.status === status ? 'scale(1.05)' : 'none',
                                            border: selectedRequest.status === status ? '2px solid black' : 'none'
                                        }}
                                    >
                                        {status === 'Denied' ? 'Reject / Deny' : status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="btn"
                                style={{ border: '1px solid #ddd' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Request Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>New ARC Request</h2>
                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                borderRadius: '0.25rem',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreateSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description of Work</label>
                                <textarea
                                    required
                                    rows="4"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Contractor Name (if applicable)</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    value={formData.contractor_name}
                                    onChange={e => setFormData({ ...formData, contractor_name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Projected Start</label>
                                    <input
                                        type="date"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                        value={formData.projected_start}
                                        onChange={e => setFormData({ ...formData, projected_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Anticipated End</label>
                                    <input
                                        type="date"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                        value={formData.anticipated_end}
                                        onChange={e => setFormData({ ...formData, anticipated_end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        required
                                        style={{ marginTop: '0.25rem' }}
                                        checked={formData.terms_accepted}
                                        onChange={e => setFormData({ ...formData, terms_accepted: e.target.checked })}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: '#555' }}>
                                        I certify that I am the owner of the property and agree to abide by all community guidelines and architectural standards.
                                    </span>
                                </label>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn" style={{ border: '1px solid #ddd' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
