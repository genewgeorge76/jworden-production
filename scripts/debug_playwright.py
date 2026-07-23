import asyncio
from playwright.async_api import async_playwright

async def run(playwright):
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context()
    page = await context.new_page()
    await page.goto("https://connect.thediamondsolutions.com/sign-in", wait_until="networkidle")
    await page.screenshot(path="debug_login.png")
    
    # Dump HTML
    html = await page.content()
    with open("debug_login.html", "w", encoding="utf-8") as f:
        f.write(html)
        
    await browser.close()

async def main():
    async with async_playwright() as playwright:
        await run(playwright)

asyncio.run(main())
