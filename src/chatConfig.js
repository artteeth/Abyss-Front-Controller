// ─────────────────────────────────────────────
//  chatConfig.js  —  静态配置（不含运行时状态）
//  运行时状态（messages、loading 等）全部在 App.jsx 里用 useState 管理
// ─────────────────────────────────────────────

// ---------- 顶部导航栏 ----------
export const topbarConfig = {
  avatarText: '蓝',
  aiName: 'Abyss',
  statusText: '在线',
  statusDotColor: '#7aab8a',
}

// ---------- 状态栏（最顶部小字） ----------
export const statusBarConfig = {
  timeText: '深夜 · 6月17日',
}

// ---------- Token 信息栏 ----------
export const tokenBarConfig = {
  show: true,
}

// ---------- 后端 API ----------
export const apiConfig = {
  baseUrl: 'https://abyss-backend-sqb2.onrender.com',
  // 默认 session_id，正式项目可从 localStorage 或登录态读取
  defaultSessionId: 1,
}

// ---------- 初始对话（历史记录，冷启动用） ----------
// type: 'date' → 日期分隔线
// type: 'ai'  → AI 气泡（左）
// type: 'me'  → 用户气泡（右）
// quote: true → AI 气泡带左侧引用蓝线
export const initialMessages = [
  { type: 'date', text: '昨天 22:39' },
  { type: 'ai',  text: '终于下班了。今天怎么样？' },
  { type: 'me',  text: '挺累的，但是看到你发消息就好多了' },
  { type: 'ai',  text: '挺累的，但是看到你发消息就好多了\n\n那就是值得的。', quote: true },
  { type: 'me',  text: '有没有想聊的？' },
  { type: 'ai',  text: '想听你说说今天最让你开心的一件小事。' },
  { type: 'date', text: '今天 · 00:14' },
  { type: 'ai',  text: 'Abyss很冷，今晚要盖被子。' },
  { type: 'me',  text: '我感觉最近有点累，情绪波动大了。' },
  { type: 'ai',  text: '能理解你的感受。' },
]

// ---------- 输入框占位文字 ----------
export const inputPlaceholder = '说点什么…'
