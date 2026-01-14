import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Maintenance from './pages/Maintenance';
import Ledger from './pages/Ledger';
import Calendar from './pages/Calendar';
import Directory from './pages/Directory';
import Violations from './pages/Violations';
import Visitors from './pages/Visitors';
import FAQ from './pages/FAQ';
import { TechSupport, HOASupport } from './pages/Help';
import Profile from './pages/Profile';
import ManageResidents from './pages/ManageResidents';
import Financials from './pages/Financials';
import Documents from './pages/Documents';
import Elections from './pages/Elections';
import ElectionDetail from './pages/ElectionDetail';
import CreateElection from './pages/CreateElection';
import ARCRequests from './pages/ARCRequests';
import BoardARC from './pages/BoardARC';
import BoardViolations from './pages/BoardViolations';

const Sidebar = () => {
  const { user, login, logout } = useAuth();
  const [helpOpen, setHelpOpen] = React.useState(false);

  return (
    <nav style={{
      width: '260px',
      backgroundColor: 'white',
      borderRight: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0
    }}>
      <div style={{ padding: '1.5rem' }}>
        <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'hsl(215 25% 27%)', textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>ESNTES</Link>

        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>Dashboard</Link>
            <Link to="/directory" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>Directory</Link>
            <Link to="/calendar" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>Calendar</Link>
            <Link to="/violations" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>Violations</Link>
            <Link to="/visitors" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>Visitors</Link>
            <Link to="/arc" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>ARC Requests</Link>
            <Link to="/documents" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>Documents</Link>
            <Link to="/elections" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>Elections</Link>

            {user.role === 'board' && (
              <>
                <Link to="/board/residents" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block', backgroundColor: '#f0f7ff', border: '1px solid #cce5ff', marginBottom: '0.5rem' }}>Manage Residents</Link>
                <Link to="/board/financials" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block', backgroundColor: '#f0f7ff', border: '1px solid #cce5ff', marginBottom: '0.5rem' }}>Financial Management</Link>
                <Link to="/board/arc" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block', backgroundColor: '#f0f7ff', border: '1px solid #cce5ff', marginBottom: '0.5rem' }}>ARC Approvals</Link>
                <Link to="/board/violations" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block', backgroundColor: '#f0f7ff', border: '1px solid #cce5ff' }}>Violations Management</Link>
              </>
            )}

            <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <Link to="/faq" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', textDecoration: 'none', display: 'block' }}>FAQ</Link>
              <div
                onClick={() => setHelpOpen(!helpOpen)}
                style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', color: 'hsl(215 15% 40%)', fontWeight: '500', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              >
                Help {helpOpen ? '▾' : '▸'}
              </div>
              {helpOpen && (
                <div style={{ marginLeft: '1rem', borderLeft: '2px solid #eee' }}>
                  <Link to="/help/tech" style={{ padding: '0.5rem 1rem', color: 'hsl(215 15% 40%)', fontSize: '0.9rem', textDecoration: 'none', display: 'block' }}>Tech Support</Link>
                  <Link to="/help/hoa" style={{ padding: '0.5rem 1rem', color: 'hsl(215 15% 40%)', fontSize: '0.9rem', textDecoration: 'none', display: 'block' }}>HOA Team</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid #eee' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#888', cursor: 'pointer' }}>{user.role}</div>
              </Link>
            </div>
            <button onClick={logout} className="btn" style={{ border: '1px solid #ddd', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => login('resident')} className="btn btn-primary" style={{ width: '100%' }}>Login Resident</button>
            <button onClick={() => login('board')} className="btn" style={{ border: '1px solid #ddd', width: '100%' }}>Login Board</button>
          </div>
        )}
      </div>
    </nav>
  );
};

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <div className="container" style={{ marginTop: '2rem', textAlign: 'center' }}>
    <h2>Please Login</h2>
    <p>Select a role in the sidebar to simulate login.</p>
  </div>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'hsl(210 20% 98%)' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
            <Routes>
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/maintenance" element={<PrivateRoute><Maintenance /></PrivateRoute>} />
              <Route path="/ledger" element={<PrivateRoute><Ledger /></PrivateRoute>} />
              <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
              <Route path="/directory" element={<PrivateRoute><Directory /></PrivateRoute>} />
              <Route path="/violations" element={<PrivateRoute><Violations /></PrivateRoute>} />
              <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
              <Route path="/elections" element={<PrivateRoute><Elections /></PrivateRoute>} />
              <Route path="/elections/new" element={<PrivateRoute><CreateElection /></PrivateRoute>} />
              <Route path="/elections/:id" element={<PrivateRoute><ElectionDetail /></PrivateRoute>} />
              <Route path="/visitors" element={<PrivateRoute><Visitors /></PrivateRoute>} />
              <Route path="/faq" element={<PrivateRoute><FAQ /></PrivateRoute>} />
              <Route path="/help/tech" element={<PrivateRoute><TechSupport /></PrivateRoute>} />

              <Route path="/help/hoa" element={<PrivateRoute><HOASupport /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/board/residents" element={<PrivateRoute><ManageResidents /></PrivateRoute>} />
              <Route path="/board/financials" element={<PrivateRoute><Financials /></PrivateRoute>} />
              <Route path="/arc" element={<PrivateRoute><ARCRequests /></PrivateRoute>} />
              <Route path="/board/arc" element={<PrivateRoute><BoardARC /></PrivateRoute>} />
              <Route path="/board/violations" element={<PrivateRoute><BoardViolations /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
