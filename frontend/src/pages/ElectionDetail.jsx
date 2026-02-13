import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

// ... (imports)

export default function ElectionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, fetchWithAuth } = useAuth();

    const [election, setElection] = useState(null);
    const [results, setResults] = useState(null);
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errored, setErrored] = useState(false);

    // UI State
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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

    useEffect(() => {
        // Fetch all elections to find this one
        const fetchElection = async () => {
            try {
                const res = await fetchWithAuth(`${API_URL}/api/voting/`);
                if (res.ok) {
                    const data = await res.json();
                    const found = data.find(e => e.id === parseInt(id));
                    if (found) {
                        setElection(found);
                        if (found.has_voted) {
                            fetchResults();
                        }
                    } else {
                        setErrored(true);
                        setError("Election not found or Access Denied.");
                    }
                } else {
                    throw new Error("Failed to fetch elections");
                }
            } catch (err) {
                console.error(err);
                setErrored(true);
                setError("Failed to load election details.");
            } finally {
                setLoading(false);
            }
        };
        fetchElection();
    }, [id]);

    const fetchResults = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/voting/${id}/results`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            } else {
                setError("Failed to load results.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load results.");
        }
    };

    const toggleCandidate = (candidateId) => {
        if (!election) return;
        setError(null);

        const limit = election.allowed_selections || 1;

        if (limit > 1) {
            // Multi-select
            if (selectedCandidates.includes(candidateId)) {
                setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
            } else {
                if (selectedCandidates.length < limit) {
                    setSelectedCandidates(prev => [...prev, candidateId]);
                } else {
                    setError(`You can only select up to ${limit} candidates.`);
                }
            }
        } else {
            // Single select
            setSelectedCandidates([candidateId]);
        }
    };

    const handleVote = async () => {
        if (selectedCandidates.length === 0) return;
        setError(null);
        setSuccess(null);

        try {
            const res = await fetchWithAuth(`${API_URL}/api/voting/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    election_id: parseInt(id),
                    candidate_ids: selectedCandidates
                })
            });

            if (res.ok) {
                // Refresh to show results
                const updated = { ...election, has_voted: true };
                setElection(updated);
                setSuccess("Vote submitted successfully!");
                fetchResults();
            } else {
                const err = await res.json();
                setError(err.detail || 'Voting failed');
            }
        } catch (err) {
            console.error(err);
            setError('Error submitting vote');
        }
    };

    const handleEndElection = async () => {
        if (!window.confirm("Are you sure you want to end this election immediately?")) return;
        setError(null);
        setSuccess(null);

        try {
            const res = await fetchWithAuth(`${API_URL}/api/voting/${id}/end`, {
                method: 'POST'
            });

            if (res.ok) {
                // Refresh election details
                setLoading(true);
                setSuccess("Election ended successfully.");
                window.location.reload();
            } else {
                setError('Failed to end election');
            }
        } catch (err) {
            console.error(err);
            setError('Error ending election');
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (errored || !election) return <div className="container">Election not found.</div>;

    const isVotingOpen = election.is_active && new Date() >= new Date(election.start_date) && new Date() <= new Date(election.end_date);
    const limit = election.allowed_selections || 1;

    return (
        <div className="container">
            <button onClick={() => navigate('/elections')} className="btn" style={{ marginBottom: '1rem', border: '1px solid #ddd' }}>
                &larr; Back to Elections
            </button>

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

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0' }}>{election.title}</h1>
                        <p style={{ color: '#666', fontSize: '1.1rem' }}>{election.description}</p>
                        <div style={{ marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
                            Type: {election.election_type === 'vendor' ? 'Vendor Selection' : (limit > 1 ? `Multi-Member (Pick ${limit})` : 'Single Member')} <br />
                            Voting Period: {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                        </div>
                    </div>
                    {user && user.role === 'board' && isVotingOpen && (
                        <button
                            onClick={handleEndElection}
                            className="btn"
                            style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            End Voting Now
                        </button>
                    )}
                </div>
            </div>

            {election.has_voted ? (
                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem', color: '#16a34a' }}>✓ You have voted in this election</h2>
                    {election.vote_timestamp && (
                        <p style={{ color: '#666', marginBottom: '1rem' }}>
                            Vote submitted on: {new Date(election.vote_timestamp + 'Z').toLocaleString()}
                        </p>
                    )}

                    {!isVotingOpen && new Date() > new Date(election.end_date) ? (
                        <>
                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Final Results</h3>
                            {results ? (
                                <div>
                                    {results.results.map(r => (
                                        <div key={r.candidate_id} style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: '500' }}>{r.candidate_name}</span>
                                                <span>{r.vote_count} votes ({results.total_votes > 0 ? Math.round(r.vote_count / results.total_votes * 100) : 0}%)</span>
                                            </div>
                                            <div style={{ height: '10px', backgroundColor: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${results.total_votes > 0 ? (r.vote_count / results.total_votes * 100) : 0}%`,
                                                    backgroundColor: '#2563eb',
                                                    height: '100%'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '1rem', textAlign: 'right', color: '#666' }}>
                                        Total Votes: {results.total_votes}
                                    </div>
                                </div>
                            ) : (
                                <p>Loading results...</p>
                            )}
                        </>
                    ) : (
                        <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                            <h3>Results Pending</h3>
                            <p style={{ color: '#555' }}>
                                Results will be available after the election ends on {new Date(election.end_date).toLocaleDateString()} at {new Date(election.end_date).toLocaleTimeString()}.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {isVotingOpen ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {election.candidates.map(candidate => {
                                const isSelected = selectedCandidates.includes(candidate.id);
                                return (
                                    <div
                                        key={candidate.id}
                                        className="card"
                                        style={{
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid #2563eb' : '1px solid #eee',
                                            backgroundColor: isSelected ? '#f0f7ff' : 'white',
                                            position: 'relative'
                                        }}
                                        onClick={() => toggleCandidate(candidate.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{
                                                width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee',
                                                marginRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem'
                                            }}>
                                                {candidate.photo_url ? <img src={candidate.photo_url} alt="" /> : (election.election_type === 'vendor' ? '🏢' : '👤')}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0 }}>{candidate.name}</h3>
                                            </div>
                                        </div>
                                        <p style={{ color: '#555', lineHeight: '1.5' }}>{candidate.bio}</p>

                                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%',
                                                border: '2px solid #ccc',
                                                margin: '0 auto',
                                                backgroundColor: isSelected ? '#2563eb' : 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}>
                                                {isSelected && '✓'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <h2>Voting is currently closed</h2>
                            <p>Please check back during the scheduled voting period.</p>
                        </div>
                    )}

                    {isVotingOpen && (
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                onClick={handleVote}
                                className="btn btn-primary"
                                style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}
                                disabled={selectedCandidates.length === 0}
                            >
                                Submit Private Ballot
                                {selectedCandidates.length > 0 && ` (${selectedCandidates.length} selected)`}
                            </button>
                            <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
                                Your vote is anonymous and cannot be changed once submitted.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
