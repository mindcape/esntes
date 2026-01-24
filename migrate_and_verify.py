
import sqlite3

# 1. Migration Helper
def migrate_db():
    print("Migrating Database...")
    conn = sqlite3.connect('esntes.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE communities ADD COLUMN community_code TEXT")
    except sqlite3.OperationalError:
        print("Column community_code already exists or error.")

    try:
        cursor.execute("ALTER TABLE communities ADD COLUMN is_active BOOLEAN DEFAULT 1")
    except sqlite3.OperationalError:
        print("Column is_active already exists.")
        
    try:
        cursor.execute("ALTER TABLE communities ADD COLUMN modules_enabled JSON DEFAULT '{}'")
    except sqlite3.OperationalError:
        print("Column modules_enabled already exists.")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN hashed_password TEXT")
    except sqlite3.OperationalError:
        print("Column hashed_password already exists.")
        
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_setup_complete BOOLEAN DEFAULT 0")
    except sqlite3.OperationalError:
        print("Column is_setup_complete already exists.")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN mailing_address TEXT")
    except sqlite3.OperationalError:
        print("Column mailing_address already exists.")

    # Finance Tables
    print("Migrating Finance Tables...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT,
        type TEXT,
        parent_id INTEGER,
        description TEXT,
        FOREIGN KEY(parent_id) REFERENCES accounts(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS financial_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TIMESTAMP,
        description TEXT,
        reference TEXT,
        created_by_id INTEGER,
        FOREIGN KEY(created_by_id) REFERENCES users(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER,
        account_id INTEGER,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        description TEXT,
        FOREIGN KEY(transaction_id) REFERENCES financial_transactions(id),
        FOREIGN KEY(account_id) REFERENCES accounts(id)
    )
    """)

    # Multi-Tenancy Migrations (Phase 3.5)
    print("Applying Multi-Tenancy Schema Updates...")
    tables_to_update = [
        "violations", 
        "maintenance_requests", 
        "accounts", 
        "financial_transactions", 
        "journal_entries", 
        "documents", 
        "arc_requests",
        "elections" # Explicitly listed if table exists, otherwise create will handle it
    ]

    for table in tables_to_update:
        try:
            # Check if table exists first
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if cursor.fetchone():
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN community_id INTEGER DEFAULT 1 REFERENCES communities(id)")
                print(f"Added community_id to {table}")
        except sqlite3.OperationalError:
            print(f"community_id already exists in {table} or error.")

    # 4. Community Schema Enhancements (Detailed Address & POC)
    print("Applying Community Schema Updates (Address & POC)...")
    new_community_cols = [
        "address2", "county", "poc_name", "poc_email", "poc_phone"
    ]
    for col in new_community_cols:
        try:
            cursor.execute(f"ALTER TABLE communities ADD COLUMN {col} TEXT")
            print(f"Added {col} to communities")
        except sqlite3.OperationalError:
            print(f"Column {col} already exists in communities.")

    # Explicitly ensure elections table has community_id if it was just created
    # (The CREATE statement for events/elections might need updating in next block if not already present)
    
    conn.commit()
    conn.close()
    print("Migration Check Complete.")

def seed_data():
    print("Seeding Data...")
    conn = sqlite3.connect('esntes.db')
    cursor = conn.cursor()
    
    # Update Community
    cursor.execute("UPDATE communities SET community_code = 'HOA-123' WHERE id = 1")

    # Fix Defaults: Ensure units_count is never NULL
    try:
        cursor.execute("UPDATE communities SET units_count = 0 WHERE units_count IS NULL")
    except Exception as e:
        print(f"Error updating units_count defaults: {e}")
    
    # Backfill any other missing community codes
    cursor.execute("SELECT id, name FROM communities WHERE community_code IS NULL")
    rows = cursor.fetchall()
    for row in rows:
        cid, cname = row
        # Generate simple code
        slug = "".join(c for c in cname if c.isalnum()).upper()[:4]
        code = f"{slug}-{cid}"
        print(f"Backfilling code for {cname}: {code}")
        cursor.execute("UPDATE communities SET community_code = ? WHERE id = ?", (code, cid))
    
    # Ensure a test user exists
    cursor.execute("UPDATE users SET is_setup_complete = 0, hashed_password = NULL WHERE id = 1")

    # FIX: Update Account Types to Uppercase to match Enum
    try:
        cursor.execute("UPDATE accounts SET type = UPPER(type)")
        print("Updated Account Types to UPPECASE.")
    except Exception as e:
        print(f"Error updating account types: {e}")

    # Seed Chart of Accounts
    # Check if accounts exist
    cursor.execute("SELECT count(*) FROM accounts")
    if cursor.fetchone()[0] == 0:
        print("Seeding Chart of Accounts...")
        input_data = [
            (1000, "Assets", "ASSET", None),
            (1010, "Operating Account", "ASSET", 1000),
            (1020, "Reserve Account", "ASSET", 1000),
            (1100, "Accounts Receivable", "ASSET", 1000),
            
            (2000, "Liabilities", "LIABILITY", None),
            (2010, "Accounts Payable", "LIABILITY", 2000),
            (2020, "Prepaid Assessments", "LIABILITY", 2000),
            
            (3000, "Equity", "EQUITY", None),
            (3010, "Retained Earnings", "EQUITY", 3000),
            
            (4000, "Revenue", "REVENUE", None),
            (4010, "Assessment Income", "REVENUE", 4000),
            (4020, "Late Fee Income", "REVENUE", 4000),
            
            (5000, "Expenses", "EXPENSE", None),
            (5010, "Management Fees", "EXPENSE", 5000),
            (5020, "Landscaping", "EXPENSE", 5000),
            (5030, "Utilities", "EXPENSE", 5000),
            (5040, "General Maintenance", "EXPENSE", 5000)
        ]
        
        # Helper to find ID by code if needed, but since we autoinc, we interpret code as code.
        # But parent_id refers to ID. Let's insert in order and map codes to inserted IDs.
        
        # Simplified: We will just insert top level then children.
        # Map code -> DB ID
        code_map = {}
        
        for code, name, type_, parent_code in input_data:
            parent_id = code_map.get(parent_code) if parent_code else None
            cursor.execute("INSERT INTO accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)", (str(code), name, type_, parent_id))
            code_map[code] = cursor.lastrowid
            
        print("Chart of Accounts Seeded.")

    # Seed Mock Transactions if empty
    cursor.execute("SELECT count(*) FROM financial_transactions")
    if cursor.fetchone()[0] == 0:
        print("Seeding Mock Transactions...")
        
        # Get Account IDs
        def get_id(code):
            cursor.execute("SELECT id FROM accounts WHERE code = ?", (str(code),))
            res = cursor.fetchone()
            return res[0] if res else None
            
        op_id = get_id(1010) # Operating
        re_id = get_id(3010) # Retained Earnings
        inc_id = get_id(4010) # Assessment Income
        ar_id = get_id(1100) # Accounts Receivable
        exp_id = get_id(5020) # Landscaping
        
        from datetime import datetime
        now = datetime.utcnow()
        
        # 1. Opening Balance
        cursor.execute("INSERT INTO financial_transactions (date, description) VALUES (?, ?)", (now, "Opening Balance"))
        tx_id = cursor.lastrowid
        cursor.execute("INSERT INTO journal_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)", (tx_id, op_id, 10000.0, 0))
        cursor.execute("INSERT INTO journal_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)", (tx_id, re_id, 0, 10000.0))
        
        # 2. Assessment Income (Accrual: Debit AR, Credit Income)
        cursor.execute("INSERT INTO financial_transactions (date, description) VALUES (?, ?)", (now, "Jan Assessment"))
        tx_id = cursor.lastrowid
        cursor.execute("INSERT INTO journal_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)", (tx_id, ar_id, 5000.0, 0))
        cursor.execute("INSERT INTO journal_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)", (tx_id, inc_id, 0, 5000.0))
        
        # 3. Expense Payment (Debit Expense, Credit Cash)
        cursor.execute("INSERT INTO financial_transactions (date, description) VALUES (?, ?)", (now, "Landscaping Payment"))
        tx_id = cursor.lastrowid
        cursor.execute("INSERT INTO journal_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)", (tx_id, exp_id, 500.0, 0))
        cursor.execute("INSERT INTO journal_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)", (tx_id, op_id, 0, 500.0))

        cursor.execute("INSERT INTO journal_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)", (tx_id, op_id, 0, 500.0))

        print("Mock Transactions Seeded.")

    # Phase 3 Tables
    print("Migrating Compliance Tables...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS arc_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resident_id INTEGER,
        resident_address TEXT,
        description TEXT,
        contractor_name TEXT,
        projected_start TEXT,
        anticipated_end TEXT,
        submission_date TIMESTAMP,
        status TEXT,
        comments JSON,
        terms_accepted BOOLEAN,
        work_started_before_approval BOOLEAN,
        FOREIGN KEY(resident_id) REFERENCES users(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS violations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resident_id INTEGER,
        resident_name TEXT,
        resident_address TEXT,
        description TEXT,
        bylaw_reference TEXT,
        date TIMESTAMP,
        status TEXT,
        fine_amount REAL,
        photo_url TEXT,
        FOREIGN KEY(resident_id) REFERENCES users(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        event_type TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        location TEXT,
        created_by_id INTEGER,
        community_id INTEGER NOT NULL DEFAULT 1,
        recurrence_rule TEXT,
        recurrence_end_date TIMESTAMP,
        FOREIGN KEY(created_by_id) REFERENCES users(id),
        FOREIGN KEY(community_id) REFERENCES communities(id)
    )
    """)
    
    # Add Recurrence Columns if missing (for existing tables)
    try:
        cursor.execute("ALTER TABLE events ADD COLUMN recurrence_rule TEXT")
        print("Added recurrence_rule to events")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE events ADD COLUMN recurrence_end_date TIMESTAMP")
        print("Added recurrence_end_date to events")
    except sqlite3.OperationalError:
        pass

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS elections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        is_active BOOLEAN,
        election_type TEXT,
        allowed_selections INTEGER,
        community_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(community_id) REFERENCES communities(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        election_id INTEGER,
        name TEXT,
        bio TEXT,
        photo_url TEXT,
        FOREIGN KEY(election_id) REFERENCES elections(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        election_id INTEGER,
        candidate_id INTEGER,
        timestamp TIMESTAMP,
        FOREIGN KEY(election_id) REFERENCES elections(id),
        FOREIGN KEY(candidate_id) REFERENCES candidates(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS voter_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        election_id INTEGER,
        user_id INTEGER,
        timestamp TIMESTAMP,
        FOREIGN KEY(election_id) REFERENCES elections(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        category TEXT,
        status TEXT,
        submitted_at TIMESTAMP,
        image_url TEXT,
        community_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(community_id) REFERENCES communities(id)
    )
    """)
    
    # Add new Community Contact Fields
    contact_cols = ["city", "state", "zip_code", "phone", "email"]
    for col in contact_cols:
        try:
            cursor.execute(f"ALTER TABLE communities ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            pass # Already exists

    # Seed ARC if empty
    cursor.execute("SELECT count(*) FROM arc_requests")
    if cursor.fetchone()[0] == 0:
        print("Seeding ARC Requests...")
        from datetime import datetime
        now = datetime.utcnow()
        cursor.execute("""
            INSERT INTO arc_requests 
            (resident_id, resident_address, description, contractor_name, projected_start, submission_date, status, terms_accepted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (1, "123 Main St", "Install 6ft Fence", "Fence Masters", "2026-06-01", now, "Pending", True))
        print("ARC Seeded.")

    # SUPER ADMIN SETUP (User 1)
    # Set to 'admin123'
    # Valid Hash: $pbkdf2-sha256$29000$5lyrldLau9c6B0CoNQZgbA$p/d62Yaeq7d.h/vNXY5uJZG4G8o0/XHGuUu4bXASIic
    
    admin_hash = "$pbkdf2-sha256$29000$5lyrldLau9c6B0CoNQZgbA$p/d62Yaeq7d.h/vNXY5uJZG4G8o0/XHGuUu4bXASIic"
    
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
        # Ensure we can use it
        admin_hash = pwd_context.hash("admin123")
    except (ImportError, ValueError) as e:
        print(f"Passlib error or not found ({e}), using pre-calculated hash for 'admin123'")

    cursor.execute("UPDATE users SET is_setup_complete = 1, hashed_password = ? WHERE id = 1", (admin_hash,))
    print(f"Super Admin (User 1) set to Active. Password: 'admin123'")

    cursor.execute("UPDATE users SET is_setup_complete = 1, hashed_password = ? WHERE id = 1", (admin_hash,))
    print(f"Super Admin (User 1) set to Active. Password: 'admin123'")

    # Ensure Roles exist and Super Admin Role
    # Check if super_admin exists
    cursor.execute("SELECT id FROM roles WHERE name = 'super_admin'")
    if not cursor.fetchone():
        print("Creating super_admin role...")
        cursor.execute("INSERT INTO roles (id, name, description) VALUES (3, 'super_admin', 'System Administrator')")
    
    # Cleanup: Remove System Community (ID -1) if it exists, as user requested no relation
    cursor.execute("DELETE FROM communities WHERE id = -1")
    
    # Set User 1 to Super Admin (mlax1980@gmail.com) and set community_id = NULL
    cursor.execute("""
        UPDATE users 
        SET email = 'mlax1980@gmail.com', 
            role_id = 3, 
            community_id = NULL,
            auth0_id = 'admin|mlax1980@gmail.com'
        WHERE id = 1
    """)
    print("User 1 updated: mlax1980@gmail.com, role=super_admin, community_id=NULL, auth0_id=admin|mlax1980@gmail.com")

    conn.commit()
    conn.close()
    print("Seed Complete.")

if __name__ == "__main__":
    migrate_db()
    seed_data()
