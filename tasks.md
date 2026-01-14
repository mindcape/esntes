# Project Tasks & Roadmap

## 1. Core Features (Completed)
- [x] **Authentication & Roles**: Secure login for Residents and Board members.
- [x] **User Profiles**: Contact info editing and granular Communication Preferences (Email vs Paper).
- [x] **Community Directory**: Opt-in privacy settings, Resident/Board views, and Board administration.
- [x] **Resident Financials**: Personal ledger view and payment integration.
- [x] **Board Financials**: Automated assessments, late fee generation, and delinquency tracking.
- [x] **Financial Reporting**: Real-time Balance Sheet, Income Statement, and Budget Variance reports.
- [x] **System Documentation**: Backend and Frontend Development Plans created.

## 2. Phase 1: Property & Vendor Management (Planned)
### ARC & Maintenance Approvals
- [x] **Backend**: Implement models for ARC Requests, Work Orders, and Vendor Bids.
- [x] **Frontend**: Create Resident submission form with required fields and validations.
- [x] **Frontend**: Create Board Kanban view for tracking approvals.
- [ ] **Frontend**: Implement Vendor Bid comparison and voting interface.

### Vendor Management
- [ ] **Backend**: Implement Vendor registry, COI/W9 tracking, and AP logic.
- [ ] **Frontend**: Create Vendor Dashboard with search/filter.
- [ ] **Frontend**: Build Document Vault for compliance certificates.
- [ ] **Frontend**: Implement automated alerts for expiring insurance.

### Violations & Compliance
- [x] **Backend**: Implement Violation model and logging endpoints.
- [x] **Frontend**: Board interface to add/track violations with search/filter.
- [x] **Frontend**: Resident interface to view violations (Read-Only + Pay).

### Community Calendar
- [x] **Backend**: Implement Event CRUD endpoints.
- [x] **Frontend**: Calendar view with "Add Event" modal for Board/Mgmt.

## 3. Phase 2: Governance & Transparency (Planned)
### Digital Voting & Elections
- [x] **Backend**: Design Election, Ballot, and Vote models (Secret Ballot logic).
- [x] **Backend**: Implement Voting Rules (Quorum, One Vote per Unit, Eligibility).
- [x] **Frontend**: Build Election Dashboard (Active, Upcoming, Past).
- [x] **Frontend**: Create Candidate Profile pages with bios and platform statements.
- [x] **Frontend**: Implement Secure Voting Interface (Anonymity assurance).
- [x] **Frontend**: Build Live Election Results Dashboard (Real-time graphs/counts).

### Secure Document Storage
- [x] **Backend**: Implement RBAC for documents (Public vs Board Only).
- [x] **Backend**: Implement persistence (replace mock data with JSON/SQLite).
- [x] **Backend**: Enable file upload/delete functionality for Board.
- [x] **Frontend**: Create Document Explorer with Folder/Category view.
- [x] **Frontend**: Build Board Document Management interface (Upload/Edit/Delete).

## 4. Phase 3: Communication & Engagement (Planned)
- [ ] **Backend**: Implement Mass messaging (Email/SMS/Push) and Segmentation.
- [ ] **Frontend**: Build Campaign Composer with rich text editor.
- [ ] **Frontend**: Create Unified Community Calendar.
