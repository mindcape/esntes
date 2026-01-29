
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum
from backend.auth.models import User

class AccountType(str, enum.Enum):
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # e.g. "1000"
    name = Column(String) # e.g. "Checking Account"
    type = Column(SQLEnum(AccountType))
    parent_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    description = Column(String, nullable=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, server_default="1")
    
    # Relationships
    children = relationship("Account", backref="parent", remote_side=[id])
    journal_entries = relationship("JournalEntry", back_populates="account")

class PaymentGatewayConfig(Base):
    __tablename__ = "payment_gateway_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, unique=True)
    stripe_account_id = Column(String, nullable=True) # Connected Account ID
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TransactionStatus(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    FAILED = "Failed"

class Transaction(Base):
    __tablename__ = "financial_transactions" # 'transactions' might be reserved in some DBs
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String)
    reference = Column(String, nullable=True) # e.g. Invoice #, Check #
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, server_default="1")
    
    # Payment Fields
    stripe_payment_intent_id = Column(String, nullable=True, index=True)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.COMPLETED)
    
    entries = relationship("JournalEntry", back_populates="transaction", cascade="all, delete-orphan")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, server_default="1")
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    description = Column(String, nullable=True) # Line item description
    
    # Sub-Ledger Link
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    transaction = relationship("Transaction", back_populates="entries")
    account = relationship("Account", back_populates="journal_entries")
    user = relationship("User")

class InvoiceStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    PAID = "Paid"
    REJECTED = "Rejected"

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    file_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.SUBMITTED)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    # Relationships
    vendor = relationship("Vendor")
    work_order = relationship("WorkOrder")
    community = relationship("Community")

