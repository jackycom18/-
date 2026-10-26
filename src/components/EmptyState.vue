<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: '📭'
  },
  title: {
    type: String,
    default: '这里空空的'
  },
  hint: {
    type: String,
    default: '把任务拖到这里吧'
  },
  actionText: {
    type: String,
    default: ''
  },
  actionIcon: {
    type: String,
    default: '＋'
  }
})

const emit = defineEmits(['action'])
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon" aria-hidden="true">{{ props.icon }}</div>
    <p class="empty-state__title">{{ props.title }}</p>
    <p class="empty-state__hint">{{ props.hint }}</p>
    <button
      v-if="props.actionText"
      class="btn btn-ghost empty-state__action"
      type="button"
      @click="emit('action')"
    >
      <span aria-hidden="true">{{ props.actionIcon }}</span>
      {{ props.actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-8) var(--space-4);
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-muted);
  transition: border-color var(--transition-base), background-color var(--transition-base);
}

.empty-state__icon {
  font-size: 34px;
  animation: float-icon 2.8s ease-in-out infinite;
}

@keyframes float-icon {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.empty-state__title {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
}

.empty-state__action {
  margin-top: var(--space-3);
}
</style>