<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { themes, current, previewing, previewTheme, cancelPreview, setTheme } = useTheme()

const open = ref(false)
const rootEl = ref(null)
const emit = defineEmits(['change'])

const currentLabel = computed(() => themes.find((theme) => theme.id === current.value))

function toggle() {
  if (open.value) cancelPreview()
  open.value = !open.value
}

function choose(id) {
  setTheme(id)
  open.value = false
  emit('change', themes.find((theme) => theme.id === id))
}

function onHover(id) {
  previewTheme(id)
}

function onLeave() {
  cancelPreview()
}

function onDocumentClick(event) {
  if (!open.value) return
  if (rootEl.value && !rootEl.value.contains(event.target)) {
    cancelPreview()
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div class="theme-selector" ref="rootEl">
    <button
      class="theme-selector__trigger"
      type="button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      title="切换主题"
      @click="toggle"
    >
      <span aria-hidden="true">{{ currentLabel.icon }}</span>
      <span class="theme-selector__label">{{ currentLabel.name }}</span>
      <span class="theme-selector__caret" :class="{ 'is-open': open }" aria-hidden="true">▾</span>
    </button>

    <Transition name="pop">
      <ul v-if="open" class="theme-menu" role="listbox" aria-label="主题列表" @mouseleave="onLeave">
        <li
          v-for="theme in themes"
          :key="theme.id"
          class="theme-menu__item"
          :class="{ 'is-active': theme.id === current, 'is-preview': theme.id === previewing }"
          role="option"
          :aria-selected="theme.id === current"
          @mouseenter="onHover(theme.id)"
          @click="choose(theme.id)"
        >
          <span class="theme-menu__swatch" :style="{ background: theme.preview[0] }"></span>
          <span class="theme-menu__swatch" :style="{ background: theme.preview[1] }"></span>
          <span class="theme-menu__swatch" :style="{ background: theme.preview[2] }"></span>
          <span class="theme-menu__text">
            <strong>{{ theme.icon }} {{ theme.name }}</strong>
            <small>{{ theme.description }}</small>
          </span>
          <span v-if="theme.id === current" class="theme-menu__check">✓</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.theme-selector {
  position: relative;
}

.theme-selector__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: border-color var(--transition-fast), color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.theme-selector__trigger:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.theme-selector__caret {
  font-size: 10px;
  transition: transform var(--transition-fast);
}

.theme-selector__caret.is-open {
  transform: rotate(180deg);
}

.theme-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: var(--z-dropdown);
  width: 240px;
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}

.theme-menu__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.theme-menu__item:hover,
.theme-menu__item.is-preview {
  background: var(--color-primary-soft);
}

.theme-menu__item.is-active {
  background: var(--color-bg-soft);
}

.theme-menu__swatch {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
}

.theme-menu__text {
  display: flex;
  flex-direction: column;
  margin-left: var(--space-2);
  line-height: 1.3;
  flex: 1;
}

.theme-menu__text strong {
  font-size: var(--font-size-base);
}

.theme-menu__text small {
  font-size: 11px;
  color: var(--color-text-muted);
}

.theme-menu__check {
  color: var(--color-primary);
  font-weight: 700;
}

@media (max-width: 640px) {
  .theme-selector__label {
    display: none;
  }
}
</style>