import requests
import concurrent.futures
import time

def check_endpoint(method, url):
    try:
        if method == "get":
            r = requests.get(url, timeout=5)
        elif method == "post":
            r = requests.post(url, json={}, timeout=5)
        elif method == "put":
            r = requests.put(url, json={}, timeout=5)
        elif method == "delete":
            r = requests.delete(url, timeout=5)
        else:
            return None
        
        if r.status_code >= 500:
            return f"{method.upper()} {url} -> {r.status_code} {r.reason}"
        return None
    except requests.exceptions.RequestException as e:
        return f"{method.upper()} {url} -> Failed to connect: {e}"

def check_apis():
    import os
    base_url = os.environ.get("BASE_URL", "https://jworden-api.fly.dev")
    print(f"Fetching OpenAPI schema from {base_url}/openapi.json...")
    
    try:
        res = requests.get(f"{base_url}/openapi.json", timeout=10)
        res.raise_for_status()
        schema = res.json()
    except Exception as e:
        print(f"Failed to fetch OpenAPI schema: {e}")
        return

    paths = schema.get("paths", {})
    print(f"Found {len(paths)} unique endpoint paths. Testing concurrently...")

    tasks = []
    for path, methods in paths.items():
        method = "get" if "get" in methods else list(methods.keys())[0]
        url = f"{base_url}{path}"
        test_url = (
            url.replace("{job_id}", "123")
            .replace("{lead_id}", "123")
            .replace("{image_id}", "123")
            .replace("{key}", "123")
            .replace("{service_path}", "status")
            .replace("{service_path:path}", "status")
        )
        tasks.append((method, test_url))

    broken_endpoints = []
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        future_to_url = {executor.submit(check_endpoint, method, url): (method, url) for method, url in tasks}
        for future in concurrent.futures.as_completed(future_to_url):
            result = future.result()
            if result:
                broken_endpoints.append(result)

    duration = time.time() - start_time
    print(f"\n--- RESULTS (took {duration:.1f}s) ---")
    if not broken_endpoints:
        print("All API endpoints responded without internal server errors (500)!")
    else:
        print(f"Found {len(broken_endpoints)} broken endpoints (500 errors or timeouts):")
        for broken in broken_endpoints:
            print(f"  - {broken}")

if __name__ == "__main__":
    check_apis()
