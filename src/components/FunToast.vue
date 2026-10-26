<script setup>
import { useToast } from '@/composables/useToast'
import { randomToastMessage } from '@/config/toastMessages'

const { toasts, remove } = useToast()

const icons = {
  create: '📝',
  move: '🔄',
  star: '⭐',
  urgent: '🔥',
  delete: '🗑️',
  reset: '♻️',
  error: '⚠️',
  theme: '🎨'
}

function onEnter(event) {
  const bar = event.currentTarget.querySelector('.toast__bar')
  if (bar) bar.style.animationPlayState = 'paused'
}

function onLeave(event) {
  const bar = event.currentTarget.querySelector('.toast__bar')
  if (bar) bar.style.animationPlayState = 'running'
}

defineExpose({ randomToastMessage })
</script>

<template>
  <div class="toast-container" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        role="status"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
        @click="remove(toast.id)"
      >
        <span class="toast__icon" aria-hidden="true">{{ icons[toast.type] || '💬' }}</span>
        <span class="toast__msg">{{ toast.message }}</span>
        <span class="toast__bar" :style="{ animationDuration: `${toast.duration}ms` }"></span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  right: var(--space-6);
  bottom: var(--space-6);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 220px;
  max-width: 360px;
  padding: 12px 16px 14px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
}

.toast--error {
  border-left-color: var(--color-danger);
}

.toast--star {
  border-left-color: var(--color-warning);
}

.toast--urgent {
  border-left-color: var(--color-danger);
}

.toast--move,
.toast--reset {
  border-left-color: var(--color-success);
}

.toast__icon {
  font-size: 16px;
}

.toast__msg {
  flex: 1;
  word-break: break-word;
}

.toast__bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--color-primary);
  opacity: 0.3;
  transform-origin: left center;
  animation: toast-shrink linear forwards;
}

@keyframes toast-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.toast-enter-active {
  transition: all var(--transition-base);
}

.toast-leave-active {
  transition: all var(--transition-fast);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (max-width: 640px) {
  .toast-container {
    left: var(--space-4);
    right: var(--space-4);
    bottom: var(--space-4);
  }

  .toast {
    min-width: 0;
    max-width: none;
  }
}
</style>