import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCard from '../src/components/TaskCard.vue'

function factory(overrides = {}) {
    return mount(TaskCard, {
        props: {
            task: {
                id: 't1',
                title: '完成任务卡片',
                description: '卡片描述',
                category: '开发',
                columnId: 'todo',
                starred: false,
                urgent: false,
                createdAt: Date.now(),
                ...overrides
            }
        }
    })
}

describe('TaskCard', () => {
    it('渲染标题、描述和分类', () => {
        const wrapper = factory()
        expect(wrapper.find('.task-card__title').text()).toBe('完成任务卡片')
        expect(wrapper.find('.task-card__desc').text()).toBe('卡片描述')
        expect(wrapper.find('.task-card__tag').text()).toBe('开发')
    })

    it('点击星标触发 toggle(starred)', async() => {
        const wrapper = factory()
        await wrapper.findAll('.task-card__action')[0].trigger('click')
        expect(wrapper.emitted('toggle')[0]).toEqual(['t1', 'starred'])
    })

    it('点击紧急触发 toggle(urgent)', async() => {
        const wrapper = factory()
        await wrapper.findAll('.task-card__action')[1].trigger('click')
        expect(wrapper.emitted('toggle')[0]).toEqual(['t1', 'urgent'])
    })

    it('点击删除触发 remove', async() => {
        const wrapper = factory()
        await wrapper.findAll('.task-card__action')[2].trigger('click')
        expect(wrapper.emitted('remove')[0]).toEqual(['t1'])
    })

    it('星标与紧急状态应用对应样式类', () => {
        const wrapper = factory({ starred: true, urgent: true })
        expect(wrapper.classes()).toContain('task-card--starred')
        expect(wrapper.classes()).toContain('task-card--urgent')
    })

    it('卡片带 draggable 属性并触发 dragstart', async() => {
        const wrapper = factory()
        expect(wrapper.attributes('draggable')).toBe('true')
        await wrapper.trigger('dragstart')
        expect(wrapper.emitted('dragstart')[0]).toEqual(['t1'])
    })
})