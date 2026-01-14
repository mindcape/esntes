import React, { useState } from 'react';
import { API_URL } from '../config';

export default function PaymentModal({ amount, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const handlePay = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API delay
        await new Promise(r => setTimeout(r, 1500));

        try {
            const response = await fetch(`${API_URL}/api/finance/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount, card_Last4: '4242' })
            });
            if (response.ok) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error("Payment failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                <h3>Make a Payment</h3>
                <p style={{ marginBottom: '1rem' }}>Total Due: <strong>${amount.toFixed(2)}</strong></p>

                <form onSubmit={handlePay}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Card Number</label>
                        <input type="text" placeholder="xxxx xxxx xxxx xxxx" disabled value="4242 4242 4242 4242"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Expiry</label>
                            <input type="text" placeholder="MM/YY" disabled value="12/28"
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>CVC</label>
                            <input type="text" placeholder="123" disabled value="123"
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid #ddd' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Processing...' : 'Pay Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
