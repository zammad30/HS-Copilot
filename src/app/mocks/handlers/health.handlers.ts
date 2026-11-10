import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config'
import { forcedErrorResponse, randomLatency } from '../scenarios'

export const healthHandlers = [
  http.get(`${env.apiBaseUrl}/health`, async ({ request }) => {
    await randomLatency()
    return forcedErrorResponse(request) ?? HttpResponse.json({ status: 'ok' })
  }),
]
