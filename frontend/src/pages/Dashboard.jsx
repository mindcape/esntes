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
                const token = localStorage.getItem('nibrr_token');
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
                const token = localStorage.getItem('nibrr_token');
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
    const [stats, setStats] = React.useState({
        balance: 0,
        open_requests: 0,
        next_event: null,
        recent_activity: [],
        quick_actions: []
    });

    React.useEffect(() => {
        let isMounted = true;
        const token = localStorage.getItem('nibrr_token');

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
            {/* Financial Summary */}
            <div className="mb-6 bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">My Balance</h2>
                    <p className="text-3xl font-bold mt-2">${stats.balance.toFixed(2)}</p>
                    {stats.balance > 0 ? (
                        <span className="text-red-500 text-sm font-medium">Payment Due</span>
                    ) : (
                        <span className="text-green-500 text-sm font-medium">No payments due</span>
                    )}
                </div>
                {stats.balance > 0 && (
                    <Link to="/make-payment" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                        Pay Now
                    </Link>
                )}
            </div>

            {/* Quick Actions */}
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.quick_actions && stats.quick_actions.map((action, i) => (
                    <Link key={i} to={action.path} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md text-center transition">
                        <div className="text-blue-600 mb-2 font-bold text-xl">
                            {/* Simple Icon Mapping could go here, treating specific labels */}
                            {action.icon === 'wrench' && '🔧'}
                            {action.icon === 'calendar' && '📅'}
                            {action.icon === 'folder' && '📂'}
                        </div>
                        <span className="font-medium text-gray-700">{action.label}</span>
                    </Link>
                ))}
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Open Requests" value={stats.open_requests} trend={stats.open_requests > 0 ? "Tracking" : "All Clear"} to="/maintenance" />
                <StatCard
                    title="Next Event"
                    value={stats.next_event?.date || "--"}
                    trend={stats.next_event?.title || "No events"}
                    to="/calendar"
                />
                <div className="card">
                    <h3 className="mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {stats.recent_activity && stats.recent_activity.length > 0 ? (
                            stats.recent_activity.map(item => (
                                <div key={item.id} className="border-l-4 border-blue-500 pl-3">
                                    <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{item.description}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
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
        const token = localStorage.getItem('nibrr_token');

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
        const token = localStorage.getItem('nibrr_token');

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
