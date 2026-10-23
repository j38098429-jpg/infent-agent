import { AuthForm } from '@/components/auth/AuthForm'
import { authConfigured } from '@/lib/auth/config'

export const metadata = { title: 'Sign in · omniAI' }
export const dynamic = 'force-dynamic'

export default function LoginPage({ searchParams }: { searchParams: { notice?: string } }) {
  return <AuthForm mode="login" configured={authConfigured()} notice={searchParams.notice} />
}
