import React, { useState } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

    const tiers = [
        {
            name: 'Starter',
            units: 'Up to 20 units',
            price: 0,
            description: 'Perfect for small communities just getting started.',
            features: ['Basic Modules included', '3 Admin Users', 'Community Support']
        },
        {
            name: 'Growth',
            units: 'Up to 50 units',
            price: 50,
            description: 'Growing neighborhoods needing more robust management.',
            features: ['Basic Modules included', 'Unlimited Admins', 'Priority Support']
        },
        {
            name: 'Professional',
            units: 'Up to 100 units',
            price: 90,
            description: 'established communities streamlining operations.',
            features: ['Basic Modules included', 'Unlimited Admins', 'Priority Support']
        },
        {
            name: 'Enterprise',
            units: 'Up to 150 units',
            price: 120,
            description: 'Large scale operations with complex needs.',
            features: ['Basic Modules included', 'Unlimited Admins', 'Dedicated Manager']
        },
        {
            name: 'Premium',
            units: 'Up to 200 units',
            price: 150,
            description: 'Maximum capacity for thriving large communities.',
            features: ['Basic Modules included', 'Unlimited Admins', 'Dedicated Manager']
        }
    ];

    const standardModules = [
        "Documents & Storage",
        "ARC Requests",
        "Calendar & Events",
        "Violations Management"
    ];

    const extraModules = [
        "Digital Elections",
        "Financial Management",
        "Community Website"
    ];

    const getPrice = (price) => {
        if (price === 0) return 'Free';
        if (billingCycle === 'yearly') {
            return `$${price * 10}`; // 10 months for yearly
        }
        return `$${price}`;
    };

    const getPeriod = () => {
        if (billingCycle === 'yearly') return '/year';
        return '/month';
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', color: '#1e293b', paddingBottom: '6rem' }}>
            {/* Header */}
            <section style={{ backgroundColor: '#1e293b', color: 'white', padding: '6rem 2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>Simple, Transparent Pricing</h1>
                <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that fits your community size. No hidden fees.
                </p>

                {/* Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                    <span style={{ color: billingCycle === 'monthly' ? 'white' : '#94a3b8', fontWeight: '600' }}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        style={{
                            width: '3.5rem',
                            height: '1.75rem',
                            backgroundColor: '#3b82f6',
                            borderRadius: '999px',
                            position: 'relative',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <div style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '0.25rem',
                            left: billingCycle === 'monthly' ? '0.25rem' : 'calc(100% - 1.5rem)',
                            transition: 'left 0.2s'
                        }} />
                    </button>
                    <span style={{ color: billingCycle === 'yearly' ? 'white' : '#94a3b8', fontWeight: '600' }}>Yearly <span style={{ fontSize: '0.8rem', color: '#4ade80', marginLeft: '0.5rem' }}>(Save ~20%)</span></span>
                </div>
            </section>

            {/* Pricing Grid */}
            <div style={{ maxWidth: '1200px', margin: '-4rem auto 0', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {tiers.map((tier) => (
                    <div key={tier.name} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{tier.name}</h3>
                            <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>{tier.units}</div>
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>{getPrice(tier.price)}</span>
                            {tier.price > 0 && <span style={{ color: '#64748b' }}>{getPeriod()}</span>}
                        </div>
                        <p style={{ color: '#64748b', marginBottom: '2rem', flex: 1 }}>{tier.description}</p>

                        <div style={{ marginBottom: '2rem' }}>
                            {tier.features.map((feature) => (
                                <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <Check size={18} color="#10b981" />
                                    <span style={{ fontSize: '0.95rem' }}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <Link to="/setup" style={{ backgroundColor: tier.price === 0 ? '#f1f5f9' : '#0066cc', color: tier.price === 0 ? '#1e293b' : 'white', padding: '0.875rem', borderRadius: '0.5rem', textAlign: 'center', fontWeight: '600', textDecoration: 'none', transition: 'all 0.2s', border: tier.price === 0 ? '1px solid #e2e8f0' : 'none' }}>
                            {tier.price === 0 ? 'Start for Free' : 'Get Started'}
                        </Link>
                    </div>
                ))}
            </div>

            {/* Modules Section */}
            <section style={{ maxWidth: '1000px', margin: '6rem auto 0', padding: '0 2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Included Modules</h2>
                    <p style={{ color: '#64748b' }}>All plans come with these core features to keep your community running smoothly.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '6rem' }}>
                    {standardModules.map((mod) => (
                        <div key={mod} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: '#334155' }}>{mod}</div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add-on Modules</h2>
                    <p style={{ color: '#64748b' }}>Premium capabilities available as add-ons. Contact sales for bundled pricing.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    {extraModules.map((mod) => (
                        <div key={mod} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #cbd5e1', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>{mod}</div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Advanced Feature</div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '4rem', padding: '2rem', backgroundColor: '#eff6ff', borderRadius: '1rem', border: '1px solid #bfdbfe', display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
                    <HelpCircle color="#2563eb" size={32} style={{ flexShrink: 0 }} />
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.5rem' }}>Payment Processing Fees</h4>
                        <p style={{ color: '#1e3a8a', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            Financial Management module includes payment processing. Usage fees apply per transaction based on the payment provider (typically 2.9% + 30¢ for cards), or a default 3% convenience fee is applied to transactions if handled by us.
                        </p>
                    </div>
                </div>

            </section>
        </div>
    );
}
