import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import './styles.css'

document.documentElement.classList.add('dark')
document.documentElement.style.colorScheme = 'dark'
localStorage.removeItem('acatalog-theme')

createApp(App).use(router).use(i18n).mount('#app')
