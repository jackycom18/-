import { ref } from 'vue'
import { THEME_STORAGE_KEY, defaultTheme, getTheme, themes, type ThemeOption } from '@/config/themes'
import { applyTheme } from '@/utils/cssVariables'

const current = ref<string>(loadSavedTheme())
const previewing = ref<string | null>(null)
const activeTheme = ref<ThemeOption>(getTheme(current.value))

function loadSavedTheme(): string {
  try {
    if (typeof localStorage === 'undefined') return defaultTheme
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return themes.some((theme) => theme.id === saved) ? (saved as string) : defaultTheme
  } catch {
    return defaultTheme
  }
}

function applyById(id: string): void {
  activeTheme.value = getTheme(id)
  applyTheme(activeTheme.value.palette)
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = id
  }
}

function initTheme(): void {
  applyById(current.value)
}

function setTheme(id: string): void {
  const theme = getTheme(id)
  current.value = theme.id
  previewing.value = null
  applyById(theme.id)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id)
    }
  } catch {
    /* ignore */
  }
}

function previewTheme(id: string): void {
  if (id === current.value) return
  previewing.value = id
  activeTheme.value = getTheme(id)
  applyTheme(activeTheme.value.palette)
}

function cancelPreview(): void {
  if (!previewing.value) return
  previewing.value = null
  applyById(current.value)
}

function cycleTheme(): string {
  const index = themes.findIndex((theme) => theme.id === current.value)
  const next = themes[(index + 1) % themes.length]
  setTheme(next.id)
  return next.name
}

export function useTheme() {
  return {
    themes,
    current,
    previewing,
    activeTheme,
    initTheme,
    setTheme,
    previewTheme,
    cancelPreview,
    cycleTheme
  }
}