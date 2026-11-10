import { setupServer } from 'msw/node'
import { healthHandlers } from './handlers/health.handlers'

export const server = setupServer(...healthHandlers)
