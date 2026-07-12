const crypto = require('node:crypto')

const TOKEN_TTL_SECONDS = 24 * 60 * 60

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signJwt(secret) {
  if (!secret) {
    throw new Error('JWT_SECRET_KEY is not set.')
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAt = nowSeconds + TOKEN_TTL_SECONDS
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(
    JSON.stringify({
      sub: 'frontend-client',
      tenant_id: 'JWORDEN_HQ',
      iat: nowSeconds,
      exp: expiresAt,
    })
  )
  const unsignedToken = `${header}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return {
    token: `${unsignedToken}.${signature}`,
    expires_at: expiresAt,
  }
}

async function fetchBackendToken() {
  const apiBase = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL
  const masterKey = process.env.JWORDEN_MASTER_KEY
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD

  if (!apiBase) {
    throw new Error('VITE_API_BASE_URL is not set.')
  }

  let response = null
  let lastError = ''

  if (masterKey) {
    response = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterKey}`,
      },
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: response.statusText }))
      lastError = body.detail || `Backend bearer token exchange failed (${response.status})`
    }
  }

  if ((!response || !response.ok) && adminUser && adminPass) {
    const basic = Buffer.from(`${adminUser}:${adminPass}`).toString('base64')
    response = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basic}`,
      },
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: response.statusText }))
      const basicError = body.detail || `Backend basic token exchange failed (${response.status})`
      lastError = lastError ? `${lastError}; ${basicError}` : basicError
    }
  }

  if (!response || !response.ok) {
    throw new Error(lastError || 'Unable to issue backend token.')
  }

  const data = await response.json()
  const nowSeconds = Math.floor(Date.now() / 1000)
  return {
    token: data.access_token,
    expires_at: nowSeconds + (data.expires_in || TOKEN_TTL_SECONDS),
  }
}

exports.handler = async (event) => {
  const headers = cors(event.headers.origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const useBackend = String(process.env.USE_BACKEND_TOKEN_ENDPOINT || 'true').toLowerCase() === 'true'
    let payload

    if (useBackend) {
      try {
        payload = await fetchBackendToken()
      } catch (backendError) {
        if (process.env.JWT_SECRET_KEY) {
          payload = signJwt(process.env.JWT_SECRET_KEY)
        } else {
          throw backendError
        }
      }
    } else {
      payload = signJwt(process.env.JWT_SECRET_KEY || '')
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unable to issue token',
      }),
    }
  }
}