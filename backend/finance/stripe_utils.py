import stripe
from backend.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

def create_connect_account_link(account_id: str, refresh_url: str, return_url: str):
    """
    Creates an account link for the user to onboard with Stripe Connect.
    """
    try:
        return stripe.AccountLink.create(
            account=account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
    except Exception as e:
        print(f"Error creating account link: {e}")
        return None

def create_connected_account(email: str):
    """
    Creates a new Standard Connect account.
    """
    try:
        return stripe.Account.create(
            type="standard",
            email=email,
        )
    except Exception as e:
        print(f"Error creating connected account: {e}")
        return None

def create_payment_intent(amount_cents: int, currency: str, connected_account_id: str, customer_email: str):
    """
    Creates a PaymentIntent on the connected account (Direct Charge).
    """
    try:
        return stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=currency,
            automatic_payment_methods={"enabled": True},
            receipt_email=customer_email,
            stripe_account=connected_account_id, # Direct charge
        )
    except Exception as e:
        print(f"Error creating payment intent: {e}")
        return None

def get_account_details(account_id: str):
    try:
        return stripe.Account.retrieve(account_id)
    except Exception as e:
        return None
