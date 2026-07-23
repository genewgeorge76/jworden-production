import requests

def check_apis():
    base_url = "https://jworden-api.fly.dev"
    print(f"Fetching OpenAPI schema from {base_url}/openapi.json...")
    
    try:
        res = requests.get(f"{base_url}/openapi.json", timeout=10)
        res.raise_for_status()
        schema = res.json()
    except Exception as e:
        print(f"Failed to fetch OpenAPI schema: {e}")
        return

    paths = schema.get("paths", {})
    print(f"Found {len(paths)} unique endpoint paths. Testing...")

    broken_endpoints = []
    
    for path, methods in paths.items():
        # Test just one method per path (usually GET or POST)
        method = "get" if "get" in methods else list(methods.keys())[0]
        url = f"{base_url}{path}"
        
        # Replace path parameters with a dummy ID to prevent 422/404 if possible,
        # or just expect a 422 Unprocessable Entity which means it's working.
        test_url = url.replace("{job_id}", "123").replace("{lead_id}", "123").replace("{image_id}", "123")
        
        try:
            if method == "get":
                r = requests.get(test_url, timeout=5)
            elif method == "post":
                r = requests.post(test_url, json={}, timeout=5)
            elif method == "put":
                r = requests.put(test_url, json={}, timeout=5)
            elif method == "delete":
                r = requests.delete(test_url, timeout=5)
            else:
                continue
                
            # If it's a 5xx error, it's broken
            if r.status_code >= 500:
                broken_endpoints.append(f"{method.upper()} {path} -> {r.status_code} {r.reason}")
            else:
                # 401, 403, 404, 422, 200 are all expected based on missing auth/params
                pass
                
        except requests.exceptions.RequestException as e:
            broken_endpoints.append(f"{method.upper()} {path} -> Failed to connect: {e}")

    print("\n--- RESULTS ---")
    if not broken_endpoints:
        print("All API endpoints responded without internal server errors (500)!")
    else:
        print(f"Found {len(broken_endpoints)} broken endpoints (500 errors or timeouts):")
        for broken in broken_endpoints:
            print(f"  - {broken}")

if __name__ == "__main__":
    check_apis()
