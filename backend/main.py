from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.documents import router as documents_router
from backend.maintenance import router as maintenance_router
from backend.finance import router as finance_router
from backend.community import router as community_router, info as community_info
from backend.user import router as user_router
from backend.community import visitors as visitors_router
from backend.compliance import router as compliance_router
from backend.property import router as property_router
from backend.violations import router as violations_router
from backend.calendar import router as calendar_router
from backend.documents import router as documents_router
from backend.voting import router as voting_router

app = FastAPI(title="ESNTES HOA API", version="0.1.0")

# Setup Logging
from backend.core.logging import setup_logging
setup_logging()

# Create Database Tables
from backend.core.database import engine, Base
# Import models to ensure they are registered with Base
from backend.documents import models as document_models
from backend.voting import models as voting_models
from backend.vendor import models as vendor_models # Register Vendors
from backend.communication import models as communication_models # Register Communication
from backend.community import models as community_models # Register Community
Base.metadata.create_all(bind=engine)

# CORS Configuration
origins = [
    "http://localhost:5173",  # React Frontend
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://main.d1h71bpojat3kb.amplifyapp.com",  # Production Frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents_router.router, prefix="/api/communities", tags=["documents"])
app.include_router(maintenance_router.router, prefix="/api/communities", tags=["maintenance"])
app.include_router(finance_router.router, prefix="/api/communities", tags=["finance"])
app.include_router(community_router.router, prefix="/api/community", tags=["community"])
app.include_router(community_info.router, prefix="/api/community-info", tags=["community-info"])
app.include_router(visitors_router.router, prefix="/api/visitors", tags=["visitors"])
app.include_router(compliance_router.router, prefix="/api/compliance", tags=["compliance"])
app.include_router(user_router.router, prefix="/api/user", tags=["user"])
app.include_router(property_router.router, prefix="/api/communities", tags=["property"])
app.include_router(violations_router.router, prefix="/api/communities", tags=["violations"])
app.include_router(calendar_router.router, prefix="/api/communities", tags=["calendar"])

from backend.communication import router as communication_router
app.include_router(communication_router.router, prefix="/api/communication", tags=["communication"])
app.include_router(voting_router.router, prefix="/api/voting", tags=["voting"])

from backend.vendor import router as vendor_router
app.include_router(vendor_router.router, prefix="/api/vendors", tags=["vendors"])

from backend.finance import payment_router
app.include_router(payment_router.router, prefix="/api/payments", tags=["payments"])

from backend.dashboard import router as dashboard_router
app.include_router(dashboard_router.router, prefix="/api/dashboard", tags=["dashboard"])

from backend.admin import router as admin_router
app.include_router(admin_router.router, prefix="/api/admin", tags=["admin"])

from backend.auth import router as auth_router
app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])

@app.get("/health")
async def health_check_root():
    return {"status": "ok"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Service is healthy"}

@app.get("/")
async def root():
    return {"message": "Welcome to ESNTES HOA Management API"}
