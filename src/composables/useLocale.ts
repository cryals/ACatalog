import { computed, watch } from 'vue'
import { i18n, localeMeta, supportedLocales, type AppLocale } from '@/i18n'

const STORAGE_KEY = 'acatalog-locale'
const initial = localStorage.getItem(STORAGE_KEY)
if (supportedLocales.includes(initial as AppLocale)) i18n.global.locale.value = initial as AppLocale

watch(i18n.global.locale, (value) => {
  localStorage.setItem(STORAGE_KEY, value)
  document.documentElement.lang = value
})
document.documentElement.lang = i18n.global.locale.value

export function useLocale() {
  const locale = computed<AppLocale>(() => i18n.global.locale.value as AppLocale)
  const languages = supportedLocales.map((code) => ({ code, ...localeMeta[code] }))
  function setLocale(value: AppLocale) { i18n.global.locale.value = value }
  return { locale, languages, setLocale }
}
