<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import Button from '@/components/ui/Button.vue'
import { useCatalog } from '@/composables/useCatalog'
import { usePersistedSet } from '@/composables/usePersistedSet'
import { formatDate, formatNumber } from '@/lib/utils'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
const { apps, loadCatalog } = useCatalog()
const compare = usePersistedSet('acatalog-compare')
const { t } = useI18n()
const { locale } = useLocale()
onMounted(loadCatalog)
const selected = computed(() => apps.value.filter((app) => compare.has(app.slug)).slice(0, 4))
</script>
<template>
  <main id="main-content" class="shell page-main compare-page">
    <section class="page-heading"><p class="eyebrow">{{ t('compare.eyebrow') }}</p><h1>{{ t('compare.heading') }}</h1><p>{{ t('compare.description') }}</p></section>
    <div v-if="selected.length" class="compare-wrap">
      <table><thead><tr><th>{{ t('compare.parameter') }}</th><th v-for="app in selected" :key="app.id"><AppIcon :src="app.iconPath" :name="app.name" size="sm" /><RouterLink :to="`/apps/${app.slug}`">{{ app.name }}</RouterLink><Button variant="ghost" size="icon" :aria-label="t('compare.remove', { name: app.name })" @click="compare.remove(app.slug)"><Trash2 :size="15" /></Button></th></tr></thead>
      <tbody><tr><th>{{ t('compare.categories') }}</th><td v-for="app in selected" :key="app.id">{{ app.categories.join(', ') }}</td></tr><tr><th>GitHub stars</th><td v-for="app in selected" :key="app.id">{{ formatNumber(app.githubStars, locale) }}</td></tr><tr><th>{{ t('compare.license') }}</th><td v-for="app in selected" :key="app.id">{{ app.license ?? '—' }}</td></tr><tr><th>{{ t('compare.compose') }}</th><td v-for="app in selected" :key="app.id">{{ app.compose ? t('compare.yes') : t('compare.no') }}</td></tr><tr><th>{{ t('compare.updated') }}</th><td v-for="app in selected" :key="app.id">{{ formatDate(app.lastPushedAt, locale, t('details.noData')) }}</td></tr><tr><th>{{ t('compare.completeness') }}</th><td v-for="app in selected" :key="app.id">{{ app.quality.completeness }}%</td></tr></tbody></table>
    </div>
    <section v-else class="empty-state"><h2>{{ t('compare.empty') }}</h2><p>{{ t('compare.emptyHint') }}</p><RouterLink class="primary-link" to="/">{{ t('compare.choose') }}</RouterLink></section>
  </main>
</template>
