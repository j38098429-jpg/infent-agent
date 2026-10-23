import { AppShell } from "@/components/dash/AppShell"
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { authServer } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'omniAI · 雨夜学习室', description: '点击 omniAI 招牌进入行情与 AI 研究工作台，点击学習室进入导师学习室；CASE FILES 与 LESSONS 售货机分别打开案例练习与课程。' }

export default async function DashboardPage() {
  const { data: { user } } = await authServer().auth.getUser()
  if (!user) redirect('/login')
  return <AppShell user={{ id: user.id, name: String(user.user_metadata.name || '') }} />
}
