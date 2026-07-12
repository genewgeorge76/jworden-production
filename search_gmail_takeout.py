import os
import sys
import imaplib
import email
from email.header import decode_header
import re
import requests

def clean_filename(name):
    if not name:
        return "attachment"
    return "".join(c for c in name if c.isalnum() or c in ['.', '_', '-'])

def download_link(url, dest_path):
    print(f"Downloading file from link: {url}")
    try:
        r = requests.get(url, stream=True, timeout=30)
        if r.status_code == 200:
            with open(dest_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Successfully downloaded to: {dest_path}")
            return True
        else:
            print(f"Failed to download from link. Status: {r.status_code}")
    except Exception as e:
        print(f"Error downloading from link: {e}")
    return False

def search_gmail():
    # Load from .env file or environment
    gmail_user = os.environ.get("GMAIL_ADDRESS")
    app_password = os.environ.get("GMAIL_APP_PASSWORD")

    # Fallback to reading from .env file directly if not in environment
    if not gmail_user or not app_password:
        env_files = ['.env', 'jwordenai operation system/.env', '.env.local']
        for env_file in env_files:
            if os.path.exists(env_file):
                with open(env_file, 'rb') as f:
                    content = f.read().replace(b'\x00', b'').decode('utf-8', errors='ignore')
                    for line in content.splitlines():
                        if line.startswith("GMAIL_ADDRESS="):
                            gmail_user = line.split("=", 1)[1].strip()
                        elif line.startswith("GMAIL_APP_PASSWORD="):
                            app_password = line.split("=", 1)[1].strip()

    if not gmail_user or not app_password:
        print("Error: GMAIL_ADDRESS or GMAIL_APP_PASSWORD is not configured in your .env file.")
        print("Please configure them using the commands provided.")
        return

    print(f"Connecting to Gmail for {gmail_user}...")
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(gmail_user, app_password)
    except Exception as e:
        print(f"Failed to login: {e}")
        return

    mail.select("inbox")
    # Search for Kickserv or export emails
    search_query = 'OR OR (SUBJECT "kickserv") (BODY "kickserv") (SUBJECT "export")'
    status, messages = mail.search(None, 'OR (SUBJECT "kickserv") (BODY "kickserv")')
    email_ids = messages[0].split()

    print(f"Found {len(email_ids)} potential emails containing 'kickserv'. Searching...")

    found_file = False
    # Check latest emails first
    for email_id in reversed(email_ids):
        status, msg_data = mail.fetch(email_id, "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")
                
                print(f"\nChecking Email: {subject.encode('ascii', errors='replace').decode('ascii')}")
                
                # Check for attachments
                for part in msg.walk():
                    content_type = part.get_content_type()
                    filename = part.get_filename()
                    if filename:
                        filename = clean_filename(filename)
                        if 'kickserv' in filename.lower() or 'export' in filename.lower() or filename.endswith('.csv') or filename.endswith('.zip'):
                            print(f"Found attachment: {filename}")
                            filepath = os.path.join(os.getcwd(), filename)
                            payload = part.get_payload(decode=True)
                            with open(filepath, 'wb') as f:
                                f.write(payload)
                            print(f"Saved attachment to: {filepath}")
                            
                            # If it's a csv, rename/copy to kickserv_export.csv
                            if filename.endswith('.csv'):
                                shutil_dest = os.path.join(os.getcwd(), 'kickserv_export.csv')
                                import shutil
                                shutil.copy(filepath, shutil_dest)
                                print(f"Prepared as: {shutil_dest}")
                                found_file = True
                                break

                if found_file:
                    break

                # If no attachment, check body for links
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        if content_type in ["text/plain", "text/html"]:
                            body += part.get_payload(decode=True).decode("utf-8", errors="ignore")
                else:
                    body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

                # Look for URLs in body
                urls = re.findall(r'https?://[^\s<>"]+|https?://[^\s<>"]+', body)
                # Look for Kickserv download URLs or export download links
                kickserv_urls = [u for u in urls if 'kickserv' in u.lower() and ('download' in u.lower() or 'export' in u.lower() or 'attachments' in u.lower())]
                
                if kickserv_urls:
                    print(f"Found potential download link in email body: {kickserv_urls[0]}")
                    dest = os.path.join(os.getcwd(), 'kickserv_export.csv')
                    if download_link(kickserv_urls[0], dest):
                        found_file = True
                        break
                    
                # Also try parsing HTML links using regex
                if "href=" in body:
                    html_links = re.findall(r'href=["\'](https?://[^"\']+)["\']', body)
                    kickserv_links = [l for l in html_links if 'kickserv' in l.lower()]
                    if kickserv_links:
                        print(f"Found potential HTML link: {kickserv_links[0]}")
                        dest = os.path.join(os.getcwd(), 'kickserv_export.csv')
                        if download_link(kickserv_links[0], dest):
                            found_file = True
                            break

        if found_file:
            break

    mail.logout()
    
    if found_file:
        print("\nSuccess! Kickserv export downloaded and prepared.")
        print("You can now run: python import_kickserv_csv.py")
    else:
        print("\nNo Kickserv export attachment or link found in the matching emails.")

if __name__ == "__main__":
    search_gmail()
