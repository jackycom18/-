<script setup>
import { ref } from 'vue'
import TaskCard from './TaskCard.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  taskList: {
    type: Array,
    default: () => []
  },
  draggingId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['move', 'toggle', 'remove', 'open-task', 'drag-state'])

const isOver = ref(false)
const dropIndex = ref(-1)

const emptyPresets = {
  todo: { icon: '🗒️', title: '暂无待办', hint: '点右上角 ＋ 记录第一件事' },
  doing: { icon: '🚀', title: '暂无进行中', hint: '从待办列拖一个任务过来' },
  done: { icon: '🏆', title: '暂无已完成', hint: '完成后拖到这里庆祝一下' }
}

function onDragEnter(event) {
  event.preventDefault()
  isOver.value = true
}

function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  isOver.value = true
  dropIndex.value = computeIndex(event)
}

function onDragLeave(event) {
  if (event.currentTarget && event.currentTarget.contains(event.relatedTarget)) return
  isOver.value = false
  dropIndex.value = -1
}

function onDrop(event) {
  event.preventDefault()
  const taskId = event.dataTransfer.getData('text/plain')
  const index = computeIndex(event)
  isOver.value = false
  dropIndex.value = -1
  if (taskId) emit('move', taskId, props.column.id, index)
}

function computeIndex(event) {
  const cards = Array.from(event.currentTarget.querySelectorAll('[data-task-id]'))
  const y = event.clientY
  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i].getBoundingClientRect()
    if (y < rect.top + rect.height / 2) return i
  }
  return cards.length
}

function onDragStart(taskId) {
  emit('drag-state', { dragging: true, taskId })
}

function onDragEnd() {
  isOver.value = false
  dropIndex.value = -1
  emit('drag-state', { dragging: false, taskId: '' })
}

function onToggle(id, flag) {
  emit('toggle', id, flag)
}

function onRemove(id) {
  emit('remove', id)
}
</script>

<template>
  <section
    class="kanban-column"
    :class="{ 'is-over': isOver }"
    :data-column-id="column.id"
    :aria-label="column.title"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <header class="kanban-column__head" :style="{ '--column-color': column.color }">
      <span class="kanban-column__dot" aria-hidden="true"></span>
      <h3 class="kanban-column__title">{{ column.title }}</h3>
      <span class="kanban-column__count">{{ taskList.length }}</span>
    </header>

    <div class="kanban-column__body">
      <TransitionGroup name="list" tag="div" class="kanban-column__list">
        <TaskCard
          v-for="(task, index) in taskList"
          :key="task.id"
          :task="task"
          :index="index"
          :class="{
            'is-dragging': draggingId === task.id,
            'is-drop-before': isOver && dropIndex === index
          }"
          @toggle="onToggle"
          @remove="onRemove"
          @open="(id) => emit('open-task', id)"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
        />
      </TransitionGroup>

      <div v-if="isOver && dropIndex >= taskList.length" class="kanban-column__drop-line"></div>

      <EmptyState
        v-if="taskList.length === 0"
        v-bind="emptyPresets[column.id]"
        :title="isOver ? '松手即可放入' : emptyPresets[column.id].title"
        :hint="isOver ? `放入「${column.title}」列` : emptyPresets[column.id].hint"
      />
    </div>
  </section>
</template>

<style scoped>
.kanban-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-surface) 72%, transparent);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-base), border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.kanban-column.is-over {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.kanban-column__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2) var(--space-3);
}

.kanban-column__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--column-color);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--column-color) 18%, transparent);
}

.kanban-column__title {
  font-size: var(--font-size-md);
  font-weight: 700;
}

.kanban-column__count {
  min-width: 24px;
  padding: 0 8px;
  border-radius: var(--radius-full);
  background: var(--color-bg-soft);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-align: center;
}

.kanban-column__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 120px;
  overflow-y: auto;
  padding-right: 2px;
}

.kanban-column__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.kanban-column__list :deep(.is-dragging) {
  opacity: 0.35;
  transform: scale(0.98) rotate(-1deg);
}

.kanban-column__list :deep(.is-drop-before) {
  box-shadow: 0 -3px 0 0 var(--color-primary);
}

.kanban-column__drop-line {
  height: 3px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  animation: fade-in-up var(--transition-fast);
}
</style>