import { AuthForm } from '@/components/auth/AuthForm'
import { authConfigured } from '@/lib/auth/config'

export const metadata = { title: 'Create account · omniAI' }
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return <AuthForm mode="register" configured={authConfigured()} />
}
