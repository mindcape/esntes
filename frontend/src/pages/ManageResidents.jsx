import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Trash2, Key, Check } from 'lucide-react';

export default function ManageResidents() {
    const [showModal, setShowModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPassword, setResetPassword] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        phone: '',
        role_name: 'resident',
        resident_type: 'owner', // 'owner' or 'tenant'
        owner_type: 'individual' // 'individual' or 'business'
    });

    const formatPhoneNumber = (value) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        }
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const { user, fetchWithAuth } = useAuth();
    // const isAdminOrBoard = user?.role === 'admin' || user?.role === 'board' || user?.role === 'super_admin';
    const canManageResidents = user?.permissions?.includes('manage_residents');

    useEffect(() => {
        fetchResidents();
    }, [user]);

    const fetchResidents = () => {
        setLoading(true);
        setError('');
        // Residents see directory (opt-in only), Admins see everyone
        const endpoint = canManageResidents
            ? `${API_URL}/api/community/all-residents`
            : `${API_URL}/api/community/directory`;

        fetchWithAuth(endpoint)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setResidents(data);
                } else {
                    console.error("Fetch residents returned non-array:", data);
                    setResidents([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load residents.');
                setLoading(false);
            });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing
                ? `${API_URL}/api/community/residents/${editingId}`
                : `${API_URL}/api/community/residents`;

            const res = await fetchWithAuth(url, {
                method: method,
                body: JSON.stringify({
                    ...formData,
                    phone: formData.phone ? formData.phone.replace(/[^\d]/g, '') : ''
                })
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: '', email: '', address: '', phone: '', role_name: 'resident', resident_type: 'owner', owner_type: 'individual' });
                setIsEditing(false);
                setEditingId(null);
                fetchResidents();
                // success message could be a toast, but usually closing modal implies success
            } else {
                const err = await res.json();
                const errorMessage = Array.isArray(err.detail)
                    ? err.detail.map(e => e.msg).join(', ')
                    : (err.detail || 'Operation failed');
                setError(errorMessage);
            }
        } catch (error) {
            console.error(error);
            setError('Failed to connect to server');
        }
    };

    const handleEdit = (resident) => {
        setFormData({
            name: resident.name,
            email: resident.email,
            address: resident.address,
            phone: resident.phone ? formatPhoneNumber(resident.phone) : '',
            role_name: 'resident', // Default, maybe should fetch?
            resident_type: resident.resident_type || 'owner',
            owner_type: resident.owner_type || 'individual',
            is_active: resident.is_active
        });
        setEditingId(resident.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleApprove = async (resident) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/community/residents/${resident.id}`, {
                method: 'PUT',
                body: JSON.stringify({ is_setup_complete: true })
            });

            if (res.ok) {
                // Update local state instead of full refetch for better UX
                const updatedResidents = residents.map(r =>
                    r.id === resident.id ? { ...r, is_setup_complete: true } : r
                );
                setResidents(updatedResidents);
            } else {
                const err = await res.json();
                setError(err.detail || 'Approval failed');
            }
        } catch (error) {
            console.error(error);
            setError('Failed to connect to server');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resident?")) return;
        setError('');

        try {
            const res = await fetchWithAuth(`${API_URL}/api/community/residents/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchResidents();
            } else {
                const err = await res.json();
                setError(err.detail || "Failed to delete");
                // Since this error is on main page, we'll scroll to top
                window.scrollTo(0, 0);
            }
        } catch (e) {
            console.error(e);
            setError("Error deleting resident");
            window.scrollTo(0, 0);
        }
    };

    const handleResetClick = (residentId) => {
        setEditingId(residentId);
        setResetPassword('');
        setShowResetModal(true);
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetchWithAuth(`${API_URL}/api/community/residents/${editingId}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ new_password: resetPassword })
            });

            if (res.ok) {
                setShowResetModal(false);
                setResetPassword('');
                setEditingId(null);
                alert("Password reset successfully.");
            } else {
                const err = await res.json();
                setError(err.detail || "Failed to reset password");
            }
        } catch (err) {
            console.error(err);
            setError("Error resetting password");
        }
    };

    // Checking if backend returns is_active. 
    // DirectoryProfile in backend MUST include is_active field for this to work.
    // Let me verify backend/community/router.py DirectoryProfile model.

    const PreferenceIcon = ({ type, email, paper }) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: '500', width: '80px' }}>{type}:</span>
                {email && <span title="Email">📧</span>}
                {paper && <span title="Paper">📄</span>}
                {!email && !paper && <span style={{ color: '#ccc' }}>-</span>}
            </div>
        );
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>{canManageResidents ? 'Manage Residents' : 'Resident Directory'}</h1>
                {canManageResidents && (
                    <button onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: '', email: '', address: '', phone: '', role_name: 'resident', resident_type: 'owner', owner_type: 'individual' });
                        setError('');
                        setShowModal(true);
                    }} className="btn btn-primary">
                        + Add Resident
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

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ marginTop: 0 }}>{isEditing ? 'Edit Resident' : 'Add New Resident'}</h2>

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

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name</label>
                                <input
                                    type="text" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address</label>
                                <input
                                    type="text" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone</label>
                                <input
                                    type="tel"
                                    placeholder="(555) 555-5555"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.phone} onChange={handlePhoneChange}
                                />
                            </div>

                            {/* Resident Type */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Resident Type</label>
                                <select
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.resident_type}
                                    onChange={e => setFormData({ ...formData, resident_type: e.target.value })}
                                >
                                    <option value="owner">Owner</option>
                                    <option value="tenant">Tenant</option>
                                </select>
                            </div>

                            {/* Owner Type - Conditional */}
                            {formData.resident_type === 'owner' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Owner Type</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="radio"
                                                name="owner_type"
                                                value="individual"
                                                checked={formData.owner_type === 'individual'}
                                                onChange={e => setFormData({ ...formData, owner_type: e.target.value })}
                                            /> Individual
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="radio"
                                                name="owner_type"
                                                value="business"
                                                checked={formData.owner_type === 'business'}
                                                onChange={e => setFormData({ ...formData, owner_type: e.target.value })}
                                            /> Business
                                        </label>
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', cursor: 'pointer', color: formData.is_active === false ? 'red' : 'green' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active !== false} // Default to true if undefined
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        {formData.is_active === false ? 'Account Deactivated' : 'Account Active'}
                                    </label>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Update' : 'Create'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, border: '1px solid #ccc' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showResetModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '350px', maxWidth: '90%' }}>
                        <h2 style={{ marginTop: 0 }}>Reset Password</h2>
                        <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>New Password</label>
                                <input
                                    type="text" required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Reset</button>
                                <button type="button" onClick={() => setShowResetModal(false)} className="btn" style={{ flex: 1, border: '1px solid #ccc' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem', color: '#666' }}>Name</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Contact</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Communication Preferences</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Type</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Status</th>
                            {canManageResidents && <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(residents) && residents.map(resident => (
                            <tr key={resident.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '600', color: 'hsl(215 25% 27%)' }}>{resident.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{resident.address}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem' }}>{resident.email}</div>
                                    {resident.phone && <div style={{ fontSize: '0.85rem', color: '#666' }}>{resident.phone}</div>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {resident.preferences ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <PreferenceIcon type="General" email={resident.preferences.general_email} paper={resident.preferences.general_paper} />
                                            <PreferenceIcon type="CCR" email={resident.preferences.ccr_email} paper={resident.preferences.ccr_paper} />
                                            <PreferenceIcon type="Collection" email={resident.preferences.collection_email} paper={resident.preferences.collection_paper} />
                                            <PreferenceIcon type="Billing" email={resident.preferences.billing_email} paper={resident.preferences.billing_paper} />
                                        </div>
                                    ) : (
                                        <span style={{ color: '#999', fontStyle: 'italic' }}>Not set</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                                        {resident.resident_type || 'Owner'}
                                    </div>
                                    {resident.resident_type === 'owner' && resident.owner_type && (
                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'capitalize' }}>
                                            ({resident.owner_type})
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {!resident.is_setup_complete ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                            Pending
                                        </span>
                                    ) : resident.is_opted_in ? ( // Assuming is_opted_in is a new field for active/opted out
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            Opted Out
                                        </span>
                                    )}
                                </td>
                                {canManageResidents && (
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button onClick={() => handleEdit(resident)} className="text-gray-600 hover:text-gray-900" title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleResetClick(resident.id)} className="text-yellow-600 hover:text-yellow-900" title="Reset Password">
                                                <Key size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(resident.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                            {!resident.is_setup_complete && (
                                                <button onClick={() => handleApprove(resident)} className="text-green-600 hover:text-green-900" title="Approve">
                                                    <Check size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
