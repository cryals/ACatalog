<script setup lang="ts">
import { LayoutGrid, List } from '@lucide/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppCard from '@/components/AppCard.vue'
import Button from '@/components/ui/Button.vue'
import { useCatalog } from '@/composables/useCatalog'
import { usePersistedSet } from '@/composables/usePersistedSet'
import { filterAndSortApps } from '@/lib/search'
import type { SortKey } from '@/types/catalog'

const props = withDefaults(defineProps<{ favoritesOnly?: boolean }>(), { favoritesOnly: false })
const route = useRoute()
const { apps, loading, error, loadCatalog } = useCatalog()
const favorites = usePersistedSet('acatalog-favorites')
const compare = usePersistedSet('acatalog-compare')
const view = ref<'grid' | 'list'>((localStorage.getItem('acatalog-view') as 'grid' | 'list' | null) ?? 'grid')
const initialPageSize = window.matchMedia('(max-width: 720px)').matches ? 12 : 24
const shown = ref(initialPageSize)

const sourceApps = computed(() => props.favoritesOnly ? apps.value.filter((app) => favorites.has(app.slug)) : apps.value)
const filters = computed(() => ({ query: String(route.query.q ?? ''), category: String(route.query.category ?? ''), license: String(route.query.license ?? ''), architecture: String(route.query.arch ?? ''), composeOnly: route.query.compose === '1', sort: ((route.query.sort as SortKey) ?? 'relevance') }))
const filtered = computed(() => filterAndSortApps(sourceApps.value, filters.value))
const visible = computed(() => filtered.value.slice(0, shown.value))

onMounted(loadCatalog)
watch(() => route.query, () => { shown.value = initialPageSize }, { deep: true })
watch(view, (value) => localStorage.setItem('acatalog-view', value))
</script>

<template>
  <main id="main-content" class="shell page-main catalog-page">
    <header class="catalog-intro">
      <h1 v-if="!props.favoritesOnly">Найдите сервис,<br />который останется вашим.</h1>
      <h1 v-else>Ваше избранное.</h1>
    </header>

    <div class="results-toolbar">
      <p aria-live="polite"><strong>{{ filtered.length }}</strong> {{ filtered.length === 1 ? 'приложение' : 'приложений' }}</p>
      <div class="view-switch" role="group" aria-label="Вид каталога">
        <Button :variant="view === 'grid' ? 'outline' : 'ghost'" size="icon" aria-label="Плитка" :aria-pressed="view === 'grid'" @click="view = 'grid'"><LayoutGrid :size="18" aria-hidden="true" /></Button>
        <Button :variant="view === 'list' ? 'outline' : 'ghost'" size="icon" aria-label="Список" :aria-pressed="view === 'list'" @click="view = 'list'"><List :size="18" aria-hidden="true" /></Button>
      </div>
    </div>

    <div v-if="loading" class="loading-grid" aria-live="polite"><div v-for="item in 8" :key="item" class="card-skeleton" /></div>
    <section v-else-if="error" class="empty-state" role="alert"><h2>Каталог не загрузился</h2><p>{{ error }}</p><Button @click="loadCatalog">Попробовать снова</Button></section>
    <section v-else-if="visible.length" class="catalog-grid" :class="{ 'catalog-grid--list': view === 'list' }" aria-label="Результаты поиска">
      <AppCard v-for="app in visible" :key="app.id" :app="app" :favorite="favorites.has(app.slug)" :compared="compare.has(app.slug)" @favorite="favorites.toggle" @compare="compare.toggle" />
    </section>
    <section v-else class="empty-state"><h2>Ничего не найдено</h2><p>Измените запрос или сбросьте фильтры в боковом меню.</p></section>
    <div v-if="shown < filtered.length" class="load-more"><Button variant="outline" @click="shown += 24; nextTick()">Показать ещё</Button></div>
  </main>
</template>
