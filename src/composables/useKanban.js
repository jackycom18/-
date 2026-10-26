import { computed, ref } from 'vue'
import { createId, loadState, saveState } from '@/utils/storage'

const VALID_COLUMNS = ['todo', 'doing', 'done']

export function useKanban() {
    const initial = loadState()
    const columns = ref(initial.columns.map((column) => ({...column })))
    const tasks = ref(initial.tasks.map((task) => ({...task })))

    const counters = ref({ order: 0 })
    const timers = new Map()

    function persist() {
        if (timers.has('save')) clearTimeout(timers.get('save'))
        timers.set(
            'save',
            setTimeout(() => {
                saveState({ columns: columns.value, tasks: tasks.value })
                timers.delete('save')
            }, 120)
        )
    }

    function flush() {
        if (timers.has('save')) {
            clearTimeout(timers.get('save'))
            timers.delete('save')
        }
        saveState({ columns: columns.value, tasks: tasks.value })
    }

    const tasksByColumn = computed(() => {
        const grouped = { todo: [], doing: [], done: [] }
        columns.value.forEach((column) => {
            grouped[column.id] = []
        })
        tasks.value.forEach((task) => {
            if (!grouped[task.columnId]) grouped[task.columnId] = []
            grouped[task.columnId].push(task)
        })
        return grouped
    })

    const categories = computed(() => {
        const set = new Set()
        tasks.value.forEach((task) => {
            if (task.category) set.add(task.category)
        })
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    })

    const stats = computed(() => {
        const total = tasks.value.length
        const done = tasksByColumn.value.done ? tasksByColumn.value.done.length : 0
        const urgent = tasks.value.filter((task) => task.urgent).length
        const starred = tasks.value.filter((task) => task.starred).length
        return {
            total,
            done,
            doing: tasksByColumn.value.doing ? tasksByColumn.value.doing.length : 0,
            todo: tasksByColumn.value.todo ? tasksByColumn.value.todo.length : 0,
            urgent,
            starred,
            progress: total === 0 ? 0 : Math.round((done / total) * 100)
        }
    })

    function addTask(payload) {
        const title = String((payload && payload.title) || '').trim()
        if (!title) return null
        const columnId = VALID_COLUMNS.includes(payload.columnId) ? payload.columnId : 'todo'
        counters.value.order += 1
        const task = {
            id: createId(),
            title,
            description: String((payload && payload.description) || '').trim(),
            category: String((payload && payload.category) || '').trim(),
            columnId,
            starred: Boolean(payload && payload.starred),
            urgent: Boolean(payload && payload.urgent),
            createdAt: Date.now() + counters.value.order
        }
        tasks.value.push(task)
        persist()
        return task
    }

    function removeTask(id) {
        const index = tasks.value.findIndex((task) => task.id === id)
        if (index === -1) return false
        tasks.value.splice(index, 1)
        persist()
        return true
    }

    function toggleTask(id, flag) {
        const task = tasks.value.find((item) => item.id === id)
        if (!task) return false
        if (flag === 'starred' || flag === 'urgent') {
            task[flag] = !task[flag]
            persist()
            return true
        }
        return false
    }

    function moveTask(taskId, columnId, index) {
        if (!VALID_COLUMNS.includes(columnId)) return false
        const task = tasks.value.find((item) => item.id === taskId)
        if (!task) return false
        const fromColumn = task.columnId
        const siblings = tasks.value.filter((item) => item.columnId === columnId && item.id !== taskId)
        let insertAt = siblings.length
        if (typeof index === 'number' && index >= 0 && index < siblings.length) {
            const anchor = siblings[index]
            insertAt = tasks.value.indexOf(anchor)
        } else {
            const last = siblings[siblings.length - 1]
            insertAt = last ? tasks.value.indexOf(last) + 1 : tasks.value.length
        }
        tasks.value.splice(tasks.value.indexOf(task), 1)
        tasks.value.splice(insertAt, 0, task)
        task.columnId = columnId
        persist()
        return { fromColumn, toColumn: columnId, changed: fromColumn !== columnId }
    }

    function resetBoard() {
        tasks.value = []
        counters.value.order = 0
        persist()
    }

    function replaceTasks(list) {
        tasks.value = Array.isArray(list) ? list : []
        persist()
    }

    return {
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
        replaceTasks,
        flush
    }
}