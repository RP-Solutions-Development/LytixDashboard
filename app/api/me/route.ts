import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { validateSession } from '@/lib/auth-db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value
    const sessionToken = cookieStore.get('sessionToken')?.value

    if (!sessionId || !sessionToken) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
    const profile = await validateSession(sessionId, tokenHash)

    if (!profile) {
      return NextResponse.json(
        { data: null, error: 'Session invalid or expired' },
        { status: 401 }
      )
    }

    return NextResponse.json({ data: profile, error: null })
  } catch (error) {
    console.error('Error in /api/me:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

