import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function BoardOnboarding() {
    const [status, setStatus] = useState({ is_active: false, charges_enabled: false, payouts_enabled: false });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/api/payments/status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('esntes_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnablePayments = async () => {
        try {
            const res = await fetch(`${API_URL}/api/payments/onboard`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('esntes_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Redirect to Stripe
                window.location.href = data.url;
            } else {
                alert("Failed to start onboarding.");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to server.");
        }
    };

    if (loading) return <div>Checking payment status...</div>;

    return (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #635bff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>💳</span> Online Payments (Stripe)
                    </h3>
                    <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9rem' }}>
                        {status.charges_enabled
                            ? "Your community is set up to receive payments."
                            : "Connect your bank account to start accepting online payments from residents."}
                    </p>
                </div>
                <div>
                    {status.charges_enabled ? (
                        <span style={{
                            padding: '0.5rem 1rem', backgroundColor: '#def7ec', color: '#03543f',
                            borderRadius: '2rem', fontWeight: 'bold', fontSize: '0.9rem'
                        }}>
                            Active & Connected
                        </span>
                    ) : (
                        <button
                            onClick={handleEnablePayments}
                            className="btn"
                            style={{
                                backgroundColor: '#635bff', color: 'white', border: 'none',
                                padding: '0.75rem 1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            Enable Payments
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
