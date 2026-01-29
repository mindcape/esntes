
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams } from 'react-router-dom';
import CommunitySettings from '../pages/CommunitySettings';
import { useAuth } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock dependencies
global.fetch = vi.fn();

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn()
    };
});

const mockUser = {
    email: 'admin@example.com',
    role: 'super_admin',
    full_name: 'Super Admin'
};

const mockCommunity = {
    id: 1,
    name: 'Pine Valley HOA',
    subdomain: 'pinevalley',
    modules_enabled: { calendar: true, violations: false },
    units_count: 150,
    address: '123 Pine St',
    poc_name: 'John Manager',
    poc_email: 'john@example.com',
    poc_phone: '555-1212',
    branding_settings: { primary_color: '#0066cc' }
};

describe('CommunitySettings Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser });
        useParams.mockReturnValue({ id: '1' });

        // Default fetch mock for community
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockCommunity
        });
    });

    it('renders community details', async () => {
        render(
            <BrowserRouter>
                <CommunitySettings />
            </BrowserRouter>
        );

        expect(await screen.findByText('Configure Pine Valley HOA')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Pine Valley HOA')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('switches tabs correctly', async () => {
        render(
            <BrowserRouter>
                <CommunitySettings />
            </BrowserRouter>
        );

        await screen.findByText('Configure Pine Valley HOA');

        // Click Modules tab
        fireEvent.click(screen.getByText('Modules'));
        expect(screen.getByText('calendar')).toBeInTheDocument();
        expect(screen.getByText('violations')).toBeInTheDocument();

        // Click Team tab
        fireEvent.click(screen.getByText('Team'));
        expect(screen.getByText('Step 2: Assign Site Admin')).toBeInTheDocument();
    });
});
