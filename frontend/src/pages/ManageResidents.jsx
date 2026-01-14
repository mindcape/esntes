import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function ManageResidents() {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/community/all-residents`)
            .then(res => res.json())
            .then(data => {
                setResidents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="container">Loading...</div>;

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
            <h1 style={{ marginBottom: '2rem' }}>Manage Residents</h1>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem', color: '#666' }}>Name</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Contact</th>
                            <th style={{ padding: '1rem', color: '#666' }}>Communication Preferences</th>
                            <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Mgmt Notif.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {residents.map(resident => (
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
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {resident.preferences?.mgmt_committee_notifications ? '✅' : '❌'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
