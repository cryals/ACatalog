<script setup lang="ts">
import { Bookmark, Box, GitCompareArrows, Menu, Search, ShieldCheck, SlidersHorizontal, Tags, X } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import FilterSelect, { type FilterOption } from '@/components/ui/FilterSelect.vue'
import { useCatalog } from '@/composables/useCatalog'
import type { SortKey } from '@/types/catalog'

const open = ref(false)
const filtersOpen = ref(false)
const compact = useMediaQuery('(max-width: 1060px)')
const route = useRoute()
const router = useRouter()
const { apps, loadCatalog } = useCatalog()
const catalogRoute = computed(() => route.name === 'catalog' || route.name === 'favorites')

const toOptions = (items: string[]): FilterOption[] => items.map((item) => ({ value: item, label: item }))
const licenses = computed(() => toOptions([...new Set(apps.value.map((app) => app.license).filter((item): item is string => Boolean(item)))].sort()))
const architectures = computed(() => toOptions([...new Set(apps.value.flatMap((app) => app.architectures))].sort()))
const sortOptions: FilterOption[] = [{ value: 'relevance', label: 'По релевантности' }, { value: 'stars', label: 'По GitHub stars' }, { value: 'updated', label: 'По обновлению' }, { value: 'name', label: 'По названию' }]
const categoryEntries = computed(() => {
  const counts = new Map<string, number>()
  for (const app of apps.value) for (const item of app.categories) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts].sort(([a], [b]) => a.localeCompare(b))
})

function queryValue(key: string) { return String(route.query[key] ?? '') }
function setQuery(key: string, value: string | boolean, defaultValue = '') {
  const nextQuery = { ...route.query }
  const normalized = typeof value === 'boolean' ? (value ? '1' : '') : value
  if (!normalized || normalized === defaultValue) delete nextQuery[key]
  else nextQuery[key] = normalized
  void router.replace({ path: catalogRoute.value ? route.path : '/', query: nextQuery })
}

const query = computed({ get: () => queryValue('q'), set: (value: string) => setQuery('q', value) })
const category = computed({ get: () => queryValue('category'), set: (value: string) => setQuery('category', value) })
const license = computed({ get: () => queryValue('license'), set: (value: string) => setQuery('license', value) })
const architecture = computed({ get: () => queryValue('arch'), set: (value: string) => setQuery('arch', value) })
const composeOnly = computed({ get: () => route.query.compose === '1', set: (value: boolean) => setQuery('compose', value) })
const sort = computed<SortKey>({ get: () => (route.query.sort as SortKey) ?? 'relevance', set: (value) => setQuery('sort', value, 'relevance') })
const activeFilterCount = computed(() => Number(Boolean(license.value)) + Number(Boolean(architecture.value)) + Number(composeOnly.value))
watch(activeFilterCount, (count) => { if (count) filtersOpen.value = true }, { immediate: true })

function clearFilters() { license.value = ''; architecture.value = ''; composeOnly.value = false }
function selectCategory(value: string) { category.value = category.value === value ? '' : value }
async function focusSearch() {
  if (!catalogRoute.value) await router.push('/')
  if (compact.value) open.value = true
  await nextTick()
  document.querySelector<HTMLInputElement>('#app-sidebar input[name="catalog-search"]')?.focus()
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    void focusSearch()
  }
}

