import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function Calendar() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'Meeting',
        start_date: '',
        end_date: '',
        location: '',
        recurrence_rule: '',
        recurrence_end_date: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = () => {
        if (!user?.community_id) return;
        setLoading(true);
        // NEW NESTED ENDPOINT
        fetch(`${API_URL}/api/communities/${user.community_id}/events`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const formattedEvents = data.map(event => ({
                        ...event,
                        start: new Date(event.start_date),
                        end: new Date(event.end_date),
                    }));
                    setEvents(formattedEvents);
                } else {
                    setEvents([]);
                    console.error("Unexpected API response:", data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching events:", err);
                setLoading(false);
            });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.title || !formData.title.trim()) {
            setError('Event title is required.');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            setError('Start and end dates are required.');
            return;
        }

        // Validate end date is after start date
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            setError('End date must be after start date.');
            return;
        }

        const payload = { ...formData };
        if (!payload.recurrence_rule) {
            payload.recurrence_rule = null;
            payload.recurrence_end_date = null;
        } else if (!payload.recurrence_end_date) {
            setError('Please select an end date for the recurrence.');
            return;
        } else {
            // Ensure it's a datetime string for Pydantic (append end of day time)
            payload.recurrence_end_date = new Date(payload.recurrence_end_date + 'T23:59:59').toISOString();
        }

        try {
            // NEW NESTED ENDPOINT
            const url = selectedEvent
                ? `${API_URL}/api/communities/${user.community_id}/events/${selectedEvent.id}`
                : `${API_URL}/api/communities/${user.community_id}/events`;

            const res = await fetch(url, {
                method: selectedEvent ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}` // Auth for admin check
                },
                body: JSON.stringify({
                    ...payload,
                    // Ensure dates are sent as ISO strings
                    start_date: new Date(payload.start_date).toISOString(),
                    end_date: new Date(payload.end_date).toISOString()
                })
            });

            if (res.ok) {
                setShowModal(false);
                setSelectedEvent(null);
                setFormData({
                    title: '',
                    description: '',
                    event_type: 'Meeting',
                    start_date: '',
                    end_date: '',
                    location: '',
                    recurrence_rule: '',
                    recurrence_end_date: ''
                });
                fetchEvents();
            } else {
                const error = await res.json();
                setError(error.detail || 'Failed to save event.');
            }
        } catch (err) {
            console.error(err);
            setError('Error saving event.');
        }
    };

    const handleEdit = (event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            event_type: event.event_type,
            // Format dates for input[type="datetime-local"] (YYYY-MM-DDTHH:mm)
            start_date: new Date(event.start_date).toISOString().slice(0, 16),
            end_date: new Date(event.end_date).toISOString().slice(0, 16),
            location: event.location || '',
            recurrence_rule: event.recurrence_rule || '',
            recurrence_end_date: event.recurrence_end_date ? new Date(event.recurrence_end_date).toISOString().slice(0, 10) : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        setError('');

        try {
            // NEW NESTED ENDPOINT
            const res = await fetch(`${API_URL}/api/communities/${user.community_id}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('nibrr_token')}` }
            });

            if (res.ok) {
                fetchEvents();
            } else {
                setError('Failed to delete event.');
                window.scrollTo(0, 0);
            }
        } catch (err) {
            console.error(err);
            setError('Error deleting event.');
            window.scrollTo(0, 0);
        }
    };

    const getEventColor = (type) => {
        const colors = {
            'Meeting': '#2563eb',
            'Maintenance': '#dc2626',
            'Social': '#16a34a',
            'Holiday': '#9333ea',
            'Other': '#6b7280'
        };
        return colors[type] || '#6b7280';
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) return <div className="container">Loading...</div>;

    const canEdit = user?.role === 'board' || user?.role === 'admin';

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Community Calendar</h1>
                {canEdit && (
                    <button onClick={() => { setSelectedEvent(null); setError(''); setShowModal(true); }} className="btn btn-primary">
                        + Add Event
                    </button>
                )}
            </div>

            {error && !showModal && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    border: '1px solid #f5c6cb'
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {events.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        <p>No upcoming events.</p>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="card">
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: getEventColor(event.event_type) + '20',
                                    border: `2px solid ${getEventColor(event.event_type)}`,
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    minWidth: '80px'
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getEventColor(event.event_type) }}>
                                        {new Date(event.start_date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getEventColor(event.event_type) }}>
                                        {new Date(event.start_date).getDate()}
                                    </span>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0 }}>{event.title}</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {event.recurrence_rule && (
                                                <span title={`Repeats ${event.recurrence_rule}`} style={{ fontSize: '1.2rem' }}>🔄</span>
                                            )}
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                backgroundColor: getEventColor(event.event_type),
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}>
                                                {event.event_type}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <strong>Start:</strong> {formatDateTime(event.start_date)}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <strong>End:</strong> {formatDateTime(event.end_date)}
                                    </div>
                                    {event.recurrence_rule && (
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                                            Repeats {event.recurrence_rule} until {new Date(event.recurrence_end_date).toLocaleDateString()}
                                        </div>
                                    )}

                                    {event.location && (
                                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                            📍 {event.location}
                                        </div>
                                    )}

                                    {event.description && (
                                        <p style={{ marginTop: '0.75rem', color: '#555' }}>{event.description}</p>
                                    )}

                                    {canEdit && (
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => { setError(''); handleEdit(event); }}
                                                className="btn"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="btn"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: '#dc2626', color: 'white' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{selectedEvent ? 'Edit Event' : 'Add New Event'}</h2>
                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                borderRadius: '0.25rem',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Event Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Event Type *
                                </label>
                                <select
                                    value={formData.event_type}
                                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                >
                                    <option value="Meeting">Meeting</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Social">Social</option>
                                    <option value="Holiday">Holiday</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Start Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        End Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>

                            {/* Recurrence Section */}
                            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '0.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Recurrence</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Repeat</label>
                                        <select
                                            value={formData.recurrence_rule}
                                            onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                        >
                                            <option value="">None (One-time)</option>
                                            <option value="DAILY">Daily</option>
                                            <option value="WEEKLY">Weekly</option>
                                            <option value="MONTHLY">Monthly</option>
                                        </select>
                                    </div>
                                    {formData.recurrence_rule && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Until Date</label>
                                            <input
                                                type="date"
                                                value={formData.recurrence_end_date}
                                                onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                                                required={!!formData.recurrence_rule}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="e.g., Community Center"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setSelectedEvent(null); }}
                                    className="btn"
                                    style={{ border: '1px solid #ddd' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedEvent ? 'Update Event' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
