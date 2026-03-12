// Server-side proxy — handles HTTP Basic auth + forwards JWT Bearer from client
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const raw = config.public.wpUrl as string

  // Parse embedded http-auth from URL
  const match = raw.match(/^(https?:\/\/)([^:@]+):([^@]+)@(.+)/)
  const base = match ? `${match[1]}${match[4]}` : raw
  const httpBasic = match ? `Basic ${Buffer.from(`${match[2]}:${match[3]}`).toString('base64')}` : null

  const path = getRouterParam(event, 'path')
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const targetUrl = `${base}/wp-json/${path}${queryString ? `?${queryString}` : ''}`

  const method = event.method
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(event) : undefined

  // Forward JWT token from client if present
  const clientAuth = getHeader(event, 'x-wp-auth')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(httpBasic ? { Authorization: httpBasic } : {}),
    ...(clientAuth ? { 'X-JWT-Auth': clientAuth } : {}),
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  setResponseStatus(event, res.status)
  return data
})
