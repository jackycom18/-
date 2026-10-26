import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    STORAGE_KEY,
    clearState,
    createDefaultState,
    createId,
    loadState,
    normalizeState,
    saveState
} from '../src/utils/storage.js'

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('无数据时返回默认状态', () => {
        const state = loadState()
        expect(state.tasks).toEqual([])
        expect(state.columns.map((column) => column.id)).toEqual(['todo', 'doing', 'done'])
    })

    it('保存后可以完整读取', () => {
        const state = {
            columns: createDefaultState().columns,
            tasks: [{
                id: 't1',
                title: '写单元测试',
                description: '覆盖 storage',
                category: '开发',
                columnId: 'doing',
                starred: true,
                urgent: false,
                createdAt: 1700000000000
            }]
        }
        expect(saveState(state)).toBe(true)
        const loaded = loadState()
        expect(loaded.tasks).toHaveLength(1)
        expect(loaded.tasks[0]).toMatchObject({ title: '写单元测试', starred: true, columnId: 'doing' })
    })

    it('JSON 格式错误时降级为默认状态', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        localStorage.setItem(STORAGE_KEY, '{ invalid json ]')
        const state = loadState()
        expect(state.tasks).toEqual([])
        expect(warn).toHaveBeenCalled()
        warn.mockRestore()
    })

    it('过滤非法任务并修正非法列', () => {
        const state = normalizeState({
            tasks: [
                { id: 'ok', title: '合法任务', columnId: 'unknown' },
                { id: 'bad' },
                null,
                'oops'
            ]
        })
        expect(state.tasks).toHaveLength(1)
        expect(state.tasks[0].columnId).toBe('todo')
        expect(state.tasks[0].description).toBe('')
    })

    it('clearState 会移除数据', () => {
        saveState({ columns: [], tasks: [] })
        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
        clearState()
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('createId 生成的 ID 唯一', () => {
        const ids = new Set(Array.from({ length: 200 }, () => createId()))
        expect(ids.size).toBe(200)
    })
})