import { useSettingsStore } from '../stores/settings'
import en from './locales/en'
import zhCN from './locales/zh-CN'

export type TranslationKey = keyof typeof en

const locales: Record<string, Record<string, string>> = {
  en,
  'zh-CN': zhCN,
}

/** Translation hook — returns a `t()` function based on current language setting */
export function useT() {
  const language = useSettingsStore((s) => s.language)
  const dict = locales[language] || locales['en']

  return function t(key: TranslationKey | string): string {
    return dict[key] || locales['en'][key] || key
  }
}
