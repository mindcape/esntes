
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import { useAuth } from '../contexts/AuthContext';

// Mock dependencies
global.fetch = vi.fn();

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

const mockUser = {
    email: 'admin@example.com',
    role: 'super_admin',
    full_name: 'Super Admin'
};

const mockAuthValues = {
    user: mockUser,
    login: vi.fn(),
    logout: vi.fn(),
    verifyMfa: vi.fn()
};

const MockAdminDashboard = () => (
    <BrowserRouter>
        <AdminDashboard />
    </BrowserRouter>
);

describe('AdminDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue(mockAuthValues);
        global.fetch = vi.fn().mockImplementation((url) => {
            console.log("FETCH CALLED:", url);
            return Promise.resolve({
                ok: true,
                json: async () => []
            });
        });
    });

    it('renders dashboard for super_admin', async () => {
        render(<MockAdminDashboard />);
        expect(await screen.findByText(/Super Admin Dashboard/i)).toBeInTheDocument();
        // Use regex that matches the button specifically or role
        expect(screen.getByRole('button', { name: /\+ Onboard New Community/i })).toBeInTheDocument();
    });

    it('fetches and displays communities', async () => {
        const mockCommunities = [
            { id: 1, name: 'Pine Valley', address: '123 Pine St', units_count: 50, community_code: 'PV01' },
            { id: 2, name: 'Oak Ridge', address: '456 Oak St', units_count: 100, community_code: 'OR02' }
        ];

        // Override the default mock for this test
        global.fetch.mockImplementationOnce((url) => {
            console.log("FETCH MOCK OVERRIDE:", url);
            return Promise.resolve({
                ok: true,
                json: async () => mockCommunities
            });
        });

        render(<MockAdminDashboard />);

        expect(await screen.findByText('Pine Valley')).toBeInTheDocument();
        expect(screen.getByText('Oak Ridge')).toBeInTheDocument();
    });

    it('opens onboard modal on click', async () => {
        render(<MockAdminDashboard />);

        const onboardBtn = await screen.findByRole('button', { name: /\+ Onboard New Community/i });
        fireEvent.click(onboardBtn);

        expect(screen.getByText(/Community Details/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e.g. Pine Valley HOA/i)).toBeInTheDocument();
    });

    it('validates form inputs', async () => {
        const { container } = render(<MockAdminDashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /\+ Onboard New Community/i }));

        const createBtn = screen.getByRole('button', { name: /Create Community/i });

        // Fill partial invalid data
        // Use container to select by ID since we added ids to ensure we target the correct field
        const emailInput = container.querySelector('#poc_email');
        const phoneInput = container.querySelector('#poc_phone');

        if (!emailInput || !phoneInput) {
            throw new Error("Inputs not found");
        }

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.change(phoneInput, { target: { value: '123' } });

        const form = container.querySelector('form');
        fireEvent.submit(form);

        screen.debug(); // Inspect render after submit
        await waitFor(() => {
            expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
        });
    });
});
