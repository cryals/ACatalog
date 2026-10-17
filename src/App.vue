<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
</script>
<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-content">
      <RouterView />
      <footer class="site-footer"><div class="shell"><div><span class="brand-mark brand-mark--small" aria-hidden="true"><span /></span><strong>ACatalog</strong></div><p>Данные собраны из открытых источников. Проверяйте конфигурацию и лицензию перед запуском.</p><RouterLink to="/quality">Качество данных</RouterLink></div></footer>
    </div>
  </div>
</template>
