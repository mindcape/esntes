import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, FileText, Vote, Users, CreditCard, Wrench, MessageSquare, Car } from 'lucide-react';

export default function LandingPage() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to={user.role === 'super_admin' ? '/admin' : '/dashboard'} replace />;
    }

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
            {/* Hero Section */}
            <section style={{ backgroundColor: 'white', padding: '6rem 2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.5rem', lineHeight: '1.1', background: 'linear-gradient(to right, #2563eb, #84cc16)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Community Management,<br />Simplified.
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                        The all-in-one platform for HOAs and Property Managers to streamline operations, enhance communication, and foster thriving communities.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/setup" style={{ backgroundColor: '#0066cc', color: 'white', padding: '1rem 2rem', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: '600', textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            Start Free Trial
                        </Link>
                        <Link to="/contact" style={{ backgroundColor: 'white', color: '#0066cc', border: '1px solid #e2e8f0', padding: '1rem 2rem', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: '600', textDecoration: 'none' }}>
                            Schedule Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" style={{ padding: '6rem 2rem', backgroundColor: '#f8fafc' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Everything you need to run your community</h2>
                        <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Powerful tools modularized to fit your specific needs.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <FeatureCard
                            icon={<FileText size={32} color="#0066cc" />}
                            title="Document Management"
                            description="Securely store and share meeting minutes, bylaws, and financial reports with role-based access control."
                        />
                        <FeatureCard
                            icon={<Vote size={32} color="#0066cc" />}
                            title="Digital Elections"
                            description="Conduct secure, transparent elections with automated quorum checks and real-time results."
                        />
                        <FeatureCard
                            icon={<Car size={32} color="#0066cc" />}
                            title="Visitor Management"
                            description="Streamline guest access with digital passes and arrival tracking."
                        />
                        <FeatureCard
                            icon={<CreditCard size={32} color="#0066cc" />}
                            title="Financials & Ledger"
                            description="Track payments, manage budgets, and generate financial reports effortlessly."
                        />
                        <FeatureCard
                            icon={<Shield size={32} color="#0066cc" />}
                            title="Violations & ARC"
                            description="Manage compliance and architectural requests with automated workflows and notifications."
                        />
                        <FeatureCard
                            icon={<Wrench size={32} color="#0066cc" />}
                            title="Maintenance Requests"
                            description="Track work orders from submission to completion with vendor management integration."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '6rem 2rem', backgroundColor: '#1e293b', color: 'white', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Ready to transform your community?</h2>
                <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                    Join thousands of thriving communities using Nibrr to build better neighborhoods.
                </p>
                <Link to="/setup" style={{ backgroundColor: 'white', color: '#1e293b', padding: '1rem 3rem', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none' }}>
                    Get Started Now
                </Link>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#f0f9ff', width: 'fit-content', padding: '0.75rem', borderRadius: '0.75rem' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{title}</h3>
            <p style={{ color: '#64748b', lineHeight: '1.5' }}>{description}</p>
        </div>
    );
}
