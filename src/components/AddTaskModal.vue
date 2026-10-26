<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  existingCategories: {
    type: Array,
    default: () => []
  },
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['submit', 'close'])

const form = reactive({
  title: '',
  description: '',
  category: '',
  columnId: 'todo',
  starred: false,
  urgent: false
})

const errors = reactive({ title: '' })
const showSuggestions = ref(false)
const activeSuggestion = ref(-1)
const titleInput = ref(null)
const categoryInput = ref(null)
const modalEl = ref(null)

const filteredCategories = computed(() => {
  const keyword = form.category.trim().toLowerCase()
  const list = props.existingCategories || []
  if (!keyword) return list
  return list.filter((item) => item.toLowerCase().includes(keyword) && item !== form.category)
})

function validate() {
  errors.title = form.title.trim() ? '' : '请填写任务标题'
  return !errors.title
}

function submit() {
  if (!validate()) {
    titleInput.value && titleInput.value.focus()
    return
  }
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    columnId: form.columnId,
    starred: form.starred,
    urgent: form.urgent
  })
}

function cancel() {
  emit('close')
}

function pickCategory(category) {
  form.category = category
  showSuggestions.value = false
  activeSuggestion.value = -1
}

function onCategoryKeydown(event) {
  if (!showSuggestions.value || filteredCategories.value.length === 0) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeSuggestion.value = (activeSuggestion.value + 1) % filteredCategories.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeSuggestion.value =
      (activeSuggestion.value - 1 + filteredCategories.value.length) % filteredCategories.value.length
  } else if (event.key === 'Enter' && activeSuggestion.value >= 0) {
    event.preventDefault()
    pickCategory(filteredCategories.value[activeSuggestion.value])
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') cancel()
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit()
}

function onBackdrop(event) {
  if (event.target === modalEl.value) cancel()
}

watch(
  () => form.title,
  (value) => {
    if (value.trim()) errors.title = ''
  }
)

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  titleInput.value && titleInput.value.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition name="modal" appear>
    <div class="modal-backdrop" ref="modalEl" @click="onBackdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="add-task-title">
        <header class="modal__head">
          <h2 id="add-task-title" class="modal__title">✨ 新增任务</h2>
          <button class="icon-btn" type="button" aria-label="关闭" @click="cancel">✕</button>
        </header>

        <form class="modal__form" @submit.prevent="submit">
          <label class="field" :class="{ 'has-error': errors.title }">
            <span class="field__label">标题 <em>*</em></span>
            <input
              ref="titleInput"
              v-model="form.title"
              class="field__input"
              type="text"
              placeholder="例如：完成看板拖拽功能"
              maxlength="80"
              data-test="title-input"
            />
            <span v-if="errors.title" class="field__error">{{ errors.title }}</span>
          </label>

          <label class="field">
            <span class="field__label">描述</span>
            <textarea
              v-model="form.description"
              class="field__input field__input--area"
              rows="3"
              maxlength="300"
              placeholder="补充一些细节（可选）"
              data-test="desc-input"
            ></textarea>
          </label>

          <div class="field field--autocomplete">
            <label class="field__label" for="category-input">分类</label>
            <input
              id="category-input"
              ref="categoryInput"
              v-model="form.category"
              class="field__input"
              type="text"
              placeholder="如：开发 / 设计 / 生活"
              maxlength="20"
              autocomplete="off"
              data-test="category-input"
              @focus="showSuggestions = true"
              @input="showSuggestions = true"
              @blur="showSuggestions = false"
              @keydown="onCategoryKeydown"
            />
            <ul v-if="showSuggestions && filteredCategories.length" class="suggestions">
              <li
                v-for="(category, index) in filteredCategories"
                :key="category"
                class="suggestions__item"
                :class="{ 'is-active': index === activeSuggestion }"
                @mousedown.prevent="pickCategory(category)"
              >
                🏷️ {{ category }}
              </li>
            </ul>
          </div>

          <div class="field">
            <span class="field__label">状态</span>
            <div class="segmented" role="radiogroup" aria-label="任务状态">
              <label
                v-for="column in columns"
                :key="column.id"
                class="segmented__item"
                :class="{ 'is-active': form.columnId === column.id }"
              >
                <input v-model="form.columnId" type="radio" :value="column.id" class="sr-only" />
                {{ column.title }}
              </label>
            </div>
          </div>

          <div class="toggles">
            <button
              type="button"
              class="toggle"
              :class="{ 'is-on': form.starred }"
              :aria-pressed="form.starred"
              @click="form.starred = !form.starred"
            >
              ⭐ 星标
            </button>
            <button
              type="button"
              class="toggle toggle--urgent"
              :class="{ 'is-on': form.urgent }"
              :aria-pressed="form.urgent"
              @click="form.urgent = !form.urgent"
            >
              🔥 紧急
            </button>
          </div>

          <footer class="modal__foot">
            <button class="btn btn-ghost" type="button" @click="cancel">取消</button>
            <button class="btn btn-primary" type="submit" data-test="submit">创建任务</button>
          </footer>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--overlay-color);
  backdrop-filter: blur(4px);
}

.modal {
  width: min(520px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  animation: pop-in var(--transition-base);
}

.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.modal__title {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field__label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.field__label em {
  color: var(--color-danger);
  font-style: normal;
}

.field__input {
  width: 100%;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-soft);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.field__input::placeholder {
  color: var(--color-text-muted);
}

.field__input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.field__input--area {
  resize: vertical;
  min-height: 76px;
}

.field.has-error .field__input {
  border-color: var(--color-danger);
}

.field__error {
  position: absolute;
  right: 0;
  top: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  margin-top: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  max-height: 160px;
  overflow-y: auto;
}

.suggestions__item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.suggestions__item:hover,
.suggestions__item.is-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.segmented {
  display: flex;
  gap: var(--space-1);
  padding: 4px;
  border-radius: var(--radius-full);
  background: var(--color-bg-soft);
}

.segmented__item {
  flex: 1;
  padding: 7px 0;
  border-radius: var(--radius-full);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.segmented__item.is-active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.toggles {
  display: flex;
  gap: var(--space-3);
}

.toggle {
  padding: 7px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.toggle:hover {
  border-color: var(--color-warning);
}

.toggle.is-on {
  background: var(--color-warning-soft);
  border-color: var(--color-warning);
  color: var(--color-text);
}

.toggle--urgent:hover,
.toggle--urgent.is-on {
  border-color: var(--color-danger);
}

.toggle--urgent.is-on {
  background: var(--color-danger-soft);
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>