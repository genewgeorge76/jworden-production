import { NextResponse } from 'next/server'

// In production, this will be your Render server URL
const BRAIN_URL = process.env.BRAIN_URL || 'https://jwordenoperations.onrender.com'
const MASTER_KEY = process.env.JWORDEN_MASTER_KEY || 'dev_override_key_123'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Encrypted API call to the Python backend
    const response = await fetch(`${BRAIN_URL}/api/v1/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': MASTER_KEY
      },
      body: JSON.stringify({
        name: body.name || 'Unknown',
        phone: body.phone || 'Unknown',
        address: body.address || 'Unknown'
      })
    })

    if (!response.ok) {
      console.error(`Brain API Error: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: 'Connection to Brain failed' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error forwarding data to Python Brain:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
