import { setupWorker } from 'msw/browser'
import { healthHandlers } from './handlers/health.handlers'

export const worker = setupWorker(...healthHandlers)
