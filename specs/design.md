## 1. Architecture Overview
The system uses a **simpler, database-backed** architecture for reliability without the complexity of Redis.

```mermaid
graph TD
    Client[Frontend] --> API[FastAPI Backend]
    API --> DB[(PostgreSQL)]
    
    subgraph "Background Processing (In-App)"
        Scheduler[APScheduler]
        Scheduler -.->|Polls every 1 min| DB
        Scheduler --> SMTP[Email Service]
    end
    
    API -.-> S3[Object Storage (Presigned URLs)]
```

## 2. Module Design

### 2.1 Mass Communications
**Design Pattern**: Database Queue + Batch Polling.
- **Entities**:
  - `MessageTemplate`: Stores HTML content.
  - `Campaign`: Stores audience logic and status.
  - `EmailQueue`: New table acting as the "Job Queue".
    - Columns: `id`, `recipient_email`, `subject`, `body`, `status` (PENDING, SENT, FAILED, RETRY), `attempts`.
- **Flow**:
  1. **Schedule**: Admin creates Campaign -> API inserts rows into `EmailQueue` (Status: PENDING) -> Returns "Scheduled".
  2. **Process**: `APScheduler` runs `process_email_queue()` job every 1 minute.
     - Selects batch of 50 PENDING records.
     - Sends Emails via SMTP.
     - Updates status to SENT or FAILED.

### 2.2 Secure Storage (S3)
**Design Pattern**: Adapter Pattern (`StorageInterface` -> `S3Adapter`).
- **Flow**:
  1. **Upload**: Client requests presigned POST URL -> Server verifies perms -> Client POSTs file to S3.
  2. **Download**: Client requests file URL -> Server verifies perms -> Server generates short-lived presigned GET URL.

### 2.3 Security (MFA)
- **Library**: `pyotp` for TOTP generation/verification.
- **Flow**:
  - Login returns `200 OK` or `403 MFA_REQUIRED`.
  - Client validates OTP via secondary endpoint.

## 3. Technology Stack Additions
- **APScheduler**: Lightweight in-process task scheduler.
- **Boto3**: AWS SDK for S3.
- **Tenacity**: Retry logic for SMTP calls.

## 4. Testing Strategy (BDD)
- **Unit**: Mock `APScheduler` and `SMTP`. Test `process_email_queue` logic.
- **E2E**:
  - **Scenario**: Send Campaign
    - Given Admin creates campaign
    - Then 100 rows appear in `EmailQueue`
    - When Scheduler Tick triggers
    - Then `EmailQueue` rows update to SENT
