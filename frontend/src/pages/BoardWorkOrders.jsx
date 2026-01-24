import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function BoardWorkOrders() {
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedWO, setSelectedWO] = useState(null); // For viewing details/bids

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        status: 'Open'
    });

    // Bid Form State
    const [bidData, setBidData] = useState({
        vendor_id: '',
        amount: '',
        notes: ''
    });
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        fetchWorkOrders();
        fetchVendors();
    }, []);

    const fetchWorkOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/communities/maintenance/work-orders`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('esntes_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkOrders(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await fetch(`${API_URL}/api/vendors`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('esntes_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVendors(data);
            }
        } catch (err) {
            console.error("Failed to fetch vendors", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/communities/maintenance/work-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('esntes_token')}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ title: '', description: '', budget: '', status: 'Open' });
                fetchWorkOrders();
            } else {
                alert("Failed to create work order");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddBid = async (e) => {
        e.preventDefault();
        if (!selectedWO) return;
        try {
            const res = await fetch(`${API_URL}/api/communities/maintenance/work-orders/${selectedWO.id}/bids`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('esntes_token')}`
                },
                body: JSON.stringify(bidData)
            });
            if (res.ok) {
                const newBid = await res.json();
                // Update local state to show new bid immediately
                const updatedWO = {
                    ...selectedWO,
                    bids: [...(selectedWO.bids || []), newBid]
                };
                setSelectedWO(updatedWO);
                setBidData({ vendor_id: '', amount: '', notes: '' });
                // Also update the list
                setWorkOrders(workOrders.map(wo => wo.id === updatedWO.id ? updatedWO : wo));

                // Refresh full details to be safe (e.g. if we need vendor name)
                fetchWorkOrders();
            } else {
                alert("Failed to add bid");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const viewDetails = async (wo) => {
        // Fetch bids for this WO
        try {
            const res = await fetch(`${API_URL}/api/communities/maintenance/work-orders/${wo.id}/bids`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('esntes_token')}` }
            });
            if (res.ok) {
                const bids = await res.json();
                setSelectedWO({ ...wo, bids });
            } else {
                setSelectedWO({ ...wo, bids: [] });
            }
        } catch (err) {
            console.error(err);
            setSelectedWO({ ...wo, bids: [] });
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Work Orders</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ New Work Order</button>
            </div>

            {/* List View */}
            <div className="card">
                {loading ? <p>Loading...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem' }}>Title</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Budget</th>
                                <th style={{ padding: '1rem' }}>Created</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workOrders.map(wo => (
                                <tr key={wo.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <strong>{wo.title}</strong>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{wo.description}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem',
                                            backgroundColor: wo.status === 'Open' ? '#e1effe' : '#def7ec',
                                            color: wo.status === 'Open' ? '#1e429f' : '#03543f'
                                        }}>
                                            {wo.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {wo.budget ? `$${wo.budget}` : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {new Date(wo.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button onClick={() => viewDetails(wo)} className="btn btn-sm">View & Bids</button>
                                    </td>
                                </tr>
                            ))}
                            {workOrders.length === 0 && (
                                <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No work orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create Work Order</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Title</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-control" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="form-control" />
                            </div>
                            <div className="form-group">
                                <label>Budget ($)</label>
                                <input type="number" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} className="form-control" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedWO && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2>{selectedWO.title}</h2>
                            <button onClick={() => setSelectedWO(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <p>{selectedWO.description}</p>

                        <h3>Vendor Bids</h3>
                        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            {selectedWO.bids && selectedWO.bids.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {selectedWO.bids.map(bid => {
                                        const vendor = vendors.find(v => v.id === bid.vendor_id);
                                        return (
                                            <li key={bid.id} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                                <div>
                                                    <strong>{vendor ? vendor.name : 'Unknown Vendor'}</strong>
                                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{bid.notes}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 'bold' }}>${bid.amount}</div>
                                                    <small>{new Date(bid.submitted_at).toLocaleDateString()}</small>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p style={{ fontStyle: 'italic', color: '#666' }}>No bids submitted yet.</p>
                            )}
                        </div>

                        <h4>Add Bid (Admin Entry)</h4>
                        <form onSubmit={handleAddBid} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem' }}>Vendor</label>
                                <select required value={bidData.vendor_id} onChange={e => setBidData({ ...bidData, vendor_id: e.target.value })} style={{ width: '100%', padding: '0.5rem' }}>
                                    <option value="">Select Vendor...</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ width: '120px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem' }}>Amount ($)</label>
                                <input required type="number" value={bidData.amount} onChange={e => setBidData({ ...bidData, amount: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem' }}>Notes</label>
                                <input type="text" value={bidData.notes} onChange={e => setBidData({ ...bidData, notes: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} placeholder="Proposal details..." />
                            </div>
                            <button type="submit" className="btn btn-primary">Add Bid</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add simple CSS for modals if not already global
const style = document.createElement('style');
style.textContent = `
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000;
  }
  .modal-content {
    background: white; padding: 2rem; border-radius: 8px;
    width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto;
  }
  .form-group { margin-bottom: 1rem; }
  .form-control { width: 100%; padding: 0.5rem; margin-top: 0.25rem; }
  .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
  .btn { padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #ccc; cursor: pointer; background: white; }
  .btn-primary { background: #0066cc; color: white; border-color: #0066cc; }
  .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.85rem; }
`;
document.head.appendChild(style);
