import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

const BoardOnboardingWizard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // State
    const [branding, setBranding] = useState({
        welcome_msg: "",
        primary_color: "#0066cc",
        logo_url: ""
    });

    const [modules, setModules] = useState({
        finance: true,
        arc: true,
        violations: true,
        documents: true,
        calendar: true,
        visitors: false,
        elections: false
    });

    const [invites, setInvites] = useState(""); // Comma separated emails

    // Fetch existing settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('nibrr_token');
                const res = await fetch(`${API_URL}/api/community/settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.branding_settings) setBranding({ ...branding, ...data.branding_settings });
                    if (data.modules_enabled) setModules({ ...modules, ...data.modules_enabled });
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nibrr_token');
            const res = await fetch(`${API_URL}/api/community/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    branding_settings: branding,
                    modules_enabled: modules
                })
            });
            if (!res.ok) throw new Error("Failed to save settings");
            return true;
        } catch (e) {
            alert(e.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!invites.trim()) return;
        const emails = invites.split(',').map(e => e.trim()).filter(e => e);
        if (emails.length === 0) return;

        try {
            const token = localStorage.getItem('nibrr_token');
            await fetch(`${API_URL}/api/community/invite-board`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ emails })
            });
        } catch (e) {
            console.error("Invite failed", e);
        }
    };

    const nextStep = async () => {
        if (step === 2 || step === 3) {
            const success = await handleSaveSettings();
            if (!success) return;
        }
        if (step === 4) {
            await handleInvite();
            navigate('/dashboard');
            return;
        }
        setStep(step + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10">
            <div className="w-full max-w-3xl bg-white shadow-xl rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">Community Setup</h1>
                    <p className="opacity-90">Step {step} of 4</p>
                </div>

                <div className="p-8">
                    {/* Step 1: Welcome */}
                    {step === 1 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Welcome to Nibrr!</h2>
                            <p className="text-gray-600 mb-6">
                                We're excited to help you manage <strong>{user?.community?.name || 'your community'}</strong>.
                                Let's get your portal set up in just a few minutes.
                            </p>
                            <button onClick={nextStep} className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700">
                                Let's Start &rarr;
                            </button>
                        </div>
                    )}

                    {/* Step 2: Branding */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Customize Your Portal</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Welcome Message</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    rows="3"
                                    value={branding.welcome_msg}
                                    onChange={(e) => setBranding({ ...branding, welcome_msg: e.target.value })}
                                    placeholder="e.g. Welcome to Sunset Valley HOA!"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Primary Color</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={branding.primary_color}
                                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                                        className="h-10 w-20"
                                    />
                                    <span>{branding.primary_color}</span>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 font-bold mb-2">Logo URL</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={branding.logo_url}
                                    onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                                    placeholder="https://..."
                                />
                                <p className="text-sm text-gray-500 mt-1">Accepts image URL (Support for upload coming soon)</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Features */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Enable Features</h2>
                            <p className="text-gray-600 mb-6">Choose the modules relevant to your community.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(modules).map(key => (
                                    <label key={key} className="flex items-center p-4 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={modules[key]}
                                            onChange={(e) => setModules({ ...modules, [key]: e.target.checked })}
                                            className="h-5 w-5 text-blue-600"
                                        />
                                        <span className="ml-3 capitalize font-medium">{key.replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Team */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Invite Your Board</h2>
                            <p className="text-gray-600 mb-4">Add email addresses of other board members to send them an invite.</p>

                            <textarea
                                className="w-full border p-2 rounded mb-6"
                                rows="4"
                                placeholder="jane@example.com, john@example.com"
                                value={invites}
                                onChange={(e) => setInvites(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step > 1 && (
                        <div className="flex justify-between mt-8 border-t pt-6">
                            <button
                                onClick={() => setStep(step - 1)}
                                className="text-gray-600 font-medium px-6 py-2"
                            >
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                            >
                                {step === 4 ? 'Finish Setup' : 'Next Step'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BoardOnboardingWizard;
