import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function Ledger() {
    const { user } = useAuth();
    const [ledger, setLedger] = useState([]);
    const [summary, setSummary] = useState({ current_balance: 0 });
    const [showPayment, setShowPayment] = useState(false);
    const [success, setSuccess] = useState(null);

    const fetchData = () => {
        if (!user?.community_id) return;
        const token = localStorage.getItem('esntes_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        fetch(`${API_URL}/api/communities/${user.community_id}/finance/ledger`, { headers })
            .then(res => res.json())
            .then(setLedger)
            .catch(console.error);

        fetch(`${API_URL}/api/communities/${user.community_id}/finance/balance`, { headers })
            .then(res => res.json())
            .then(setSummary)
            .catch(console.error);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Auto-dismiss notifications
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <div className="container">
            <Link to="/dashboard" style={{ display: 'inline-block', marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>← Back to Dashboard</Link>

            {/* Inline Notifications */}
            {success && (
                <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                    {success}
                </div>
            )}

            <div className="header">
                <h1>Financial Ledger</h1>
            </div>

            <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                <div>
                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Balance Due</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                        ${summary.current_balance.toFixed(2)}
                    </div>
                </div>
                <button onClick={() => setShowPayment(true)} className="btn" style={{ backgroundColor: 'white', color: 'hsl(var(--primary))' }}>
                    Pay Now
                </button>
            </div>

            {showPayment && (
                <PaymentModal
                    amount={summary.current_balance}
                    onClose={() => setShowPayment(false)}
                    onSuccess={() => {
                        setSuccess("Payment Successful!");
                        fetchData();
                    }}
                />
            )}

            <div className="card">
                <h3>Transaction History</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', color: '#666' }}>Date</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Description</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Type</th>
                            <th style={{ padding: '1rem', color: '#666', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '1rem', color: '#666', textAlign: 'right' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{tx.description}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#f0f0f0'
                                    }}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>${tx.amount.toFixed(2)}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${tx.balance_after.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
