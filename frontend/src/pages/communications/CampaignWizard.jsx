import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import {
    Calendar as CalendarIcon,
    Users,
    Layout,
    Send,
    ArrowLeft,
    Check,
    Clock,
    FileText,
    Paperclip,
    X,
    UploadCloud
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Campaign.css';

const CampaignWizard = () => {
    const navigate = useNavigate();
    const { fetchWithAuth } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [audience, setAudience] = useState({ role: 'resident' }); // Default
    const [schedule, setSchedule] = useState({ isImmediate: true, date: '' });
    const [campaignTitle, setCampaignTitle] = useState('');
    const [loading, setLoading] = useState(false);

    // Attachments
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Query Params
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const defaultCategory = queryParams.get('category') || 'All';
    const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

    // Fetch Templates on mount
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/communication/templates`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadRes = await fetchWithAuth(`${API_URL}/api/upload`, {
                method: 'POST',
                body: uploadFormData
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const data = await uploadRes.json();

            setAttachments([...attachments, { name: file.name, url: data.url }]);
        } catch (err) {
            alert(err.message || 'Error uploading attachment.');
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!campaignTitle || !selectedTemplate) {
            alert("Please fill in all required fields (Title and Template).");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: campaignTitle,
                template_id: selectedTemplate.id,
                audience_filter: audience,
                attachments: attachments.map(a => a.url),
                scheduled_at: schedule.isImmediate ? null : schedule.date
            };

            const res = await fetchWithAuth(`${API_URL}/api/communication/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create campaign");

            navigate('/communications');
        } catch (e) {
            alert(e.message);
            setLoading(false);
        }
    };

    const today = new Date().toISOString().slice(0, 16);

    return (
        <div className="container">
            {/* Header */}
            <div className="header" style={{ alignItems: "center", marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Link to="/communications" style={{ padding: "0.5rem", borderRadius: "9999px", color: "#6b7280", background: "transparent" }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ margin: 0 }}>New Campaign</h1>
                        <p style={{ color: "#6b7280", margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>Create and schedule a mass email campaign</p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Link to="/communications" style={{ padding: "0.5rem 1rem", color: "#4b5563", fontWeight: 500, textDecoration: "none" }}>
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary" style={{ gap: "0.5rem" }}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send size={18} />
                                {schedule.isImmediate ? 'Send Now' : 'Schedule Campaign'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
                {/* Left Column: Settings */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Basic Info */}
                    <div className="card">
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#111827", margin: 0 }}>
                            <FileText size={20} className="text-blue-600" />
                            Campaign Details
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label className="form-label">Campaign Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={campaignTitle}
                                    onChange={(e) => setCampaignTitle(e.target.value)}
                                    placeholder="e.g. June Community Newsletter"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Audience */}
                    <div className="card">
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#111827", margin: 0 }}>
                            <Users size={20} className="text-blue-600" />
                            Audience
                        </h3>
                        <div>
                            <label className="form-label">Target Role</label>
                            <select
                                className="form-select"
                                value={audience.role}
                                onChange={(e) => setAudience({ ...audience, role: e.target.value })}
                            >
                                <option value="resident">All Residents</option>
                                <option value="owner">Owners Only</option>
                                <option value="tenant">Tenants Only</option>
                                <option value="board">Board Members Only</option>
                                <option value="vendor">Vendors Only</option>
                            </select>
                            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
                                Selection will target all active users with this role.
                            </p>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="card">
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#111827", margin: 0 }}>
                            <Clock size={20} className="text-blue-600" />
                            Schedule
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="schedule"
                                    checked={schedule.isImmediate}
                                    onChange={() => setSchedule({ ...schedule, isImmediate: true })}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-3 font-medium text-gray-700">Send Immediately</span>
                            </label>

                            <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex items-center h-5">
                                    <input
                                        type="radio"
                                        name="schedule"
                                        checked={!schedule.isImmediate}
                                        onChange={() => setSchedule({ ...schedule, isImmediate: false })}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                </div>
                                <div className="ml-3 w-full">
                                    <span className="font-medium text-gray-700 block mb-2">Schedule for Later</span>
                                    <input
                                        type="datetime-local"
                                        min={today}
                                        disabled={schedule.isImmediate}
                                        value={schedule.date}
                                        onChange={(e) => setSchedule({ ...schedule, date: e.target.value, isImmediate: false })}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded text-sm ${schedule.isImmediate ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                    {/* Attachments */}
                    <div className="card">
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#111827", margin: 0 }}>
                            <Paperclip size={20} className="text-blue-600" />
                            Attachments
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {attachments.length > 0 && (
                                <ul className="space-y-2">
                                    {attachments.map((att, idx) => (
                                        <li key={idx} className="flex items-center justify-between p-2 bg-gray-50 border rounded text-sm">
                                            <span className="truncate max-w-[200px] text-gray-700 font-medium" title={att.name}>{att.name}</span>
                                            <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700">
                                                <X size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />
                                <div className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg text-sm font-medium transition-colors ${uploading ? 'bg-gray-100 border-gray-300 text-gray-400' : 'bg-blue-50/50 border-blue-200 text-blue-600 hover:bg-blue-50'} `}>
                                    {uploading ? (
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <UploadCloud size={18} />
                                            Add File
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Template Selection */}
                <div style={{ gridColumn: "span 2" }}>
                    <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Layout size={20} className="text-blue-600" />
                                Select Template
                            </h3>
                            <Link to="/communications" className="text-blue-600 text-sm font-medium hover:underline">
                                Manage Templates
                            </Link>
                        </div>

                        {templates.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                                <FileText className="text-gray-300 mb-4" size={48} />
                                <h4 style={{ margin: "1rem 0 0.5rem 0", color: "#111827" }}>No templates found</h4>
                                <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Create a template in the dashboard to start.</p>
                                <Link
                                    to="/communications"
                                    className="btn btn-primary"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6 flex-1">
                                <div style={{ display: "flex", gap: "0.5rem", paddingBottom: "0.5rem", overflowX: "auto" }}>
                                    {['All', 'General', 'Newsletter', 'Alerts', 'Meetings', 'Financial', 'Maintenance'].map(cat => (
                                        <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap", border: selectedCategory === cat ? "1px solid hsl(var(--primary))" : "1px solid #e5e7eb", backgroundColor: selectedCategory === cat ? "hsl(var(--primary))" : "white", color: selectedCategory === cat ? "white" : "#4b5563", cursor: "pointer" }}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem", maxHeight: "300px", overflowY: "auto", padding: "0.25rem" }}>
                                        {templates.filter(t => selectedCategory === 'All' || (t.category || 'General') === selectedCategory).map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => setSelectedTemplate(t)}
                                                style={{ padding: "1rem", border: selectedTemplate?.id === t.id ? "2px solid hsl(var(--primary))" : "1px solid #e5e7eb", borderRadius: "0.5rem", cursor: "pointer", position: "relative", backgroundColor: selectedTemplate?.id === t.id ? "hsl(221 83% 53% / 0.05)" : "white" }}
                                            >
                                                {selectedTemplate?.id === t.id && (
                                                    <div className="absolute top-3 right-3 text-blue-600">
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                                <div style={{ fontWeight: 500, color: "#111827", paddingRight: "1.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {t.name}
                                                    {t.is_system && <span style={{ marginLeft: "0.5rem", backgroundColor: "#f3f4f6", color: "#4b5563", fontSize: "0.625rem", padding: "0.125rem 0.5rem", borderRadius: "9999px", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-block" }}>System</span>}
                                                </div>
                                                <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Subject: {t.subject_template}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedTemplate && (
                                    <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", marginTop: "0.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                                        <div style={{ backgroundColor: "#f9fafb", borderRadius: "0.5rem", padding: "1.5rem", border: "1px solid #e5e7eb", flex: 1, overflow: "auto", maxHeight: "400px" }}>
                                            <div style={{ backgroundColor: "white", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", borderRadius: "0.25rem", border: "1px solid #f3f4f6", maxWidth: "42rem", margin: "0 auto", overflow: "hidden" }}>
                                                <div style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#4b5563", display: "flex", gap: "0.5rem" }}>
                                                    <span style={{ fontWeight: 600, color: "#374151" }}>Subject:</span>
                                                    {selectedTemplate.subject_template}
                                                </div>
                                                <div style={{ padding: "1.5rem", color: "#374151", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: selectedTemplate.content_html }}>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignWizard;
