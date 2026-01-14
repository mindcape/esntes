import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function Documents() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        category: 'all'
    });
    const [formData, setFormData] = useState({
        title: '',
        category: 'Bylaws',
        access_level: 'Public',
        description: '',
        file_url: ''
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = () => {
        const role = user?.role || 'resident';
        fetch(`${API_URL}/api/documents?user_role=${role}`)
            .then(res => res.json())
            .then(data => {
                setDocuments(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.title.trim()) {
            alert('Document title is required.');
            return;
        }

        if (!formData.file_url || !formData.file_url.trim()) {
            alert('File URL is required.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/documents/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({
                    title: '',
                    category: 'Bylaws',
                    access_level: 'Public',
                    description: '',
                    file_url: ''
                });
                fetchDocuments();
            } else {
                const error = await res.json();
                alert(error.detail || 'Failed to upload document.');
            }
        } catch (err) {
            console.error(err);
            alert('Error uploading document.');
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const res = await fetch(`${API_URL}/api/documents/${docId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchDocuments();
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting document.');
        }
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'Bylaws': '📜',
            'Meeting Minutes': '📝',
            'Financial Reports': '💰',
            'Policies': '📋',
            'Other': '📄'
        };
        return icons[category] || '📄';
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Bylaws': '#2563eb',
            'Meeting Minutes': '#16a34a',
            'Financial Reports': '#dc2626',
            'Policies': '#9333ea',
            'Other': '#6b7280'
        };
        return colors[category] || '#6b7280';
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = filters.search === '' ||
            doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            (doc.description && doc.description.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesCategory = filters.category === 'all' || doc.category === filters.category;

        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Document Library</h1>
                {user?.role === 'board' && (
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        + Upload Document
                    </button>
                )}
            </div>

            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Search by title or description..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                            Category
                        </label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                        >
                            <option value="all">All Categories</option>
                            <option value="Bylaws">Bylaws</option>
                            <option value="Meeting Minutes">Meeting Minutes</option>
                            <option value="Financial Reports">Financial Reports</option>
                            <option value="Policies">Policies</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredDocuments.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        <p>No documents found.</p>
                    </div>
                ) : (
                    filteredDocuments.map(doc => (
                        <div key={doc.id} className="card">
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
                                <div style={{
                                    fontSize: '3rem',
                                    minWidth: '60px',
                                    textAlign: 'center'
                                }}>
                                    {getCategoryIcon(doc.category)}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0 }}>{doc.title}</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                backgroundColor: getCategoryColor(doc.category),
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}>
                                                {doc.category}
                                            </span>
                                            {doc.access_level === 'Board Only' && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    backgroundColor: '#dc2626',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    🔒 Board Only
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {doc.description && (
                                        <p style={{ color: '#666', marginBottom: '0.5rem' }}>{doc.description}</p>
                                    )}

                                    <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
                                        Uploaded by {doc.uploaded_by} on {new Date(doc.upload_date).toLocaleDateString()}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => window.open(doc.file_url, '_blank')}
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                        >
                                            📥 Download
                                        </button>
                                        {user?.role === 'board' && (
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="btn"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: '#dc2626', color: 'white' }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
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
                        <h2 style={{ marginBottom: '1.5rem' }}>Upload Document</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Document Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="e.g., 2026 Annual Budget"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Category *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                >
                                    <option value="Bylaws">Bylaws</option>
                                    <option value="Meeting Minutes">Meeting Minutes</option>
                                    <option value="Financial Reports">Financial Reports</option>
                                    <option value="Policies">Policies</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Access Level *
                                </label>
                                <select
                                    value={formData.access_level}
                                    onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                >
                                    <option value="Public">Public (All Residents)</option>
                                    <option value="Board Only">Board Only</option>
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
                                    placeholder="Brief description of the document..."
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    File URL * <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}>(Mock - in production, use file upload)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.file_url}
                                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    placeholder="/documents/example.pdf"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn"
                                    style={{ border: '1px solid #ddd' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Upload Document
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
