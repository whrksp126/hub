import { collectionHandlers } from '@/lib/content-routes'

export const runtime = 'nodejs'

export const { GET, POST } = collectionHandlers('posts')
