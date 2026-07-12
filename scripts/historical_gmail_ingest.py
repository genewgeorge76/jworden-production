import imaplib
import email
from email.header import decode_header
import requests
import json
import os
from datetime import datetime, timedelta

# Configuration
# Run this script to ingest HISTORICAL emails into the AI Webhook.
# You will need to enable "App Passwords" for your Gmail accounts to use this.
# https://support.google.com/accounts/answer/185833?hl=en

GMAIL_USER = input("Enter Gmail Address (e.g. jworden.sales@gmail.com): ")
GMAIL_APP_PASSWORD = input("Enter Gmail App Password (16 characters): ")
WEBHOOK_URL = "http://localhost:8000/api/v1/leads/email-ingest" # Update to production URL when deployed

# Number of days to look back
DAYS_BACK = int(input("How many days of history to ingest? (e.g. 30): ") or "30")

def clean_text(text):
    if text:
        return text.replace('\r', '').strip()
    return ""

def connect_imap():
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(GMAIL_USER, GMAIL_APP_PASSWORD)
    return mail

def fetch_emails(mail):
    mail.select("inbox")
    
    date_since = (datetime.now() - timedelta(days=DAYS_BACK)).strftime("%d-%b-%Y")
    status, messages = mail.search(None, f'(SINCE "{date_since}")')
    
    email_ids = messages[0].split()
    print(f"Found {len(email_ids)} emails in the last {DAYS_BACK} days.")
    
    for email_id in email_ids:
        status, msg_data = mail.fetch(email_id, "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")
                
                from_ = msg.get("From")
                
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        content_disposition = str(part.get("Content-Disposition"))
                        
                        if content_type == "text/plain" and "attachment" not in content_disposition:
                            body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                            break
                else:
                    body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
                
                # Send to Webhook
                payload = {
                    "subject": subject or "No Subject",
                    "body": clean_text(body),
                    "from_email": from_,
                    "from_name": from_,
                    "source_account": GMAIL_USER
                }
                
                print(f"Ingesting: {subject[:50]}...")
                try:
                    res = requests.post(WEBHOOK_URL, json=payload)
                    if res.ok:
                        print("  -> Success!")
                    else:
                        print(f"  -> Failed: {res.text}")
                except Exception as e:
                    print(f"  -> Error calling webhook: {e}")

if __name__ == "__main__":
    print(f"Starting Historical Ingest for {GMAIL_USER}")
    mail_client = connect_imap()
    fetch_emails(mail_client)
    mail_client.logout()
    print("Done!")
