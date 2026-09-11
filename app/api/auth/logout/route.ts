import { NextRequest, NextResponse } from 'next/server'
import { revokeSession } from '@/lib/auth-db'

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('sessionId')?.value

    if (sessionId) {
      await revokeSession(sessionId)
    }

    const response = NextResponse.json({ success: true })

    // Clear cookies
    response.cookies.set('sessionId', '', {
      httpOnly: true,
      secure: process.env.AUTH_COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('sessionToken', '', {
      httpOnly: true,
      secure: process.env.AUTH_COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error in /api/auth/logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
