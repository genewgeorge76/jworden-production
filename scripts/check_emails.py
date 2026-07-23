import imaplib
import email
from email.header import decode_header

DIAMOND_EMAIL = 'j.wordenandsonspaving@gmail.com'
GMAIL_APP_PASS = 'kggihfudcsrlsfny'

mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login(DIAMOND_EMAIL, GMAIL_APP_PASS)
mail.select('inbox')

# Search for emails from diamond solutions about new jobs
status, messages = mail.search(None, 'ALL')
if status == 'OK':
    msg_ids = messages[0].split()
    print(f"Found {len(msg_ids)} total emails. Checking last 20...")
    for num in reversed(msg_ids[-20:]):
        status, data = mail.fetch(num, '(RFC822)')
        if status == 'OK':
            msg = email.message_from_bytes(data[0][1])
            subject, encoding = decode_header(msg['Subject'])[0]
            if isinstance(subject, bytes):
                try:
                    subject = subject.decode(encoding if encoding else 'utf-8')
                except:
                    subject = str(subject)
            print(f"Subject: {subject}")
            if "job" in subject.lower() or "available" in subject.lower():
                print("--- BODY ---")
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == 'text/plain':
                            print(part.get_payload(decode=True).decode()[:500])
                            break
                else:
                    print(msg.get_payload(decode=True).decode()[:500])
                print("------------")
