import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'Meeting',
        start_date: '',
        end_date: '',
        location: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = () => {
        fetch('http://127.0.0.1:8000/api/calendar/events')
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.title.trim()) {
            alert('Event title is required.');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            alert('Start and end dates are required.');
            return;
        }

        // Validate end date is after start date
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            alert('End date must be after start date.');
            return;
        }

        try {
            const url = selectedEvent
                ? `http://127.0.0.1:8000/api/calendar/events/${selectedEvent.id}`
                : 'http://127.0.0.1:8000/api/calendar/events';

            const res = await fetch(url, {
                method: selectedEvent ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
                    location: ''
                });
                fetchEvents();
            } else {
                const error = await res.json();
                alert(error.detail || 'Failed to save event.');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving event.');
        }
    };

    const handleEdit = (event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            event_type: event.event_type,
            start_date: new Date(event.start_date).toISOString().slice(0, 16),
            end_date: new Date(event.end_date).toISOString().slice(0, 16),
            location: event.location || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/calendar/events/${eventId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchEvents();
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting event.');
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

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Community Calendar</h1>
                {user?.role === 'board' && (
                    <button onClick={() => { setSelectedEvent(null); setShowModal(true); }} className="btn btn-primary">
                        + Add Event
                    </button>
                )}
            </div>

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

                                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <strong>Start:</strong> {formatDateTime(event.start_date)}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                        <strong>End:</strong> {formatDateTime(event.end_date)}
                                    </div>

                                    {event.location && (
                                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                            📍 {event.location}
                                        </div>
                                    )}

                                    {event.description && (
                                        <p style={{ marginTop: '0.75rem', color: '#555' }}>{event.description}</p>
                                    )}

                                    {user?.role === 'board' && (
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEdit(event)}
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

                            <div style={{ marginBottom: '1rem' }}>
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

                            <div style={{ marginBottom: '1rem' }}>
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
