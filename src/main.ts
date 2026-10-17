import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles.css'

document.documentElement.classList.add('dark')
document.documentElement.style.colorScheme = 'dark'
localStorage.removeItem('acatalog-theme')

createApp(App).use(router).mount('#app')
