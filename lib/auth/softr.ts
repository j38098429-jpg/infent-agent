export type WebsiteProfile = {
  auth_user_id: string
  name: string
  email: string
  registered_at: string
  last_login_at: string | null
  email_confirmed_at: string | null
  softr_record_id: string | null
  revision: number
  sync_token: string
}

export type SoftrRecord = { id: string; fields: Record<string, unknown> }
export const USER_FIELDS = {
  name: 'lEehx', email: 'ULDyS', createdAt: 'uQNi9',
  authId: 'tQzYN', registeredAt: 'zJY8Z', lastLoginAt: 'AzaZz', status: 'OiDYX',
} as const

export class SoftrUsers {
  private base: string
  constructor(private key: string, databaseId: string, tableId: string, private request: typeof fetch = fetch) {
    this.base = `https://tables-api.softr.io/api/v1/databases/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(tableId)}/records`
  }

  private async call(path: string, method: string, body?: unknown) {
    const response = await this.request(this.base + path, {
      method, headers: { 'Content-Type': 'application/json', 'Softr-Api-Key': this.key },
      body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error(`SOFTR_HTTP_${response.status}`)
    return response.json()
  }

  private async find(field: string, value: string): Promise<SoftrRecord[]> {
    const result = await this.call('/search', 'POST', {
      filter: { condition: { operator: 'IS', leftSide: field, rightSide: value } },
      paging: { offset: 0, limit: 2 },
    })
    if (!Array.isArray(result.data)) throw new Error('SOFTR_BAD_RESPONSE')
    if (result.data.length > 1) throw new Error('SOFTR_DUPLICATE_PROFILE')
    return result.data
  }

  async sync(profile: WebsiteProfile): Promise<{ id: string } | { deferred: true }> {
    const matching = await this.find(USER_FIELDS.authId, profile.auth_user_id)
    let existing = matching[0]
    if (!existing) {
      const byEmail = await this.find(USER_FIELDS.email, profile.email.toLowerCase())
      const candidate = byEmail[0]
      if (candidate) {
        const attached = candidate.fields[USER_FIELDS.authId]
        if (attached && attached !== profile.auth_user_id) throw new Error('SOFTR_IDENTITY_CONFLICT')
        // An unverified signup cannot claim a teammate's manually created record.
        if (!profile.email_confirmed_at) return { deferred: true }
        existing = candidate
      }
    }
    const fields: Record<string, unknown> = {
      [USER_FIELDS.name]: profile.name,
      [USER_FIELDS.email]: profile.email.toLowerCase(),
      [USER_FIELDS.authId]: profile.auth_user_id,
      [USER_FIELDS.registeredAt]: profile.registered_at,
      [USER_FIELDS.status]: profile.email_confirmed_at ? 'Active' : 'Pending Verification',
    }
    if (profile.last_login_at) fields[USER_FIELDS.lastLoginAt] = profile.last_login_at
    if (!existing) fields[USER_FIELDS.createdAt] = profile.registered_at.slice(0, 10)
    const result = await this.call(existing ? `/${encodeURIComponent(existing.id)}` : '', existing ? 'PATCH' : 'POST', { fields })
    if (typeof result.data?.id !== 'string') throw new Error('SOFTR_BAD_RESPONSE')
    return { id: result.data.id }
  }
}
