import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock useAuth
const mockUser = {
    name: "Test User",
    role: "resident",
    community: {
        modules_enabled: {
            visitors: false,
            documents: true,
            elections: false,
            violations: true
        }
    }
};

vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: () => ({
            user: mockUser,
            logout: vi.fn(),
            loading: false
        })
    };
});

describe('Sidebar Integration', () => {
    test('renders only enabled modules', () => {
        render(
            <BrowserRouter>
                <Sidebar />
            </BrowserRouter>
        );

        // Documents should be visible
        expect(screen.getByText('Documents')).toBeInTheDocument();

        // Violations should be visible
        expect(screen.getByText('Violations')).toBeInTheDocument();

        // Visitors should NOT be visible
        expect(screen.queryByText('Visitors')).not.toBeInTheDocument();

        // Elections should NOT be visible
        expect(screen.queryByText('Elections')).not.toBeInTheDocument();
    });
});
