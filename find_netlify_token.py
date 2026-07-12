import subprocess, json, os, requests

# Get Netlify token from CLI env
result = subprocess.run(
    'npx netlify-cli api listSites',
    shell=True, capture_output=True, text=True, cwd=os.getcwd()
)

# Try to extract token from netlify config file locations
token = None
config_paths = [
    os.path.expandvars(r'%APPDATA%\xdg.config\netlify\config.json'),
    os.path.expandvars(r'%LOCALAPPDATA%\netlify\config.json'),
    os.path.expandvars(r'%USERPROFILE%\.netlify\config.json'),
    os.path.expandvars(r'%APPDATA%\netlify\config.json'),
]

for path in config_paths:
    if os.path.exists(path):
        print(f"Found config at: {path}")
        with open(path) as f:
            data = json.load(f)
        print(json.dumps(data, indent=2)[:500])
        break
else:
    print("Config not found in standard locations, searching...")
    # Search more broadly
    base = os.path.expandvars('%APPDATA%')
    for root, dirs, files in os.walk(base):
        for fn in files:
            if 'config' in fn.lower() and 'netlify' in root.lower():
                print(os.path.join(root, fn))
