import sqlite3

c = sqlite3.connect('jworden_leads.db')
cursor = c.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]

for table in tables:
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"{table}: {count}")
