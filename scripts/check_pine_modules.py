
import sqlite3
import json

conn = sqlite3.connect('esntes.db')
cursor = conn.cursor()

print("--- Checking Pine Valley Modules ---")

cursor.execute("SELECT id, name, modules_enabled FROM communities WHERE name LIKE '%pine valley%'")
comm = cursor.fetchone()

if not comm:
    print("Pine Valley not found.")
else:
    cid, cname, modules = comm
    print(f"Community: {cname}")
    print(f"Modules (Raw): {modules}")
    try:
        mod_dict = json.loads(modules)
        print(f"ARC Enabled: {mod_dict.get('arc', 'Not Set')}")
    except:
        print("Error parsing modules json")

conn.close()
