import test from 'node:test'
import assert from 'node:assert/strict'
import { SoftrUsers, USER_FIELDS, type WebsiteProfile } from '../lib/auth/softr'
import { credentials, registration, sameOrigin } from '../lib/auth/http'

const profile: WebsiteProfile = {
  auth_user_id: 'auth-1', name: 'Example learner', email: 'learner@example.com',
  registered_at: '2026-10-23T03:00:00.000Z', last_login_at: null, email_confirmed_at: null,
  softr_record_id: null, revision: 1, sync_token: 'lease-1',
}

function mockSoftr(responses: unknown[]) {
  const calls: { url: string; method: string; body: any }[] = []
  const request = (async (input: any, init: any) => {
    calls.push({ url: String(input), method: init.method, body: init.body ? JSON.parse(init.body) : undefined })
    assert.ok(responses.length, 'Unexpected network call')
    return Response.json(responses.shift())
  }) as typeof fetch
  return { client: new SoftrUsers('test-only-key', 'db', 'users', request), calls }
}

test('new signup creates only approved profile fields and no password', async () => {
  const { client, calls } = mockSoftr([{ data: [] }, { data: [] }, { data: { id: 'record-1' } }])
  assert.deepEqual(await client.sync(profile), { id: 'record-1' })
  const write = calls[2]
  assert.equal(write.method, 'POST')
  assert.equal(write.body.fields[USER_FIELDS.authId], 'auth-1')
  assert.equal(write.body.fields[USER_FIELDS.status], 'Pending Verification')
  assert.equal(write.body.fields[USER_FIELDS.createdAt], '2026-10-23')
  assert.equal(Object.keys(write.body.fields).length, 6)
  assert.equal(JSON.stringify(write.body).includes('password'), false)
})

test('subsequent logins update the same profile without creating another record', async () => {
  const { client, calls } = mockSoftr([{ data: [{ id: 'record-1', fields: { [USER_FIELDS.authId]: 'auth-1' } }] }, { data: { id: 'record-1' } }])
  await client.sync({ ...profile, email_confirmed_at: profile.registered_at, last_login_at: profile.registered_at })
  assert.equal(calls.length, 2)
  assert.equal(calls[1].method, 'PATCH')
  assert.ok(calls[1].url.endsWith('/record-1'))
  assert.equal(calls[1].body.fields[USER_FIELDS.status], 'Active')
  assert.equal(calls[1].body.fields[USER_FIELDS.lastLoginAt], profile.registered_at)
  assert.equal(USER_FIELDS.createdAt in calls[1].body.fields, false)
})

test('unverified signup cannot claim a manually added team member profile', async () => {
  const { client, calls } = mockSoftr([{ data: [] }, { data: [{ id: 'seed-1', fields: {} }] }])
  assert.deepEqual(await client.sync(profile), { deferred: true })
  assert.equal(calls.length, 2)
  assert.equal(calls.some(call => call.method === 'PATCH'), false)
})

test('verified teammate signup reuses the seed profile and preserves existing progress links', async () => {
  const { client, calls } = mockSoftr([{ data: [] }, { data: [{ id: 'seed-1', fields: {} }] }, { data: { id: 'seed-1' } }])
  await client.sync({ ...profile, email_confirmed_at: profile.registered_at })
  assert.equal(calls[2].method, 'PATCH')
  assert.ok(calls[2].url.endsWith('/seed-1'))
  assert.equal('SmPrK' in calls[2].body.fields, false)
})

test('another Auth ID with the same email causes a conflict instead of an overwrite', async () => {
  const { client, calls } = mockSoftr([{ data: [] }, { data: [{ id: 'other', fields: { [USER_FIELDS.authId]: 'auth-other' } }] }])
  await assert.rejects(client.sync({ ...profile, email_confirmed_at: profile.registered_at }), /IDENTITY_CONFLICT/)
  assert.equal(calls.length, 2)
})

test('ambiguous profile matches stop synchronization', async () => {
  const { client } = mockSoftr([{ data: [{ id: 'one' }, { id: 'two' }] }])
  await assert.rejects(client.sync(profile), /DUPLICATE_PROFILE/)
})

test('registration normalizes email and rejects invalid data', () => {
  assert.equal(registration.parse({ name: ' Learner ', email: ' Person@Example.com ', password: 'test-only-password' }).email, 'person@example.com')
  assert.equal(credentials.safeParse({ email: 'invalid', password: 'test-only-password' }).success, false)
  assert.equal(registration.safeParse({ name: '', email: 'a@example.com', password: '123' }).success, false)
})

test('auth writes require the same origin', () => {
  assert.equal(sameOrigin(new Request('https://infent.example/api/auth/login', { headers: { origin: 'https://attacker.example' } })), false)
  assert.equal(sameOrigin(new Request('https://infent.example/api/auth/login', { headers: { origin: 'https://infent.example' } })), true)
  assert.equal(sameOrigin(new Request('https://infent.example/api/auth/login')), false)
})
