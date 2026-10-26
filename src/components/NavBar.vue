<script setup>
import { computed } from 'vue'
import ThemeSelector from './ThemeSelector.vue'
import { createRipple } from '@/composables/useRipple'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add-task', 'reset', 'theme-change', 'filter-change'])

const list = computed(() => props.tasks || [])

const stats = computed(() => {
  const total = list.value.length
  const done = list.value.filter((task) => task.columnId === 'done').length
  const starred = list.value.filter((task) => task.starred).length
  const urgent = list.value.filter((task) => task.urgent).length
  return {
    total,
    done,
    starred,
    urgent,
    progress: total === 0 ? 0 : Math.round((done / total) * 100)
  }
})

function onAdd(event) {
  createRipple(event, { color: '#ffffff' })
  emit('add-task')
}

function onReset(event) {
  createRipple(event)
  emit('reset')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__inner">
      <div class="navbar__brand">
        <span class="navbar__logo" aria-hidden="true">📋</span>
        <div class="navbar__titles">
          <h1 class="navbar__title">任务管理看板</h1>
          <p class="navbar__subtitle">拖拽流转 · 数据自动保存</p>
        </div>
      </div>

      <div class="navbar__stats" aria-label="任务统计">
        <div class="stat">
          <span class="stat__value">{{ stats.total }}</span>
          <span class="stat__label">全部</span>
        </div>
        <div class="stat stat--done">
          <span class="stat__value">{{ stats.done }}</span>
          <span class="stat__label">已完成</span>
        </div>
        <div class="stat stat--star">
          <span class="stat__value">{{ stats.starred }}</span>
          <span class="stat__label">星标</span>
        </div>
        <div class="stat stat--urgent">
          <span class="stat__value">{{ stats.urgent }}</span>
          <span class="stat__label">紧急</span>
        </div>
        <div class="progress" :title="`完成进度 ${stats.progress}%`">
          <div class="progress__bar" :style="{ width: `${stats.progress}%` }"></div>
          <span class="progress__text">{{ stats.progress }}%</span>
        </div>
      </div>

      <div class="navbar__actions">
        <ThemeSelector @change="(theme) => emit('theme-change', theme)" />
        <button class="btn btn-ghost navbar__reset" type="button" @click="onReset">↺ 重置</button>
        <button class="btn btn-primary navbar__add" type="button" @click="onAdd">＋ 新增任务</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-dropdown);
  backdrop-filter: blur(14px);
  background: color-mix(in srgb, var(--color-surface) 82%, transparent);
  border-bottom: 1px solid var(--color-border);
}

.navbar__inner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-3) var(--space-6);
  min-height: var(--header-height);
  flex-wrap: wrap;
}

.navbar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.navbar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  font-size: 22px;
  background: linear-gradient(135deg, var(--color-primary-soft), color-mix(in srgb, var(--color-accent) 18%, transparent));
  box-shadow: var(--shadow-sm);
}

.navbar__title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  letter-spacing: 0.2px;
  line-height: 1.25;
}

.navbar__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.navbar__stats {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
  justify-content: center;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 52px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.stat__value {
  font-size: var(--font-size-md);
  font-weight: 800;
  line-height: 1.2;
}

.stat__label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.stat--done .stat__value {
  color: var(--color-success);
}

.stat--star .stat__value {
  color: var(--color-warning);
}

.stat--urgent .stat__value {
  color: var(--color-danger);
}

.progress {
  position: relative;
  width: 120px;
  height: 22px;
  border-radius: var(--radius-full);
  background: var(--color-bg-soft);
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-primary), var(--color-success));
  transition: width var(--transition-slow);
}

.progress__text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

@media (max-width: 960px) {
  .navbar__stats {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    gap: var(--space-3);
  }

  .progress {
    display: none;
  }
}

@media (max-width: 640px) {
  .navbar__inner {
    padding: var(--space-2) var(--space-4);
    gap: var(--space-3);
  }

  .navbar__subtitle,
  .navbar__reset {
    display: none;
  }

  .navbar__title {
    font-size: var(--font-size-md);
  }
}
</style>