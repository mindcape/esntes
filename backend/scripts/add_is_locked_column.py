
import sqlite3
import os

DB_FILE = 'esntes.db'

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found.")
        return

    print(f"Connecting to database: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        print("Checking if column exists...")
        try:
            cursor.execute("SELECT is_locked FROM users LIMIT 1")
            print("Column 'is_locked' already exists.")
        except sqlite3.OperationalError:
             print("Column 'is_locked' not found. Adding it...")
             cursor.execute("ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT 0")
             print("Column 'is_locked' added successfully.")
             conn.commit()
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()
            
if __name__ == "__main__":
    migrate()
