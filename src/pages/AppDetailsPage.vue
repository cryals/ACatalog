<script setup lang="ts">
import { ArrowLeft, Bookmark, BookOpen, Box, Check, Code2, Copy, Download, ExternalLink, GitCompareArrows, Scale, Star } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { useCatalog } from '@/composables/useCatalog'
import { usePersistedSet } from '@/composables/usePersistedSet'
import { formatDate, formatNumber, safeExternalUrl, sourceFileUrl } from '@/lib/utils'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'

const route = useRoute()
const { apps, loading, loadCatalog } = useCatalog()
const favorites = usePersistedSet('acatalog-favorites')
const compare = usePersistedSet('acatalog-compare')
const copied = ref(false)
const composeContent = ref('')
const { t } = useI18n()
const { locale } = useLocale()
onMounted(loadCatalog)
const app = computed(() => apps.value.find((item) => item.slug === route.params.slug))
watch(app, async (current) => {
  composeContent.value = current?.compose?.content ?? ''
  const contentUrl = current?.compose?.contentUrl
  if (!contentUrl || !/^\/data\/compose\/[a-f0-9]{16}\.yaml$/.test(contentUrl)) return
  try {
    const response = await fetch(contentUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    composeContent.value = await response.text()
  } catch {
    composeContent.value = t('details.loadComposeFailed')
  }
}, { immediate: true })
async function copyCompose() {
  if (!app.value?.compose || !composeContent.value) return
  const content = composeContent.value
  try {
    await navigator.clipboard.writeText(content)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1800)
}
</script>
<template>
  <main id="main-content" class="shell detail-main">
    <RouterLink class="back-link" to="/"><ArrowLeft :size="16" />{{ t('details.back') }}</RouterLink>
    <div v-if="loading" class="detail-loading" aria-live="polite">{{ t('details.loading') }}</div>
    <section v-else-if="app" class="detail-layout">
      <article class="detail-content">
        <header class="detail-header">
          <AppIcon :src="app.iconPath" :name="app.name" size="lg" />
          <div><p class="eyebrow">{{ app.categories.join(' / ') }}</p><h1>{{ app.name }}</h1><p>{{ app.summary }}</p></div>
        </header>
        <div class="detail-actions">
          <a v-if="safeExternalUrl(app.websiteUrl)" class="primary-link" :href="safeExternalUrl(app.websiteUrl) ?? '#'" target="_blank" rel="noopener noreferrer">{{ t('details.openWebsite') }}<ExternalLink :size="17" /></a>
          <a v-if="safeExternalUrl(app.repositoryUrl)" class="secondary-link" :href="safeExternalUrl(app.repositoryUrl) ?? '#'" target="_blank" rel="noopener noreferrer"><Code2 :size="17" />GitHub</a>
          <Button variant="outline" @click="favorites.toggle(app.slug)"><Bookmark :size="17" :fill="favorites.has(app.slug) ? 'currentColor' : 'none'" />{{ favorites.has(app.slug) ? t('details.favorited') : t('details.favorite') }}</Button>
          <Button variant="outline" @click="compare.toggle(app.slug)"><GitCompareArrows :size="17" />{{ compare.has(app.slug) ? t('details.compared') : t('details.compare') }}</Button>
        </div>
        <section class="detail-section"><h2>{{ t('details.about') }}</h2><p>{{ app.description }}</p><div class="badge-row"><Badge v-for="tag in [...app.tags, ...app.runtimes].slice(0, 12)" :key="tag" variant="muted">{{ tag }}</Badge></div></section>
        <section class="detail-section install-section">
          <p class="eyebrow">{{ t('details.install') }}</p>
          <h2>{{ app.compose ? t('details.composeInstall') : t('details.guideInstall') }}</h2>
          <p v-if="app.compose">{{ t('details.composeHint') }}</p>
          <p v-else>{{ t('details.guideHint') }}</p>
          <div class="install-actions">
            <a v-if="app.compose?.contentUrl" class="secondary-link" :href="app.compose.contentUrl" :download="`${app.slug}-compose.yaml`"><Download :size="17" />{{ t('details.downloadCompose') }}</a>
            <a v-if="safeExternalUrl(app.installGuideUrl ?? null)" class="secondary-link" :href="safeExternalUrl(app.installGuideUrl ?? null) ?? '#'" target="_blank" rel="noopener noreferrer"><BookOpen :size="17" />{{ t('details.openGuide') }}<ExternalLink :size="14" /></a>
          </div>
        </section>
        <section v-if="app.compose" class="detail-section compose-section">
          <div class="section-heading"><div><p class="eyebrow">{{ app.compose.sourceRepo }} / {{ app.compose.path }}</p><h2>Docker Compose</h2></div><Button variant="outline" size="sm" @click="copyCompose"><Check v-if="copied" :size="15" /><Copy v-else :size="15" />{{ copied ? t('details.copied') : t('details.copy') }}</Button></div>
          <pre tabindex="0"><code>{{ composeContent || '# Loading Compose…' }}</code></pre>
        </section>
      </article>
      <aside class="detail-aside" :aria-label="t('details.metadata')">
        <div class="fact"><span><Star :size="16" />{{ t('details.stars') }}</span><strong>{{ formatNumber(app.githubStars, locale) }}</strong></div>
        <div class="fact"><span><Scale :size="16" />{{ t('details.license') }}</span><strong>{{ app.license ?? t('details.notSpecified') }}</strong></div>
        <div class="fact"><span><Box :size="16" />{{ t('details.deployment') }}</span><strong>{{ app.compose ? t('details.composeReady') : t('details.byGuide') }}</strong></div>
        <div class="fact"><span>{{ t('details.updated') }}</span><strong>{{ formatDate(app.lastPushedAt, locale, t('details.noData')) }}</strong></div>
        <div class="quality-meter"><div><span>{{ t('details.completeness') }}</span><strong>{{ app.quality.completeness }}%</strong></div><progress :value="app.quality.completeness" max="100" /></div>
        <div class="provenance"><h2>{{ t('details.sources') }}</h2><a v-for="source in app.provenance" :key="`${source.repoName}:${source.sourcePath}`" :href="sourceFileUrl(source) ?? '#'" target="_blank" rel="noopener noreferrer"><span>{{ source.repoName }}</span><small>{{ source.sourcePath }}</small><code>{{ source.commitSha.slice(0, 10) }}</code></a></div>
      </aside>
    </section>
    <section v-else class="empty-state"><h1>{{ t('details.missing') }}</h1><p>{{ t('details.missingHint') }}</p><RouterLink class="primary-link" to="/">{{ t('details.openCatalog') }}</RouterLink></section>
  </main>
</template>
