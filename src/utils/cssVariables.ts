export type CssVariableMap = Record<string, string>

export function applyTheme(variables: CssVariableMap, root?: HTMLElement): void {
  const target = root || (typeof document !== 'undefined' ? document.documentElement : null)
  if (!target) return
  Object.entries(variables).forEach(([name, value]) => {
    target.style.setProperty(name, value)
  })
}

export function getCssVariable(name: string, root?: HTMLElement): string {
  const target = root || (typeof document !== 'undefined' ? document.documentElement : null)
  if (!target || typeof window === 'undefined') return ''
  return window.getComputedStyle(target).getPropertyValue(name).trim()
}

export function clearTheme(variables: string[], root?: HTMLElement): void {
  const target = root || (typeof document !== 'undefined' ? document.documentElement : null)
  if (!target) return
  variables.forEach((name) => target.style.removeProperty(name))
}