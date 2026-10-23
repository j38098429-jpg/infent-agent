"use client"

import { DashProvider } from '@/lib/dash-store'
import { NightStudy } from '@/components/academy/NightStudy'
import { AcademyProvider } from '@/components/academy/AcademyProvider'
import { AccountTools } from '@/components/auth/AccountTools'

export function AppShell({ user }: { user: { id: string; name: string } }) {
  return <DashProvider><AcademyProvider key={user.id} user={user}><NightStudy /><AccountTools name={user.name} /></AcademyProvider></DashProvider>
}
