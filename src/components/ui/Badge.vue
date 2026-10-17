<script setup lang="ts">
import { cn } from '@/lib/utils'
const props = withDefaults(defineProps<{ variant?: 'default' | 'muted' | 'compose' | 'outline'; class?: string }>(), { variant: 'default', class: undefined })
</script>
<template><span :class="cn('ui-badge', `ui-badge--${props.variant}`, props.class)"><slot /></span></template>
