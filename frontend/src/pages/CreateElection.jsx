import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function CreateElection() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Redirect if not board member (double check)
    if (user && user.role !== 'board') {
        navigate('/elections');
    }

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        is_active: true,
        election_type: 'single',
        allowed_selections: 1,
        candidates: [
            { name: '', bio: '', photo_url: '' },
            { name: '', bio: '', photo_url: '' } // Start with 2 empty candidates
        ]
    });
    const [error, setError] = useState('');

    const handleMetaChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCandidateChange = (index, field, value) => {
        const newCandidates = [...formData.candidates];
        newCandidates[index][field] = value;
        setFormData({ ...formData, candidates: newCandidates });
    };

    const addCandidate = () => {
        setFormData({
            ...formData,
            candidates: [...formData.candidates, { name: '', bio: '', photo_url: '' }]
        });
    };

    const removeCandidate = (index) => {
        if (formData.candidates.length <= 1) return;
        const newCandidates = formData.candidates.filter((_, i) => i !== index);
        setFormData({ ...formData, candidates: newCandidates });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic Validation
        if (!formData.title || !formData.start_date || !formData.end_date) {
            setError('Please fill in all election details.');
            window.scrollTo(0, 0);
            return;
        }

        // Validate candidates
        const validCandidates = formData.candidates.filter(c => c.name.trim() !== '');
        if (validCandidates.length < 2) {
            setError('Please provide at least 2 valid candidates.');
            window.scrollTo(0, 0);
            return;
        }

        try {
            const payload = {
                ...formData,
                candidates: validCandidates,
            };

            const token = localStorage.getItem('nibrr_token');
            const res = await fetch(`${API_URL}/api/voting/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                navigate('/elections');
            } else {
                const err = await res.json();
                setError(err.detail || 'Failed to create election');
                window.scrollTo(0, 0);
            }
        } catch (err) {
            console.error(err);
            setError('Error creating election');
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="container">
            <button onClick={() => navigate('/elections')} className="btn" style={{ marginBottom: '1rem', border: '1px solid #ddd' }}>
                Cancel
            </button>

            <div className="card">
                <h1 style={{ marginBottom: '1.5rem' }}>Create New Election</h1>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '0.25rem',
                        marginBottom: '1rem',
                        border: '1px solid #f5c6cb'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Election Metadata */}
                    <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Election Details</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleMetaChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                placeholder="e.g. 2026 Board Election"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Election Type</label>
                                <select
                                    name="election_type"
                                    value={formData.election_type}
                                    onChange={handleMetaChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                >
                                    <option value="single">Single Member (Vote for 1)</option>
                                    <option value="multi">Multi-Member (Vote for N)</option>
                                    <option value="vendor">Vendor Selection</option>
                                </select>
                            </div>
                            {formData.election_type === 'multi' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Allowed Selections</label>
                                    <input
                                        type="number"
                                        name="allowed_selections"
                                        value={formData.allowed_selections}
                                        onChange={handleMetaChange}
                                        min="2"
                                        max={Math.max(2, formData.candidates.length)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleMetaChange}
                                rows="3"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                placeholder="Purpose of this election..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleMetaChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleMetaChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Candidates */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Candidates</h3>

                        {formData.candidates.map((candidate, index) => (
                            <div key={index} style={{
                                padding: '1rem',
                                border: '1px solid #eee',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                backgroundColor: '#f9fafb'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <strong>Candidate #{index + 1}</strong>
                                    {formData.candidates.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCandidate(index)}
                                            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div style={{ marginBottom: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={candidate.name}
                                        onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd', marginBottom: '0.5rem' }}
                                    />
                                    <textarea
                                        placeholder="Bio / Platform Statement"
                                        value={candidate.bio}
                                        onChange={(e) => handleCandidateChange(index, 'bio', e.target.value)}
                                        rows="2"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd', marginBottom: '0.5rem' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Photo URL (Optional)"
                                        value={candidate.photo_url}
                                        onChange={(e) => handleCandidateChange(index, 'photo_url', e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addCandidate}
                            className="btn"
                            style={{ width: '100%', border: '1px dashed #aaa', color: '#555' }}
                        >
                            + Add Another Candidate
                        </button>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                            Launch Election
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
