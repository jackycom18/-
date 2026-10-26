import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanColumn from '../src/components/KanbanColumn.vue'

const column = { id: 'doing', title: '进行中', color: '#f5a524' }

function makeTask(id, title) {
    return {
        id,
        title,
        description: '',
        category: '',
        columnId: 'doing',
        starred: false,
        urgent: false,
        createdAt: Date.now()
    }
}

function createTransfer(initial = {}) {
    const store = {...initial }
    return {
        effectAllowed: '',
        dropEffect: '',
        setData(key, value) {
            store[key] = value
        },
        getData(key) {
            return store[key] || ''
        }
    }
}

describe('KanbanColumn', () => {
    it('渲染列标题和任务数量', () => {
        const wrapper = mount(KanbanColumn, {
            props: { column, taskList: [makeTask('a', '任务A'), makeTask('b', '任务B')] }
        })
        expect(wrapper.find('.kanban-column__title').text()).toBe('进行中')
        expect(wrapper.find('.kanban-column__count').text()).toBe('2')
        expect(wrapper.findAll('[data-task-id]')).toHaveLength(2)
    })

    it('空列展示 EmptyState', () => {
        const wrapper = mount(KanbanColumn, { props: { column, taskList: [] } })
        expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('放下拖拽卡片时发出 move 事件', async() => {
        const wrapper = mount(KanbanColumn, {
            props: { column, taskList: [makeTask('a', '任务A')] }
        })
        const transfer = createTransfer({ 'text/plain': 'a' })
        await wrapper.trigger('drop', { dataTransfer: transfer })
        const [taskId, columnId] = wrapper.emitted('move')[0]
        expect(taskId).toBe('a')
        expect(columnId).toBe('doing')
        expect(typeof wrapper.emitted('move')[0][2]).toBe('number')
    })

    it('透传卡片的 toggle 与 remove 事件', async() => {
        const wrapper = mount(KanbanColumn, {
            props: { column, taskList: [makeTask('a', '任务A')] }
        })
        const card = wrapper.findComponent({ name: 'TaskCard' })
        card.vm.$emit('toggle', 'a', 'starred')
        card.vm.$emit('remove', 'a')
        expect(wrapper.emitted('toggle')[0]).toEqual(['a', 'starred'])
        expect(wrapper.emitted('remove')[0]).toEqual(['a'])
    })

    it('拖拽开始与结束发出 drag-state 事件', async() => {
        const wrapper = mount(KanbanColumn, {
            props: { column, taskList: [makeTask('a', '任务A')] }
        })
        const card = wrapper.findComponent({ name: 'TaskCard' })
        card.vm.$emit('dragstart', 'a')
        card.vm.$emit('dragend', 'a')
        expect(wrapper.emitted('drag-state')[0][0]).toEqual({ dragging: true, taskId: 'a' })
        expect(wrapper.emitted('drag-state')[1][0]).toEqual({ dragging: false, taskId: '' })
    })
})