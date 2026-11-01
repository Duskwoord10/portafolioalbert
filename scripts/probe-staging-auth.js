const origin = 'https://d34buqdfi1n3fd.cloudfront.net'
const response = await fetch(`${origin}/api/login`, { method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'nonexistent-test@example.invalid', password: 'not-a-real-password', code: '' }) })
const body = await response.json().catch(() => null)
console.log(JSON.stringify({ loginStatus: response.status,
  genericInvalidCredentials: body?.error === 'Credenciales inválidas.',
  corsOriginMatches: response.headers.get('access-control-allow-origin') === origin,
  cookieIssued: response.headers.has('set-cookie') }))
if (response.status !== 401 || body?.error !== 'Credenciales inválidas.' ||
    response.headers.has('set-cookie')) process.exitCode = 1
