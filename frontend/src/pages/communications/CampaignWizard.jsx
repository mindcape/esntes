import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../config';
import {
    Calendar as CalendarIcon,
    Users,
    Layout,
    Send,
    ArrowLeft,
    Plus,
    X,
    Check,
    AlignLeft,
    Clock,
    FileText
} from 'lucide-react';

const CampaignWizard = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [audience, setAudience] = useState({ role: 'resident' }); // Default
    const [schedule, setSchedule] = useState({ isImmediate: true, date: '' });
    const [campaignTitle, setCampaignTitle] = useState('');
    const [loading, setLoading] = useState(false);

    // Template Creation Modal State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

    // Fetch Templates on mount
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const token = localStorage.getItem('esntes_token');
        try {
            const res = await fetch(`${API_URL}/api/communication/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) return;

        try {
            const token = localStorage.getItem('esntes_token');
            const res = await fetch(`${API_URL}/api/communication/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newTemplate.name,
                    subject_template: newTemplate.subject,
                    content_html: newTemplate.body
                })
            });
            if (res.ok) {
                const newTmpl = await res.json();
                setTemplates([...templates, newTmpl]);
                setSelectedTemplate(newTmpl);
                setShowTemplateModal(false);
                setNewTemplate({ name: '', subject: '', body: '' }); // Reset
            }
        } catch (e) {
            alert("Failed to create template");
        }
    };

    const handleSubmit = async () => {
        if (!campaignTitle || !selectedTemplate) {
            alert("Please fill in all required fields (Title and Template).");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('esntes_token');
            const payload = {
                title: campaignTitle,
                template_id: selectedTemplate.id,
                audience_filter: audience,
                scheduled_at: schedule.isImmediate ? null : schedule.date
            };

            const res = await fetch(`${API_URL}/api/communication/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
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
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/communications" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
                        <p className="text-gray-500 text-sm">Create and schedule a mass email campaign</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link to="/communications" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Campaign Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={campaignTitle}
                                    onChange={(e) => setCampaignTitle(e.target.value)}
                                    placeholder="e.g. June Community Newsletter"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Audience */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            Audience
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                value={audience.role}
                                onChange={(e) => setAudience({ ...audience, role: e.target.value })}
                            >
                                <option value="resident">All Residents</option>
                                <option value="owner">Owners Only</option>
                                <option value="tenant">Tenants Only</option>
                                <option value="board">Board Members Only</option>
                                <option value="vendor">Vendors Only</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Selection will target all active users with this role.
                            </p>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-blue-600" />
                            Schedule
                        </h3>
                        <div className="space-y-4">
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
                </div>

                {/* Right Column: Template Selection */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Layout size={20} className="text-blue-600" />
                                Email Content
                            </h3>
                            <button
                                onClick={() => setShowTemplateModal(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus size={16} />
                                Create New Template
                            </button>
                        </div>

                        {templates.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                                <FileText className="text-gray-300 mb-4" size={48} />
                                <h4 className="text-lg font-medium text-gray-900">No templates found</h4>
                                <p className="text-gray-500 mb-6">Create a template to start designing your email.</p>
                                <button
                                    onClick={() => setShowTemplateModal(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Create Template
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[240px] overflow-y-auto p-1">
                                        {templates.map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => setSelectedTemplate(t)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-all relative ${selectedTemplate?.id === t.id
                                                        ? 'border-blue-600 ring-2 ring-blue-50 bg-blue-50/20'
                                                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                {selectedTemplate?.id === t.id && (
                                                    <div className="absolute top-3 right-3 text-blue-600">
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                                <div className="font-medium text-gray-900 pr-6 truncate">{t.name}</div>
                                                <div className="text-sm text-gray-500 mt-1 truncate">Subject: {t.subject_template}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedTemplate && (
                                    <div className="border-t pt-6 mt-2 flex-1 flex flex-col">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 flex-1">
                                            <div className="bg-white shadow-sm rounded border border-gray-100 max-w-2xl mx-auto overflow-hidden">
                                                <div className="bg-gray-50 border-b px-4 py-3 text-sm text-gray-600 flex gap-2">
                                                    <span className="font-semibold text-gray-700">Subject:</span>
                                                    {selectedTemplate.subject_template}
                                                </div>
                                                <div className="p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedTemplate.content_html }}>
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

            {/* Template Creation Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowTemplateModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Create New Email Template</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Monthly Newsletter Layout"
                                    value={newTemplate.name}
                                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Subject</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter subject line (supports {{first_name}})"
                                    value={newTemplate.subject}
                                    onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Tip: Use <code>{"{{first_name}}"}</code> to insert the recipient's name.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">HTML Content</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                    rows={8}
                                    placeholder="<div>Hello {{first_name}},</div><br><p>Write your content here...</p>"
                                    value={newTemplate.body}
                                    onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.body}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignWizard;
