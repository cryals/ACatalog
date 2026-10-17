<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Database, GitBranch, Image } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useCatalog } from '@/composables/useCatalog'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
const { apps, payload, loadCatalog } = useCatalog()
const { t } = useI18n()
const { locale } = useLocale()
onMounted(loadCatalog)
const stats = computed(() => [
  { label: t('quality.total'), value: apps.value.length, icon: Database },
  { label: t('quality.repository'), value: apps.value.filter((app) => app.repositoryUrl).length, icon: GitBranch },
  { label: t('quality.compose'), value: apps.value.filter((app) => app.compose).length, icon: CheckCircle2 },
  { label: t('quality.icons'), value: apps.value.filter((app) => app.quality.warnings.includes('icon_pending')).length, icon: Image },
])
const warnings = computed(() => apps.value.filter((app) => app.quality.warnings.length).sort((a, b) => a.quality.completeness - b.quality.completeness).slice(0, 100))
</script>
<template>
  <main id="main-content" class="shell page-main quality-page">
    <section class="page-heading"><p class="eyebrow">{{ t('quality.eyebrow') }}</p><h1>{{ t('quality.heading') }}</h1><p>{{ t('quality.description', { date: payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString(locale) : '—' }) }}</p></section>
    <section class="quality-stats"><article v-for="item in stats" :key="item.label"><component :is="item.icon" :size="20" /><strong>{{ item.value }}</strong><span>{{ item.label }}</span></article></section>
    <section class="warning-list"><div class="section-heading"><div><p class="eyebrow">{{ t('quality.queue') }}</p><h2>{{ t('quality.needsAttention') }}</h2></div><span>{{ warnings.length }}</span></div><RouterLink v-for="app in warnings" :key="app.id" :to="`/apps/${app.slug}`"><AlertTriangle :size="17" /><strong>{{ app.name }}</strong><span>{{ app.quality.warnings.join(', ') }}</span><code>{{ app.quality.completeness }}%</code></RouterLink></section>
  </main>
</template>
