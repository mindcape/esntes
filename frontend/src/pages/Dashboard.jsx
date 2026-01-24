import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

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



const CommunityInfo = () => {
    const [info, setInfo] = React.useState(null);
    const [board, setBoard] = React.useState([]);

    React.useEffect(() => {
        let isMounted = true;

        const fetchInfo = async () => {
            try {
                const token = localStorage.getItem('esntes_token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`${API_URL}/api/community-info/info`, { headers });

                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setInfo(data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchBoard = async () => {
            try {
                const token = localStorage.getItem('esntes_token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`${API_URL}/api/community-info/board`, { headers });

                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && Array.isArray(data)) setBoard(data);
                } else {
                    if (isMounted) setBoard([]); // Fallback to empty
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setBoard([]);
            }
        };

        fetchInfo();
        fetchBoard();

        return () => { isMounted = false; };
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
                {board && Array.isArray(board) && board.length > 0 ? board.map((member, i) => (
                    <li key={i} style={{ padding: '0.25rem 0', fontSize: '0.9rem' }}>
                        <strong>{member.name}</strong> - {member.position}
                    </li>
                )) : (
                    <li style={{ padding: '0.25rem 0', fontSize: '0.9rem', color: '#888' }}>
                        No board members listed.
                    </li>
                )}
            </ul>
        </div>
    );
};

const ResidentDashboard = () => {
    const [stats, setStats] = React.useState({ balance: 0, open_requests: 0, next_event: null });

    React.useEffect(() => {
        let isMounted = true;
        const token = localStorage.getItem('esntes_token');

        if (token) {
            fetch(`${API_URL}/api/dashboard/resident/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => { if (isMounted) setStats(data); })
                .catch(console.error);
        }
        return () => { isMounted = false; };
    }, []);

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>My Residence</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <StatCard title="Current Balance" value={`$${stats.balance.toFixed(2)}`} trend={stats.balance > 0 ? "Payment Due" : "No due payments"} to="/ledger" />
                <StatCard title="Open Requests" value={stats.open_requests} trend={stats.open_requests > 0 ? "In Progress" : "All Clear"} to="/maintenance" />
                <StatCard
                    title="Next Event"
                    value={stats.next_event?.date || "No events"}
                    trend={stats.next_event?.title || ""}
                    to="/calendar"
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* DocumentList Removed (Hardcoded) - Replaced with link */}
                    <div className="card">
                        <h3>Community Documents</h3>
                        <p>Access all governing documents, forms, and meeting minutes.</p>
                        <Link to="/documents" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Browse Documents</Link>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <CommunityInfo />
                </div>
            </div>
        </div>
    );
};

const BoardDashboard = () => {
    const [stats, setStats] = React.useState({ delinquency: 0, open_work_orders: 0, operating_account: 0, pending_arc: 0 });

    React.useEffect(() => {
        let isMounted = true;
        const token = localStorage.getItem('esntes_token');

        if (token) {
            fetch(`${API_URL}/api/dashboard/board/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => { if (isMounted) setStats(data); })
                .catch(console.error);
        }
        return () => { isMounted = false; };
    }, []);

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Executive Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <StatCard title="Total Delinquency" value={`$${stats.delinquency.toLocaleString()}`} trend="Tracked" />
                <StatCard title="Open Work Orders" value={stats.open_work_orders} trend="Maintenance" />
                <StatCard title="Operating Account" value={`$${stats.operating_account.toLocaleString()}`} trend="Funds" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="card">
                    <h3>Recent Violations</h3>
                    <p>View and manage reported community violations.</p>
                    <Link to="/violations" className="btn" style={{ marginTop: '0.5rem' }}>Manage Violations</Link>
                </div>
                <div className="card">
                    <h3>Pending Approvals</h3>
                    <p>{stats.pending_arc} Architectural Change Requests pending review.</p>
                    <Link to="/board/arc" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Review Requests</Link>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useAuth();
    const [community, setCommunity] = React.useState(null);

    React.useEffect(() => {
        let isMounted = true;
        const token = localStorage.getItem('esntes_token');

        if (token) {
            fetch(`${API_URL}/api/community-info/info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => { if (isMounted) setCommunity(data); })
                .catch(console.error);
        }
        return () => { isMounted = false; };
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
