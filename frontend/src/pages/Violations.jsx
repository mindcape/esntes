import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

// ... (imports remain)
export default function Violations() {
    const { user, fetchWithAuth } = useAuth();
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchViolations();
    }, [user]); // Add user dependency

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

    const fetchViolations = async () => {
        // Ensure user is loaded
        if (!user?.community_id) return;

        try {
            const res = await fetchWithAuth(`${API_URL}/api/communities/${user.community_id}/violations/my`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setViolations(data);
                } else {
                    setViolations([]);
                }
            } else {
                setViolations([]);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load violations.");
            setViolations([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePayFine = async (violationId, amount) => {
        if (!window.confirm(`Pay fine of $${amount.toFixed(2)}?`)) return;
        setError(null);
        setSuccess(null);

        try {
            const res = await fetchWithAuth(`${API_URL}/api/communities/${user.community_id}/violations/${violationId}/pay`, {
                method: 'POST'
            });
            if (res.ok) {
                setSuccess('Fine paid successfully!');
                fetchViolations();
            } else {
                const error = await res.json();
                setError(error.detail || 'Failed to pay fine.');
            }
        } catch (err) {
            console.error(err);
            setError('Error processing payment.');
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

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>My Violations</h1>

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

            {violations.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>✓ No violations on record</p>
                    <p style={{ fontSize: '0.9rem' }}>You're in good standing with the community!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {violations.map(violation => (
                        <div key={violation.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0 }}>Violation #{violation.id}</h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            backgroundColor: getStatusColor(violation.status) + '20',
                                            color: getStatusColor(violation.status),
                                            border: `2px solid ${getStatusColor(violation.status)}`
                                        }}>
                                            {violation.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#999' }}>
                                        {new Date(violation.date).toLocaleDateString()}
                                    </div>
                                </div>
                                {violation.status === 'Fined' && violation.fine_amount > 0 && (
                                    <button
                                        onClick={() => handlePayFine(violation.id, violation.fine_amount)}
                                        className="btn btn-primary"
                                    >
                                        Pay Fine (${violation.fine_amount.toFixed(2)})
                                    </button>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Description:</strong>
                                <p style={{ marginTop: '0.5rem', color: '#555' }}>{violation.description}</p>
                            </div>

                            {violation.bylaw_reference && (
                                <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                                    Reference: {violation.bylaw_reference}
                                </div>
                            )}

                            {violation.fine_amount > 0 && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    backgroundColor: '#fff3cd',
                                    borderLeft: '4px solid #ffc107',
                                    borderRadius: '0.25rem'
                                }}>
                                    <strong>Fine Amount:</strong> ${violation.fine_amount.toFixed(2)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
