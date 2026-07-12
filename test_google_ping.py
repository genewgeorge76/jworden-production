import requests

url = "https://www.google.com/ping?sitemap=https://jwordenasphaltpaving.com/sitemap.xml"
print(f"Pinging {url}...")
try:
    resp = requests.get(url)
    print("Status:", resp.status_code)
    print("Body:", resp.text[:200])
except Exception as e:
    print("Error:", e)
