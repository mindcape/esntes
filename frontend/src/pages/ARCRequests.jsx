import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function ARCRequests() {
    const [requests, setRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
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
    }, []);

    const fetchRequests = () => {
        fetch(`${API_URL}/api/property/arc/my`)
            .then(res => res.json())
            .then(data => {
                setRequests(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!formData.contractor_name || !formData.contractor_name.trim()) {
            alert("Contractor name is required. Enter 'Self' for DIY projects.");
            return;
        }

        if (!formData.projected_start) {
            alert("Projected start date is required.");
            return;
        }

        // Validate end date is after start date
        if (formData.anticipated_end && formData.projected_start) {
            const startDate = new Date(formData.projected_start);
            const endDate = new Date(formData.anticipated_end);
            if (endDate <= startDate) {
                alert("Anticipated end date must be after the projected start date.");
                return;
            }
        }

        try {
            const res = await fetch(`${API_URL}/api/property/arc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resident_id: 1, // Mock user ID
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
                fetchRequests();
            }
        } catch (err) {
            console.error(err);
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
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    + New Request
                </button>
            </div>

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
                    <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Submit ARC Request</h2>
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
