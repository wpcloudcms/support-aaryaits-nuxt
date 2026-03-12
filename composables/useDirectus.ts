import {
  createDirectus,
  rest,
  authentication,
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  type DirectusClient,
  type RestClient,
  type AuthenticationClient,
} from '@directus/sdk'
import type { Schema } from '~/types'

let client: DirectusClient<Schema> & RestClient<Schema> & AuthenticationClient<Schema>

export function useDirectus() {
  const config = useRuntimeConfig()

  if (!client) {
    client = createDirectus<Schema>(config.public.directusUrl)
      .with(authentication('json', { autoRefresh: true, msRefreshBeforeExpires: 30000 }))
      .with(rest())
  }

  return {
    client,
    readItems,
    readItem,
    createItem,
    updateItem,
    deleteItem,
  }
}
