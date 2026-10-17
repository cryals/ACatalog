<script setup lang="ts">
import { Check, ChevronDown, Search } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Input from '@/components/ui/Input.vue'
import { useI18n } from 'vue-i18n'

export interface FilterOption { value: string; label: string }
const props = withDefaults(defineProps<{ label: string; options: FilterOption[]; placeholder: string; searchable?: boolean }>(), { searchable: false })
const model = defineModel<string>({ default: '' })
const root = ref<HTMLElement | null>(null)
const open = ref(false)
const search = ref('')
const { t } = useI18n()
const selectedLabel = computed(() => props.options.find((item) => item.value === model.value)?.label ?? props.placeholder)
const filtered = computed(() => {
  const needle = search.value.trim().toLocaleLowerCase()
  return needle ? props.options.filter((item) => item.label.toLocaleLowerCase().includes(needle)) : props.options
})

function select(value: string) { model.value = value; open.value = false; search.value = '' }
function onDocumentClick(event: MouseEvent) { if (!root.value?.contains(event.target as Node)) open.value = false }
function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape') open.value = false }
onMounted(() => { document.addEventListener('pointerdown', onDocumentClick); document.addEventListener('keydown', onKeydown) })
onBeforeUnmount(() => { document.removeEventListener('pointerdown', onDocumentClick); document.removeEventListener('keydown', onKeydown) })
</script>

<template>
  <div ref="root" class="filter-select" :class="{ 'filter-select--open': open }">
    <button class="filter-select-trigger" type="button" :aria-expanded="open" aria-haspopup="listbox" @click="open = !open">
      <span><small>{{ props.label }}</small><strong>{{ selectedLabel }}</strong></span><ChevronDown :size="15" aria-hidden="true" />
    </button>
    <div v-if="open" class="filter-select-popover">
      <label v-if="props.searchable" class="filter-select-search"><span class="sr-only">{{ t('sidebar.search') }}</span><Search :size="15" aria-hidden="true" /><Input v-model="search" autocomplete="off" :placeholder="t('sidebar.searchPlaceholder')" :aria-label="t('sidebar.search')" /></label>
      <div class="filter-select-options" role="listbox" :aria-label="props.label">
        <button type="button" role="option" :aria-selected="model === ''" @click="select('')"><span>{{ props.placeholder }}</span><Check v-if="model === ''" :size="15" aria-hidden="true" /></button>
        <button v-for="option in filtered" :key="option.value" type="button" role="option" :aria-selected="model === option.value" @click="select(option.value)"><span>{{ option.label }}</span><Check v-if="model === option.value" :size="15" aria-hidden="true" /></button>
        <p v-if="!filtered.length">{{ t('catalog.empty') }}</p>
      </div>
    </div>
  </div>
</template>
