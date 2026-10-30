import { createApp } from 'vue'
import './app/style.css'
import App from './app/App.vue'
import { router } from './app/router'

createApp(App).use(router).mount('#app')
