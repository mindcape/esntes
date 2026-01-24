
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime
import enum

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
    
    transaction = relationship("Transaction", back_populates="entries")
    account = relationship("Account", back_populates="journal_entries")
