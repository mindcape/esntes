import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { Link } from 'react-router-dom';
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
    Search
} from 'lucide-react';

const CampaignDashboard = () => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [campaigns, setCampaigns] = useState([]);
    const [failedEmails, setFailedEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Campaigns
    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem('esntes_token');
            const res = await fetch(`${API_URL}/api/communication/campaigns`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const token = localStorage.getItem('esntes_token');
            const res = await fetch(`${API_URL}/api/communication/emails/failed`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch failed emails");
            const data = await res.json();
            setFailedEmails(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchCampaigns(), fetchFailedEmails()])
            .finally(() => setLoading(false));
    }, []);

    const handleRetryEmail = async (emailId) => {
        try {
            const token = localStorage.getItem('esntes_token');
            const res = await fetch(`${API_URL}/api/communication/emails/${emailId}/retry`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Retry failed");
            fetchFailedEmails();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRetryCampaign = async (campaignId) => {
        try {
            const token = localStorage.getItem('esntes_token');
            const res = await fetch(`${API_URL}/api/communication/campaigns/${campaignId}/retry`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Retry failed");
            fetchFailedEmails();
            alert("All failed emails for this campaign have been queued for retry.");
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
                    <p className="text-gray-500 mt-1">Manage email campaigns and newsletters</p>
                </div>
                <Link to="/communications/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
                    <Plus size={20} />
                    New Campaign
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'campaigns' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('campaigns')}
                    >
                        <FileText size={18} />
                        Campaigns
                        {activeTab === 'campaigns' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                    </button>
                    <button
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'failed' ? 'text-red-600 bg-red-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('failed')}
                    >
                        <AlertCircle size={18} />
                        Failed Deliveries
                        {failedEmails.length > 0 && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full ml-1">
                                {failedEmails.length}
                            </span>
                        )}
                        {activeTab === 'failed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>}
                    </button>
                </div>

                <div className="p-6">
                    {/* Campaigns Tab */}
                    {activeTab === 'campaigns' && (
                        <div>
                            {campaigns.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="text-blue-600" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No campaigns yet</h3>
                                    <p className="text-gray-500 mt-1 mb-6">Create your first mass email campaign to reach all residents.</p>
                                    <Link to="/communications/new" className="text-blue-600 font-medium hover:underline">
                                        Start a Campaign &rarr;
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Campaign</th>
                                                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Schedule</th>
                                                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Performance</th>
                                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {campaigns.map(c => (
                                                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="py-4 px-4">
                                                        <div className="font-medium text-gray-900">{c.title}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <Mail size={12} />
                                                            ID: #{c.id}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
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
                                                    <td className="py-4 px-4 text-sm text-gray-600">
                                                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString(undefined, {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        }) : 'Immediate'}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-500 text-xs uppercase tracking-wide">Sent</span>
                                                                <span className="font-medium text-gray-900">{c.sent_count}</span>
                                                            </div>
                                                            <div className="h-8 w-px bg-gray-200"></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-500 text-xs uppercase tracking-wide">Failed</span>
                                                                <span className={`font-medium ${c.failed_count > 0 ? 'text-red-600' : 'text-gray-900'}`}>{c.failed_count}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        {c.failed_count > 0 && (
                                                            <button
                                                                onClick={() => handleRetryCampaign(c.id)}
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 justify-end ml-auto"
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

                    {/* Failed Emails Tab */}
                    {activeTab === 'failed' && (
                        <div>
                            {failedEmails.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3 opacity-50" />
                                    <h3 className="text-lg font-medium text-gray-900">All systems operational</h3>
                                    <p>No failed email deliveries found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-500">Recipient</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-500">Subject</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-500">Error Details</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-500">Attempts</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-500 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {failedEmails.map(email => (
                                                <tr key={email.id} className="hover:bg-red-50/10 transition-colors">
                                                    <td className="py-3 px-4 font-medium text-gray-900">{email.recipient_email}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{email.subject}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-block bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-100 max-w-xs truncate" title={email.last_error}>
                                                            {email.last_error || 'Unknown Error'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{email.attempts}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() => handleRetryEmail(email.id)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
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
        </div>
    );
};

export default CampaignDashboard;
