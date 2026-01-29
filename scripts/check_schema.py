
import sqlite3
import os

db_path = "esntes.db"
print(f"Checking database at: {os.path.abspath(db_path)}")

if not os.path.exists(db_path):
    print("Database file NOT found!")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print(f"Found {len(columns)} columns in 'users' table:")
    found = False
    for col in columns:
        print(f" - {col[1]} ({col[2]})")
        if col[1] == 'failed_login_attempts':
            found = True
            
    if found:
        print("\nSUCCESS: 'failed_login_attempts' column EXISTS.")
    else:
        print("\nFAILURE: 'failed_login_attempts' column is MISSING.")
    conn.close()
