import sqlite3

c = sqlite3.connect('jworden_leads.db')
cursor = c.cursor()
tables = ["customers", "jobs", "estimates"]
for table in tables:
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE name='{table}'")
    result = cursor.fetchone()
    if result:
        print(f"--- {table} ---")
        print(result[0])
    else:
        print(f"--- {table} NOT FOUND ---")
