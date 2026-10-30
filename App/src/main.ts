import { createApp } from 'vue'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import './app/style.css'
import App from './app/App.vue'
import { router } from './app/router'
import { initBackend } from './backend'
import { t } from './shared/i18n'

// The router guard reads preferences from the database, so it must be open before the app mounts.
initBackend()
  .then(() => createApp(App).use(router).mount('#app'))
  .catch((error) => {
    console.error('Cannot open the databases', error)
    document.querySelector('#app')!.textContent = t('app.dbError')
  })
