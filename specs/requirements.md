# Phase 7 Requirements: Onboarding & Mass Communications

## 1. Overview
Phase 7 focuses on "Priority Release" features to enhance community engagement and system administration. The key pillars are Mass Communications, Secure Scaling (Infrastructure), and Enhanced Security.

## 2. Mass Communications
**Objective**: Unified platform for disseminating information to the community via Email and SMS.

### Functional Requirements
- **Template Management**:
  - CRUD operations for message templates.
  - Support for Rich Text (HTML) and dynamic placeholders (e.g., `{{first_name}}`, `{{balance}}`).
- **Campaign Management**:
  - Schedule blasts for immediate or future delivery.
  - **Audience Filtering**:
    - By Role (Owner, Tenant, Board).
    - By Status (Delinquent, Has Violation).
  - **Failed Email Management**:
    - Admins can view list of failed emails per campaign or globally for their community.
    - Retry mechanism: "Retry All Failed" or individual retry.
    - Super Admins can view/retry for any specific community.
- **Delivery**:
  - Support generic Email and SMS channels.
  - Background processing for reliability (non-blocking).
- **Reporting**:
  - Dashboard showing Send/Delivered/Failed/Opened counts.
  - Detailed logs per campaign.

## 3. Infrastructure & Secure Storage
**Objective**: Scalable foundation for files and background tasks.

### Functional Requirements
- **Background Scheduler**:
  - Implement `APScheduler` to poll the database for pending emails.
  - "Fire and Forget" experience: User clicks send, system queues messages, background job handles delivery.
- **Secure File Storage (S3)**:
  - Replace local file storage with S3-compatible object storage.
  - Use Presigned URLs for secure uploads and downloads (Direct-to-S3 pattern).
  - RBAC enforcement: Access to files must be checked against user permissions before generating URLs.

## 4. Enhanced Security (MFA)
**Objective**: Protect high-privilege accounts.

### Functional Requirements
- **Multi-Factor Authentication (MFA)**:
  - Time-based One-Time Password (TOTP) standard (Google Authenticator compatible).
  - Backup codes for account recovery.
  - Optional for Residents, Enforced for Board/Admins (Configurable).
- **Login Flow**:
  - Enhance login to support a 2-step challenge if MFA is enabled.

## 5. Onboarding
**Objective**: Streamline the setup process for new communities/admins.

### Functional Requirements
- **"Get Started" Wizard**:
  - Step-by-step UI to configure Community Settings, Branding, and Invite initial Board members.
- **Progress Tracking**:
  - persist completion state of onboarding steps.
