<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-content">
      <RouterView />
      <footer class="site-footer"><div class="shell"><div><span class="brand-mark brand-mark--small" aria-hidden="true"><span /></span><strong>ACatalog</strong></div><p>{{ t('footer.warning') }}</p><RouterLink to="/quality">{{ t('footer.quality') }}</RouterLink></div></footer>
    </div>
  </div>
</template>
