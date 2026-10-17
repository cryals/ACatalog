<script setup lang="ts">
import type { InputHTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{ class?: InputHTMLAttributes['class']; placeholder?: string; type?: string; ariaLabel?: string; name?: string; autocomplete?: string }>(), { class: undefined, placeholder: undefined, type: undefined, ariaLabel: undefined, name: undefined, autocomplete: undefined })
</script>
<template><input v-model="model" :type="props.type ?? 'text'" :placeholder="props.placeholder" :aria-label="props.ariaLabel" :name="props.name" :autocomplete="props.autocomplete" :class="cn('ui-input', props.class)" /></template>
