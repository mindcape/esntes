import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function CommunitySettings() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        if (!user || user.role !== 'super_admin') {
            navigate('/admin');
            return;
        }

        // Fetch single community details
        // In a real app we'd have a specific endpoint or filter the list
        fetch(`${API_URL}/api/admin/communities`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const found = data.find(c => c.id === parseInt(id));
                    if (found) {
                        setCommunity({
                            ...found,
                            modules_enabled: found.modules_enabled || {
                                finance: true, arc: true, voting: true, violations: true, documents: true, calendar: true
                            },
                            branding_settings: found.branding_settings || { primary_color: '#0066cc', welcome_msg: '' }
                        });
                    } else {
                        alert("Community not found");
                        navigate('/admin');
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

    }, [id, user, navigate]);

    const handleUpdate = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${community.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: community.name,
                    subdomain: community.subdomain,
                    branding_settings: community.branding_settings,
                    modules_enabled: community.modules_enabled
                })
            });
            if (res.ok) {
                alert('Community updated successfully!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update settings');
        }
    };

    const toggleModule = (moduleKey) => {
        setCommunity(prev => ({
            ...prev,
            modules_enabled: {
                ...prev.modules_enabled,
                [moduleKey]: !prev.modules_enabled[moduleKey]
            }
        }));
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!community) return null;

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin')} className="btn" style={{ border: '1px solid #ddd', background: 'white' }}>
                    ← Back
                </button>
                <h1 style={{ margin: 0 }}>Configure {community.name}</h1>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    <button
                        onClick={() => setActiveTab('general')}
                        style={{ padding: '1rem 2rem', background: activeTab === 'general' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'general' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}
                    >General</button>
                    <button
                        onClick={() => setActiveTab('modules')}
                        style={{ padding: '1rem 2rem', background: activeTab === 'modules' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'modules' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}
                    >Modules</button>
                    <button
                        onClick={() => setActiveTab('data')}
                        style={{ padding: '1rem 2rem', background: activeTab === 'data' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'data' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}
                    >Data</button>
                    <button
                        onClick={() => setActiveTab('team')}
                        style={{ padding: '1rem 2rem', background: activeTab === 'team' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'team' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}
                    >Team</button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        style={{ padding: '1rem 2rem', background: activeTab === 'finance' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'finance' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}
                    >Finance</button>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem' }}>
                    {activeTab === 'team' && (
                        <TeamSettings communityId={community.id} />
                    )}
                    {activeTab === 'general' && (
                        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subdomain</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={community.subdomain || ''}
                                        onChange={e => setCommunity({ ...community, subdomain: e.target.value })}
                                        style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px 0 0 4px', fontSize: '1rem' }}
                                        placeholder="pinevalley"
                                    />
                                    <span style={{ padding: '0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderLeft: 'none', borderRadius: '0 4px 4px 0', color: '#666', fontSize: '1rem' }}>.esntes.com</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Primary Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="color"
                                        value={community.branding_settings?.primary_color || '#0066cc'}
                                        onChange={e => setCommunity({ ...community, branding_settings: { ...community.branding_settings, primary_color: e.target.value } })}
                                        style={{ width: '60px', height: '60px', padding: 0, border: 'none', cursor: 'pointer' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{community.branding_settings?.primary_color}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Brand color used for buttons and headers</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'modules' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {Object.keys(community.modules_enabled).map(module => (
                                <label key={module} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: community.modules_enabled[module] ? '#f0f9ff' : 'white', borderColor: community.modules_enabled[module] ? '#bae6fd' : '#eee' }}>
                                    <input
                                        type="checkbox"
                                        checked={community.modules_enabled[module]}
                                        onChange={() => toggleModule(module)}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <span style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '1.1rem' }}>{module}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div style={{ maxWidth: '600px' }}>
                            <h3 style={{ marginTop: 0 }}>Bulk Import Residents</h3>
                            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Upload a CSV file with headers: <code>email, name, address, role</code>.</p>

                            <div style={{ padding: '2rem', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center', marginBottom: '1.5rem' }}>
                                <input type="file" accept=".csv" id="csvInput" style={{ display: 'block', width: '100%', marginBottom: '1rem' }} />
                                <div style={{ fontSize: '0.9rem', color: '#888' }}>or drag and drop here (coming soon)</div>
                            </div>

                            <button
                                onClick={async () => {
                                    const fileInput = document.getElementById('csvInput');
                                    if (!fileInput.files.length) return alert("Please select a file");

                                    const formData = new FormData();
                                    formData.append('file', fileInput.files[0]);

                                    try {
                                        const res = await fetch(`${API_URL}/api/admin/communities/${community.id}/import`, {
                                            method: 'POST',
                                            body: formData
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            alert(data.message);
                                            if (data.errors && data.errors.length > 0) {
                                                alert("Completed with warnings:\n" + data.errors.join("\n"));
                                            }
                                        } else {
                                            alert("Error: " + data.detail);
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert("Import failed");
                                    }
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '0.75rem' }}
                            >
                                Upload & Import Residents
                            </button>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏦</div>
                            <h2 style={{ margin: '0 0 1rem 0' }}>Financial Setup</h2>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>Link the community's bank account or payment processor (Stripe) to enable rent collection and fee payments.</p>

                            <button className="btn" style={{ backgroundColor: '#635bff', color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '4px' }} onClick={() => alert("Stripe Integration coming soon")}>
                                Connect with Stripe
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #eee', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={() => navigate('/admin')} className="btn" style={{ border: '1px solid #ddd', background: 'white' }}>Cancel</button>
                    <button onClick={handleUpdate} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}

function TeamSettings({ communityId }) {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });

    useEffect(() => {
        fetchAdmins();
    }, [communityId]);

    const fetchAdmins = () => {
        setLoading(true);
        fetch(`${API_URL}/api/admin/communities/${communityId}/admins`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAdmins(data);
                else setAdmins([]);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${communityId}/admins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdmin)
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setNewAdmin({ name: '', email: '' });
                fetchAdmins();
            } else {
                alert("Error: " + data.detail);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to add admin");
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h3 style={{ marginTop: 0 }}>Step 2: Assign Site Admin</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Add a management company or initial admin user who will manage this community.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '2rem' }}>
                <div>
                    <h4 style={{ marginBottom: '1rem' }}>Existing Admins</h4>
                    {loading ? (
                        <div>Loading...</div>
                    ) : admins.length === 0 ? (
                        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center', color: '#666' }}>
                            No admins assigned yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {admins.map(admin => (
                                <div key={admin.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{admin.full_name}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>{admin.email}</div>
                                    </div>
                                    <span className="status-badge status-open">Admin</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', height: 'fit-content' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Add New Admin</h4>
                    <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={newAdmin.name}
                                onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>Email Address</label>
                            <input
                                type="email"
                                required
                                value={newAdmin.email}
                                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                placeholder="john@example.com"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            Add Admin
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
