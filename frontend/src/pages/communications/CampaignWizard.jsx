import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

const CampaignWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [audience, setAudience] = useState({ role: 'resident' }); // Default
    const [schedule, setSchedule] = useState({ isImmediate: true, date: '' });
    const [campaignTitle, setCampaignTitle] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch Templates on mount
    useEffect(() => {
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
        fetchTemplates();
    }, []);

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        const name = prompt("Template Name:");
        const subject = prompt("Subject Line (Use {{first_name}} for personalization):");
        const body = prompt("HTML Content:");

        if (!name || !subject || !body) return;

        try {
            const token = localStorage.getItem('esntes_token');
            const res = await fetch(`${API_URL}/api/communication/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, subject_template: subject, content_html: body })
            });
            if (res.ok) {
                const newTmpl = await res.json();
                setTemplates([...templates, newTmpl]);
                setSelectedTemplate(newTmpl);
            }
        } catch (e) {
            alert("Failed to create template");
        }
    };

    const handleSubmit = async () => {
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

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg mt-8">
            <h1 className="text-2xl font-bold mb-6">New Campaign</h1>

            {/* Progress Bar */}
            <div className="flex mb-8">
                <div className={`flex-1 h-2 rounded-l ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex-1 h-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex-1 h-2 rounded-r ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            </div>

            {/* Step 1: Template */}
            {step === 1 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Step 1: Select Template</h2>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Campaign Title</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded"
                            value={campaignTitle}
                            onChange={(e) => setCampaignTitle(e.target.value)}
                            placeholder="e.g. June Newsletter"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4">
                        {templates.map(t => (
                            <div
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`p-4 border rounded cursor-pointer ${selectedTemplate?.id === t.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                                <div className="font-bold">{t.name}</div>
                                <div className="text-sm text-gray-500">{t.subject_template}</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={handleCreateTemplate} className="text-blue-600 text-sm mb-6">+ Create New Template (Quick)</button>

                    <div className="flex justify-end">
                        <button
                            disabled={!selectedTemplate || !campaignTitle}
                            onClick={() => setStep(2)}
                            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
                        >
                            Next: Audience
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Audience */}
            {step === 2 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Step 2: Select Audience</h2>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Target Role</label>
                        <select
                            className="w-full border p-2 rounded"
                            value={audience.role}
                            onChange={(e) => setAudience({ ...audience, role: e.target.value })}
                        >
                            <option value="resident">All Residents</option>
                            <option value="owner">Owners Only</option>
                            <option value="board">Board Members</option>
                        </select>
                    </div>

                    <div className="flex justify-between">
                        <button onClick={() => setStep(1)} className="text-gray-600 px-4 py-2">Back</button>
                        <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded">Next: Schedule</button>
                    </div>
                </div>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Step 3: Review & Schedule</h2>

                    <div className="bg-gray-50 p-4 rounded mb-6">
                        <p><strong>Campaign:</strong> {campaignTitle}</p>
                        <p><strong>Template:</strong> {selectedTemplate?.name}</p>
                        <p><strong>Audience:</strong> {audience.role}</p>
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                checked={schedule.isImmediate}
                                onChange={(e) => setSchedule({ ...schedule, isImmediate: e.target.checked })}
                                className="mr-2"
                            />
                            Send Immediately
                        </label>

                        {!schedule.isImmediate && (
                            <input
                                type="datetime-local"
                                className="border p-2 rounded w-full"
                                value={schedule.date}
                                onChange={(e) => setSchedule({ ...schedule, date: e.target.value })}
                            />
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button onClick={() => setStep(2)} className="text-gray-600 px-4 py-2">Back</button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                        >
                            {loading ? 'Processing...' : 'Launch Campaign'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignWizard;
