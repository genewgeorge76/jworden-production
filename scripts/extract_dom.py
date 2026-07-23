from bs4 import BeautifulSoup
import json

with open('jobs_page.html', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Find elements that might represent jobs
# Usually they are links, list items, or divs with certain classes
links = soup.find_all('a', href=True)
job_links = [l for l in links if '/jobs/' in l['href']]

print(f"Found {len(job_links)} job links")
for link in job_links[:5]:
    print(link['href'], link.get_text(strip=True)[:50])
