<script setup lang="ts">
import { computed, ref } from 'vue'
import { safeIconPath } from '@/lib/utils'
const props = defineProps<{ src: string; name: string; size?: 'sm' | 'md' | 'lg' }>()
const failed = ref(false)
const safeSrc = computed(() => safeIconPath(props.src))
const initials = props.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
</script>
<template>
  <span class="app-icon" :class="`app-icon--${props.size ?? 'md'}`" aria-hidden="true">
    <img v-if="!failed && safeSrc" :src="safeSrc" alt="" width="64" height="64" loading="lazy" decoding="async" @error="failed = true" />
    <span v-else>{{ initials }}</span>
  </span>
</template>
