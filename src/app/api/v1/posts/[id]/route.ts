import { itemHandlers } from '@/lib/content-routes'

export const runtime = 'nodejs'

export const { GET, PATCH, DELETE } = itemHandlers('posts')
