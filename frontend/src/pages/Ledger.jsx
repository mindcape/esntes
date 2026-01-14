import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

export default function Ledger() {
    const [ledger, setLedger] = useState([]);
    const [summary, setSummary] = useState({ current_balance: 0 });
    const [showPayment, setShowPayment] = useState(false);

    const fetchData = () => {
        fetch('http://127.0.0.1:8000/api/finance/ledger').then(res => res.json()).then(setLedger).catch(console.error);
        fetch('http://127.0.0.1:8000/api/finance/balance').then(res => res.json()).then(setSummary).catch(console.error);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="container">
            <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
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
                        alert("Payment Successful!");
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
