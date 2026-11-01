// Match the API Lambda's reserved concurrency so the browser does not create
// an avoidable burst of throttled requests.
const maxConcurrent = 2
let active = 0
const waiting = []
const inflight = new Map()
const cached = new Map()

export async function publicRequest(run) {
  if (active < maxConcurrent && waiting.length === 0) active += 1
  else await new Promise(resolve => waiting.push(resolve))
  try {
    for (let attempt = 0; ; attempt++) {
      try { return await run() }
      catch (error) {
        // One short retry handles a transient gateway/Lambda cold-start error
        // without leaving the public page waiting through a long retry chain.
        if (error.status !== 503 || attempt >= 1) throw error
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }
  } finally {
    const next = waiting.shift()
    if (next) next()
    else active -= 1
  }
}

export function dedupedPublicRequest(key, run) {
  if (inflight.has(key)) return inflight.get(key)
  const task = publicRequest(run).finally(() => { inflight.delete(key) })
  inflight.set(key, task)
  return task
}

export function cachedPublicRequest(key, run, ttlMs = 5000) {
  const entry = cached.get(key)
  if (entry && Date.now() - entry.time < ttlMs) return Promise.resolve(entry.value)
  return dedupedPublicRequest(key, run).then(value => {
    cached.set(key, { value, time:Date.now() })
    return value
  })
}

// A route can render the last value immediately while the effect refreshes it.
// Public content is safe to keep in memory; the server remains the source of truth.
export function peekPublicRequest(key) {
  return cached.get(key)?.value
}

export function clearPublicRequestCache() {
  cached.clear()
}
