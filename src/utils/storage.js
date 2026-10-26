export const STORAGE_KEY = 'task-kanban-state'

export const defaultColumns = [
    { id: 'todo', title: '待办', color: '#4f7cff' },
    { id: 'doing', title: '进行中', color: '#f5a524' },
    { id: 'done', title: '已完成', color: '#17b26a' }
]

export function createDefaultState() {
    return {
        columns: defaultColumns.map((column) => ({...column })),
        tasks: []
    }
}

function isValidTask(task) {
    return (
        task &&
        typeof task === 'object' &&
        typeof task.id === 'string' &&
        typeof task.title === 'string' &&
        typeof task.columnId === 'string'
    )
}

export function normalizeState(raw) {
    const fallback = createDefaultState()
    if (!raw || typeof raw !== 'object') return fallback

    const columnIds = defaultColumns.map((column) => column.id)
    const tasks = Array.isArray(raw.tasks) ?
        raw.tasks.filter(isValidTask).map((task) => ({
            id: task.id,
            title: task.title,
            description: typeof task.description === 'string' ? task.description : '',
            category: typeof task.category === 'string' ? task.category : '',
            columnId: columnIds.includes(task.columnId) ? task.columnId : 'todo',
            starred: Boolean(task.starred),
            urgent: Boolean(task.urgent),
            createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now()
        })) : []

    return { columns: fallback.columns, tasks }
}

export function loadState() {
    try {
        if (typeof localStorage === 'undefined') return createDefaultState()
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return createDefaultState()
        return normalizeState(JSON.parse(raw))
    } catch (error) {
        console.warn('[storage] 读取失败，已降级为默认状态', error)
        return createDefaultState()
    }
}

export function saveState(state) {
    try {
        if (typeof localStorage === 'undefined') return false
        const payload = {
            columns: state && Array.isArray(state.columns) ? state.columns : defaultColumns,
            tasks: state && Array.isArray(state.tasks) ? state.tasks : []
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        return true
    } catch (error) {
        console.warn('[storage] 写入失败', error)
        return false
    }
}

export function clearState() {
    try {
        if (typeof localStorage === 'undefined') return false
        localStorage.removeItem(STORAGE_KEY)
        return true
    } catch (error) {
        console.warn('[storage] 清除失败', error)
        return false
    }
}

export function createId(prefix = 'task') {
    const random = Math.random().toString(36).slice(2, 8)
    return `${prefix}-${Date.now().toString(36)}-${random}`
}