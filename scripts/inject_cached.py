import sqlite3
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup

with open('jobs_page.html', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
job_links = [l for l in soup.find_all('a', href=True) if '/jobs/' in l['href'] and len(l['href']) > 20]

db_path = "jworden_leads.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

count = 0
for link in job_links:
    try:
        href = link['href']
        job_id_match = re.search(r'/jobs/([a-f0-9\-]{36})', href)
        if not job_id_match: continue
        job_id = job_id_match.group(1)
        
        name_tag = link.find('h3')
        name = name_tag.get_text(strip=True) if name_tag else "Unknown Job"
        
        address = ""
        price_tags = link.find_all('p')
        for pt in price_tags:
            txt = pt.get_text(strip=True)
            if len(txt) > 10 and ',' in txt and '$' not in txt and 'Deadline' not in txt and txt != name:
                address = txt
                break
                
        c.execute('SELECT id FROM jobs WHERE job_number = ?', (job_id,))
        if not c.fetchone():
            now = datetime.now(timezone.utc).isoformat()
            c.execute('''
                INSERT INTO jobs (
                    job_number, name, status, site_address, progress_percent, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                job_id, name, 'active', address, 0, now, now
            ))
            count += 1
    except Exception as e:
        print(f"Error parsing a job: {e}")
        
conn.commit()
conn.close()
print(f"Successfully scraped and synced {count} new Diamond jobs to SQLite!")
