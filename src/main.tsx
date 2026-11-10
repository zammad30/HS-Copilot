import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from './app/bootstrap/AppProviders'
import { router } from './app/router/router'
import { env } from '@/shared/config'
import './app/styles/global.scss'

async function enableMocking(): Promise<void> {
  if (!env.useMocks) return

  const { worker } = await import('./app/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
      </AppProviders>
    </StrictMode>,
  )
})
