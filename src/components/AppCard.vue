<script setup lang="ts">
import { Bookmark, Box, Check, Code2, ExternalLink, GitCompareArrows, Star } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { formatNumber, safeExternalUrl } from '@/lib/utils'
import type { CatalogApp } from '@/types/catalog'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'

const props = defineProps<{ app: CatalogApp; favorite: boolean; compared: boolean }>()
const emit = defineEmits<{ favorite: [slug: string]; compare: [slug: string] }>()
const { t } = useI18n()
const { locale } = useLocale()
</script>
<template>
  <article class="app-card">
    <div class="card-topline">
      <AppIcon :src="props.app.iconPath" :name="props.app.name" />
      <div class="card-actions">
        <Button variant="ghost" size="icon" :aria-label="favorite ? t('card.removeFavorite') : t('card.addFavorite')" :aria-pressed="favorite" @click="emit('favorite', props.app.slug)">
          <Bookmark :size="18" :fill="favorite ? 'currentColor' : 'none'" />
        </Button>
        <Button variant="ghost" size="icon" :aria-label="compared ? t('card.removeCompare') : t('card.addCompare')" :aria-pressed="compared" @click="emit('compare', props.app.slug)">
          <Check v-if="compared" :size="18" /><GitCompareArrows v-else :size="18" />
        </Button>
      </div>
    </div>
    <div class="card-copy">
      <RouterLink class="card-title" :to="`/apps/${props.app.slug}`">{{ props.app.name }}</RouterLink>
      <p>{{ props.app.summary }}</p>
    </div>
    <div class="badge-row">
      <Badge v-if="props.app.compose" variant="compose"><Box :size="13" />Compose</Badge>
      <Badge v-for="category in props.app.categories.slice(0, 2)" :key="category" variant="muted">{{ category }}</Badge>
    </div>
    <div class="source-rail">
      <span class="source-name">{{ props.app.provenance[0]?.repoName ?? t('card.sourceUnknown') }}</span>
      <span class="source-rule" />
      <span class="stars"><Star :size="14" />{{ formatNumber(props.app.githubStars, locale) }}</span>
    </div>
    <div class="card-links">
      <a v-if="safeExternalUrl(props.app.repositoryUrl)" :href="safeExternalUrl(props.app.repositoryUrl) ?? '#'" target="_blank" rel="noopener noreferrer"><Code2 :size="16" />GitHub<span class="sr-only">{{ t('card.newTab') }}</span></a>
      <a v-if="safeExternalUrl(props.app.websiteUrl)" :href="safeExternalUrl(props.app.websiteUrl) ?? '#'" target="_blank" rel="noopener noreferrer"><ExternalLink :size="16" />{{ t('card.website') }}<span class="sr-only">{{ t('card.newTab') }}</span></a>
      <RouterLink class="details-link" :to="`/apps/${props.app.slug}`">{{ t('card.details') }}</RouterLink>
    </div>
  </article>
</template>
