import { computed, readonly, ref } from 'vue'
import type { CatalogApp, CatalogPayload } from '@/types/catalog'

const payload = ref<CatalogPayload | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
let request: Promise<void> | null = null

async function loadCatalog() {
  if (payload.value || request) return request
  loading.value = true
  request = fetch('/data/apps.json', { headers: { Accept: 'application/json' } })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      payload.value = await response.json() as CatalogPayload
    })
    .catch((reason: unknown) => { error.value = reason instanceof Error ? reason.message : 'Unknown error' })
    .finally(() => { loading.value = false })
  return request
}

export function useCatalog() {
  const apps = computed<CatalogApp[]>(() => payload.value?.apps ?? [])
  const bySlug = (slug: string) => apps.value.find((app) => app.slug === slug)
  return { payload: readonly(payload), apps, loading: readonly(loading), error: readonly(error), loadCatalog, bySlug }
}
