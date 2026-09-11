import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { validateSession } from './auth-db'

export interface SessionProfile {
  userId: string
  email: string
  displayName: string
  role: 'admin' | 'client'
  isActive: boolean
}

export type AuthResult =
  | { ok: true; profile: SessionProfile }
  | { ok: false; response: NextResponse }

export async function requireAuth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value
    const sessionToken = cookieStore.get('sessionToken')?.value

    if (!sessionId || !sessionToken) {
      return {
        ok: false,
        response: NextResponse.json(
          { data: null, error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }

    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
    const profile = await validateSession(sessionId, tokenHash)

    if (!profile) {
      return {
        ok: false,
        response: NextResponse.json(
          { data: null, error: 'Session invalid or expired' },
          { status: 401 }
        ),
      }
    }

    return {
      ok: true,
      profile: {
        userId: profile.userId,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        isActive: profile.isActive,
      },
    }
  } catch (error) {
    console.error('Error in authentication:', error)
    return {
      ok: false,
      response: NextResponse.json(
        { data: null, error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}
