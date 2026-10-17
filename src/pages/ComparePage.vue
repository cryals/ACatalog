<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import Button from '@/components/ui/Button.vue'
import { useCatalog } from '@/composables/useCatalog'
import { usePersistedSet } from '@/composables/usePersistedSet'
import { formatDate, formatNumber } from '@/lib/utils'
const { apps, loadCatalog } = useCatalog()
const compare = usePersistedSet('acatalog-compare')
onMounted(loadCatalog)
const selected = computed(() => apps.value.filter((app) => compare.has(app.slug)).slice(0, 4))
</script>
<template>
  <main id="main-content" class="shell page-main compare-page">
    <section class="page-heading"><p class="eyebrow">COMPARE</p><h1>Сравнение</h1><p>До четырёх приложений рядом — без рейтинга, только факты из источников.</p></section>
    <div v-if="selected.length" class="compare-wrap">
      <table><thead><tr><th>Параметр</th><th v-for="app in selected" :key="app.id"><AppIcon :src="app.iconPath" :name="app.name" size="sm" /><RouterLink :to="`/apps/${app.slug}`">{{ app.name }}</RouterLink><Button variant="ghost" size="icon" :aria-label="`Убрать ${app.name} из сравнения`" @click="compare.remove(app.slug)"><Trash2 :size="15" /></Button></th></tr></thead>
      <tbody><tr><th>Категории</th><td v-for="app in selected" :key="app.id">{{ app.categories.join(', ') }}</td></tr><tr><th>GitHub stars</th><td v-for="app in selected" :key="app.id">{{ formatNumber(app.githubStars) }}</td></tr><tr><th>Лицензия</th><td v-for="app in selected" :key="app.id">{{ app.license ?? '—' }}</td></tr><tr><th>Compose</th><td v-for="app in selected" :key="app.id">{{ app.compose ? 'Есть' : 'Нет' }}</td></tr><tr><th>Последнее обновление</th><td v-for="app in selected" :key="app.id">{{ formatDate(app.lastPushedAt) }}</td></tr><tr><th>Полнота</th><td v-for="app in selected" :key="app.id">{{ app.quality.completeness }}%</td></tr></tbody></table>
    </div>
    <section v-else class="empty-state"><h2>Список сравнения пуст</h2><p>Добавьте приложения кнопкой сравнения в каталоге.</p><RouterLink class="primary-link" to="/">Выбрать приложения</RouterLink></section>
  </main>
</template>
