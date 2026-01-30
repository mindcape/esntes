# Project Tasks & Roadmap

## 1. Core Features (Completed)
- [x] **Authentication & Roles**: Secure login for Residents and Board members.
- [x] **User Profiles**: Contact info editing and granular Communication Preferences (Email vs Paper).
- [x] **Community Directory**: Opt-in privacy settings, Resident/Board views, and Board administration.
- [x] **Resident Financials**: Personal ledger view and payment integration.
- [x] **Board Financials**: Automated assessments, late fee generation, and delinquency tracking.
- [x] **Financial Reporting**: Real-time Balance Sheet, Income Statement, and Budget Variance reports.
- [x] **System Documentation**: Backend and Frontend Development Plans created.
- [x] **Specs Organization**: Created `specs/` folder with `requirements.md` and `design.md`.

## 2. Phase 7: Onboarding & Mass Communications (Completed)
### Infrastructure & Security
- [x] **Backend**: Add dependencies (APScheduler, Boto3) to `requirements.txt`.
- [x] **Backend**: Update `docker-compose.yml` (Removed Redis).
- [x] **Backend**: Update `config.py` with S3 settings.
- [x] **Backend**: Implement `S3StorageAdapter` in `core/storage.py` and unit tests.
- [x] **Backend**: Implement `security_mfa.py` (TOTP logic).
- [x] **Backend**: Implement MFA Setup & Verify endpoints.
- [x] **Backend**: Update Login flow to support MFA challenge.

### Mass Communications
- [x] **Backend**: Create `EmailQueue`, `Campaign`, `Template` models.
- [x] **Backend**: Implement `init_scheduler` and `process_email_queue` job.
- [x] **Backend**: Create `CampaignService` and audience filtering logic.
- [x] **Backend**: Create Template CRUD endpoints.
- [x] **Backend**: Build Campaign Scheduler (API).
- [x] **Backend**: Implement Failed Email View & Retry endpoints.
- [x] **Frontend**: Build Template Editor (Integrated in Wizard).
- [x] **Frontend**: Create Campaign Wizard.
- [x] **Frontend**: Build Delivery Stats Dashboard with Retry UI.

### Community Onboarding
- [x] **Backend**: Create Community Settings & Branding endpoints.
- [x] **Frontend**: Build "Get Started" implementation flow.

### Resident Portal Enhancements
- [x] **Frontend**: Add "Quick Actions" and "Recent Activity" to Dashboard.
- [x] **Backend**: Update `/resident/stats` to return activity feed and actions.

## 3. Phase 8: Advanced Roles & Workflows
- [x] **Backend**: Seed `Treasurer`, `VP`, `Vendor` roles.
- [x] **Backend**: Secure Finance Endpoints (`pay_invoice`, `transactions`) for Treasurer.
- [x] **Backend**: Secure Violation Endpoints (`update_status`) for VP.
- [x] **Backend**: Enable Vendor Bidding (`add_bid`) for Vendor users.
