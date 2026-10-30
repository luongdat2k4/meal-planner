import { lang } from '../shared/i18n'
import { loadCatalog } from './catalog'
import { loadCatalogText } from './catalogText'
import { openDatabases } from './database'

/** Opens catalog.db and runtime.db and loads the i18n files; call once before mounting the app. */
export async function initBackend() {
  await Promise.all([openDatabases(), loadCatalogText(['vn', 'en', lang.value])])
  loadCatalog()
}
