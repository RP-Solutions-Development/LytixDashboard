import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSession } from '@/lib/session'
import { LeadsClient } from '@/components/leads-client'
import { LogoutButton } from '@/components/logout-button'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/rp-logo.png" alt="RP Solutions" width={28} height={28} className="h-7 w-auto" />
            <a href="/" className="text-sm font-semibold text-zinc-900 tracking-tight hover:text-zinc-600 transition-colors">
              PPL Dashboard
            </a>
            <span className="text-zinc-300">/</span>
            <span className="text-sm text-zinc-500">Leads</span>
          </div>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              {session.displayName}
              {session.role === 'admin' && (
                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  Admin
                </span>
              )}
            </span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <Suspense>
          <LeadsClient />
        </Suspense>
      </main>
    </div>
  )
}
