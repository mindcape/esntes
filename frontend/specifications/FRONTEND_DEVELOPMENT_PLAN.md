# Frontend Development Plan

## 1. Introduction
This document outlines the frontend specifications for the ESNTES HOA management portal. It complements the backend plan, focusing on UI/UX, component hierarchy, and user interactions for the new Board and Resident modules.

**Tech Stack**: React, Vite, CSS Modules (or scoped CSS), React Router.

## 2. Feature Specifications

### 2.0. Core Features (Implemented)
**Objective**: User-facing interfaces for profile management, directory access, and financial oversight.

**User Management (`/profile`)**:
-   **Profile Page**:
    -   Display of Identity (Name, Address, Status).
    -   Editable Form: Email, Phone, Mailing Address.
    -   **Communication Preferences Table**:
        -   Radio buttons for mutually exclusive Email/Paper choice per doc type.
        -   Checkboxes for additional notifications.

**Community Directory (`/directory`)**:
-   **Resident View**:
    -   Gallery grid of opted-in neighbors.
    -   Opt-in toggle mechanism.
-   **Board View**:
    -   See all board members.
-   **Manage Residents (`/board/residents`)**:
    -   Admin table listing ALL residents.
    -   Columns: Name, Contact, Communication Preference Icons (Email vs Paper).

**Financial Management & Reporting**:
-   **Resident Ledger (`/ledger`)**:
    -   Table of transactions (Date, Desc, Amount, Balance).
    -   "Pay Now" modal for balance settlement.
-   **Board Financials (`/board/financials`)**:
    -   **Actions Tab**:
        -   Buttons to trigger "Run Assessments" and "Assess Late Fees".
        -   Delinquency Table (Residents with overdue balances).
    -   **Reports Tab**:
        -   Balance Sheet (Assets/Liabilities/Equity).
        -   Income Statement (Revenue/Expenses) with Budget Variance highlighting.

**Implementation Details**:
-   **State**: `AuthContext` handles user session and role.
-   **Routes**: Protected via `PrivateRoute` component.

### 2.1. ARC & Maintenance Approvals
**Objective**: A visual interface for managing architectural change requests and work orders.

**User Roles & Views**:
-   **Resident View**:
    -   `NewARCRequest` (Form): Fields for description, contractor info, projected start date. Drag-and-drop zone for PDF/Image attachments.
    -   `MyRequests` (List): Status pill (Pending = Yellow, Approved = Green, Denied = Red).
-   **Board View (`/board/approvals`)**:
    -   **Kanban Board**: Columns for "New", "Under Review", "Awaiting Vendor Bid", "Ready for Vote", "Closed".
    -   **Card Detail Modal**: Click a card to view attachments, comments, and action buttons (Approve/Deny/Request Info).
    -   **Bid Comparison**: Side-by-side view of vendor bids for a specific work order with a "Select Winner" button.

**Key Components**:
-   `FileUploader`: Reusable drag-and-drop component.
-   `StatusBadge`: consistently customized status indicators.
-   `KanbanColumn`: Draggable container for request cards.

### 2.2. Vendor Management
**Objective**: Dashboard for managing vendor relationships and documents.

**Board View (`/board/vendors`)**:
-   **Vendor List Table**: Searchable/Filterable list. Columns: Name, Service Type, COI Status (Green/Red), W9 Status.
-   **Vendor Detail Page**:
    -   **Profile**: Contact info, Tax ID.
    -   **Document Vault**: List of files with expiry dates. "Upload New" button.
    -   **Payment History**: Table of past payments.
    -   **Action Panel**: "Initiate Payment", "Send Requirement Reminder".

**Key Components**:
-   `ExpiryAlert`: Visual warning component for expired insurance.
-   `DocumentList`: Row-based file explorer with download actions.

### 2.3. Governance & Transparency
**Objective**: Secure and clear interfaces for voting and document access.

**Routes**:
-   `/governance/vote`: Active elections.
-   `/governance/documents`: Shared drive interface.

**UI Specifications**:
-   **Digital Ballot**:
    -   **Candidate Profiles**: Card with photo, bio, and "Select" checkbox.
    -   **Review & Submit**: Modal summary before final casting (irreversible interaction).
    -   **Confirmation Screen**: Display unique confirmation hash/receipt.
-   **Results Dashboard**:
    -   **Live Charts**: Pie/Bar charts for poll results (only after election closes).
-   **Document Explorer**:
    -   **Folder Navigation**: breadcrumb-style navigation.
    -   **Permission Indicators**: "Board Only" icons on restricted folders.

### 2.4. Multi-Channel Communication
**Objective**: A simplified campaign manager for the Board.

**Board View (`/board/communications`)**:
-   **Campaign Composer**:
    -   **Channel Toggles**: "Email", "SMS", "Push".
    -   **Audience Selector**: Dropdown (All, Owners, Renters, Specific Building).
    -   **Rich Text Editor**: For email body.
    -   **Preview Modal**: Toggle between "Mobile Preview" and "Desktop Preview".
-   **Unified Calendar**:
    -   FullCalendar (or similar) implementation.
    -   Color-coded events (Social = Blue, Maintenance = Orange, Board Mtg = Purple).
    -   "Sync to my Calendar" button.

**Key Components**:
-   `RichTextEditor`: Wrapper around libraries like Quill or Draft.js.
-   `channelToggle`: Switch component with icons.

### 2.5. Violations & Compliance
**Board View (`/board/violations`)**:
-   **Violation Log**: Table view of all active violations.
-   **Log New Violation**: Form with:
    -   Resident Search.
    -   Violation Category Dropdown.
    -   Photo Upload.
    -   Action: "Send Warning" or "Issue Fine".

**Resident View (`/violations`)**:
-   **My Violations**: List of current and past issues (Read-Only).
-   **Actionable Items**: "Pay Fine" button (links to payment modal).

### 2.6. Community Calendar
**Route**: `/calendar` (View All), `/board/calendar` (Manage).

**UI Specifications**:
-   **Calendar View**: Monthly/Weekly grid (using `react-big-calendar` or similar).
-   **Add Event Modal** (Board/Mgmt Only):
    -   Title, Date/Time Range, Location.
    -   Entry form overlays the calendar view.
-   **Event Details**: Click event to see full description and location map.

## 3. Navigation Structure
Update `Sidebar` to include role-based sections:

**Resident**:
-   Dashboard
-   Financials (Personal)
-   ARC Requests
-   Directory
-   Governance (Vote/Docs)

**Board (Admin Section)**:
-   *Manage Residents*
-   *Financial Management* (Ledger, Reporting)
-   *Property & Maintenance* (ARC, Vendors)
-   *Governance Admin* (Create Election, Upload Docs)
-   *Communication Center*

## 4. State Management Strategy
-   **Context API**: Use `AuthContext` for user role (determining view access).
-   **Local State**: For form inputs and UI toggles (modals).
-   **Fetch/Cache**: Simple `useEffect` data fetching initially, potentially moving to React Query if complexity grows.
