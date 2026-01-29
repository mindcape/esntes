
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock dependencies
global.fetch = vi.fn();

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

const mockResident = {
    email: 'resident@example.com',
    role: 'resident',
    full_name: 'John Resident',
    address: '123 Pine St'
};

const mockStats = {
    balance: 150.00,
    open_requests: 2,
    next_event: { date: '2023-12-25', title: 'Holiday Party' }
};

const mockCommunityInfo = {
    name: 'Pine Valley HOA',
    address: '123 Pine St',
    city_state_zip: 'Springfield, IL 62704',
    phone: '555-1212',
    email: 'contact@pinevalley.com'
};

describe('Resident Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('esntes_token', 'mock-token');
        useAuth.mockReturnValue({ user: mockResident });

        // Mock fetch routing
        global.fetch.mockImplementation((url) => {
            if (url.includes('/resident/stats')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockStats
                });
            }
            if (url.includes('/community-info/info')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockCommunityInfo
                });
            }
            if (url.includes('/community-info/board')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => []
                });
            }
            return Promise.resolve({ ok: false });
        });
    });

    it('renders resident dashboard', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        expect(await screen.findByText(/Welcome back, John Resident/i)).toBeInTheDocument();
        expect(screen.getByText('My Residence')).toBeInTheDocument();
        expect(screen.getByText('Current Balance')).toBeInTheDocument();
    });

    it('displays fetched stats', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('$150.00')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument(); // Open requests
            expect(screen.getByText('Holiday Party')).toBeInTheDocument();
        });
    });
});
