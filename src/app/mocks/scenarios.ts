import { HttpResponse } from 'msw'

const MIN_LATENCY_MS = 300
const MAX_LATENCY_MS = 700

/** Resolves after a random delay in the design-approved mock latency range. */
export function randomLatency(): Promise<void> {
  const delay = Math.floor(Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS + 1)) + MIN_LATENCY_MS
  return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Lets any handler simulate a failure on demand via `?forceError=<code>`,
 * without hard-coding error cases per endpoint.
 */
export function forcedErrorResponse(request: Request): Response | null {
  const forceError = new URL(request.url).searchParams.get('forceError')
  if (!forceError) return null

  return HttpResponse.json(
    { error: { code: forceError, message: `Simulated ${forceError} error` } },
    { status: forceError === 'not_found' ? 404 : 500 },
  )
}
