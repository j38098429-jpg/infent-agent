import { NextResponse } from 'next/server'
import { z } from 'zod'

export const credentials = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(8).max(128),
})
export const registration = credentials.extend({ name: z.string().trim().min(1).max(80) })

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return Boolean(origin && origin === new URL(request.url).origin)
}

export async function readBody(request: Request) {
  if (!sameOrigin(request)) throw new Error('BAD_ORIGIN')
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('BAD_INPUT')
  if (Number(request.headers.get('content-length')) > 8192) throw new Error('BAD_INPUT')
  const text = await request.text()
  if (text.length > 8192) throw new Error('BAD_INPUT')
  try { return JSON.parse(text) as unknown } catch { throw new Error('BAD_INPUT') }
}

export function authJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export function authFailure(error: unknown) {
  if (error instanceof z.ZodError || (error instanceof Error && ['BAD_INPUT', 'BAD_ORIGIN'].includes(error.message))) {
    return authJson({ error: 'INVALID_REQUEST' }, 400)
  }
  // Never include request bodies, passwords, tokens or provider error details.
  return authJson({ error: 'SERVICE_UNAVAILABLE' }, 503)
}
