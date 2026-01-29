import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
import CommunitySettings from './pages/CommunitySettings';
import ManageVendors from './pages/ManageVendors';
import BoardWorkOrders from './pages/BoardWorkOrders';
import BoardAnnouncements from './pages/BoardAnnouncements';
import VendorDashboard from './pages/VendorDashboard';

import Login from './pages/Login';
import SetupAccount from './pages/SetupAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import Pricing from './pages/Pricing';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PublicLayout from './layouts/PublicLayout';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/setup" element={<SetupAccount />} />
            {/* Placeholders for links */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<ContactUs />} />
          </Route>

          {/* Private Routes */}
          <Route element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/directory" element={<ManageResidents />} />
            <Route path="/violations" element={<Violations />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/elections" element={<Elections />} />
            <Route path="/elections/new" element={<CreateElection />} />
            <Route path="/elections/:id" element={<ElectionDetail />} />
            <Route path="/visitors" element={<Visitors />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/help/tech" element={<TechSupport />} />
            <Route path="/help/hoa" element={<HOASupport />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/board/residents" element={<ManageResidents />} />
            <Route path="/board/financials" element={<Financials />} />
            <Route path="/arc" element={<ARCRequests />} />
            <Route path="/board/arc" element={<BoardARC />} />
            <Route path="/board/violations" element={<BoardViolations />} />
            <Route path="/board/vendors" element={<ManageVendors />} />
            <Route path="/board/work-orders" element={<BoardWorkOrders />} />
            <Route path="/board/announcements" element={<BoardAnnouncements />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/community/:id" element={<CommunitySettings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
