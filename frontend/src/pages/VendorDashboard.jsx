import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function VendorDashboard() {
    const [workOrders, setWorkOrders] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Invoice Form
    const [invoiceData, setInvoiceData] = useState({
        work_order_id: '',
        amount: '',
        notes: '',
        file_url: '' // Placeholder for actual file upload logic later
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('esntes_user') || '{}');
        setUser(storedUser);
        if (storedUser.role === 'vendor' && storedUser.vendor_id) {
            fetchData(storedUser.vendor_id);
        }
    }, []);

    const fetchData = async (vendorId) => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('esntes_token')}` };

            // Fetch All Work Orders (filter client side or backend? Backend is cleaner but let's see)
            // Ideally we need endpoint to get "My Work Orders" or filter by assigned_vendor_id
            // reusing /api/communities/work-orders and filtering client side for now, 
            // though backend enforces community permission. 
            // Better: use filtered endpoint if available. 
            // Actually, `get_work_orders` returns all for community.
            // A vendor might see others? No, Board sees all.
            // We should filter client side for MVP or ask backend to filter.
            // Let's filter client side.

            const resWO = await fetch(`${API_URL}/api/communities/work-orders`, { headers });
            if (resWO.ok) {
                const data = await resWO.json();
                setWorkOrders(data.filter(wo => wo.assigned_vendor_id === vendorId));
            }

            // Fetch Invoices
            const resInv = await fetch(`${API_URL}/api/communities/invoices`, { headers });
            if (resInv.ok) {
                const data = await resInv.json();
                setInvoices(data);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        if (!user || !user.vendor_id) return;

        try {
            const payload = {
                ...invoiceData,
                vendor_id: user.vendor_id,
                amount: parseFloat(invoiceData.amount)
            };

            const res = await fetch(`${API_URL}/api/communities/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('esntes_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowInvoiceModal(false);
                setInvoiceData({ work_order_id: '', amount: '', notes: '', file_url: '' });
                fetchData(user.vendor_id);
                alert("Invoice submitted successfully!");
            } else {
                const err = await res.json();
                alert(`Failed: ${err.detail}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting invoice");
        }
    };

    if (!user) return <div>Loading user...</div>;
    if (user.role !== 'vendor') return <div className="container">Access Denied. Vendor role required.</div>;

    return (
        <div className="container">
            <h1>Vendor Dashboard</h1>
            <p>Welcome, {user.name}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>

                {/* Work Orders Column */}
                <div className="card">
                    <h2>Assigned Work Orders</h2>
                    {loading ? <p>Loading...</p> : (
                        <ul className="list-group">
                            {workOrders.map(wo => (
                                <li key={wo.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{wo.title}</strong>
                                        <span className={`badge badge-${wo.status.toLowerCase().replace(' ', '-')}`}>{wo.status}</span>
                                    </div>
                                    <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>{wo.description}</p>
                                    <div style={{ fontSize: '0.85rem' }}>Budget: ${wo.budget}</div>

                                    {wo.status === 'In Progress' && (
                                        <button
                                            className="btn btn-sm btn-primary"
                                            style={{ marginTop: '0.5rem' }}
                                            onClick={() => {
                                                setInvoiceData({ ...invoiceData, work_order_id: wo.id, amount: wo.budget });
                                                setShowInvoiceModal(true);
                                            }}
                                        >
                                            Create Invoice
                                        </button>
                                    )}
                                </li>
                            ))}
                            {workOrders.length === 0 && <p>No active work orders.</p>}
                        </ul>
                    )}
                </div>

                {/* Invoices Column */}
                <div className="card">
                    <h2>My Invoices</h2>
                    {loading ? <p>Loading...</p> : (
                        <ul className="list-group">
                            {invoices.map(inv => (
                                <li key={inv.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>Ref: INV-{inv.id}</strong>
                                        <span style={{
                                            fontWeight: 'bold',
                                            color: inv.status === 'Paid' ? 'green' : (inv.status === 'Rejected' ? 'red' : 'orange')
                                        }}>
                                            {inv.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem' }}>Work Order: {inv.work_order_title}</div>
                                    <div style={{ fontSize: '0.9rem' }}>Amount: ${inv.amount}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(inv.created_at).toLocaleDateString()}</div>
                                </li>
                            ))}
                            {invoices.length === 0 && <p>No invoices found.</p>}
                        </ul>
                    )}
                </div>
            </div>

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Submit Invoice</h2>
                        <form onSubmit={handleCreateInvoice}>
                            <div className="form-group">
                                <label>Work Order</label>
                                <select
                                    className="form-control"
                                    value={invoiceData.work_order_id}
                                    onChange={e => setInvoiceData({ ...invoiceData, work_order_id: e.target.value })}
                                    disabled // Locked to selected WO
                                >
                                    {workOrders.map(wo => (
                                        <option key={wo.id} value={wo.id}>{wo.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    required
                                    value={invoiceData.amount}
                                    onChange={e => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    className="form-control"
                                    value={invoiceData.notes}
                                    onChange={e => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>File URL (Optional)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="https://"
                                    value={invoiceData.file_url}
                                    onChange={e => setInvoiceData({ ...invoiceData, file_url: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reuse styles or add new ones? Assuming global styles or similar CSS from previous pages
const style = document.createElement('style');
style.textContent = `
  .list-group { list-style: none; padding: 0; margin: 0; }
  .badge { padding: 0.25rem 0.5rem; border-radius: 99px; font-size: 0.75rem; color: white; background: #666; }
  .badge-in-progress { background: #3b82f6; }
  .badge-open { background: #10b981; }
  .badge-completed { background: #6b7280; }
`;
document.head.appendChild(style);
