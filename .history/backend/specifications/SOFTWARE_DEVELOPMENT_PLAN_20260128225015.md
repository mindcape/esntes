# Software Development Plan

## 1. Introduction
This document outlines the software development plan for the ESNTES HOA management portal. The text details specifications for upcoming modules including ARC Approvals, Vendor Management, Governance, and Multi-Channel Communications.

## 2. Feature Specifications

### 2.0. Core Features (Implemented)
**Objective**: Fundamental system operations for user management and community visibility.

**User Management & Profiles**:
-   **Authentication**: Secure login with Role-Based Access Control (RBAC) (Resident vs Board).
-   **Profile Management**:
    -   Residents can update contact info (Email, Phone, Mailing Address).
    -   **Communication Preferences**:
        -   Granular control for Document Delivery (General, CCR, Collection, Billing).
        -   Enforced Mutually Exclusive selection (Email OR Paper).
        -   Opt-in for "Management Committee Notifications" and "Phone Communications".

**Community Directory**:
-   **Opt-In System**: Residents must explicitly opt-in to appear in the public directory.
-   **Board Visibility**: Separate section for Board Members.
-   **Board Administration**: "Manage Residents" view for Board to see ALL residents and their full preference breakdown.

**Core Financials**:
-   **Ledger**: Per-resident transaction history (Assessments, Payments, Fees).
-   **Automated Invoicing**:
    -   Endpoint to generate recurring monthly assessments for all residents.
    -   Endpoint to scan for delinquencies and apply late fees.
-   **Real-Time Reporting**:
    -   Board access to generated Balance Sheet, Income Statement, and Budget Variance reports.

**Data Models (Existing)**:
-   `User`: `id`, `name`, `email`, `role`, `mailing_address`, `preferences` (JSON/Object).
-   `CommunicationPreferences`: `general_email`, `general_paper`, `ccr_email`, `ccr_paper`, ...
-   `DirectoryProfile`: `id`, `name`, `address`, `contact_info`, `is_opted_in`.
-   `Transaction`: `id`, `date`, `description`, `amount`, `type` (Assessment, Payment, Fine), `balance_after`.
-   `Delinquency`: `resident_id`, `balance`, `days_overdue`.

### 2.1. ARC & Maintenance Approvals
**Objective**: Streamline the review interaction between residents, the board, and vendors for architectural changes and community maintenance.

**Functional Requirements**:
-   **Resident Submission**: Interface for residents to submit Architectural Review Committee (ARC) requests with attachments (plans, photos).
-   **Board Dashboard**: Kanban or list view for the Board to track request status (Pending, Under Review, Approved, Denied).
-   **Vendor Integration**:
    -   Ability to create Maintenance Work Orders from approved ARC requests or general issues.
    -   Vendor Bid Portal: Allow invited vendors to upload bids for specific work orders.
    -   Board Vote on Bids: Mechanism for board members to select a winning bid.

**Data Models**:
-   `ARCRequest`: `id`, `resident_id`, `description`, `status` (enum), `attachments` (list).
-   `WorkOrder`: `id`, `description`, `assigned_vendor_id`, `status` (Open, In Progress, Completed), `budget`.
-   `VendorBid`: `id`, `work_order_id`, `vendor_id`, `amount`, `document_url`, `status` (Submitted, Accepted, Rejected).

### 2.2. Vendor Management
**Objective**: specific administrative tools to manage vendor relationships, compliance, and payments.

**Functional Requirements**:
-   **Centralized Repository**: Store vendor contracts, insurance certificates (COI), and W-9 forms.
-   **Compliance Tracking**: Automated alerts for expiring insurance policies.
-   **Accounts Payable (AP)**:
    -   Process electronic payments to vendors.
    -   Integration with ledger for automatic expense categorization.
-   **Tax Automation**: Summarize payments for automated 1099 form generation at fiscal year-end.

**Data Models**:
-   `Vendor`: `id`, `name`, `contact_info`, `tax_id`, `payment_terms`.
-   `VendorDocument`: `id`, `vendor_id`, `type` (Contract, COI, W9), `url`, `expiration_date`.
-   `Payment`: `id`, `vendor_id`, `amount`, `date`, `method`, `status`.

### 2.3. Governance & Transparency
**Objective**: Enable secure, democratic decision-making and provide easy access to governing documents.

**Functional Requirements**:
-   **Digital Voting & Surveys**:
    -   **Secret Ballots**: Cryptographically secure voting for board elections.
    -   **Community Polls**: Non-binding surveys for rule changes or amenities.
    -   **Real-time Results**: Live tallying (hidden until polls close for elections).
    -   **Quorum Tracking**: Automatic calculation of participation against quorum requirements.
-   **Secure Document Storage**:
    -   Cloud-based file system structure (folders/files).
    -   **Role-Based Access Control (RBAC)**:
        -   *Public*: Bylaws, Rules (Visible to all residents).
        -   *Board Only*: Executive session minutes, delinquency reports.
        -   *Resident Uploads*: Designated drop-zones for residents to submit required forms.

