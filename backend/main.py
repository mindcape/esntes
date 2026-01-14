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

# Create Database Tables
from backend.core.database import engine, Base
# Import models to ensure they are registered with Base
from backend.documents import models as document_models
from backend.voting import models as voting_models
Base.metadata.create_all(bind=engine)

# CORS Configuration
origins = [
    "http://localhost:5173",  # React Frontend
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents_router.router, prefix="/api/documents", tags=["documents"])
app.include_router(maintenance_router.router, prefix="/api/maintenance", tags=["maintenance"])
app.include_router(finance_router.router, prefix="/api/finance", tags=["finance"])
app.include_router(community_router.router, prefix="/api/community", tags=["community"])
app.include_router(community_info.router, prefix="/api/community-info", tags=["community-info"])
app.include_router(visitors_router.router, prefix="/api/visitors", tags=["visitors"])
app.include_router(compliance_router.router, prefix="/api/compliance", tags=["compliance"])
app.include_router(user_router.router, prefix="/api/user", tags=["user"])
app.include_router(property_router.router, prefix="/api/property", tags=["property"])
app.include_router(violations_router.router, prefix="/api/violations", tags=["violations"])
app.include_router(calendar_router.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(voting_router.router, prefix="/api/voting", tags=["voting"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Service is healthy"}

@app.get("/")
async def root():
    return {"message": "Welcome to ESNTES HOA Management API"}
