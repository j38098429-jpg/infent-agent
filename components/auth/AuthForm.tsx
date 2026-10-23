'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export function AuthForm({ mode, configured, notice }: { mode: 'login' | 'register'; configured: boolean; notice?: string }) {
  const { lang, toggle } = useLang()
  const tr = (zh: string, en: string) => lang === 'zh' ? zh : en
  const register = mode === 'register'
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const element = event.currentTarget
    setBusy(true); setMessage(''); setSuccess(false)
    const form = new FormData(element)
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password'), ...(register ? { name: form.get('name') } : {}) }),
      })
      const result = await response.json()
      if (!response.ok) {
        const errors: Record<string, string> = {
          LOGIN_FAILED: tr('请检查邮箱、密码，并确认已完成邮箱验证。', 'Check your email and password, and confirm your email first.'),
          REGISTRATION_FAILED: tr('暂时无法完成注册，请检查信息或稍后重试。', 'We could not complete registration. Check your details or try again later.'),
          RATE_LIMITED: tr('操作较频繁，请稍后再试。', 'Too many attempts. Please try again later.'),
          INVALID_REQUEST: tr('请填写有效的姓名、邮箱和至少 8 位的密码。', 'Enter a valid name, email and a password of at least 8 characters.'),
          SERVICE_UNAVAILABLE: tr('账号服务暂时不可用，请稍后再试。', 'The account service is temporarily unavailable. Please try again later.'),
        }
        setMessage(errors[result.error] || errors.SERVICE_UNAVAILABLE)
      } else if (result.needsConfirmation) {
        setSuccess(true)
        setMessage(tr('请查收验证邮件，在此浏览器中打开邮件链接，完成注册。若已有账号，请直接登录。', 'Check your inbox and open the confirmation link in this browser to finish signing up. If you already have an account, sign in.'))
        element.reset()
      } else {
        window.location.assign('/dashboard')
      }
    } catch { setMessage(tr('连接失败，请稍后重试。', 'Connection failed. Please try again.')) }
    finally { setBusy(false) }
  }

  return <main className="infent-auth">
    <section className="infent-auth-world" aria-label={tr('好奇心伙伴', 'Curious companions')}>
      <Link href="/" className="infent-auth-brand"><span>Ω</span> omniAI</Link>
      <div className="infent-auth-intro"><p>A LITTLE CURIOUS. A LITTLE WISER.</p><h1>{tr('每一次好奇，', 'A little curiosity.')}<br />{tr('都是新的开始。', 'A new beginning.')}</h1><p>{tr('和你的 AI 小伙伴，一起看懂投资。', 'Learn to understand investing, with your AI companions.')}</p></div>
      <div className="infent-auth-friends" aria-hidden="true">{['purple', 'orange', 'mint', 'yellow'].map(color => <div key={color} className={`infent-friend ${color}`}><i /><i /><b /></div>)}</div>
      <small>omniAI · {tr('从好奇，到有据可依。', 'Stay curious. Think clearly.')}</small>
    </section>
    <section className="infent-auth-panel">
      <button className="infent-language" onClick={toggle}>{tr('English', '中文')}</button>
      <div className="infent-auth-card">
        <p className="infent-auth-eyebrow">YOUR INVESTING JOURNEY</p>
        <h2>{register ? tr('认识一下？', 'Let’s get acquainted.') : tr('欢迎回来！', 'Welcome back!')}</h2>
        <p className="infent-auth-subtitle">{register ? tr('创建账号，开始你的投资学习。', 'Create an account and start learning.') : tr('登录，继续你的投资探索。', 'Sign in and keep exploring.')}</p>
        {!configured && <p className="infent-auth-message" role="status">{tr('真实注册登录正在配置中，请稍后再来。', 'Account registration is being configured. Please check back soon.')}</p>}
        <form onSubmit={submit}>
          {register && <label>{tr('姓名或昵称', 'Name')}<input name="name" autoComplete="name" maxLength={80} required disabled={busy || !configured} /></label>}
          <label>{tr('邮箱', 'Email')}<input name="email" type="email" autoComplete="email" maxLength={254} required disabled={busy || !configured} /></label>
          <label>{tr('密码', 'Password')}<span className="infent-password"><input name="password" type={show ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required disabled={busy || !configured} /><button type="button" onClick={() => setShow(!show)} aria-label={show ? tr('隐藏密码', 'Hide password') : tr('显示密码', 'Show password')}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
          {register && <small className="infent-auth-help">{tr('至少 8 位。注册后请查收邮箱验证邮件。', 'At least 8 characters. Check your inbox to confirm your email.')}</small>}
          <button className="infent-auth-submit" disabled={busy || !configured}>{busy ? <Loader2 className="infent-spin" size={18} /> : register ? tr('创建账号', 'Create account') : tr('登录', 'Sign in')}{!busy && <ArrowRight size={18} />}</button>
        </form>
        {(message || notice) && <p className={`infent-auth-message ${success ? 'success' : ''}`} role="status">{message || tr('验证链接已失效，或不是在注册时的浏览器打开。请尝试登录。', 'The link expired or was opened in a different browser. Please try signing in.')}</p>}
        <p className="infent-auth-alternative">{register ? tr('已经有账号？', 'Already have an account?') : tr('第一次来？', 'New here?')} <Link href={register ? '/login' : '/register'}>{register ? tr('去登录', 'Sign in') : tr('创建账号', 'Create an account')}</Link></p>
        <p className="infent-auth-footer">LEARN · EXPLORE · THINK CLEARLY</p>
      </div>
    </section>
  </main>
}
