"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { ACADEMY_STORAGE_KEY, EMPTY_ACADEMY, readAcademy, type AcademyState } from '@/lib/academy'

type AcademyContext = { state: AcademyState; ready: boolean; storageAvailable: boolean; update: (patch: Partial<AcademyState>) => void; logout: () => void }
const Context = createContext<AcademyContext | null>(null)

export function AcademyProvider({ children, user }: { children: React.ReactNode; user?: { id: string; name: string } }) {
  const storageKey = user ? `${ACADEMY_STORAGE_KEY}:${user.id}` : ACADEMY_STORAGE_KEY
  const [state, setState] = useState<AcademyState>(EMPTY_ACADEMY)
  const [ready, setReady] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  useEffect(() => {
    try {
      const saved = readAcademy(localStorage.getItem(storageKey))
      setState({ ...saved, name: saved.name || user?.name || '' })
    } catch { setStorageAvailable(false) }
    setReady(true)
  }, [storageKey, user?.name])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch { setStorageAvailable(false) }
  }, [ready, state, storageKey])
  return <Context.Provider value={{ state, ready, storageAvailable, update: patch => setState(prev => ({ ...prev, ...patch })), logout: () => setState({ ...EMPTY_ACADEMY }) }}>{children}</Context.Provider>
}

export function useAcademy() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('AcademyProvider is required')
  return ctx
}
