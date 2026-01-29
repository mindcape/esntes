
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock AuthContext if needed, but integration test with Provider is better if possible.
// However, Login uses `login` function from context. We should mock the context value or fetch.
// Let's mock the global fetch for now.

global.fetch = vi.fn();

const MockLogin = () => (
    <BrowserRouter>
        <AuthProvider>
            <Login />
        </AuthProvider>
    </BrowserRouter>
);

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form', () => {
        render(<MockLogin />);
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument(); // Email input
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument(); // Password input
    });

    it('handles input changes', () => {
        render(<MockLogin />);
        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/Password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('displays error on failed login', async () => {
        // Mock 401 response
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: 'Incorrect email or password' })
        });

        render(<MockLogin />);
        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign in/i });

        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Incorrect email or password/i)).toBeInTheDocument();
        });
    });
});
