<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '@/utils/timeFormat'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['toggle', 'remove', 'dragstart', 'dragover-card', 'dragend', 'open'])

const relativeTime = computed(() => formatRelativeTime(props.task.createdAt))

const cardClass = computed(() => ({
  'task-card--starred': props.task.starred,
  'task-card--urgent': props.task.urgent
}))

function onToggle(flag) {
  emit('toggle', props.task.id, flag)
}

function onRemove() {
  emit('remove', props.task.id)
}

function onDragStart(event) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.task.id)
  }
  emit('dragstart', props.task.id)
}

function onDragEnd() {
  emit('dragend', props.task.id)
}

function onDragOverCard(event) {
  event.stopPropagation()
  emit('dragover-card', props.task.id)
}

function onKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('open', props.task.id)
  }
}
</script>

<template>
  <article
    class="task-card"
    :class="cardClass"
    :data-task-id="task.id"
    draggable="true"
    tabindex="0"
    role="button"
    :aria-label="`任务：${task.title}`"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover="onDragOverCard"
    @dblclick="emit('open', task.id)"
    @keydown="onKeydown"
  >
    <div class="task-card__head">
      <h4 class="task-card__title">{{ task.title }}</h4>
      <div class="task-card__actions">
        <button
          class="icon-btn task-card__action"
          :class="{ 'is-active-star': task.starred }"
          type="button"
          :aria-pressed="task.starred"
          :title="task.starred ? '取消星标' : '标记星标'"
          @click.stop="onToggle('starred')"
        >
          {{ task.starred ? '⭐' : '☆' }}
        </button>
        <button
          class="icon-btn task-card__action"
          :class="{ 'is-active-urgent': task.urgent }"
          type="button"
          :aria-pressed="task.urgent"
          :title="task.urgent ? '取消紧急' : '标记紧急'"
          @click.stop="onToggle('urgent')"
        >
          🔥
        </button>
        <button
          class="icon-btn task-card__action task-card__action--danger"
          type="button"
          title="删除任务"
          @click.stop="onRemove"
        >
          🗑️
        </button>
      </div>
    </div>

    <p v-if="task.description" class="task-card__desc">{{ task.description }}</p>

    <div class="task-card__meta">
      <span v-if="task.category" class="task-card__tag">{{ task.category }}</span>
      <span class="task-card__time">{{ relativeTime }}</span>
    </div>

    <span class="task-card__grip" aria-hidden="true">⋮⋮</span>
  </article>
</template>

<style scoped>
.task-card {
  position: relative;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  cursor: grab;
  transition: transform var(--transition-base), box-shadow var(--transition-base),
    border-color var(--transition-base);
  animation: fade-in-up var(--transition-base);
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-soft);
}

.task-card:active {
  cursor: grabbing;
}

.task-card--starred {
  background: linear-gradient(135deg, var(--color-warning-soft), var(--color-surface) 60%);
}

.task-card--urgent {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 1px var(--color-danger-soft), var(--shadow-sm);
  animation: fade-in-up var(--transition-base), pulse-ring 2.4s ease-out infinite;
}

.task-card--urgent::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--space-3);
  bottom: var(--space-3);
  width: 3px;
  border-radius: var(--radius-full);
  background: var(--color-danger);
}

.task-card__head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.task-card__title {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}

.task-card__actions {
  display: flex;
  gap: 2px;
  opacity: 0.55;
  transition: opacity var(--transition-fast);
}

.task-card:hover .task-card__actions,
.task-card:focus-within .task-card__actions {
  opacity: 1;
}

.task-card__action {
  width: 26px;
  height: 26px;
  font-size: 13px;
  filter: grayscale(1);
  opacity: 0.7;
}

.task-card__action:hover {
  filter: none;
  opacity: 1;
}

.task-card__action.is-active-star,
.task-card__action.is-active-urgent {
  filter: none;
  opacity: 1;
}

.task-card__action--danger:hover {
  background: var(--color-danger-soft);
}

.task-card__desc {
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.task-card__tag {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-card__grip {
  position: absolute;
  right: 6px;
  bottom: 2px;
  color: var(--color-text-muted);
  font-size: 10px;
  letter-spacing: -2px;
  opacity: 0.4;
}
</style>