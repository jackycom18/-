export const THEME_STORAGE_KEY = 'task-kanban-theme'

export interface ThemePalette {
  '--color-primary': string
  '--color-primary-soft': string
  '--color-primary-hover': string
  '--color-accent': string
  '--color-bg': string
  '--color-bg-soft': string
  '--color-surface': string
  '--color-surface-hover': string
  '--color-border': string
  '--color-text': string
  '--color-text-secondary': string
  '--color-text-muted': string
  '--color-danger': string
  '--color-danger-soft': string
  '--color-warning': string
  '--color-warning-soft': string
  '--color-success': string
  '--color-success-soft': string
  '--shadow-color': string
  '--overlay-color': string
  '--bg-gradient': string
}

export interface ThemeOption {
  id: string
  name: string
  icon: string
  description: string
  preview: [string, string, string]
  palette: ThemePalette
}

export const themes: ThemeOption[] = [
  {
    id: 'light',
    name: '亮色',
    icon: '☀️',
    description: '清爽明亮的默认主题',
    preview: ['#4f7cff', '#ffffff', '#f5f7fb'],
    palette: {
      '--color-primary': '#4f7cff',
      '--color-primary-soft': 'rgba(79, 124, 255, 0.12)',
      '--color-primary-hover': '#3d68e8',
      '--color-accent': '#7c5cff',
      '--color-bg': '#f5f7fb',
      '--color-bg-soft': '#eef2fa',
      '--color-surface': '#ffffff',
      '--color-surface-hover': '#f8faff',
      '--color-border': '#e3e8f2',
      '--color-text': '#1f2937',
      '--color-text-secondary': '#5a6577',
      '--color-text-muted': '#98a2b3',
      '--color-danger': '#e5484d',
      '--color-danger-soft': 'rgba(229, 72, 77, 0.12)',
      '--color-warning': '#f5a524',
      '--color-warning-soft': 'rgba(245, 165, 36, 0.14)',
      '--color-success': '#17b26a',
      '--color-success-soft': 'rgba(23, 178, 106, 0.12)',
      '--shadow-color': 'rgba(31, 41, 55, 0.08)',
      '--overlay-color': 'rgba(17, 24, 39, 0.45)',
      '--bg-gradient': 'radial-gradient(circle at 12% 0%, #e6edff 0%, transparent 45%), radial-gradient(circle at 88% 8%, #f0e9ff 0%, transparent 40%)'
    }
  },
  {
    id: 'dark',
    name: '暗色',
    icon: '🌙',
    description: '沉浸专注的夜间主题',
    preview: ['#6b93ff', '#1d2330', '#151a24'],
    palette: {
      '--color-primary': '#6b93ff',
      '--color-primary-soft': 'rgba(107, 147, 255, 0.18)',
      '--color-primary-hover': '#86a7ff',
      '--color-accent': '#a78bfa',
      '--color-bg': '#151a24',
      '--color-bg-soft': '#1a2130',
      '--color-surface': '#1d2330',
      '--color-surface-hover': '#242c3c',
      '--color-border': '#2f394c',
      '--color-text': '#e6ebf5',
      '--color-text-secondary': '#a9b4c7',
      '--color-text-muted': '#75819a',
      '--color-danger': '#ff6b6f',
      '--color-danger-soft': 'rgba(255, 107, 111, 0.16)',
      '--color-warning': '#ffc453',
      '--color-warning-soft': 'rgba(255, 196, 83, 0.18)',
      '--color-success': '#3ddc97',
      '--color-success-soft': 'rgba(61, 220, 151, 0.16)',
      '--shadow-color': 'rgba(0, 0, 0, 0.45)',
      '--overlay-color': 'rgba(0, 0, 0, 0.65)',
      '--bg-gradient': 'radial-gradient(circle at 12% 0%, #22304d 0%, transparent 45%), radial-gradient(circle at 88% 8%, #2a2340 0%, transparent 40%)'
    }
  },
  {
    id: 'colorful',
    name: '多彩',
    icon: '🎨',
    description: '活泼明快的糖果配色',
    preview: ['#ff6fa5', '#fff8fb', '#ffeef5'],
    palette: {
      '--color-primary': '#ff6fa5',
      '--color-primary-soft': 'rgba(255, 111, 165, 0.14)',
      '--color-primary-hover': '#f4588f',
      '--color-accent': '#6ad0ff',
      '--color-bg': '#fff8fb',
      '--color-bg-soft': '#ffeef5',
      '--color-surface': '#ffffff',
      '--color-surface-hover': '#fffaff',
      '--color-border': '#f7dbea',
      '--color-text': '#3b2a34',
      '--color-text-secondary': '#7a6470',
      '--color-text-muted': '#b39fac',
      '--color-danger': '#f24b5c',
      '--color-danger-soft': 'rgba(242, 75, 92, 0.12)',
      '--color-warning': '#ffa02e',
      '--color-warning-soft': 'rgba(255, 160, 46, 0.16)',
      '--color-success': '#2ec4a0',
      '--color-success-soft': 'rgba(46, 196, 160, 0.14)',
      '--shadow-color': 'rgba(190, 96, 143, 0.14)',
      '--overlay-color': 'rgba(59, 42, 52, 0.42)',
      '--bg-gradient': 'radial-gradient(circle at 10% 0%, #ffe0ee 0%, transparent 42%), radial-gradient(circle at 90% 6%, #dff5ff 0%, transparent 42%), radial-gradient(circle at 50% 100%, #fff2d6 0%, transparent 45%)'
    }
  }
]

export const defaultTheme = 'light'

export function getTheme(id: string): ThemeOption {
  return themes.find((theme) => theme.id === id) || themes[0]
}