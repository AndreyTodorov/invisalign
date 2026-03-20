import type { ReactNode } from 'react'
import BottomNav from './BottomNav'
import DevBanner from '../DevBanner'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <DevBanner />
      <main className="flex-1 overflow-y-auto" style={{ overflowX: 'hidden', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