**Data Models**:
-   `Election`: `id`, `title`, `start_date`, `end_date`, `quorum_required`, `status`.
-   `Ballot`: `id`, `election_id`, `user_id` (hashed/anonymized), `selections`.
-   `Document`: `id`, `title`, `url`, `category`, `access_level` (Public, Board, Admin).

### 2.4. Multi-Channel Communication
**Objective**: Unified platform for disseminating information to the community.

**Functional Requirements**:
-   **Mass Messaging**:
    -   Send blasts via Email, SMS, and Push Notification simultaneously.
    -   Segment audiences (e.g., "All Residents", "Building A", "Owners vs Renters").
-   **Templates**: Rich text editor for creating reusable newsletter templates.
-   **Unified Calendar**:
    -   Event creation (Meetings, Social, Maintenance).
    -   Sync with resident dashboards (Google Cal/iCal export).

**Data Models**:
-   `Announcement`: `id`, `title`, `content`, `channels` (list: email, sms, push), `target_audience`.
-   `MessageTemplate`: `id`, `name`, `html_content`.
-   `Event`: `id`, `title`, `start_time`, `end_time`, `location`, `type`.

### 2.5. Violations & Compliance (Phase 1)
**Objective**: Tools for the Board/Management to enforce community rules and for residents to resolve issues.

**Functional Requirements**:
-   **Violation Logging**: Board/Management can create a violation record (Citation).
    -   Select Resident/Property.
    -   Attach photos/evidence.
    -   Cite specific Bylaw/CC&R article.
    -   Set status: Warning, Fined, Resolved.
-   **Resident Notification**: Automated email/notification upon creation.
-   **Payment**: Residents can pay fines directly (integrated with Ledger).

**Data Models**:
-   `Violation`: `id`, `resident_id`, `date`, `description`, `bylaw_reference`, `status` (Open, Warning, Fined, Closed), `fine_amount`.

### 2.6. Community Calendar (Phase 1)
**Objective**: Shared calendar for community events, visible to all, managed by Board/Management.

**Functional Requirements**:
-   **Event Management**: Board/Management can Create/Edit/Delete events.
-   **Event Types**: Social, Board Meeting, Maintenance, Reservation.
-   **Audience**: Public (All residents) or Private (Board only).

**Data Models**:
-   `CalendarEvent`: `id`, `title`, `description`, `start_time`, `end_time`, `location`, `created_by` (User ID).

## 3. Technical Architecture Strategy
-   **Backend**: Python FastAPI.
-   **Database**: PostgreSQL (Migrations via Alembic).
-   **Frontend**: React (Vite) with Material UI or Tailwind.
-   **Security**:
    -   JWT Authentication for all actions.
    -   S3-compatible storage (Mio/AWS) for documents with pre-signed URLs for secure access.

## 4. Implementation phases
-   **Phase 1**: ARC & Vendor Management (Core Operations).
-   **Phase 2**: Governance (Voting & Docs) (Trust & Safety).
-   **Phase 3**: Communications (Engagement).
-   **Phase 4**: Documents & Storage Enhancements (S3-backed Document Vault, presigned uploads/downloads, per-community directory structure, RBAC).
-   **Phase 5**: Roles & Permissions (add Treasurer, Vice President; introduce granular role permissions and management UI).
-   **Phase 6**: Security Enhancements (MFA - TOTP with backup codes, secure storage of secrets, optional SMS; audit and recovery flows).
-   **Phase 7**: Onboarding & Template-based Mass Communications (Priority release).
    - Scope:
      - Add a "Get Started" onboarding flow for admins with steps for community setup, branding, inviting board members, and enabling modules.
      - Build a template-driven communications system: template CRUD, placeholders, audience filters (overdue dues, violations, board-only, custom), preview, scheduling, and delivery stats.
      - Implement background worker architecture (e.g., Celery + Redis) for reliable mass delivery and retries with audit logs.
      - Integrate document upload workflow to store files in S3 under `communities/{community_id}/...` with presigned URLs, metadata, and RBAC enforcement.
      - Extend role support to include Treasurer, Vice President, and enable permission-based checks across features.
      - Implement MFA (opt-in, TOTP + backup codes, admin enforcement option) and update auth/login flow to support second-factor verification.
    - Acceptance criteria:
      - Onboarding available and persisted per community; admins can complete or resume onboarding steps.
      - Communications templates support targeted sends (including overdue dues and violations filters), scheduling, preview, and provide delivery statistics and logs.
      - Documents are uploaded to S3 with presigned mechanisms; per-community directory segregation and RBAC are enforced.
      - New board roles can be created/assigned and permissions are enforced in key workflows (documents, finance, violations, communications).
      - MFA provisioning, verification, backup codes, and login enforcement operate end-to-end with proper security controls and rate limiting.