watch(() => route.path, () => { open.value = false })
onMounted(() => { void loadCatalog(); window.addEventListener('keydown', onKeydown) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Button class="sidebar-trigger" variant="outline" size="icon" :aria-expanded="open" aria-controls="app-sidebar" aria-label="Открыть меню" @click="open = true"><Menu :size="20" /></Button>
  <button v-if="open" class="sidebar-backdrop" type="button" aria-label="Закрыть меню" @click="open = false" />
  <aside id="app-sidebar" class="app-sidebar" :class="{ 'app-sidebar--open': open }" :inert="compact && !open" :aria-hidden="compact && !open ? 'true' : undefined">
    <div class="sidebar-head">
      <RouterLink class="brand" to="/" aria-label="ACatalog — на главную"><span class="brand-mark" aria-hidden="true"><span /></span><span>ACatalog</span></RouterLink>
      <Button class="sidebar-close" variant="ghost" size="icon" aria-label="Закрыть меню" @click="open = false"><X :size="20" /></Button>
    </div>

    <nav class="sidebar-nav" aria-label="Основная навигация">
      <RouterLink to="/"><Search :size="22" aria-hidden="true" /><span>Каталог</span></RouterLink>
      <RouterLink to="/favorites"><Bookmark :size="22" aria-hidden="true" /><span>Избранное</span></RouterLink>
      <RouterLink to="/compare"><GitCompareArrows :size="22" aria-hidden="true" /><span>Сравнение</span></RouterLink>
      <RouterLink to="/quality"><ShieldCheck :size="22" aria-hidden="true" /><span>Качество</span></RouterLink>
    </nav>

    <div class="sidebar-catalog-tools">
      <div class="sidebar-search-row">
        <label class="sidebar-search">
          <span class="sr-only">Поиск по каталогу</span><Search :size="17" aria-hidden="true" />
          <Input v-model="query" name="catalog-search" autocomplete="off" placeholder="Поиск…" aria-label="Поиск по каталогу" />
          <button v-if="query" class="sidebar-search-clear" type="button" aria-label="Очистить поиск" @click="query = ''"><X :size="15" aria-hidden="true" /></button>
        </label>
        <button class="sidebar-filters-button" type="button" :class="{ 'sidebar-filters-button--active': filtersOpen || activeFilterCount }" :aria-expanded="filtersOpen" aria-controls="sidebar-filter-panel" aria-label="Фильтры" title="Фильтры" @click="filtersOpen = !filtersOpen">
          <SlidersHorizontal :size="19" aria-hidden="true" />
          <span v-if="activeFilterCount">{{ activeFilterCount }}</span>
        </button>
      </div>

      <div v-if="filtersOpen" id="sidebar-filter-panel" class="sidebar-filter-panel">
        <div class="sidebar-filter-panel-head">
          <strong>Фильтры</strong>
          <button type="button" aria-label="Закрыть фильтры" @click="filtersOpen = false"><X :size="17" aria-hidden="true" /></button>
        </div>
        <FilterSelect v-model="license" label="Лицензия" :options="licenses" placeholder="Любая лицензия" />
        <FilterSelect v-if="architectures.length" v-model="architecture" label="Архитектура" :options="architectures" placeholder="Любая архитектура" />
        <label class="sidebar-check"><input v-model="composeOnly" type="checkbox" /><Box :size="16" aria-hidden="true" /><span>Только с Compose</span></label>
        <FilterSelect v-model="sort" label="Сортировка" :options="sortOptions" placeholder="По релевантности" />
        <Button v-if="activeFilterCount" variant="ghost" size="sm" @click="clearFilters"><X :size="15" aria-hidden="true" />Сбросить фильтры</Button>
      </div>

      <section class="sidebar-section" aria-labelledby="category-heading">
        <div class="sidebar-section-heading"><span id="category-heading"><Tags :size="14" aria-hidden="true" />Категории</span></div>
        <div class="sidebar-category-list" aria-label="Список категорий">
          <button type="button" :aria-pressed="!category" @click="category = ''"><span>Все категории</span><small>{{ apps.length }}</small></button>
          <button v-for="[item, count] in categoryEntries" :key="item" type="button" :aria-pressed="category === item" @click="selectCategory(item)"><span>{{ item }}</span><small>{{ count }}</small></button>
        </div>
      </section>
    </div>

    <div class="sidebar-foot"><p>SELF-HOSTED // OPEN SOURCE</p></div>
  </aside>
</template>
