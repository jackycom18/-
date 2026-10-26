export type ToastType =
  | 'create'
  | 'move'
  | 'star'
  | 'urgent'
  | 'delete'
  | 'reset'
  | 'error'
  | 'theme'

export const toastMessages: Record<ToastType, string[]> = {
  create: [
    '新任务已上板，开干吧！',
    '又有事情可做啦，加油 💪',
    '任务已记录，别忘了它哦',
    '清单 +1，成就感 +1'
  ],
  move: [
    '任务挪窝成功～',
    '状态更新，节奏感拉满！',
    '进度条前进了一小格',
    '一切尽在掌握之中'
  ],
  star: [
    '重点任务已点亮 ⭐',
    '这颗星星，值得关注',
    '重要的事情说三遍：星标！',
    '已为任务打上高光'
  ],
  urgent: [
    '紧急任务已标红 🔴',
    '优先级拉满，冲！',
    '这个任务已经进入警戒状态',
    '火烧眉毛，赶紧处理'
  ],
  delete: [
    '任务已移除，轻装上阵',
    '断舍离成功 🗑️',
    '清掉一件心事',
    '看板更清爽了'
  ],
  reset: [
    '看板已重置，重新出发！',
    '清空完毕，一切从零开始',
    '新的旅程，从空白看板开始',
    '旧的不去，新的不来'
  ],
  error: [
    '哎呀，操作没成功',
    '出了点小状况，再试一次吧',
    '标题不能为空哦',
    '这个操作暂时不被支持'
  ],
  theme: [
    '换了个心情，颜色也变了',
    '新主题已生效 🎨',
    '眼睛说：谢谢你',
    '氛围感拉满'
  ]
}

export function randomToastMessage(type: ToastType): string {
  const list = toastMessages[type] || toastMessages.create
  return list[Math.floor(Math.random() * list.length)]
}