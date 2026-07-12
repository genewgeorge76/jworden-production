from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=['200/minute'])

BLOG_LIMIT = '30/minute'
PAYMENTS_LIMIT = '10/minute'
VOICE_LIMIT = '10/minute'
LIEN_LIMIT = '30/minute'
CUSTOMERS_LIMIT = '60/minute'
CRM_LIMIT = '60/minute'
AI_LIMIT = '20/minute'
LEADS_LIMIT = '10/minute'     # public-facing contact form
PORTAL_LIMIT = '5/minute'     # customer portal auth
SCAN_LIMIT = '30/minute'      # scan campaign CRUD
SCAN_RUN_LIMIT = '3/minute'   # pipeline trigger — expensive
