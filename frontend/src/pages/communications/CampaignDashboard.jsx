import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    Send,
    FileText,
    Users,
    Mail,
    ChevronRight,
    Search,
    Trash2,
    Edit,
    X,
    Check,
    Zap,
    Layout
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Campaign.css';

const CampaignDashboard = () => {
    const { fetchWithAuth } = useAuth();
    const [activeTab, setActiveTab] = useState('campaigns');
    const [campaigns, setCampaigns] = useState([]);
    const [failedEmails, setFailedEmails] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Template Modal State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({ name: '', subject_template: '', content_html: '', category: 'General' });


    // Fetch Campaigns
    const fetchCampaigns = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communication/campaigns`);
            if (!res.ok) throw new Error("Failed to fetch campaigns");
            const data = await res.json();
            setCampaigns(data);
        } catch (err) {
            setError(err.message);
        }
    };

    // Fetch Failed Emails
    const fetchFailedEmails = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communication/emails/failed`);
            if (!res.ok) throw new Error("Failed to fetch failed emails");
            const data = await res.json();
            setFailedEmails(data);
        } catch (err) {
            setError(err.message);
        }
    };

    // Fetch Templates
    const fetchTemplates = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communication/templates`);
            if (!res.ok) throw new Error("Failed to fetch templates");
            const data = await res.json();
            setTemplates(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchCampaigns(), fetchFailedEmails(), fetchTemplates()])
            .finally(() => setLoading(false));
    }, []);

    const handleRetryEmail = async (emailId) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communication/emails/${emailId}/retry`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error("Retry failed");
            fetchFailedEmails();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRetryCampaign = async (campaignId) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communication/campaigns/${campaignId}/retry`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error("Retry failed");
            fetchFailedEmails();
            alert("All failed emails for this campaign have been queued for retry.");
        } catch (err) {
            alert(err.message);
        }
    };

    // Template Handlers
    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setTemplateForm({
            name: template.name,
            subject_template: template.subject_template,
            content_html: template.content_html,
            category: template.category || 'General'
        });
        setShowTemplateModal(true);
    };

    const handleNewTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({ name: '', subject_template: '', content_html: '', category: 'General' });
        setShowTemplateModal(true);
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communication/templates/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchTemplates();
            } else {
                const err = await res.json();
                alert(`Failed to delete template: ${err.detail || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting template");
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.name || !templateForm.subject_template || !templateForm.content_html) {
            alert("All fields are required");
            return;
        }

        try {
            const url = editingTemplate
                ? `${API_URL}/api/communication/templates/${editingTemplate.id}`
                : `${API_URL}/api/communication/templates`;

            const method = editingTemplate ? 'PUT' : 'POST';

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(templateForm)
            });

            if (res.ok) {
                setShowTemplateModal(false);
                fetchTemplates();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'Failed to save template'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Error saving template");
        }
    };

    if (loading) return (
        <div className="container" style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <h3>Loading...</h3>
        </div>
    );

    return (
        <div className="container">
            <div className="header" style={{ alignItems: "flex-start", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ margin: 0 }}>Communications</h1>
                    <p style={{ color: "#6b7280", margin: "0.5rem 0 0 0" }}>Manage email campaigns and newsletters</p>
                </div>
                {activeTab === 'templates' ? (
                    <button
                        onClick={handleNewTemplate}
                        className="btn btn-primary" style={{ gap: "0.5rem" }}
                    >
                        <Plus size={20} />
                        New Template
                    </button>
                ) : (
                    <Link to="/communications/new" className="btn btn-primary" style={{ gap: "0.5rem" }}>
                        <Plus size={20} />
                        New Campaign
                    </Link>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Tabs */}
                <div className="campaign-tabs">
                    <button className={`campaign-tab ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>
                        <FileText size={18} />
                        Campaigns

                    </button>
                    <button className={`campaign-tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
                        <Layout size={18} />
                        Templates

                    </button>
                    <button className={`campaign-tab ${activeTab === 'failed' ? 'active' : ''}`} onClick={() => setActiveTab('failed')}>
                        <AlertCircle size={18} />
                        Failed Deliveries
                        {failedEmails.length > 0 && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full ml-1">
                                {failedEmails.length}
                            </span>
                        )}

                    </button>
                </div >

                <div style={{ padding: "1.5rem" }}>
                    {/* Campaigns Tab */}
                    {activeTab === 'campaigns' && (
                        <div>
                            {/* Quick Actions (Only show if templates are loaded) */}
                            {templates.length > 0 && (
                                <div className="mb-8">
                                    <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Zap size={16} className="text-amber-500" />
                                        Quick Actions
                                    </h3>
                                    <div className="quick-actions">
                                        {[
                                            { title: "Send Newsletter", cat: "Newsletter", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                                            { title: "Urgent Alert", cat: "Alerts", color: "bg-red-50 text-red-700 hover:bg-red-100" },
                                            { title: "Meeting Notice", cat: "Meetings", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                                            { title: "Financial Update", cat: "Financial", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                                        ].map(action => (
                                            <Link
                                                key={action.title}
                                                to={`/communications/new?category=${action.cat}`}
                                                className="action-card"
                                            >
                                                {action.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {campaigns.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "3rem" }}>
                                    <Send className="text-blue-600" size={32} />
                                    <h3 style={{ margin: "1rem 0 0.5rem 0" }}>No campaigns yet</h3>
                                    <p style={{ color: "#6b7280", margin: "0 0 1.5rem 0" }}>Create your first mass email campaign to reach all residents.</p>
                                    <Link to="/communications/new" style={{ color: "hsl(var(--primary))", fontWeight: 500 }}>
                                        Start a Campaign &rarr;
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="campaign-table">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th>Campaign</th>
                                                <th>Status</th>
                                                <th>Schedule</th>
                                                <th>Performance</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody >
                                            {campaigns.map(c => (
                                                <tr key={c.id} >
                                                    <td>
                                                        <strong style={{ display: "block", color: "#111827" }}>{c.title}</strong>
                                                        <div style={{ fontSize: "0.75rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                                                            <Mail size={12} />
                                                            ID: #{c.id}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            c.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                            {c.status === 'COMPLETED' ? <CheckCircle2 size={12} /> :
                                                                c.status === 'FAILED' ? <AlertCircle size={12} /> :
                                                                    <Clock size={12} />}
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString(undefined, {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        }) : 'Immediate'}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                                <span style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>Sent</span>
                                                                <strong style={{ color: "#111827" }}>{c.sent_count}</strong>
                                                            </div>
                                                            <div style={{ height: "2rem", width: "1px", backgroundColor: "#e5e7eb" }}></div>
                                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                                <span style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase" }}>Failed</span>
                                                                <strong style={{ color: c.failed_count > 0 ? "#dc2626" : "#111827" }}>{c.failed_count}</strong>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {c.failed_count > 0 && (
                                                            <button
                                                                onClick={() => handleRetryCampaign(c.id)}
                                                                style={{ color: "hsl(var(--primary))", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}
                                                            >
                                                                <RefreshCw size={14} />
                                                                Retry Failed
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div>
                            {templates.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "3rem" }}>
                                    <Layout className="text-blue-600" size={32} />
                                    <h3 style={{ margin: "1rem 0 0.5rem 0" }}>No templates yet</h3>
                                    <p style={{ color: "#6b7280", margin: "0 0 1.5rem 0" }}>Create email templates to reuse in your campaigns.</p>
                                    <button
                                        onClick={handleNewTemplate}
                                        style={{ color: "hsl(var(--primary))", fontWeight: 500 }}
                                    >
                                        Create First Template &rarr;
                                    </button>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="campaign-table">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th>Template Name</th>
                                                <th>Category</th>
                                                <th>Subject Line</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody >
                                            {templates.map(t => (
                                                <tr key={t.id} >
                                                    <td>
                                                        {t.name}
                                                        {t.is_system && (
                                                            <span style={{ marginLeft: "0.5rem", background: "#f3f4f6", color: "#4b5563", fontSize: "0.65rem", padding: "0.1rem 0.5rem", borderRadius: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>System</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "1rem", border: "1px solid #dbeafe" }}>
                                                            {t.category || 'General'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {t.subject_template}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                                                            <button
                                                                onClick={() => handleEditTemplate(t)}
                                                                style={{ padding: "0.4rem", cursor: "pointer", border: "none", background: "none", color: "#4b5563" }}
                                                                title={t.is_system ? "View" : "Edit"}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            {!t.is_system && (
                                                                <button
                                                                    onClick={() => handleDeleteTemplate(t.id)}
                                                                    style={{ padding: "0.4rem", cursor: "pointer", border: "none", background: "none", color: "#dc2626" }}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Failed Emails Tab */}
                    {activeTab === 'failed' && (
                        <div>
                            {failedEmails.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3 opacity-50" />
                                    <h3 style={{ margin: "1rem 0 0.5rem 0" }}>All systems operational</h3>
                                    <p>No failed email deliveries found.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="campaign-table">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th>Recipient</th>
                                                <th>Subject</th>
                                                <th>Error Details</th>
                                                <th>Attempts</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody >
                                            {failedEmails.map(email => (
                                                <tr key={email.id} >
                                                    <td>{email.recipient_email}</td>
                                                    <td>{email.subject}</td>
                                                    <td>
                                                        <span className="inline-block bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-100 max-w-xs truncate" title={email.last_error}>
                                                            {email.last_error || 'Unknown Error'}
                                                        </span>
                                                    </td>
                                                    <td>{email.attempts}</td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleRetryEmail(email.id)}
                                                            style={{ color: "hsl(var(--primary))", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                                                        >
                                                            <RefreshCw size={14} />
                                                            Retry
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ position: "relative" }}>
                        <button onClick={() => setShowTemplateModal(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                            <X size={24} />
                        </button>

                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>
                                {editingTemplate ? 'Edit Template' : 'Create New Template'}
                            </h2>
                        </div>

                        <div className="modal-body space-y-4">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <label className="form-label">Template Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Monthly Newsletter Layout"
                                        value={templateForm.name}
                                        disabled={editingTemplate?.is_system}
                                        onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={templateForm.category}
                                        disabled={editingTemplate?.is_system}
                                        onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                                    >
                                        <option value="General">General</option>
                                        <option value="Newsletter">Newsletter</option>
                                        <option value="Alerts">Alerts</option>
                                        <option value="Meetings">Meetings</option>
                                        <option value="Financial">Financial</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Email Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter subject line (supports {{first_name}})"
                                    value={templateForm.subject_template}
                                    disabled={editingTemplate?.is_system}
                                    onChange={e => setTemplateForm({ ...templateForm, subject_template: e.target.value })}
                                />
                                <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0.25rem 0 0 0" }}>Tip: Use <code>{'{{first_name}}'}</code> to insert the recipient's name.</p>
                            </div>

                            <div>
                                <label className="form-label">HTML Content</label>
                                {editingTemplate?.is_system ? (
                                    <div className="form-input" style={{ background: "#f9fafb", maxHeight: "300px", overflowY: "auto", color: "#6b7280" }} dangerouslySetInnerHTML={{ __html: templateForm.content_html }} />
                                ) : (
                                    <div style={{ height: "250px", marginBottom: "3rem" }}>
                                        <ReactQuill
                                            theme="snow"
                                            value={templateForm.content_html}
                                            onChange={(content) => setTemplateForm({ ...templateForm, content_html: content })}
                                            style={{ height: "100%" }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                            >
                                {editingTemplate?.is_system ? 'Close' : 'Cancel'}
                            </button>
                            {!editingTemplate?.is_system && (
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={!templateForm.name || !templateForm.subject_template || !templateForm.content_html}
                                    className="btn btn-primary"
                                >
                                    Save Template
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default CampaignDashboard;
