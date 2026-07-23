import os
import json
import sqlite3
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv('.env.ops.local')

DIAMOND_EMAIL = os.getenv('DIAMOND_EMAIL')
DIAMOND_PASSWORD = os.getenv('DIAMOND_PASSWORD')
DB_PATH = 'jworden_leads.db'

async def run(playwright):
    if not DIAMOND_EMAIL or not DIAMOND_PASSWORD:
        print("Error: DIAMOND_EMAIL or DIAMOND_PASSWORD not found in .env.ops.local")
        return

    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context()
    page = await context.new_page()

    print("Navigating to Diamond Solutions login...")
    await page.goto("https://connect.thediamondsolutions.com/sign-in")

    print("Waiting for email input...")
    await page.wait_for_selector('input[type="email"]')
    await page.fill('input[type="email"]', DIAMOND_EMAIL)
    await page.click('button.cl-formButtonPrimary')

    print("Waiting for password input...")
    await page.wait_for_selector('input[type="password"]', timeout=10000)
    await page.fill('input[type="password"]', DIAMOND_PASSWORD)
    await page.click('button.cl-formButtonPrimary')

    print("Waiting for login to complete...")
    await page.wait_for_url("**/dashboard**", timeout=15000)

    print("Navigating to jobs page...")
    target_url = "https://connect.thediamondsolutions.com/jobs/my-jobs?states=NC%2CSC%2CVA%2CWV%2CWY%2CTX%2CTN%2CSD%2CPA%2COH%2CNJ%2CMO%2CMN%2CMI%2CMD%2CIN%2CIL%2CGA%2CFL%2CDC%2CDE%2CAR%2CAL%2CCO&services=ARR%2CMOL%2CMP%2CPAV%2CIR%2CTP%2CSB%2CCRR%2CCONC%2CCURB%2CBLLD%2CPS%2CDP%2CRSR%2CJS%2CGRND%2CTD%2CBASE%2CCB%2CDT%2CCS%2CSC%2CSTR%2CSGN%2COTHR"
    
    job_data = []
    async def handle_response(response):
        if "api.thediamondsolutions.com" in response.url and response.request.method == "GET":
            try:
                data = await response.json()
                if isinstance(data, list) or 'data' in data:
                    print(f"Captured API response from: {response.url}")
                    job_data.append(data)
            except:
                pass

    page.on("response", handle_response)
    
    await page.goto(target_url)
    await page.wait_for_timeout(10000) # wait for API requests to complete
    
    await browser.close()
    
    if job_data:
        with open('diamond_jobs_cache.json', 'w') as f:
            json.dump(job_data, f)
        print("Successfully scraped and saved Diamond jobs!")
    else:
        print("Failed to capture job data from the API.")

async def main():
    async with async_playwright() as playwright:
        await run(playwright)

if __name__ == '__main__':
    asyncio.run(main())
