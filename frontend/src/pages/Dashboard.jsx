import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, trend, icon, to }) => (
    <Link to={to || "#"} className="card" style={{ textDecoration: 'none', display: 'block', color: 'inherit', cursor: to ? 'pointer' : 'default' }}>
        <h3>{title}</h3>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            {value}
        </div>
        {trend && (
            <div style={{ color: trend.includes('+') ? 'green' : 'red', fontSize: '0.875rem' }}>
                {trend} vs last month
            </div>
        )}
    </Link>
);

const DocumentList = ({ title }) => (
    <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>{title}</h3>
            <button className="btn btn-primary" style={{ fontSize: '0.875rem' }}>View All</button>
        </div>
        <ul style={{ listStyle: 'none' }}>
            {[1, 2, 3].map((i) => (
                <li key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Community Update - Jan {i}</span>
                    <span style={{ color: '#888' }}>PDF</span>
                </li>
            ))}
        </ul>
    </div>
);

const CommunityInfo = () => {
    const [info, setInfo] = React.useState(null);
    const [board, setBoard] = React.useState([]);

    React.useEffect(() => {
        fetch('http://127.0.0.1:8000/api/community-info/info').then(res => res.json()).then(setInfo).catch(console.error);
        fetch('http://127.0.0.1:8000/api/community-info/board').then(res => res.json()).then(setBoard).catch(console.error);
    }, []);

    if (!info) return null;

    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <h3>Community Management</h3>
            <div style={{ marginBottom: '1rem', color: '#666' }}>
                <strong>{info.name}</strong><br />
                {info.address}<br />
                {info.city_state_zip}<br />
                <a href={`tel:${info.phone}`}>{info.phone}</a> • <a href={`mailto:${info.email}`}>{info.email}</a>
            </div>
            <h4>Board of Directors</h4>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                {board.map((member, i) => (
                    <li key={i} style={{ padding: '0.25rem 0', fontSize: '0.9rem' }}>
                        <strong>{member.name}</strong> - {member.position}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ResidentDashboard = () => (
    <div>
        <h2 style={{ marginBottom: '1.5rem' }}>My Residence</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <StatCard title="Current Balance" value="$0.00" trend="No due payments" to="/ledger" />
            <StatCard title="Open Requests" value="1" trend="Repair in progress" to="/maintenance" />
            <StatCard title="Next Event" value="Feb 12" trend="Annual BBQ" to="/calendar" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <DocumentList title="Recent Community Documents" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <CommunityInfo />
            </div>
        </div>
    </div>
);

const BoardDashboard = () => (
    <div>
        <h2 style={{ marginBottom: '1.5rem' }}>Executive Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <StatCard title="Total Delinquency" value="$1,240" trend="+5%" />
            <StatCard title="Open Work Orders" value="12" trend="-2%" />
            <StatCard title="Operating Account" value="$45,200" trend="Healthy" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="card">
                <h3>Recent Violations</h3>
                <p>No major violations reported this week.</p>
            </div>
            <div className="card">
                <h3>Pending Approvals</h3>
                <p>2 Architectural Change Requests pending review.</p>
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const { user } = useAuth();
    const [community, setCommunity] = React.useState(null);

    React.useEffect(() => {
        fetch('http://127.0.0.1:8000/api/community-info/info')
            .then(res => res.json())
            .then(setCommunity)
            .catch(console.error);
    }, []);

    if (!user) {
        return <div className="container">Please log in to view the dashboard.</div>;
    }

    return (
        <div className="container">
            <div className="header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <h1>Welcome back, {user.name}</h1>
                    {user.address && <div style={{ fontSize: '1rem', color: '#666', marginTop: '0.25rem' }}>📍 {user.address}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    {community && (
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>
                            <strong>{community.name}</strong><br />
                            {community.address}
                        </div>
                    )}
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#eee', borderRadius: '1rem', fontSize: '0.875rem' }}>
                        {user.role === 'resident' ? 'Resident Portal' : 'Board Access'}
                    </span>
                </div>
            </div>
            {user.role === 'resident' ? <ResidentDashboard /> : <BoardDashboard />}
        </div>
    );
}
