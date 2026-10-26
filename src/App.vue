<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import NavBar from './components/NavBar.vue'
import KanbanColumn from './components/KanbanColumn.vue'
import AddTaskModal from './components/AddTaskModal.vue'
import FunToast from './components/FunToast.vue'
import Celebration from './components/Celebration.vue'
import { useKanban } from './composables/useKanban'
import { useToast } from './composables/useToast'
import { useTheme } from './composables/useTheme'
import { randomToastMessage } from './config/toastMessages'

const {
  columns,
  tasks,
  tasksByColumn,
  categories,
  stats,
  addTask,
  removeTask,
  toggleTask,
  moveTask,
  resetBoard,
  flush
} = useKanban()

const { show } = useToast()
const { initTheme } = useTheme()

const modalVisible = ref(false)
const filterCategory = ref('')
const filterStarred = ref(false)
const filterUrgent = ref(false)
const draggingId = ref('')
const celebrate = ref(false)
const celebrateEffect = ref('confetti')
const draggingTaskId = ref('')

const categoryOptions = computed(() => {
  const set = new Set(categories.value)
  tasks.value.forEach((task) => {
    if (task.category) set.add(task.category)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

const filteredTasks = computed(() => {
  return tasks.value.filter((task) => {
    if (filterCategory.value && task.category !== filterCategory.value) return false
    if (filterStarred.value && !task.starred) return false
    if (filterUrgent.value && !task.urgent) return false
    return true
  })
})

const filteredByColumn = computed(() => {
  const grouped = {}
  columns.value.forEach((column) => {
    grouped[column.id] = []
  })
  filteredTasks.value.forEach((task) => {
    if (!grouped[task.columnId]) grouped[task.columnId] = []
    grouped[task.columnId].push(task)
  })
  return grouped
})

const hasFilter = computed(() => Boolean(filterCategory.value) || filterStarred.value || filterUrgent.value)
const filteredCount = computed(() => filteredTasks.value.length)

const filterSummary = computed(() => {
  const parts = []
  if (filterCategory.value) parts.push(`分类「${filterCategory.value}」`)
  if (filterStarred.value) parts.push('星标')
  if (filterUrgent.value) parts.push('紧急')
  return parts.join(' + ')
})

function toast(type) {
  show(randomToastMessage(type), type)
}

function openModal() {
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
}

function handleSubmit(payload) {
  const task = addTask(payload)
  if (!task) {
    toast('error')
    return
  }
  modalVisible.value = false
  toast('create')
}

function handleRemove(id) {
  if (removeTask(id)) toast('delete')
}

function handleToggle(id, flag) {
  if (!toggleTask(id, flag)) return
  toast(flag === 'starred' ? 'star' : 'urgent')
}

function handleMove(taskId, columnId, index) {
  const task = tasks.value.find((item) => item.id === taskId)
  const fromColumn = task ? task.columnId : ''
  const result = moveTask(taskId, columnId, index)
  if (!result) return
  if (fromColumn === columnId) {
    toast('move')
    return
  }
  if (columnId === 'done') {
    triggerCelebration(task)
    return
  }
  toast('move')
}

function triggerCelebration(task) {
  if (!task) return
  const effects = ['confetti', 'stars', 'hearts']
  celebrateEffect.value = effects[Math.floor(Math.random() * effects.length)]
  celebrate.value = true
  show(`🎉 「${task.title}」完成啦！`, 'move', 2600)
}

function onCelebrationComplete() {
  celebrate.value = false
}

function handleReset() {
  if (tasks.value.length === 0) {
    show('看板已经是空的啦', 'reset', 2000)
    return
  }
  const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
    ? window.confirm('确定要清空所有任务吗？此操作不可撤销。')
    : true
  if (!confirmed) return
  resetBoard()
  filterCategory.value = ''
  filterStarred.value = false
  filterUrgent.value = false
  toast('reset')
}

function handleThemeChange(theme) {
  if (!theme) return
  show(`已切换到「${theme.name}」主题`, 'theme', 2000)
}

function handleDragState({ dragging, taskId }) {
  draggingId.value = dragging ? taskId : ''
}

function handleDragStart(taskId) {
  draggingTaskId.value = taskId
}

function toggleStarFilter() {
  filterStarred.value = !filterStarred.value
}

function toggleUrgentFilter() {
  filterUrgent.value = !filterUrgent.value
}

function clearFilters() {
  filterCategory.value = ''
  filterStarred.value = false
  filterUrgent.value = false
}

function onKeydown(event) {
  const tag = event.target && event.target.tagName
  const editable = tag === 'INPUT' || tag === 'TEXTAREA' || (event.target && event.target.isContentEditable)
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n' && !editable) {
    event.preventDefault()
    openModal()
  }
}

function onBeforeUnload() {
  flush()
}

watch(
  () => [
    columns.value.map((column) => column.id).join(','),
    tasks.value.length,
    tasks.value.map((task) => `${task.id}:${task.columnId}:${task.starred}:${task.urgent}`).join('|')
  ],
  () => {
    if (filterCategory.value && !categoryOptions.value.includes(filterCategory.value)) {
      filterCategory.value = ''
    }
  }
)

onMounted(async () => {
  initTheme()
  await nextTick()
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
  flush()
})
</script>

<template>
  <div class="app-shell">
    <NavBar
      :tasks="tasks"
      @add-task="openModal"
      @reset="handleReset"
      @theme-change="handleThemeChange"
    />

    <main class="app-main">
      <section class="toolbar">
        <div class="toolbar__filters">
          <label class="filter-select">
            <span class="filter-select__icon" aria-hidden="true">🏷️</span>
            <select v-model="filterCategory" aria-label="按分类筛选">
              <option value="">全部分类</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

          <button
            class="chip"
            :class="{ 'is-active': filterStarred }"
            type="button"
            :aria-pressed="filterStarred"
            @click="toggleStarFilter"
          >
            ⭐ 只看星标
          </button>

          <button
            class="chip chip--urgent"
            :class="{ 'is-active': filterUrgent }"
            type="button"
            :aria-pressed="filterUrgent"
            @click="toggleUrgentFilter"
          >
            🔥 只看紧急
          </button>

          <button v-if="hasFilter" class="chip chip--clear" type="button" @click="clearFilters">
            ✕ 清除筛选
          </button>
        </div>

        <div class="toolbar__summary">
          <template v-if="hasFilter">
            <span class="toolbar__hint">筛选：{{ filterSummary }}</span>
            <span class="toolbar__badge">{{ filteredCount }} / {{ stats.total }}</span>
          </template>
          <span v-else class="toolbar__hint">共 {{ stats.total }} 个任务 · 完成度 {{ stats.progress }}%</span>
        </div>
      </section>

      <div class="board" :class="{ 'is-dragging': Boolean(draggingId) }">
        <KanbanColumn
          v-for="column in columns"
          :key="column.id"
          :column="column"
          :task-list="filteredByColumn[column.id] || []"
          :dragging-id="draggingId"
          @move="handleMove"
          @toggle="handleToggle"
          @remove="handleRemove"
          @open-task="(id) => (draggingTaskId = id)"
          @drag-state="handleDragState"
        />
      </div>

      <p class="app-tip">
        小提示：拖拽卡片即可在三列之间流转，按
        <kbd>Ctrl</kbd> + <kbd>N</kbd> 快速新增任务
      </p>
    </main>

    <AddTaskModal
      v-if="modalVisible"
      :columns="columns"
      :existing-categories="categoryOptions"
      :visible="modalVisible"
      @submit="handleSubmit"
      @close="closeModal"
    />

    <FunToast />
    <Celebration :visible="celebrate" :effect="celebrateEffect" @complete="onCelebrationComplete" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-6);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.toolbar__filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-select {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.filter-select:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.filter-select select {
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 2px 0;
  max-width: 160px;
}

.filter-select select:focus {
  outline: none;
}

.chip {
  padding: 7px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--transition-fast);
}

.chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.chip.is-active {
  background: var(--color-warning-soft);
  border-color: var(--color-warning);
  color: var(--color-text);
}

.chip--urgent.is-active {
  background: var(--color-danger-soft);
  border-color: var(--color-danger);
}

.chip--clear {
  border-style: dashed;
}

.chip--clear:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.toolbar__summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.toolbar__badge {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.board.is-dragging :deep(.kanban-column) {
  border-style: dashed;
}

.app-tip {
  margin-top: var(--space-6);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.app-tip kbd {
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 11px;
  font-family: inherit;
}

@media (max-width: 900px) {
  .board {
    grid-template-columns: 1fr;
  }

  .app-main {
    padding: var(--space-4);
  }
}
</style>