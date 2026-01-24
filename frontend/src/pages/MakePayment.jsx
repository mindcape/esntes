import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements, CardElement, useStripe, useElements
} from '@stripe/react-stripe-js';
import { API_URL } from '../config';

// Initialize Stripe (placeholder key for now, will come from backend ideally if dynamic)
// But for standard connect, we use platform key and 'stripeAccount' option.
// However, simplified approach: Backend returns client_secret + publishable_key.
// Logic: Fetch keys first.

const CheckoutForm = ({ amount, description, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) {
            return;
        }

        const cardElement = elements.getElement(CardElement);

        // 1. Create Payment Intent on Backend
        try {
            const res = await fetch(`${API_URL}/api/payments/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('esntes_token')}`
                },
                body: JSON.stringify({
                    amount_cents: Math.round(amount * 100), // Convert to cents
                    currency: 'usd',
                    description: description
                })
            });

            if (!res.ok) {
                throw new Error('Failed to initialize payment.');
            }

            const { client_secret } = await res.json();

            // 2. Confirm Card Payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card: cardElement,
                }
            });

            if (error) {
                setError(error.message);
                setProcessing(false);
            } else if (paymentIntent.status === 'succeeded') {
                onSuccess(paymentIntent);
                setProcessing(false);
            }

        } catch (err) {
            setError(err.message);
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <CardElement options={{
                    style: {
                        base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                        invalid: { color: '#9e2146' },
                    },
                }} />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            <button type="submit" disabled={!stripe || processing} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>
        </form>
    );
};

export default function MakePayment({ amount, description, onPaymentComplete }) {
    // We need to fetch the key first or hardcode platform key
    // For this demo, we assume platform pub key is constant
    // In production, fetch from /api/config or similar if dynamic
    // Using placeholder for now, user needs to update this in constants

    const [stripePromise] = useState(() => loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_test_placeholder'));

    return (
        <div className="card">
            <h3>Make a Payment</h3>
            <p><strong>{description}</strong></p>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Total: <strong>${amount.toFixed(2)}</strong></p>

            <Elements stripe={stripePromise}>
                <CheckoutForm amount={amount} description={description} onSuccess={onPaymentComplete} />
            </Elements>

            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                <span role="img" aria-label="lock">🔒</span> deeply secure payment via Stripe
            </div>
        </div>
    );
}
