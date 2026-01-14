import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

export default function Visitors() {
    const [visitorName, setVisitorName] = useState('');
    const [date, setDate] = useState('');
    const [accessCode, setAccessCode] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/visitors/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: visitorName,
                    arrival_date: new Date(date).toISOString()
                })
            });
            const data = await response.json();
            setAccessCode(data.access_code);
        } catch (err) {
            console.error("Failed to register visitor", err);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1>Visitor Access</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                <div className="card">
                    <h3>Register a Guest</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Guest Name</label>
                            <input
                                type="text"
                                value={visitorName}
                                onChange={e => setVisitorName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Arrival Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Generate Pass</button>
                    </form>
                </div>

                <div>
                    {accessCode ? (
                        <div className="card" style={{ textAlign: 'center', backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                            <h3>Gate Access Code</h3>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '0.5rem', margin: '1rem 0' }}>
                                {accessCode}
                            </div>
                            <p style={{ opacity: 0.8 }}>Share this code with {visitorName}</p>
                            <button onClick={() => { setAccessCode(null); setVisitorName(''); }} className="btn" style={{ marginTop: '1rem', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                Register Another
                            </button>
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', border: '2px dashed #ddd', borderRadius: '1rem' }}>
                            Gate code will appear here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
