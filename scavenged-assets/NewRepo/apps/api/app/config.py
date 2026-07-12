from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # Core
    environment: str = 'development'
    debug: bool = False
    jworden_master_key: str = 'change-me'
    jwt_secret_key: str = 'change-me-jwt'
    jwt_algorithm: str = 'HS256'

    # Database
    database_url: str = 'sqlite:///./dev.db'

    # Redis / Celery
    redis_url: str = 'redis://localhost:6379/0'

    # Claude
    anthropic_api_key: str = ''

    # OpenAI (vision inspector, blog draft, voice transcription)
    openai_api_key: str = ''

    # Stripe
    stripe_secret_key: str = ''
    stripe_webhook_secret: str = ''

    # Notifications
    sendgrid_api_key: str = ''
    sendgrid_from_email: str = 'no-reply@jwordenasphaltpaving.com'
    portal_base_url: str = 'https://www.jwordenasphaltpaving.com/portal'
    heartbeat_email: str = ''  # daily system-alive summary recipient; empty = disabled
    twilio_account_sid: str = ''
    twilio_auth_token: str = ''
    twilio_from_number: str = ''

    # Gallery / file storage
    gallery_storage_path: str = './gallery_uploads'
    s3_bucket: str = ''
    s3_region: str = 'us-east-1'
    aws_access_key_id: str = ''
    aws_secret_access_key: str = ''

    # VDOT scraper
    vdot_bids_url: str = 'https://www.vdot.virginia.gov/business/construction-division/advertisement/'

    # Vector search / RAG
    pinecone_api_key: str = ''
    pinecone_index_name: str = 'worden-knowledge'
    pinecone_environment: str = 'us-east-1-aws'

    # Google (GBP, Gemini)
    gemini_api_key: str = ''
    google_api_key: str = ''           # alias for gemini_api_key; runtime_config reads either
    gbp_oauth_token: str = ''
    gbp_location_id: str = ''          # accounts/{acc}/locations/{loc}

    # Wave 6 — multi-provider LLM router
    perplexity_api_key: str = ''       # Perplexity Sonar Pro (web research)
    xai_api_key: str = ''              # xAI Grok 4 (social signal / X firehose)
    jarvis_max_tier: str = 'opus'      # "opus" | "sonnet" — caps Jarvis spend
    llm_fallback_silent: str = '1'     # "1" silently fall through on provider error
    llm_disabled_providers: str = ''   # comma-separated provider denylist

    # Wave 6 — Vapi outbound voice calling
    vapi_api_key: str = ''
    vapi_phone_number_id: str = ''
    vapi_assistant_id: str = ''

    # Wave 6 — autonomy state persistence
    jarvis_autonomy_state_path: str = ''

    # Admin 2FA
    admin_username: str = 'admin'
    admin_pin: str = ''                 # 4-digit PIN fallback
    totp_issuer: str = 'WordenStandard'

    # Celery
    celery_always_eager: bool = False   # set True in dev to run tasks synchronously

    # Permit scraper
    vpt_api_url: str = 'https://permits.virginiapermit.org/api'

    # Wave 4 — Property Scan → Direct Mail
    regrid_api_key: str = ''          # Regrid parcel data; empty = mock mode
    google_maps_api_key: str = ''     # Google Maps Static API (aerial imagery); empty = mock
    lob_api_key: str = ''             # Lob direct mail; empty = mock send
    lob_from_name: str = 'J. Worden & Sons'   # Business name for Lob "from" address

    # QuickBooks Online
    quickbooks_client_id: str = ''
    quickbooks_client_secret: str = ''
    quickbooks_access_token: str = ''
    quickbooks_refresh_token: str = ''
    quickbooks_realm_id: str = ''
    quickbooks_redirect_uri: str = 'http://localhost:5174/oauth/qb'
    quickbooks_sandbox: bool = True

    # SaaS billing — Stripe plan price IDs for licensees
    stripe_price_starter: str = ''     # Price ID for $299/mo starter plan
    stripe_price_pro: str = ''         # Price ID for $599/mo pro plan
    stripe_price_enterprise: str = ''  # Price ID for $1499/mo enterprise plan

    # Monitoring
    sentry_dsn: str = ''


settings = Settings()
