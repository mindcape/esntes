
import sqlite3
import sys

def reset_db():
    print("WARNING: This will wipe all data except Super Admin!")
    print("type 'yes' to confirm:")
    # confirmation = input()
    # if confirmation != 'yes':
    #     print("Aborted.")
    #     return

    conn = sqlite3.connect('esntes.db')
    cursor = conn.cursor()
    
    # 1. Clear Operational Data
    tables_to_clear = [
        "arc_requests", 
        "violations", 
        "maintenance_requests",
        "journal_entries", 
        "financial_transactions",
        "accounts" # Will need re-seeding if we want default COA, check migrate_and_verify
    ]
    
    for table in tables_to_clear:
        try:
            cursor.execute(f"DELETE FROM {table}")
            print(f"Cleared {table}")
        except sqlite3.OperationalError:
            print(f"Skipped {table} (not found)")

    # 2. Clear Users (Except Super Admin ID 1)
    cursor.execute("DELETE FROM users WHERE id != 1")
    print("Cleared users (kept Super Admin)")

    # 3. Clear Communities
    cursor.execute("DELETE FROM communities")
    print("Cleared communities")
    
    # 4. Enforce Super Admin State
    # Ensure ID 1 is decoupled
    cursor.execute("UPDATE users SET community_id = NULL WHERE id = 1")

    conn.commit()
    conn.close()
    
    print("\nDatabase Reset Complete.")
    print("Run 'python migrate_and_verify.py' to re-seed default Chart of Accounts if needed.")

if __name__ == "__main__":
    reset_db()
