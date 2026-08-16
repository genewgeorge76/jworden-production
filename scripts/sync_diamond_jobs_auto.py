import os
import json
import sqlite3
import asyncio
import imaplib
import email
import re
import time
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# The app password used to be hardcoded here in a public repository. It grants
# full IMAP access to the mailbox, so it now comes from the environment.
DIAMOND_EMAIL = os.environ.get('GMAIL_USER', 'j.wordenandsonspaving@gmail.com')
GMAIL_APP_PASS = os.environ.get('GMAIL_APP_PASSWORD')

def get_latest_otp():
    if not GMAIL_APP_PASS:
        print('GMAIL_APP_PASSWORD is not set; cannot read the OTP mailbox.')
        return None
    try:
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        mail.login(DIAMOND_EMAIL, GMAIL_APP_PASS)
        mail.select('inbox')
        status, messages = mail.search(None, '(UNSEEN)')
        if status == 'OK' and messages[0]:
            for num in reversed(messages[0].split()):
                status, data = mail.fetch(num, '(RFC822)')
                if status == 'OK':
                    msg = email.message_from_bytes(data[0][1])
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == 'text/plain':
                                body = part.get_payload(decode=True).decode()
                                break
                    else:
                        body = msg.get_payload(decode=True).decode()
                    match = re.search(r'\b(\d{6})\b', body)
                    if match:
                        return match.group(1)
    except Exception as e:
        print("Gmail read error:", e)
    return None

async def run(playwright):
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context()
    page = await context.new_page()

    print("Navigating to Diamond Solutions login...")
    await page.goto("https://connect.thediamondsolutions.com/sign-in")
    await page.wait_for_selector('input[name="identifier"]', timeout=15000)
    await page.fill('input[name="identifier"]', DIAMOND_EMAIL)
    await page.click('button.cl-formButtonPrimary')

    print("Waiting for Diamond to send OTP to email...")
    await page.wait_for_timeout(5000)
    
    print("Connecting to Gmail to read OTP...")
    otp = None
    for _ in range(10):
        otp = get_latest_otp()
        if otp: break
        time.sleep(5)
        
    if not otp:
        print("Could not find OTP in Gmail.")
        await browser.close()
        return

    print(f"Found OTP: {otp}. Entering into form...")
    await page.wait_for_selector('input[data-input-otp="true"]', timeout=10000)
    await page.fill('input[data-input-otp="true"]', otp)

    print("Waiting for login to complete...")
    await page.wait_for_timeout(5000)

    targets = [
        {"url": "https://connect.thediamondsolutions.com/jobs/my-jobs", "status": "active"},
        {"url": "https://connect.thediamondsolutions.com/jobs/available", "status": "available"}
    ]
    
    db_path = "jworden_leads.db"
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    total_count = 0

    for target in targets:
        print(f"Navigating to {target['url']}...")
        await page.goto(target['url'])
        
        # Wait for the job links to render
        try:
            await page.wait_for_selector('a[href^="/jobs/"]', timeout=15000)
        except:
            pass
        
        # Give it an extra few seconds to make sure all jobs load
        await page.wait_for_timeout(5000)
        html = await page.content()
        
        # Parse DOM
        soup = BeautifulSoup(html, 'html.parser')
        job_links = [l for l in soup.find_all('a', href=True) if '/jobs/' in l['href'] and len(l['href']) > 20]
        
        print(f"Found {len(job_links)} jobs for {target['status']}!")
        
        count = 0
        for link in job_links:
            try:
                # Extract UUID from href
                href = link['href']
                job_id_match = re.search(r'/jobs/([a-f0-9\-]{36})', href)
                if not job_id_match: continue
                job_id = job_id_match.group(1)
                
                # Name
                name_tag = link.find('h3')
                name = name_tag.get_text(strip=True) if name_tag else "Unknown Job"
                
                # Address and Price
                address = ""
                price = ""
                price_tags = link.find_all('p')
                for pt in price_tags:
                    txt = pt.get_text(strip=True)
                    if '$' in txt:
                        price = txt
                    elif len(txt) > 10 and ',' in txt and 'Deadline' not in txt and txt != name:
                        address = txt
                        
                c.execute('SELECT id, status FROM jobs WHERE job_number = ?', (job_id,))
                existing = c.fetchone()
                
                now = datetime.now(timezone.utc).isoformat()
                if not existing:
                    c.execute('''
                        INSERT INTO jobs (
                            job_number, name, status, site_address, price, progress_percent, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        job_id, name, target['status'], address, price, 0, now, now
                    ))
                    count += 1
                else:
                    # If it exists, update the status and price
                    c.execute('UPDATE jobs SET status = ?, price = ?, updated_at = ? WHERE job_number = ?', (target['status'], price, now, job_id))
            except Exception as e:
                print(f"Error parsing a job: {e}")
        total_count += count
                
    await browser.close()
    conn.commit()
    conn.close()
    print(f"Successfully scraped and synced {total_count} new Diamond jobs to SQLite!")

async def main():
    async with async_playwright() as playwright:
        await run(playwright)

if __name__ == '__main__':
    asyncio.run(main())
