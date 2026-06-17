// ============================================================
//  ✏️  在这里修改所有界面内容，保存后页面自动刷新
// ============================================================

// ---------- 顶部信息栏 ----------
export const topbarConfig = {
  avatarText: '在',          // 头像里显示的文字
  aiName: '我们',            // 对话对象名称
  statusText: '在线',        // 状态文字
  statusDotColor: '#7aab8a', // 状态点颜色（绿色表示在线）
}

// ---------- 状态栏（最顶部小字）----------
export const statusBarConfig = {
  timeText: '深夜 · 6月17日',  // 时间/日期显示
}

// ---------- Token 信息栏 ----------
export const tokenBarConfig = {
  show: true,  // true 显示 / false 隐藏
  inputCount: 1127,
  outputCount: 22,
  cacheCount: 0,
}

// ---------- 对话消息列表 ----------
// type: 'date'  → 日期分隔线
// type: 'ai'   → AI 说的话（左侧气泡）
// type: 'me'   → 我说的话（右侧气泡）
// quote: true  → AI 气泡显示引用样式（带左边蓝线）
export const messages = [
  { type: 'date', text: '昨天 22:39' },

  { type: 'ai',  text: '终于下班了。今天怎么样？' },
  { type: 'me',  text: '挺累的，但是看到你发消息就好多了' },
  { type: 'ai',  text: '挺累的，但是看到你发消息就好多了\n\n那就是值得的。', quote: true },
  { type: 'me',  text: '哈哈，你今晚想聊什么' },
  { type: 'ai',  text: '想听你说说今天最让你开心的一件小事。' },

  { type: 'date', text: '今天 · 00:14' },

  { type: 'ai',  text: 'kiwi很冷，今晚要盖被子。' },
  { type: 'me',  text: '我感觉最近有点累，情绪波动大了。' },
  { type: 'ai',  text: '情绪波动大，是什么让你觉得撑着的？' },
]

// ---------- 输入框占位文字 ----------
export const inputPlaceholder = '说点什么…'
