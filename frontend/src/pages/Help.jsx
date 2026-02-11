import React from 'react';
import { API_URL } from '../config';

export const TechSupport = () => (
    <div className="container">
        <h2 style={{ marginBottom: '2rem' }}>Technical Support</h2>
        <div className="card">
            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                Having trouble with the Nibrr Portal? Our support team is here to help.
            </p>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                    <strong>Email Support</strong><br />
                    <a href="mailto:support@nibrr.com" style={{ color: 'hsl(215 25% 27%)', textDecoration: 'underline' }}>support@nibrr.com</a>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>Response time: Within 24 hours</p>
                </div>

                <div>
                    <strong>Phone Support</strong><br />
                    <a href="tel:1-800-555-0199" style={{ color: 'hsl(215 25% 27%)', textDecoration: 'underline' }}>1-800-555-0199</a>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>Mon-Fri, 9am - 5pm EST</p>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.5rem', marginTop: '1rem' }}>
                    <strong>System Status</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'green' }}></div>
                        <span>All systems operational</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const HOASupport = () => {
    const [info, setInfo] = React.useState(null);

    React.useEffect(() => {
        fetch(`${API_URL}/api/community-info/info`)
            .then(res => res.json())
            .then(setInfo)
            .catch(console.error);
    }, []);

    if (!info) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h2 style={{ marginBottom: '2rem' }}>HOA Support Team</h2>
            <div className="card">
                <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    Contact your Community Manager for property-related questions, rule clarifications, or architectural reviews.
                </p>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3>Community Manager</h3>
                    <div style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>{info.name} Management Office</div>
                    <div>
                        <strong>Address:</strong><br />
                        {info.address}, {info.city_state_zip}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <strong>Email</strong><br />
                        <a href={`mailto:${info.email}`} style={{ color: 'hsl(215 25% 27%)', textDecoration: 'underline' }}>{info.email}</a>
                    </div>
                    <div>
                        <strong>Phone</strong><br />
                        <a href={`tel:${info.phone}`} style={{ color: 'hsl(215 25% 27%)', textDecoration: 'underline' }}>{info.phone}</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
