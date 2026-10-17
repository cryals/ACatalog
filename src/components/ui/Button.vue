<script setup lang="ts">
import type { ButtonHTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'outline' | 'ghost' | 'quiet'
  size?: 'default' | 'sm' | 'icon'
  class?: ButtonHTMLAttributes['class']
  type?: 'button' | 'submit' | 'reset'
}>(), { variant: 'default', size: 'default', type: 'button', class: undefined })
</script>

<template>
  <button
    :type="props.type"
    :class="cn('ui-button', `ui-button--${props.variant}`, `ui-button--${props.size}`, props.class)"
  >
    <slot />
  </button>
</template>
