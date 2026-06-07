import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Only protect the /os path
  if (req.nextUrl.pathname.startsWith('/os')) {
    
    const basicAuth = req.headers.get('authorization')
    
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      // Hardcoded master password for the dashboard
      // User: gene
      // Password: password123 (We can make this an ENV var later)
      const validUser = process.env.OS_USER || 'gene'
      const validPassword = process.env.OS_PASSWORD || 'password123'

      if (user === validUser && pwd === validPassword) {
        return NextResponse.next()
      }
    }

    // Force browser to prompt for basic auth
    return new NextResponse('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure JWorden OS Area"'
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/os/:path*']
}
