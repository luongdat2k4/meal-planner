import { createApp } from 'vue'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import './app/style.css'
import App from './app/App.vue'
import { router } from './app/router'

createApp(App).use(router).mount('#app')
