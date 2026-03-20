import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

  if (!CONVEX_URL) {
    throw new Error("Missing VITE_CONVEX_URL in environment variables")
  }

  // ✅ Convex client
  const convexClient = new ConvexReactClient(CONVEX_URL)

  // ✅ Convex Query Client
  const convexQueryClient = new ConvexQueryClient(convexClient)

  // ✅ React Query client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 1000 * 60 * 5,
      },
    },
  })

  convexQueryClient.connect(queryClient)

  // ✅ Router setup
  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      context: { queryClient },
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultErrorComponent: ({ error }) => (
        <div style={{ padding: 20 }}>
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
        </div>
      ),
      defaultNotFoundComponent: () => (
        <div style={{ padding: 20 }}>
          <h2>404 - Page Not Found</h2>
        </div>
      ),

      // ✅ IMPORTANT WRAP
      Wrap: ({ children }) => (
        <ConvexProvider client={convexClient}>
          {children}
        </ConvexProvider>
      ),
    }),
    queryClient,
  )

  return router
}