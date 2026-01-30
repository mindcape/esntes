import pytest
from datetime import datetime, timedelta
from backend.auth.models import User, Role
from backend.community.models import Community
from backend.voting.models import Election, Vote, VoterRecord
from backend.vendor.models import Vendor, VendorDocument
from backend.main import app

@pytest.mark.asyncio
async def test_voting_full_flow(client, db_session):
    # 1. Setup
    community = Community(name="Voting Comm", modules_enabled={"elections": True})
    db_session.add(community)
    db_session.commit()
    
    # Roles
    if not db_session.query(Role).filter_by(name="board").first():
        db_session.add(Role(id=3, name="board"))
    if not db_session.query(Role).filter_by(name="resident").first():
        db_session.add(Role(id=1, name="resident"))
    db_session.commit()

    board = User(email="vote_board@test.com", full_name="Board Vote", community_id=community.id, role_id=3)
    res_a = User(email="vote_res_a@test.com", full_name="Res A", community_id=community.id, role_id=1)
    res_b = User(email="vote_res_b@test.com", full_name="Res B", community_id=community.id, role_id=1)
    db_session.add_all([board, res_a, res_b])
    db_session.commit()

    from backend.auth.dependencies import get_current_user
    
    # 2. Create Election (Board)
    app.dependency_overrides[get_current_user] = lambda: board
    election_data = {
        "title": "Board 2026",
        "description": "Elect new board",
        "start_date": (datetime.now() - timedelta(minutes=1)).isoformat(),
        "end_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "is_active": True,
        "election_type": "board",
        "allowed_selections": 1,
        "candidates": [
            {"name": "Candidate X", "bio": "Bio X"},
            {"name": "Candidate Y", "bio": "Bio Y"}
        ]
    }
    res = await client.post("/api/elections/", json=election_data)
    assert res.status_code == 200
    election_id = res.json()["id"]
    candidates = res.json()["candidates"]
    cand_x_id = candidates[0]["id"]
    cand_y_id = candidates[1]["id"]
    
    # 3. Vote (Res A -> X)
    app.dependency_overrides[get_current_user] = lambda: res_a
    vote_data = {"election_id": election_id, "candidate_ids": [cand_x_id]}
    res = await client.post("/api/elections/vote", json=vote_data)
    assert res.status_code == 200
    
    # 4. Double Vote Check (Res A -> Y)
    vote_data_2 = {"election_id": election_id, "candidate_ids": [cand_y_id]}
    res = await client.post("/api/elections/vote", json=vote_data_2)
    assert res.status_code == 400
    
    # 5. Vote (Res B -> X)
    app.dependency_overrides[get_current_user] = lambda: res_b
    vote_data_3 = {"election_id": election_id, "candidate_ids": [cand_x_id]}
    res = await client.post("/api/elections/vote", json=vote_data_3)
    assert res.status_code == 200
    
    # 6. Check Results (Board)
    app.dependency_overrides[get_current_user] = lambda: board
    res = await client.get(f"/api/elections/{election_id}/results")
    assert res.status_code == 200
    details = res.json()
    assert details["total_votes"] == 2
    
    
    # 7. End Election
    res = await client.post(f"/api/elections/{election_id}/end")
    assert res.status_code == 200
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_vendor_management(client, db_session):
    # 1. Setup
    community = Community(name="Vendor Comm")
    db_session.add(community)
    db_session.commit()
    
    # Roles
    if not db_session.query(Role).filter_by(name="board").first():
        db_session.add(Role(id=3, name="board"))
    if not db_session.query(Role).filter_by(name="resident").first():
        db_session.add(Role(id=1, name="resident"))
    db_session.commit()

    board = User(email="vendor_board@test.com", full_name="Board Vendor", community_id=community.id, role_id=3)
    resident = User(email="vendor_res@test.com", full_name="Res Vendor", community_id=community.id, role_id=1)
    db_session.add_all([board, resident])
    db_session.commit()
    
    from backend.auth.dependencies import get_current_user

    # 2. Board creates Vendor
    app.dependency_overrides[get_current_user] = lambda: board
    vendor_data = {"name": "Test Vendor", "phone": "1234567890", "category": "Plumbing"}
    res = await client.post("/api/vendors/", json=vendor_data)
    assert res.status_code == 200
    v_id = res.json()["id"]
    
    # 3. Add Document
    doc_data = {"type": "Contract", "title": "2024 Contract", "url": "http://s3/file.pdf"}
    res = await client.post(f"/api/vendors/{v_id}/documents", json=doc_data)
    assert res.status_code == 200
    
    # 3b. Update Vendor
    update_data = {"name": "Updated Vendor Inc"}
    res = await client.put(f"/api/vendors/{v_id}", json=update_data)
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Vendor Inc"
    
    # 4. Resident tries to access (Fail)
    app.dependency_overrides[get_current_user] = lambda: resident
    res = await client.get("/api/vendors/")
    assert res.status_code == 403
    
    res = await client.get(f"/api/vendors/{v_id}")
    assert res.status_code == 403
    
    # 5. Delete Vendor (Board)
    app.dependency_overrides[get_current_user] = lambda: board
    res = await client.delete(f"/api/vendors/{v_id}")
    assert res.status_code == 200
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_maintenance_bidding(client, db_session):
    # 1. Setup
    community = Community(name="Maint Comm")
    db_session.add(community)
    db_session.commit()
    
    # Roles
    if not db_session.query(Role).filter_by(name="board").first():
        db_session.add(Role(id=3, name="board"))
    if not db_session.query(Role).filter_by(name="vendor").first():
        db_session.add(Role(id=4, name="vendor"))
    db_session.commit()

    board = User(email="maint_board@test.com", full_name="Board Maint", community_id=community.id, role_id=3)
    vendor_user = User(email="maint_vendor@test.com", full_name="Vendor Maint", community_id=community.id, role_id=4)
    db_session.add_all([board, vendor_user])
    db_session.commit()
    
    # Create Vendor Profile
    vendor = Vendor(name="Maint Vendor Inc", community_id=community.id, user_id=vendor_user.id)
    db_session.add(vendor)
    db_session.commit()
    
    from backend.auth.dependencies import get_current_user

    # 2. Board creates Work Order
    app.dependency_overrides[get_current_user] = lambda: board
    wo_data = {"title": "Roof Leak", "estimated_cost": 1000.0} # Check schema
    # Use Maintenance Router WO endpoint?
    # backend/maintenance/router.py: /work-orders
    wo_data = {"title": "Roof Leak", "description": " leaking bad"}
    res = await client.post("/api/communities/work-orders", json=wo_data)
    assert res.status_code == 200
    wo_id = res.json()["id"]
    
    # 3. Vendor Bids
    app.dependency_overrides[get_current_user] = lambda: vendor_user
    bid_data = {"amount": 800.0, "notes": "Can fix today", "vendor_id": None} # Inferred
    res = await client.post(f"/api/communities/work-orders/{wo_id}/bids", json=bid_data)
    assert res.status_code == 200
    bid_id = res.json()["id"]
    
    # 4. Board Reviews Bids
    app.dependency_overrides[get_current_user] = lambda: board
    res = await client.get(f"/api/communities/work-orders/{wo_id}/bids")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["amount"] == 800.0
    
    # 5. Board Awards Bid
    res = await client.post(f"/api/communities/work-orders/{wo_id}/award/{bid_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "In Progress"
    assert res.json()["assigned_vendor_id"] == vendor.id
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_user_profile(client, db_session):
    # 1. Setup
    user = User(email="profile@test.com", full_name="Profile User", role_id=1)
    db_session.add(user)
    db_session.commit()
    
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user
    
    # 2. Get Profile
    res = await client.get("/api/user/profile")
    assert res.status_code == 200
    assert res.json()["preferences"]["general_email"] == False
    
    # 3. Update Profile
    update_data = {
        "phone": "555-1234",
        "preferences": {
            "general_email": True,
            "billing_paper": True
        }
    }
    res = await client.put("/api/user/profile", json=update_data)
    assert res.status_code == 200
    assert res.json()["phone"] == "555-1234"
    assert res.json()["preferences"]["general_email"] == True
    
    # 4. Verify Persistence
    res = await client.get("/api/user/profile")
    assert res.json()["phone"] == "555-1234"
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_finance_advanced(client, db_session):
    # 1. Setup
    community = Community(name="Fin Comm", monthly_assessment_amount=100.0, late_fee_amount=10.0)
    db_session.add(community)
    db_session.commit()
    
    # Roles
    if not db_session.query(Role).filter_by(name="board").first():
        db_session.add(Role(id=3, name="board"))
    if not db_session.query(Role).filter_by(name="resident").first():
        db_session.add(Role(id=1, name="resident"))
    db_session.commit()

    board = User(email="fin_board@test.com", full_name="Board Fin", community_id=community.id, role_id=3)
    res = User(email="fin_res@test.com", full_name="Res Fin", community_id=community.id, role_id=1, resident_type="owner")
    db_session.add_all([board, res])
    db_session.commit()
    
    # Create Chart of Accounts (Helper or manual)
    from backend.finance.models import Account, AccountType
    # We rely on ensure_coa_exists which is called in endpoints usually, 
    # but let's pre-seed to be safe or just call endpoint.
    # assessments/generate calls ensure_coa_exists.
    
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: board
    
    # 2. Generate Assessments
    res_api = await client.post(f"/api/communities/{community.id}/finance/assessments/generate")
    assert res_api.status_code == 200
    assert "Generated assessments" in res_api.json()["message"]
    
    # 3. Verify Ledger / Balance (Board view of Resident) or Delinquencies
    res_api = await client.get(f"/api/communities/{community.id}/finance/delinquencies")
    assert res_api.status_code == 200
    delinqs = res_api.json()
    assert len(delinqs) >= 1
    # Find our resident
    target = next((d for d in delinqs if d["id"] == res.id), None)
    assert target is not None
    assert target["balance"] == 100.0
    
    # 4. Late Fees
    # Force late fee? Config sets due day. If today > due day.
    # We can't easily mock time inside the endpoint without patching datetime within the module.
    # But we can verify endpoint runs.
    res_api = await client.post(f"/api/communities/{community.id}/finance/assessments/late-fees")
    assert res_api.status_code == 200
    
    # 5. Reports: Income Statement
    res_api = await client.get(f"/api/communities/{community.id}/finance/reports/income-statement")
    assert res_api.status_code == 200
    data = res_api.json()
    # Should see User Assessment Income
    rev = sum(i["actual"] for i in data["revenue"])
    assert rev >= 100.0
    
    # 6. Reports: Balance Sheet
    res_api = await client.get(f"/api/communities/{community.id}/finance/reports/balance-sheet")
    assert res_api.status_code == 200
    bs = res_api.json()
    # Assets (AR) should be > 0
    assets = sum(i["amount"] for i in bs["assets"])
    assert assets >= 100.0
    
    # 7. Ledger
    res_api = await client.get(f"/api/communities/{community.id}/finance/ledger")
    assert res_api.status_code == 200
    assert len(res_api.json()) > 0
    
    # 8. Unbalanced Transaction (Error Case)
    tx_data = {
        "description": "Bad Tx",
        "entries": [
            {"account_id": 1, "debit": 100.0, "credit": 0.0},
            {"account_id": 2, "debit": 0.0, "credit": 50.0} # Diff 50
        ]
    }
    # Need endpoint for generic transaction creation if exposed?
    # backend/finance/router.py: POST /communities/{id}/finance/transactions
    # Assuming account_IDs 1/2 exist from setup (COA) or we find them
    # We can fetch accounts from ledger to get valid IDs
    accs = await client.get(f"/api/communities/{community.id}/finance/accounts")
    if accs.status_code == 200 and len(accs.json()) >= 2:
        a1 = accs.json()[0]["id"]
        a2 = accs.json()[1]["id"]
        tx_data["entries"][0]["account_id"] = a1
        tx_data["entries"][1]["account_id"] = a2
        
        res_fail = await client.post(f"/api/communities/{community.id}/finance/transactions", json=tx_data)
        assert res_fail.status_code == 400
        assert "unbalanced" in res_fail.json()["detail"].lower()
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_payment_mock(client, db_session):
    # 1. Setup
    from backend.main import app
    from unittest.mock import patch, MagicMock
    from backend.finance.models import PaymentGatewayConfig
    
    # Setup Config for Community
    # Use community from DB or create new
    community = Community(name="Pay Comm")
    db_session.add(community)
    db_session.commit()
    
    config = PaymentGatewayConfig(community_id=community.id, stripe_account_id="acct_123")
    db_session.add(config)
    
    # User
    user = User(email="pay@test.com", full_name="Pay User", community_id=community.id, role_id=1)
    db_session.add(user)
    db_session.commit()
    
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user
    
    # Mock create_payment_intent
    with patch("backend.finance.payment_router.create_payment_intent") as mock_create:
        mock_intent = MagicMock()
        mock_intent.id = "pi_123"
        mock_intent.client_secret = "secret_123"
        mock_create.return_value = mock_intent
        
        # Call Endpoint
        pay_data = {"amount_cents": 10000, "description": "HOA Fee"}
        res = await client.post("/api/payments/create-payment-intent", json=pay_data)
        
        assert res.status_code == 200
        assert res.json()["client_secret"] == "secret_123"
        
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_property_arc(client, db_session):
    # 1. Setup
    from backend.property.models import ARCRequest, ARCStatus
    
    community = Community(name="ARC Comm")
    db_session.add(community)
    db_session.commit()
    
    # Roles
    if not db_session.query(Role).filter_by(name="board").first():
        db_session.add(Role(id=3, name="board"))
    if not db_session.query(Role).filter_by(name="resident").first():
        db_session.add(Role(id=1, name="resident"))
    db_session.commit()
    
    board = User(email="arc_board@test.com", full_name="Board ARC", community_id=community.id, role_id=3)
    res = User(email="arc_res@test.com", full_name="Res ARC", community_id=community.id, role_id=1)
    db_session.add_all([board, res])
    db_session.commit()
    
    from backend.auth.dependencies import get_current_user
    
    # 2. Resident Submits ARC
    app.dependency_overrides[get_current_user] = lambda: res
    arc_data = {
        "resident_id": res.id,
        "resident_address": "123 ARC St",
        "description": "New Fence",
        "contractor_name": "Fence Co",
        "projected_start": "2024-01-01",
        "terms_accepted": True
    }
    # /api/communities/{id}/arc is the prefix? Check backend/main.py
    # backend/main.py: app.include_router(property_router.router, prefix="/api/communities", tags=["property"])
    # router paths are /{community_id}/arc...
    
    resp = await client.post(f"/api/communities/{community.id}/arc", json=arc_data)
    assert resp.status_code == 200
    arc_id = resp.json()["id"]
    
    # 3. Resident Get My
    resp = await client.get(f"/api/communities/{community.id}/arc/my")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    
    # 4. Board Get All
    app.dependency_overrides[get_current_user] = lambda: board
    resp = await client.get(f"/api/communities/{community.id}/arc")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
    
    # 5. Board Approve
    resp = await client.put(f"/api/communities/{community.id}/arc/{arc_id}/status?status=Approved")
    assert resp.status_code == 200
    assert resp.json()["status"] == "Approved"
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_auth_advanced(client, db_session):
    # 1. Setup
    from unittest.mock import patch
    from backend.auth.models import User
    
    user = User(email="auth_test@test.com", full_name="Auth User", role_id=1, hashed_password="hashed_password")
    user.is_active = True
    db_session.add(user)
    db_session.commit()
    
    # 2. Login Failure x 2
    # Mock verify_password to return False
    with patch("backend.auth.router.verify_password", return_value=False):
        # Attempt 1
        res = await client.post("/api/auth/login", json={"email": "auth_test@test.com", "password": "wrong"})
        assert res.status_code == 401
        
        # Attempt 2
        res = await client.post("/api/auth/login", json={"email": "auth_test@test.com", "password": "wrong"})
        assert res.status_code == 401
        
        # Check if captcha required logic triggered (in DB) based on implementation
        db_session.refresh(user)
        assert user.failed_login_attempts >= 2
        
        # Attempt 3 (Captcha Trigger)
        res = await client.post("/api/auth/login", json={"email": "auth_test@test.com", "password": "wrong"})
        assert res.status_code == 200
        assert res.json()["captcha_required"] == True
        
    # 3. Forgot Password
    async def mock_send_email(*args, **kwargs):
        return None

    with patch("backend.auth.router.verify_captcha_token", return_value=True), \
         patch("backend.auth.router.send_password_reset_email", side_effect=mock_send_email):
         
         # Request Reset
         res = await client.post("/api/auth/forgot-password", json={"email": "auth_test@test.com", "captcha_token": "valid"})
         assert res.status_code == 200
         
         # Check User Token
         db_session.refresh(user)
         assert user.reset_token is not None
         token = user.reset_token
         
         # 4. Reset Password
         # Mock hash
         with patch("backend.auth.router.get_password_hash", return_value="new_hashed_pwd"):
             res = await client.post("/api/auth/reset-password", json={"token": token, "new_password": "new_secret"})
             assert res.status_code == 200
             
             db_session.refresh(user)
             assert user.reset_token is None
             assert user.hashed_password == "new_hashed_pwd"
             
    # 5. Setup Account (New User)
    from backend.community.models import Community
    # Create Community with code
    comm = Community(name="Setup Comm", community_code="SETUP123")
    db_session.add(comm)
    db_session.commit()
    
    # Pre-seed user (invite style)
    new_user = User(email="new@test.com", community_id=comm.id, full_name="New User", role_id=1, is_setup_complete=False)
    db_session.add(new_user)
    db_session.commit()
    
    setup_data = {
        "community_code": "SETUP123",
        "email": "new@test.com",
        "password": "secret_password"
    }
    
    with patch("backend.auth.router.get_password_hash", return_value="hashed_secret"):
        res = await client.post("/api/auth/setup-account", json=setup_data)
        assert res.status_code == 200
        assert res.json()["user"]["is_setup_complete"] == True
    
    app.dependency_overrides.clear()
