
import sqlite3
import os

db_path = "esntes.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get Super Admin Role ID
cursor.execute("SELECT id FROM roles WHERE name = 'super_admin'")
res = cursor.fetchone()
if not res:
    print("Error: Super Admin role not found!")
else:
    sa_id = res[0]
    print(f"Super Admin Role ID is: {sa_id}")
    
    # Update User 1
    cursor.execute("UPDATE users SET role_id = ? WHERE id = 1", (sa_id,))
    conn.commit()
    print(f"User 1 updated to Role ID {sa_id}")

conn.close()
