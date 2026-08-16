import imaplib
import email
from email.header import decode_header
import requests
import json
import os
import time
import logging
from datetime import datetime

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

WEBHOOK_URL = "http://localhost:8000/api/v1/leads/email-ingest"
CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'email_accounts.json')
POLL_INTERVAL_SECONDS = 300  # 5 minutes

def clean_text(text):
    if text:
        return text.replace('\r', '').strip()
    return ""

def load_accounts():
    """
    Load accounts from the EMAIL_ACCOUNTS_JSON env var, falling back to the
    on-disk config for local development.

    App passwords grant full IMAP/SMTP access and bypass 2FA, so they belong in
    the environment rather than in a file inside this public repository.
    """
    raw = os.environ.get('EMAIL_ACCOUNTS_JSON')
    source = 'EMAIL_ACCOUNTS_JSON'
    if not raw:
        if not os.path.exists(CONFIG_FILE):
            logger.error(
                "No accounts configured: set EMAIL_ACCOUNTS_JSON or create %s "
                "(see email_accounts.example.json).", CONFIG_FILE
            )
            return []
        source = CONFIG_FILE
        with open(CONFIG_FILE, 'r') as f:
            raw = f.read()
    try:
        accounts = json.loads(raw)
    except Exception as e:
        logger.error(f"Failed to parse JSON config from {source}: {e}")
        return []
    if not isinstance(accounts, list):
        logger.error(f"Accounts in {source} must be a JSON array.")
        return []
    return [acc for acc in accounts if acc.get('active')]

def poll_account(account):
    gmail_user = account['email']
    app_password = account['app_password']
    
    if app_password == "ENTER_16_LETTER_PASSWORD_HERE":
        logger.warning(f"[{gmail_user}] Skipping. App Password has not been configured yet.")
        return

    logger.info(f"[{gmail_user}] Checking for new leads...")
    
    try:
        # Connect to Gmail
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(gmail_user, app_password)
        mail.select("inbox")
        
        # Search for all UNREAD emails
        status, messages = mail.search(None, 'UNREAD')
        email_ids = messages[0].split()
        
        if not email_ids:
            logger.info(f"[{gmail_user}] No new unread emails.")
            mail.logout()
            return
            
        logger.info(f"[{gmail_user}] Found {len(email_ids)} new unread emails. Processing...")
        
        for email_id in email_ids:
            # Fetch the email body (RFC822)
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
                    
                    # Send to AI Webhook
                    payload = {
                        "subject": subject or "No Subject",
                        "body": clean_text(body),
                        "from_email": from_,
                        "from_name": from_,
                        "source_account": gmail_user
                    }
                    
                    try:
                        res = requests.post(WEBHOOK_URL, json=payload)
                        if res.ok:
                            logger.info(f"[{gmail_user}] -> Successfully ingested lead from: {subject[:40]}")
                            # Mark as read (implicitly done by fetching RFC822, but we can be explicit if needed)
                            # mail.store(email_id, '+FLAGS', '\\Seen')
                        else:
                            logger.error(f"[{gmail_user}] -> Webhook failed: {res.text}")
                    except Exception as e:
                        logger.error(f"[{gmail_user}] -> Webhook error: {e}")
                        
        mail.logout()
        
    except imaplib.IMAP4.error as e:
        logger.error(f"[{gmail_user}] IMAP Authentication failed. Check App Password. Error: {e}")
    except Exception as e:
        logger.error(f"[{gmail_user}] Unexpected error: {e}")

def run_daemon():
    logger.info("Starting Multi-Account Email Poller Daemon...")
    while True:
        accounts = load_accounts()
        if not accounts:
            logger.warning("No active accounts found in email_accounts.json. Sleeping...")
        else:
            for account in accounts:
                poll_account(account)
                
        logger.info(f"Sleeping for {POLL_INTERVAL_SECONDS} seconds before next check...")
        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    run_daemon()
