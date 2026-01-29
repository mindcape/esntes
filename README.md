# ESNTES HOA Management System

## Deployment Links
- **Frontend (Amplify)**: https://main.d1h71bpojat3kb.amplifyapp.com/
- **Backend (App Runner)**: https://3y2hmnpizb.us-east-1.awsapprunner.com/

## Configuration
Please check `.env` for configuration secrets. Do not commit secrets to this file.

## Setup
1. Backend: `pip3 install -r requirements.txt`
    source backend/venv/bin/activate
    uvicorn backend.main:app --reload --reload-dir=backend
2. Frontend: `npm install` 
    cd frontend
    npm run dev