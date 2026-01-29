import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/directory', label: 'Directory', icon: '👥' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/violations', label: 'Violations', icon: '⚠️' },
    { path: '/visitors', label: 'Visitors', icon: '🚗' },
    { path: '/arc', label: 'ARC Requests', icon: '🎨' },
    { path: '/documents', label: 'Documents', icon: '📄' },
    { path: '/elections', label: 'Elections', icon: '🗳️' },
];

const BOARD_ITEMS = [
    { path: '/board/financials', label: 'Financial Management', icon: '📊' },
    { path: '/board/arc', label: 'ARC Approvals', icon: '✅' },
    { path: '/board/violations', label: 'Violations Management', icon: '👮' },
    { path: '/board/vendors', label: 'Vendors', icon: '👷' },
    { path: '/board/work-orders', label: 'Work Orders', icon: '🛠️' },
    { path: '/board/announcements', label: 'Announcements', icon: '📢' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const [helpOpen, setHelpOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    // Shared styles
    const navItemStyle = {
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        color: 'hsl(215 15% 40%)',
        fontWeight: '500',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        marginBottom: '0.25rem',
        transition: 'all 0.2s ease',
    };

    const activeStyle = {
        ...navItemStyle,
        backgroundColor: '#e6f0ff',
        color: '#0066cc',
    };

    const boardItemStyle = {
        ...navItemStyle,
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
    };

    // Filter Nav Items based on user community modules
    const visibleNavItems = NAV_ITEMS.filter(item => {
        if (!user || user.role === 'super_admin') return true;

        const modules = user.community?.modules_enabled || {};

        if (item.path === '/visitors' && modules.visitors === false) return false;
        if (item.path === '/elections' && modules.elections === false) return false;
        if (item.path === '/violations' && modules.violations === false) return false;
        if (item.path === '/documents' && modules.documents === false) return false;
        if (item.path === '/calendar' && modules.calendar === false) return false;

        return true;
    });

    const visibleBoardItems = BOARD_ITEMS.filter(item => {
        if (!user || user.role === 'super_admin') return true;
        const modules = user.community?.modules_enabled || {};

        if (item.path === '/board/arc' && modules.arc === false) return false;
        if (item.path === '/board/violations' && modules.violations === false) return false;
        if (item.path === '/board/financials' && modules.finance === false) return false;
        // Work Orders usually tied to Maintenance, assume always on or tied to something? 
        // Let's tie it to 'maintenance' if exists, or just keep it. 
        // User didn't complain about work orders, but let's be safe.
        // Assuming maintenance is core or same as 'maintenance'? Model doesn't have 'maintenance' key explicit in default list above?
        // Wait, models.py default has: finance, arc, violations, documents, calendar, visitors, elections.
        // It does NOT have 'maintenance'.

        return true;
    });

    return (
        <nav style={{
            width: isCollapsed ? '80px' : '260px',
            backgroundColor: 'white',
            borderRight: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0,
            flexShrink: 0,
            transition: 'width 0.3s ease',
            zIndex: 100
        }}>
            {/* Header */}
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
                {!isCollapsed && (
                    <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'hsl(215 25% 27%)', textDecoration: 'none' }}>
                        ESNTES
                    </Link>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        color: '#888',
                        padding: '0.25rem'
                    }}
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? '➡' : '⬅'}
                </button>
            </div>

            {/* Navigation */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '0 0.5rem' : '0 1rem' }}>
                {user && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {user.role !== 'super_admin' && visibleNavItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={isActive(item.path) ? activeStyle : navItemStyle}
                                title={isCollapsed ? item.label : ''}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        ))}

                        {(user.role === 'board' || user.role === 'admin') && (
                            <>
                                <div style={{ margin: '1rem 0', borderTop: '1px solid #eee' }} />
                                {!isCollapsed && <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Board</div>}

                                {visibleBoardItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        style={isActive(item.path) ? { ...boardItemStyle, backgroundColor: '#e6f0ff', color: '#0066cc', borderColor: '#0066cc' } : boardItemStyle}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </Link>
                                ))}
                            </>
                        )}

                        {user.role === 'super_admin' && (
                            <Link
                                to="/admin"
                                style={isActive('/admin') ? activeStyle : navItemStyle}
                                title={isCollapsed ? "Admin Dashboard" : ''}
                            >
                                <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                                {!isCollapsed && <span>Admin Dashboard</span>}
                            </Link>
                        )}

                        {user.role !== 'super_admin' && (
                            <>
                                {/* Help & FAQ */}
                                <div style={{ margin: '1rem 0', borderTop: '1px solid #eee' }} />

                                <Link
                                    to="/faq"
                                    style={isActive('/faq') ? activeStyle : navItemStyle}
                                    title={isCollapsed ? "FAQ" : ''}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>❓</span>
                                    {!isCollapsed && <span>FAQ</span>}
                                </Link>

                                {!isCollapsed ? (
                                    <>
                                        <div
                                            onClick={() => setHelpOpen(!helpOpen)}
                                            style={{ ...navItemStyle, cursor: 'pointer', justifyContent: 'space-between' }}
                                        >
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <span style={{ fontSize: '1.2rem' }}>🆘</span>
                                                <span>Help</span>
                                            </div>
                                            <span>{helpOpen ? '▾' : '▸'}</span>
                                        </div>
                                        {helpOpen && (
                                            <div style={{ marginLeft: '1rem', borderLeft: '2px solid #eee' }}>
                                                <Link to="/help/tech" style={{ padding: '0.5rem 1rem', color: 'hsl(215 15% 40%)', fontSize: '0.9rem', textDecoration: 'none', display: 'block' }}>Tech Support</Link>
                                                <Link to="/help/hoa" style={{ padding: '0.5rem 1rem', color: 'hsl(215 15% 40%)', fontSize: '0.9rem', textDecoration: 'none', display: 'block' }}>HOA Team</Link>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        to="/help/tech"
                                        style={navItemStyle}
                                        title="Help"
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>🆘</span>
                                    </Link>
                                )}
                            </>
                        )}

                    </div>
                )}
            </div>

            {/* Footer / User Profile */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eee' }}>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: isCollapsed ? 'column' : 'row' }}>
                        <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }} title="My Profile">
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                backgroundColor: '#0066cc', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0
                            }}>
                                {user.name.charAt(0)}
                            </div>
                            {!isCollapsed && (
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>{user.role}</div>
                                </div>
                            )}
                        </Link>

                        {!isCollapsed ? (
                            <button onClick={logout} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                Logout
                            </button>
                        ) : (
                            <button onClick={logout} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Logout">
                                🚪
                            </button>
                        )}
                    </div>
                ) : null}
            </div>
        </nav>
    );
}
