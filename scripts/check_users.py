
import sqlite3
import os

db_path = "esntes.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Data in Users Table ---")
try:
    cursor.execute("SELECT id, email, role_id, is_active FROM users")
    users = cursor.fetchall()
    for u in users:
        print(f"ID: {u[0]}, Email: {u[1]}, Role: {u[2]}, Active: {u[3]}")
        
    print(f"\nTotal Users: {len(users)}")
except Exception as e:
    print(f"Error reading users: {e}")

conn.close()
