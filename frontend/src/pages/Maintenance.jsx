import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function Maintenance() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [newRequest, setNewRequest] = useState({ title: '', description: '', category: 'General' });

    useEffect(() => {
        if (!user?.community_id) return;

        const token = localStorage.getItem('esntes_token') || localStorage.getItem('token');
        fetch(`${API_URL}/api/communities/${user.community_id}/maintenance`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRequests(data);
                else setRequests([]);
            })
            .catch(err => console.error("Failed to fetch requests", err));
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('esntes_token') || localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/communities/${user.community_id}/maintenance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newRequest)
            });
            if (response.ok) {
                const data = await response.json();
                setRequests([...requests, data]);
                setNewRequest({ title: '', description: '', category: 'General' });
            } else {
                console.error("Failed to submit request");
            }
        } catch (error) {
            console.error("Error submitting request", error);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1>Maintenance Requests</h1>
                <button className="btn btn-primary" onClick={() => document.getElementById('new-req-form').scrollIntoView({ behavior: 'smooth' })}>
                    + New Request
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }}>
                {requests.map(req => (
                    <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{req.title}</div>
                            <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>{req.category} • {new Date(req.submitted_at).toLocaleDateString()}</div>
                            <p style={{ marginTop: '0.5rem' }}>{req.description}</p>
                        </div>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.875rem',
                            backgroundColor: req.status === 'Open' ? 'hsl(38 92% 50%)' : '#eee',
                            color: req.status === 'Open' ? 'white' : 'black'
                        }}>
                            {req.status}
                        </span>
                    </div>
                ))}
            </div>

            <div id="new-req-form" className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3>Submit New Request</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
                        <input
                            type="text"
                            value={newRequest.title}
                            onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Category</label>
                        <select
                            value={newRequest.category}
                            onChange={e => setNewRequest({ ...newRequest, category: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                        >
                            <option>General</option>
                            <option>Plumbing</option>
                            <option>Electrical</option>
                            <option>Landscaping</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                        <textarea
                            rows="4"
                            value={newRequest.description}
                            onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Submit Request</button>
                </form>
            </div>
        </div>
    );
}
