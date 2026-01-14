import React, { useState, useEffect } from 'react';

export default function BoardARC() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = () => {
        fetch('http://127.0.0.1:8000/api/property/arc/all')
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

    const updateStatus = async (requestId, newStatus) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/property/arc/${requestId}/status?status=${newStatus}`, {
                method: 'PUT'
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

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>ARC Approvals</h1>

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
                                            backgroundColor: getStatusColor(status),
                                            color: 'white',
                                            border: 'none'
                                        }}
                                    >
                                        {status}
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
        </div>
    );
}
