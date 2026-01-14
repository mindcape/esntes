import React, { useState, useEffect } from 'react';

export default function Financials() {
    const [delinquencies, setDelinquencies] = useState([]);
    const [balanceSheet, setBalanceSheet] = useState(null);
    const [incomeStatement, setIncomeStatement] = useState(null);
    const [activeTab, setActiveTab] = useState('actions'); // 'actions' or 'reports'
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('http://127.0.0.1:8000/api/finance/delinquencies').then(r => r.json()),
            fetch('http://127.0.0.1:8000/api/finance/reports/balance-sheet').then(r => r.json()),
            fetch('http://127.0.0.1:8000/api/finance/reports/income-statement').then(r => r.json())
        ]).then(([delinqData, bsData, isData]) => {
            setDelinquencies(delinqData);
            setBalanceSheet(bsData);
            setIncomeStatement(isData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const fetchDelinquencies = () => {
        fetch('http://127.0.0.1:8000/api/finance/delinquencies')
            .then(res => res.json())
            .then(setDelinquencies)
            .catch(console.error);
    };

    const runAssessments = async () => {
        setMessage('');
        try {
            const res = await fetch('http://127.0.0.1:8000/api/finance/assessments/generate', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Success: ${data.message}`);
            } else {
                setMessage('Failed to generate assessments.');
            }
        } catch (err) {
            console.error(err);
            setMessage('Error generating assessments.');
        }
    };

    const runLateFees = async () => {
        setMessage('');
        try {
            const res = await fetch('http://127.0.0.1:8000/api/finance/assessments/late-fees', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Success: ${data.message}`);
                fetchDelinquencies(); // Refresh list as balances might change
            } else {
                setMessage('Failed to assess late fees.');
            }
        } catch (err) {
            console.error(err);
            setMessage('Error assessing late fees.');
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>Financial Management</h1>

            {message && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: message.includes('Success') ? '#d4edda' : '#f8d7da',
                    color: message.includes('Success') ? '#155724' : '#721c24',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #ddd' }}>
                <button
                    onClick={() => setActiveTab('actions')}
                    style={{
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'actions' ? '3px solid hsl(215 25% 27%)' : '3px solid transparent',
                        fontWeight: activeTab === 'actions' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        color: activeTab === 'actions' ? 'hsl(215 25% 27%)' : '#666'
                    }}
                >
                    Actions & Delinquencies
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    style={{
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'reports' ? '3px solid hsl(215 25% 27%)' : '3px solid transparent',
                        fontWeight: activeTab === 'reports' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        color: activeTab === 'reports' ? 'hsl(215 25% 27%)' : '#666'
                    }}
                >
                    Financial Reports
                </button>
            </div>

            {activeTab === 'actions' ? (
                <>
                    <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f8f9fa' }}>

                        <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f8f9fa' }}>
                            <h3>Automated Actions</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={runAssessments} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>💰</span> Check/Run Assessments
                                </button>
                                <button onClick={runLateFees} className="btn" style={{ border: '1px solid #dc3545', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>⚠️</span> Check/Run Late Fees
                                </button>
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                *Triggers automated batch processing for all accounts.
                            </p>
                        </div>

                        <div className="card">
                            <h3>Delinquency Report</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem', color: '#666' }}>Resident</th>
                                            <th style={{ padding: '1rem', color: '#666' }}>Address</th>
                                            <th style={{ padding: '1rem', color: '#666', textAlign: 'right' }}>Past Due Balance</th>
                                            <th style={{ padding: '1rem', color: '#666', textAlign: 'right' }}>Days Overdue</th>
                                            <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {delinquencies.map(d => (
                                            <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '1rem', fontWeight: '500' }}>{d.name}</td>
                                                <td style={{ padding: '1rem', color: '#666' }}>{d.address}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#dc3545' }}>
                                                    ${d.balance.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>{d.days_overdue}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#f8d7da',
                                                        color: '#721c24',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        DELINQUENT
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Balance Sheet */}
                    <div className="card">
                        <h3>Balance Sheet</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                            <div>
                                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: '#666' }}>Assets</h4>
                                {balanceSheet?.assets.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>{item.category}</span>
                                        <span style={{ fontWeight: '500' }}>${item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #eee', fontWeight: 'bold' }}>
                                    <span>Total Assets</span>
                                    <span>${balanceSheet?.total_assets.toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: '#666' }}>Liabilities</h4>
                                {balanceSheet?.liabilities.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>{item.category}</span>
                                        <span style={{ fontWeight: '500' }}>${item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: '#666' }}>Equity</h4>
                                {balanceSheet?.equity.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>{item.category}</span>
                                        <span style={{ fontWeight: '500' }}>${item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #eee', fontWeight: 'bold' }}>
                                    <span>Total Liab. & Equity</span>
                                    <span>${balanceSheet?.total_liabilities_equity.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Income Statement / Budget Variance */}
                    <div className="card">
                        <h3>Income Statement & Budget Variance</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: '#666' }}>Category</th>
                                    <th style={{ padding: '0.75rem', color: '#666', textAlign: 'right' }}>Actual</th>
                                    <th style={{ padding: '0.75rem', color: '#666', textAlign: 'right' }}>Budget</th>
                                    <th style={{ padding: '0.75rem', color: '#666', textAlign: 'right' }}>Variance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ backgroundColor: '#f9f9f9' }}><td colSpan="4" style={{ padding: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>REVENUE</td></tr>
                                {incomeStatement?.revenue.map((item, i) => (
                                    <tr key={`rev-${i}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>{item.category}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>${item.actual.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#888' }}>${item.budget.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 'bold', color: item.variance >= 0 ? '#155724' : '#721c24' }}>
                                            {item.variance >= 0 ? '+' : ''}{item.variance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#f9f9f9' }}><td colSpan="4" style={{ padding: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', paddingTop: '1rem' }}>EXPENSES</td></tr>
                                {incomeStatement?.expenses.map((item, i) => (
                                    <tr key={`exp-${i}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>{item.category}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>${item.actual.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#888' }}>${item.budget.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 'bold', color: item.variance >= 0 ? '#155724' : '#721c24' }}>
                                            {item.variance >= 0 ? '+' : ''}{item.variance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ borderTop: '2px solid #ddd' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>NET INCOME</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>${incomeStatement?.net_income.toLocaleString()}</td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
