export interface RippleOptions {
  color?: string
  duration?: number
}

export function createRipple(event: MouseEvent, options: RippleOptions = {}): void {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  if (typeof window !== 'undefined' && window.matchMedia) {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media && media.matches) return
  }

  const rect = target.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const ripple = document.createElement('span')

  ripple.className = 'ripple-wave'
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`
  ripple.style.background = options.color || 'currentColor'
  ripple.style.animationDuration = `${options.duration || 620}ms`

  target.appendChild(ripple)
  window.setTimeout(() => {
    ripple.remove()
  }, options.duration || 620)
}

export function useRipple(options: RippleOptions = {}) {
  const vRipple = (event: MouseEvent) => createRipple(event, options)
  return { createRipple: vRipple }
}