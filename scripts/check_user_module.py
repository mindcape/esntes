
import sqlite3
import json

conn = sqlite3.connect('esntes.db')
cursor = conn.cursor()

email = "p1@pine.com"
print(f"Checking user: {email}")

cursor.execute("SELECT id, role_id, community_id FROM users WHERE email = ?", (email,))
user = cursor.fetchone()

if not user:
    print("User not found.")
else:
    uid, role_id, cid = user
    print(f"User ID: {uid}, Role ID: {role_id}, Community ID: {cid}")
    
    # Get Role Name
    cursor.execute("SELECT name FROM roles WHERE id = ?", (role_id,))
    role_name = cursor.fetchone()[0]
    print(f"Role: {role_name}")

    if cid:
        cursor.execute("SELECT name, modules_enabled FROM communities WHERE id = ?", (cid,))
        comm = cursor.fetchone()
        if comm:
            cname, modules = comm
            print(f"Community: {cname}")
            print(f"Modules Enabled (Raw): {modules}")
            try:
                mod_dict = json.loads(modules)
                print(f"Documents Enabled: {mod_dict.get('documents', 'Not Set')}")
            except:
                print("Error parsing modules json")
        else:
            print("Community not found.")
    else:
        print("User has no community.")

conn.close()
