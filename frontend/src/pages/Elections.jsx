import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

export default function Elections() {
    const { user, fetchWithAuth } = useAuth();
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadElections = async () => {
            try {
                const res = await fetchWithAuth(`${API_URL}/api/elections/`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setElections(data);
                    else setElections([]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadElections();
    }, []);

    const getStatusBadge = (election) => {
        const now = new Date();
        const start = new Date(election.start_date);
        const end = new Date(election.end_date);

        if (!election.is_active) return <span className="status-badge status-closed">Draft</span>;
        if (now < start) return <span className="status-badge status-pending">Upcoming</span>;
        if (now > end) return <span className="status-badge status-closed">Closed</span>;
        return <span className="status-badge status-open">Active</span>;
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Elections & Voting</h1>
                {user?.role === 'board' && (
                    <Link to="/elections/new" className="btn btn-primary">+ Create Election</Link>
                )}
            </div>

            <div className="grid">
                {elections.map(election => (
                    <div key={election.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{election.title}</h3>
                            {getStatusBadge(election)}
                        </div>

                        <p style={{ color: '#666', marginBottom: '1rem' }}>{election.description}</p>

                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' }}>
                            <div>Start: {new Date(election.start_date).toLocaleString()}</div>
                            <div>End: {new Date(election.end_date).toLocaleString()}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {election.has_voted ? (
                                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ You Voted</span>
                            ) : (
                                <span style={{ color: '#666' }}>Not Voted</span>
                            )}

                            <Link to={`/elections/${election.id}`} className="btn btn-primary">
                                {election.has_voted ? 'View Results' : 'Vote Now'}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {elections.length === 0 && !loading && (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
                    No elections found.
                </div>
            )}
        </div>
    );
}
