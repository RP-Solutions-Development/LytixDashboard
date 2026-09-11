import { cookies } from 'next/headers'
import crypto from 'crypto'
import { validateSession } from './auth-db'

export interface Session {
  userId: string
  email: string
  displayName: string
  role: 'admin' | 'client'
  isActive: boolean
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value
    const sessionToken = cookieStore.get('sessionToken')?.value

    if (!sessionId || !sessionToken) {
      return null
    }

    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
    const session = await validateSession(sessionId, tokenHash)

    if (!session) {
      return null
    }

    return {
      userId: session.userId,
      email: session.email,
      displayName: session.displayName,
      role: session.role,
      isActive: session.isActive,
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}
