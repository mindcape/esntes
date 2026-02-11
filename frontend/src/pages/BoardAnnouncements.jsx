import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function BoardAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        audience: 'All Residents'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/communication`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!window.confirm("This will immediately send an email to the selected audience. Are you sure?")) return;

        try {
            const res = await fetch(`${API_URL}/api/communication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ title: '', content: '', audience: 'All Residents' });
                alert("Announcement sent!");
                fetchAnnouncements();
            } else {
                alert("Failed to create announcement");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Announcements & Mass Messaging</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ New Announcement</button>
            </div>

            {/* List View */}
            <div className="card">
                {loading ? <p>Loading...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem' }}>Title</th>
                                <th style={{ padding: '1rem' }}>Audience</th>
                                <th style={{ padding: '1rem' }}>Sent At</th>
                                <th style={{ padding: '1rem' }}>Stats</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <strong>{a.title}</strong>
                                        <div style={{ fontSize: '0.85rem', color: '#666', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {a.content}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem',
                                            backgroundColor: '#f3f4f6', color: '#1f2937'
                                        }}>
                                            {a.audience}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {new Date(a.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {a.delivery_stats ? (
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <span style={{ color: 'green' }}>✓ {a.delivery_stats.sent}</span> /
                                                <span style={{ color: '#666' }}> {a.delivery_stats.total}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {announcements.length === 0 && (
                                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No announcements sent yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '600px' }}>
                        <h2>Send Announcement</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Title (Subject)</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-control" />
                            </div>
                            <div className="form-group">
                                <label>Audience</label>
                                <select value={formData.audience} onChange={e => setFormData({ ...formData, audience: e.target.value })} className="form-control">
                                    <option value="All Residents">All Residents</option>
                                    <option value="Owners Only">Owners Only</option>
                                    <option value="Rental Tenants">Rental Tenants</option>
                                    <option value="Board Only">Board Only</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Content (Email Body)</label>
                                <textarea required rows="8" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="form-control" />
                                <small style={{ color: '#666' }}>Plain text for now. Emails will be sent immediately.</small>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn">Cancel</button>
                                <button type="submit" className="btn btn-primary">Send Blast</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
