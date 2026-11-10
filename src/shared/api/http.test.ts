import { describe, expect, it } from 'vitest'
import { http } from './http'

describe('http', () => {
  it('resolves the mocked /health endpoint through the fetch wrapper', async () => {
    const result = await http.get<{ status: string }>('/health')
    expect(result.status).toBe('ok')
  })
})
