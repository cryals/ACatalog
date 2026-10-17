<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Database, GitBranch, Image } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useCatalog } from '@/composables/useCatalog'
const { apps, payload, loadCatalog } = useCatalog()
onMounted(loadCatalog)
const stats = computed(() => [
  { label: 'Всего записей', value: apps.value.length, icon: Database },
  { label: 'С репозиторием', value: apps.value.filter((app) => app.repositoryUrl).length, icon: GitBranch },
  { label: 'С Compose', value: apps.value.filter((app) => app.compose).length, icon: CheckCircle2 },
  { label: 'Иконки ожидают проверки', value: apps.value.filter((app) => app.quality.warnings.includes('icon_pending')).length, icon: Image },
])
const warnings = computed(() => apps.value.filter((app) => app.quality.warnings.length).sort((a, b) => a.quality.completeness - b.quality.completeness).slice(0, 100))
</script>
<template>
  <main id="main-content" class="shell page-main quality-page">
    <section class="page-heading"><p class="eyebrow">DATA QUALITY</p><h1>Качество каталога</h1><p>Прозрачный отчёт о полноте импортированных данных. Сгенерирован {{ payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString('ru-RU') : '—' }}.</p></section>
    <section class="quality-stats"><article v-for="item in stats" :key="item.label"><component :is="item.icon" :size="20" /><strong>{{ item.value }}</strong><span>{{ item.label }}</span></article></section>
    <section class="warning-list"><div class="section-heading"><div><p class="eyebrow">REVIEW QUEUE</p><h2>Требуют внимания</h2></div><span>{{ warnings.length }}</span></div><RouterLink v-for="app in warnings" :key="app.id" :to="`/apps/${app.slug}`"><AlertTriangle :size="17" /><strong>{{ app.name }}</strong><span>{{ app.quality.warnings.join(', ') }}</span><code>{{ app.quality.completeness }}%</code></RouterLink></section>
  </main>
</template>
