import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Trash2, Key, CheckSquare, Square, UserMinus } from 'lucide-react';

export default function CommunitySettings() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');


    useEffect(() => {
        fetchCommunity();
    }, [id]);

    const fetchCommunity = () => {
        setLoading(true);
        fetch(`${API_URL}/api/admin/communities/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch community");
                return res.json();
            })
            .then(data => {
                setCommunity(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load community details");
                setLoading(false);
            });
    };
    // ... inside CommunitySettings component ...
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

    const handleUpdate = async () => {
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${community.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: community.name,
                    subdomain: community.subdomain,
                    branding_settings: community.branding_settings,
                    modules_enabled: community.modules_enabled,
                    // Address
                    address: community.address,
                    address2: community.address2,
                    city: community.city,
                    state: community.state,
                    zip_code: community.zip_code,
                    county: community.county,
                    // POC
                    poc_name: community.poc_name,
                    poc_email: community.poc_email,
                    poc_phone: community.poc_phone
                })
            });
            if (res.ok) {
                setSuccess('Community updated successfully!');
            } else {
                const err = await res.json();
                setError(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            setError('Failed to update settings');
        }
    };

    // ... (rest of imports/state)

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

            {/* Inline Notifications for Main Page */}
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

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {/* ... (Tabs maintained) ... */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    <button onClick={() => setActiveTab('general')} style={{ padding: '1rem 2rem', background: activeTab === 'general' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'general' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}>General</button>
                    <button onClick={() => setActiveTab('modules')} style={{ padding: '1rem 2rem', background: activeTab === 'modules' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'modules' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}>Modules</button>
                    <button onClick={() => setActiveTab('data')} style={{ padding: '1rem 2rem', background: activeTab === 'data' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'data' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}>Data</button>
                    <button onClick={() => setActiveTab('team')} style={{ padding: '1rem 2rem', background: activeTab === 'team' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'team' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}>Team</button>
                    <button onClick={() => setActiveTab('finance')} style={{ padding: '1rem 2rem', background: activeTab === 'finance' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'finance' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}>Finance</button>
                    <button onClick={() => setActiveTab('members')} style={{ padding: '1rem 2rem', background: activeTab === 'members' ? '#f8fafc' : 'white', border: 'none', borderBottom: activeTab === 'members' ? '2px solid #0066cc' : 'none', cursor: 'pointer', fontWeight: '500' }}>Members</button>
                </div>

                <div style={{ padding: '2rem' }}>
                    {activeTab === 'team' && (
                        <TeamSettings communityId={community.id} />
                    )}
                    {/* ... (General/Modules tabs same as before) ... */}
                    {activeTab === 'general' && (
                        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Details & Location</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Community Name</label>
                                    <input type="text" value={community.name || ''} onChange={e => setCommunity({ ...community, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address</label>
                                    <input type="text" placeholder="Address Line 1" value={community.address || ''} onChange={e => setCommunity({ ...community, address: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }} />
                                    <input type="text" placeholder="Address Line 2" value={community.address2 || ''} onChange={e => setCommunity({ ...community, address2: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>City</label>
                                        <input type="text" value={community.city || ''} onChange={e => setCommunity({ ...community, city: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>State</label>
                                        <input type="text" value={community.state || ''} onChange={e => setCommunity({ ...community, state: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>County</label>
                                        <input type="text" value={community.county || ''} onChange={e => setCommunity({ ...community, county: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Zip Code</label>
                                        <input type="text" value={community.zip_code || ''} onChange={e => setCommunity({ ...community, zip_code: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Point of Contact</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                                        <input type="text" value={community.poc_name || ''} onChange={e => setCommunity({ ...community, poc_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                                            <input type="email" value={community.poc_email || ''} onChange={e => setCommunity({ ...community, poc_email: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone</label>
                                            <input type="tel" value={community.poc_phone || ''} onChange={e => setCommunity({ ...community, poc_phone: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>System Settings</h3>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subdomain</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input type="text" value={community.subdomain || ''} onChange={e => setCommunity({ ...community, subdomain: e.target.value })} style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px 0 0 4px', fontSize: '1rem' }} placeholder="pinevalley" />
                                    <span style={{ padding: '0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderLeft: 'none', borderRadius: '0 4px 4px 0', color: '#666', fontSize: '1rem' }}>.esntes.com</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Primary Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input type="color" value={community.branding_settings?.primary_color || '#0066cc'} onChange={e => setCommunity({ ...community, branding_settings: { ...community.branding_settings, primary_color: e.target.value } })} style={{ width: '60px', height: '60px', padding: 0, border: 'none', cursor: 'pointer' }} />
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
                                    <input type="checkbox" checked={community.modules_enabled[module]} onChange={() => toggleModule(module)} style={{ width: '20px', height: '20px' }} />
                                    <span style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '1.1rem' }}>{module}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <ImportResidents communityId={community.id} />
                    )}

                    {activeTab === 'finance' && (
                        <div style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏦</div>
                            <h2 style={{ margin: '0 0 1rem 0' }}>Financial Setup</h2>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>Link the community's bank account or payment processor (Stripe) to enable rent collection and fee payments.</p>
                            <button className="btn" style={{ backgroundColor: '#635bff', color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '4px' }} disabled title="Coming Soon">
                                Connect with Stripe (Coming Soon)
                            </button>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <MembersList communityId={community.id} />
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

function ImportResidents({ communityId }) {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleImport = async () => {
        setError(null);
        setSuccess(null);
        const fileInput = document.getElementById('csvInput');
        if (!fileInput.files.length) {
            setError("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${communityId}/import`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                let msg = data.message;
                if (data.errors && data.errors.length > 0) {
                    msg += " (Completed with warnings: " + data.errors.join(", ") + ")";
                }
                setSuccess(msg);
            } else {
                setError("Error: " + data.detail);
            }
        } catch (e) {
            console.error(e);
            setError("Import failed");
        }
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h3 style={{ marginTop: 0 }}>Bulk Import Residents</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Upload a CSV file with headers: <code>email, name, address, role</code>.</p>

            {error && <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px' }}>{success}</div>}

            <div style={{ padding: '2rem', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center', marginBottom: '1.5rem' }}>
                <input type="file" accept=".csv" id="csvInput" style={{ display: 'block', width: '100%', marginBottom: '1rem' }} />
                <div style={{ fontSize: '0.9rem', color: '#888' }}>or drag and drop here (coming soon)</div>
            </div>

            <button onClick={handleImport} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                Upload & Import Residents
            </button>
        </div>
    );
}

function TeamSettings({ communityId }) {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${communityId}/admins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdmin)
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                setNewAdmin({ name: '', email: '' });
                fetchAdmins();
            } else {
                setError("Error: " + data.detail);
            }
        } catch (error) {
            console.error(error);
            setError("Failed to add admin");
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h3 style={{ marginTop: 0 }}>Step 2: Assign Site Admin</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Add a management company or initial admin user who will manage this community.</p>

            {error && <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px' }}>{success}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '2rem' }}>
                <div>
                    <h4 style={{ marginBottom: '1rem' }}>Existing Admins</h4>
                    {/* ... (Existing admins list same as before) ... */}
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

function MembersList({ communityId }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        address: '',
        role_name: 'resident',
        resident_type: 'owner',
        owner_type: 'individual'
    });

    // Password Reset State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordResetUser, setPasswordResetUser] = useState(null);

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
        fetchMembers();
    }, [communityId]);

    const fetchMembers = () => {
        setLoading(true);
        fetch(`${API_URL}/api/admin/communities/${communityId}/members`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMembers(data);
                else setMembers([]);
                // Clear selection on refresh
                setSelectedUsers(new Set());
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleSelectAll = () => {
        if (selectedUsers.size === members.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(members.map(m => m.id)));
        }
    };

    const handleSelectUser = (id) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUsers(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.size === 0) return;
        if (!window.confirm(`Are you sure you want to deactivate ${selectedUsers.size} users?`)) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${communityId}/members/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_ids: Array.from(selectedUsers) })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                fetchMembers();
            } else {
                setError(`Error: ${data.detail}`);
            }
        } catch (error) {
            console.error(error);
            setError("Failed to perform bulk deletion");
        }
    };

    const handleSingleDelete = async (memberId) => {
        if (!window.confirm("Are you sure you want to deactivate this user?")) return;
        // Re-use bulk delete endpoint for single user for simplicity
        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${communityId}/members/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_ids: [memberId] })
            });
            if (res.ok) {
                fetchMembers();
                setSuccess("Member deactivated successfully");
            } else {
                const data = await res.json();
                setError(`Error: ${data.detail}`);
            }
        } catch (error) {
            console.error(error);
            setError("Failed to deactivate user");
        }
    };


    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${communityId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ full_name: '', email: '', address: '', role_name: 'resident', resident_type: 'owner', owner_type: 'individual' });
                fetchMembers();
                setSuccess('Member created successfully!');
            } else {
                const err = await res.json();
                setError(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            setError('Failed to connect to server');
        }
    };

    // Password Reset Modal Logic
    const openPasswordReset = (member) => {
        setPasswordResetUser(member);
        setShowPasswordModal(true);
        // Reset state
        setSuccess(null);
        setError(null);
    };

    const confirmResetPassword = async () => {
        if (!passwordResetUser) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/users/${passwordResetUser.id}/reset-password`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                // Update the modal with the new password instead of closing it
                setPasswordResetUser({ ...passwordResetUser, newPassword: data.new_password });
                setSuccess("Password reset successfully.");
            } else {
                setError(`Error: ${data.detail}`);
                setShowPasswordModal(false); // Close on error to show toast
            }
        } catch (error) {
            console.error(error);
            setError("Failed to reset password");
            setShowPasswordModal(false);
        }
    };

    // Edit Handling
    const openEditModal = (member) => {
        setFormData({
            id: member.id,
            full_name: member.full_name,
            email: member.email,
            address: member.address || '',
            role_name: member.role || 'resident',
            resident_type: member.resident_type || 'owner',
            owner_type: member.owner_type || 'individual',
            is_active: member.is_active
        });
        setShowModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/admin/communities/${communityId}/members/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({ full_name: '', email: '', address: '', role_name: 'resident', resident_type: 'owner', owner_type: 'individual' });
                fetchMembers();
                setSuccess('Member updated successfully!');
            } else {
                const err = await res.json();
                setError(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            setError('Failed to connect to server');
        }
    };

    if (loading) return <div>Loading members...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ marginTop: 0 }}>Community Members</h3>
                    <p style={{ color: '#666', margin: 0 }}>All users registered in this community.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedUsers.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn"
                            style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Trash2 size={16} />
                            Deactivate ({selectedUsers.size})
                        </button>
                    )}
                    <button onClick={() => {
                        setFormData({ full_name: '', email: '', address: '', role_name: 'resident', resident_type: 'owner', owner_type: 'individual' });
                        setShowModal(true);
                    }} className="btn btn-primary">
                        + Add Member
                    </button>
                </div>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ marginTop: 0 }}>{formData.id ? 'Edit Member' : 'Add New Member'}</h2>
                        <form onSubmit={formData.id ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                                <input
                                    type="text" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                                <input
                                    type="email" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Role</label>
                                <select
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.role_name} onChange={e => setFormData({ ...formData, role_name: e.target.value })}
                                >
                                    <option value="resident">Resident</option>
                                    <option value="board">Board Member</option>
                                    <option value="admin">Site Admin</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {formData.id && (
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        Active Account
                                    </label>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{formData.id ? 'Update' : 'Create'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, border: '1px solid #ccc' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPasswordModal && passwordResetUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '450px', maxWidth: '90%' }}>
                        {!passwordResetUser.newPassword ? (
                            <>
                                <h3 style={{ marginTop: 0 }}>Reset Password</h3>
                                <p style={{ color: '#666' }}>Are you sure you want to reset the password for <strong>{passwordResetUser.email}</strong>?</p>
                                <p style={{ fontSize: '0.9rem', color: '#888' }}>A new temporary password will be generated.</p>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button onClick={confirmResetPassword} className="btn btn-primary" style={{ flex: 1 }}>Generate New Password</button>
                                    <button onClick={() => setShowPasswordModal(false)} className="btn" style={{ flex: 1, border: '1px solid #ccc' }}>Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 style={{ marginTop: 0, color: '#16a34a' }}>Password Reset Successful</h3>
                                <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '4px', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Email</span>
                                        <div style={{ fontWeight: '500' }}>{passwordResetUser.email}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>New Password</span>
                                        <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold', color: '#111827', letterSpacing: '1px' }}>
                                            {passwordResetUser.newPassword}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setShowPasswordModal(false)} className="btn btn-primary" style={{ width: '100%' }}>Close</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', background: '#f8f9fa' }}>
                            <th style={{ padding: '1rem', width: '40px', textAlign: 'center' }}>
                                <div
                                    onClick={handleSelectAll}
                                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                                >
                                    {members.length > 0 && selectedUsers.size === members.length ? <CheckSquare size={18} color="#0066cc" /> : <Square size={18} color="#aaa" />}
                                </div>
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Role</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#555' }}>Address</th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#555' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#555' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No members found.</td>
                            </tr>
                        ) : members.map(member => (
                            <tr key={member.id} style={{ borderBottom: '1px solid #eee', backgroundColor: selectedUsers.has(member.id) ? '#f0f9ff' : 'transparent' }}>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div
                                        onClick={() => handleSelectUser(member.id)}
                                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                                    >
                                        {selectedUsers.has(member.id) ? <CheckSquare size={18} color="#0066cc" /> : <Square size={18} color="#ddd" />}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{member.full_name}</td>
                                <td style={{ padding: '1rem', color: '#444' }}>{member.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        backgroundColor: member.role === 'admin' ? '#e0e7ff' : '#f3f4f6',
                                        color: member.role === 'admin' ? '#4f46e5' : '#374151'
                                    }}>
                                        {member.role || 'Resident'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#666' }}>{member.address || '-'}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {member.is_active ?
                                        <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 'bold' }}>ACTIVE</span> :
                                        <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 'bold' }}>INACTIVE</span>
                                    }
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => openEditModal(member)}
                                            className="btn"
                                            title="Edit User"
                                            style={{ padding: '0.4rem', color: '#4b5563', border: '1px solid #e5e7eb' }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => openPasswordReset(member)}
                                            className="btn"
                                            title="Reset Password"
                                            style={{ padding: '0.4rem', color: '#d97706', border: '1px solid #fcd34d' }}
                                        >
                                            <Key size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleSingleDelete(member.id)}
                                            className="btn"
                                            title={member.is_active ? "Deactivate User" : "User Inactive"}
                                            disabled={!member.is_active}
                                            style={{
                                                padding: '0.4rem',
                                                color: member.is_active ? '#dc2626' : '#9ca3af',
                                                border: '1px solid #fee2e2',
                                                cursor: member.is_active ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
