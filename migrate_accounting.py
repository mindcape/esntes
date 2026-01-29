import sqlite3
import os

DB_PATH = "esntes.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Update communities table
    try:
        cursor.execute("ALTER TABLE communities ADD COLUMN monthly_assessment_amount FLOAT DEFAULT 0.0")
        print("Added monthly_assessment_amount to communities")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("monthly_assessment_amount already exists")
        else:
            print(f"Error adding monthly_assessment_amount: {e}")

    try:
        cursor.execute("ALTER TABLE communities ADD COLUMN late_fee_amount FLOAT DEFAULT 0.0")
        print("Added late_fee_amount to communities")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("late_fee_amount already exists")
        else:
            print(f"Error adding late_fee_amount: {e}")

    try:
        cursor.execute("ALTER TABLE communities ADD COLUMN late_fee_due_day INTEGER DEFAULT 15")
        print("Added late_fee_due_day to communities")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("late_fee_due_day already exists")
        else:
            print(f"Error adding late_fee_due_day: {e}")

    # 2. Update journal_entries table
    try:
        cursor.execute("ALTER TABLE journal_entries ADD COLUMN user_id INTEGER REFERENCES users(id)")
        print("Added user_id to journal_entries")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("user_id already exists")
        else:
            print(f"Error adding user_id: {e}")

    # 3. Update vendors table
    try:
        cursor.execute("ALTER TABLE vendors ADD COLUMN user_id INTEGER REFERENCES users(id)")
        print("Added user_id to vendors")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("user_id already exists in vendors")
        else:
            print(f"Error adding user_id to vendors: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
