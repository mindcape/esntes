import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const CampaignDashboard = () => {
    const { user } = useAuth();
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
            // Refresh list
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
    }

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mass Communications</h1>
                <Link to="/communications/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    + New Campaign
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'campaigns' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
                    onClick={() => setActiveTab('campaigns')}
                >
                    Campaigns
                </button>
                <button
                    className={`px-4 py-2 ml-4 ${activeTab === 'failed' ? 'border-b-2 border-red-600 font-semibold text-red-600' : ''}`}
                    onClick={() => setActiveTab('failed')}
                >
                    Failed Emails ({failedEmails.length})
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">{error}</div>}

            {/* Campaigns Table */}
            {activeTab === 'campaigns' && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats (Sent/Failed)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {campaigns.map(c => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{c.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs 
                                            ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                c.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : 'Immediate'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {c.sent_count} / <span className="text-red-600 font-bold">{c.failed_count}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {c.failed_count > 0 && (
                                            <button
                                                onClick={() => handleRetryCampaign(c.id)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Retry All Failed
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {campaigns.length === 0 && (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No campaigns found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Failed Emails Table */}
            {activeTab === 'failed' && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {failedEmails.map(email => (
                                <tr key={email.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{email.recipient_email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{email.subject}</td>
                                    <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate" title={email.last_error}>
                                        {email.last_error || 'Unknown Error'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{email.attempts}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleRetryEmail(email.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {failedEmails.length === 0 && (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No failed emails found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CampaignDashboard;
