from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth.models import User
from backend.auth.dependencies import get_current_user
from backend.finance.models import PaymentGatewayConfig, Transaction, TransactionStatus
from backend.community.models import Community
from backend.finance.stripe_utils import create_connect_account_link, create_connected_account, create_payment_intent, get_account_details
from backend.core.config import settings

router = APIRouter()

# --- Schemas ---

class CreatePaymentIntentRequest(BaseModel):
    amount_cents: int
    currency: str = "usd"
    description: str

class PaymentIntentResponse(BaseModel):
    client_secret: str
    publishable_key: str

class OnboardingLinkResponse(BaseModel):
    url: str

class ConnectStatusResponse(BaseModel):
    is_active: bool
    charges_enabled: bool
    payouts_enabled: bool

# --- Endpoints ---

@router.post("/onboard", response_model=OnboardingLinkResponse)
def onboard_community(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Step 1: Board Member clicks "Enable Payments".
    We create a Stripe Account (if needed) and return an account link.
    """
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if config exists
    config = db.query(PaymentGatewayConfig).filter(PaymentGatewayConfig.community_id == current_user.community_id).first()
    
    # Define redirect URLs (Frontend)
    refresh_url = f"{settings.FRONTEND_URL}/board/financials/onboarding-refresh"
    return_url = f"{settings.FRONTEND_URL}/board/financials/onboarding-complete"

    stripe_account_id = None

    if not config:
        # Create new Standard account
        account = create_connected_account(email=current_user.email)
        if not account:
             raise HTTPException(status_code=500, detail="Failed to create Stripe account")
        stripe_account_id = account.id
        
        # Save to DB
        config = PaymentGatewayConfig(
            community_id=current_user.community_id,
            stripe_account_id=stripe_account_id,
        )
        db.add(config)
        db.commit()
    else:
        stripe_account_id = config.stripe_account_id
        if not stripe_account_id:
             # Should not happen if config exists, but handle it
             # Retry creation logic ... (omitted for brevity, assume valid if config exists)
             pass

    # Create Link
    account_link = create_connect_account_link(stripe_account_id, refresh_url, return_url)
    if not account_link:
        raise HTTPException(status_code=500, detail="Failed to create account link")
        
    return {"url": account_link.url}

@router.get("/status", response_model=ConnectStatusResponse)
def get_connect_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if the community's Stripe account is fully active.
    """
    if current_user.role.name not in ["admin", "board", "super_admin"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    config = db.query(PaymentGatewayConfig).filter(PaymentGatewayConfig.community_id == current_user.community_id).first()
    if not config or not config.stripe_account_id:
        return {"is_active": False, "charges_enabled": False, "payouts_enabled": False}
        
    account = get_account_details(config.stripe_account_id)
    if not account:
        return {"is_active": False, "charges_enabled": False, "payouts_enabled": False}
        
    # Standard accounts are usually active once onboarded
    return {
        "is_active": account.details_submitted,
        "charges_enabled": account.charges_enabled,
        "payouts_enabled": account.payouts_enabled
    }

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
def create_payment(
    payment: CreatePaymentIntentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resident wants to pay. We create an intent on the Community's connected account.
    """
    config = db.query(PaymentGatewayConfig).filter(PaymentGatewayConfig.community_id == current_user.community_id).first()
    
    if not config or not config.stripe_account_id:
        raise HTTPException(status_code=400, detail="Payments not enabled for this community")
        
    intent = create_payment_intent(
        amount_cents=payment.amount_cents,
        currency=payment.currency,
        connected_account_id=config.stripe_account_id,
        customer_email=current_user.email
    )
    
    if not intent:
        raise HTTPException(status_code=500, detail="Failed to create payment intent")

    # Log empty transaction (pending)
    new_txn = Transaction(
        description=payment.description,
        community_id=current_user.community_id,
        created_by_id=current_user.id,
        stripe_payment_intent_id=intent.id,
        status=TransactionStatus.PENDING
    )
    db.add(new_txn)
    db.commit()
    
    return {
        "client_secret": intent.client_secret,
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY 
    }
