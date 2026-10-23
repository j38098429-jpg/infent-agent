'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLang } from '@/lib/i18n'

export function AccountTools({ name }: { name: string }) {
  const { lang } = useLang()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  return <nav className="infent-account-tools" aria-label={lang === 'zh' ? '我的账号' : 'My account'}>
    <Link href="/account">{name || (lang === 'zh' ? '我的账号' : 'My account')}</Link>
    <button disabled={busy} onClick={async () => {
      setBusy(true); setFailed(false)
      try {
        const result = await fetch('/api/auth/logout', { method: 'POST' })
        if (result.ok) window.location.assign('/login')
        else { setFailed(true); setBusy(false) }
      } catch { setFailed(true); setBusy(false) }
    }}>{busy ? '…' : lang === 'zh' ? '退出登录' : 'Sign out'}</button>
    {failed && <span role="status">{lang === 'zh' ? '退出失败，请重试' : 'Please try again'}</span>}
  </nav>
}
