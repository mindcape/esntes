
import sqlite3
import os

db_path = "esntes.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Data in Roles Table ---")
try:
    cursor.execute("SELECT id, name, description FROM roles")
    roles = cursor.fetchall()
    for r in roles:
        print(f"ID: {r[0]}, Name: {r[1]}, Desc: {r[2]}")
except Exception as e:
    print(f"Error reading roles: {e}")

conn.close()
