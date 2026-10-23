import Link from 'next/link'
import { redirect } from 'next/navigation'
import { authServer } from '@/lib/auth/server'
import { AccountTools } from '@/components/auth/AccountTools'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const { data: { user } } = await authServer().auth.getUser()
  if (!user) redirect('/login')
  const name = String(user.user_metadata.name || '')
  return <main className="infent-account-page"><Link href="/dashboard">← omniAI</Link><h1>我的账号 / My account</h1><dl>
    <dt>姓名 / Name</dt><dd>{name}</dd>
    <dt>邮箱 / Email</dt><dd>{user.email}</dd>
    <dt>注册时间 / Registered</dt><dd>{user.created_at}</dd>
    <dt>最近登录 / Last sign-in</dt><dd>{user.last_sign_in_at || '—'}</dd>
  </dl><AccountTools name={name} /></main>
}
