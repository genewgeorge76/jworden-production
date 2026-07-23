from bs4 import BeautifulSoup

with open('jobs_page.html', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

job_links = [l for l in soup.find_all('a', href=True) if '/jobs/' in l['href'] and len(l['href']) > 20]
if job_links:
    print(job_links[0].prettify())
