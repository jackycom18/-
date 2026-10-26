import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AddTaskModal from '../src/components/AddTaskModal.vue'

const columns = [
    { id: 'todo', title: '待办', color: '#4f7cff' },
    { id: 'doing', title: '进行中', color: '#f5a524' },
    { id: 'done', title: '已完成', color: '#17b26a' }
]

function factory(props = {}) {
    return mount(AddTaskModal, {
        props: { columns, existingCategories: [], visible: true, ...props },
        attachTo: document.body
    })
}

afterEach(() => {
    document.body.innerHTML = ''
})

describe('AddTaskModal', () => {
    it('标题为空时不提交', async() => {
        const wrapper = factory()
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('submit')).toBeUndefined()
        expect(wrapper.find('.field__error').text()).toBe('请填写任务标题')
        wrapper.unmount()
    })

    it('提交完整的任务数据', async() => {
        const wrapper = factory()
        await wrapper.find('[data-test="title-input"]').setValue('  新任务  ')
        await wrapper.find('[data-test="desc-input"]').setValue('任务描述')
        await wrapper.find('[data-test="category-input"]').setValue('开发')
        await wrapper.findAll('.segmented__item')[1].trigger('click')
        await wrapper.findAll('.toggle')[0].trigger('click')
        await wrapper.findAll('.toggle')[1].trigger('click')
        await wrapper.find('form').trigger('submit')

        const payload = wrapper.emitted('submit')[0][0]
        expect(payload).toMatchObject({
            title: '新任务',
            description: '任务描述',
            category: '开发',
            columnId: 'doing',
            starred: true,
            urgent: true
        })
        wrapper.unmount()
    })

    it('点击取消发出 close 事件', async() => {
        const wrapper = factory()
        await wrapper.find('.btn-ghost').trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
        wrapper.unmount()
    })

    it('已有分类可自动补全', async() => {
        const wrapper = factory({ existingCategories: ['开发', '设计', '生活'] })
        await wrapper.find('[data-test="category-input"]').setValue('设')
        const items = wrapper.findAll('.suggestions__item')
        expect(items).toHaveLength(1)
        expect(items[0].text()).toContain('设计')
        await items[0].trigger('mousedown')
        expect(wrapper.find('[data-test="category-input"]').element.value).toBe('设计')
        wrapper.unmount()
    })
})