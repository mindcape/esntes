import React, { useState, useEffect } from 'react';

export default function Violations() {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchViolations();
    }, []);

    const fetchViolations = () => {
        fetch('http://127.0.0.1:8000/api/violations/my')
            .then(res => res.json())
            .then(data => {
                setViolations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handlePayFine = async (violationId, amount) => {
        if (!confirm(`Pay fine of $${amount.toFixed(2)}?`)) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/violations/${violationId}/pay`, {
                method: 'POST'
            });
            if (res.ok) {
                alert('Fine paid successfully!');
                fetchViolations();
            } else {
                const error = await res.json();
                alert(error.detail || 'Failed to pay fine.');
            }
        } catch (err) {
            console.error(err);
            alert('Error processing payment.');
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
