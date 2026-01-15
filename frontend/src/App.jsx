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
import AdminDashboard from './pages/AdminDashboard';

import Sidebar from './components/Sidebar';

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
          <div style={{ flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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

                {/* Super Admin Route - Handles its own auth */}
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
