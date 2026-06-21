import { useState, useRef, useEffect } from 'react'
import {
  topbarConfig,
  statusBarConfig,
  tokenBarConfig,
  apiConfig,
  initialMessages,
  inputPlaceholder,
} from './chatConfig'
import './App.css'

// ── 把 \n 换成 <br> ──────────────────────────────────────────
function TextWithBreaks({ text }) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ))
}

// ── 打字动画气泡 ──────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="msg-row">
      <div className="bubble ai typing-bubble">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  )
}

// ── 今天的日期标签文字 ────────────────────────────────────────
function todayLabel() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `今天 · ${h}:${m}`
}

// ── 主组件 ───────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages]   = useState(initialMessages)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState({ input: 0, output: 0, cache: 0 })
  const [error, setError]         = useState(null)

  const chatEndRef  = useRef(null)
  const inputRef    = useRef(null)
  const sessionId   = useRef(null)  // null = 尚未初始化

  // ── 启动时自动创建会话 ────────────────────────────────────
  useEffect(() => {
    async function initSession() {
      // 优先复用 localStorage 里上次的 session_id
      const saved = localStorage.getItem('abyss_session_id')
      if (saved) {
        sessionId.current = Number(saved)
        return
      }
      try {
        const res = await fetch(`${apiConfig.baseUrl}/sessions`, {
          method: 'POST',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        sessionId.current = data.session_id
        localStorage.setItem('abyss_session_id', String(data.session_id))
      } catch (err) {
        console.error('Session init failed:', err)
        setError('无法连接服务器，请刷新重试')
      }
    }
    initSession()
  }, [])

  // 每次消息列表更新，滚到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── 发送消息 ──────────────────────────────────────────────
  async function sendMessage() {
    const text = inputText.trim()
    if (!text || isLoading || sessionId.current === null) return

    setError(null)
    setInputText('')

    // 1. 立刻把用户消息追加到界面
    setMessages(prev => [...prev, { type: 'me', text }])
    setIsLoading(true)

    try {
      const res = await fetch(`${apiConfig.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId.current,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`HTTP ${res.status}: ${errBody}`)
      }

      const data = await res.json()
      const reply = data.reply ?? ''

      // 更新 token 信息（后端如果返回就用，否则清零）
      if (data.usage) {
        setTokenInfo({
          input:  data.usage.prompt_tokens     ?? 0,
          output: data.usage.completion_tokens ?? 0,
          cache:  data.usage.cached_tokens     ?? 0,
        })
      }

      // 2. 把 AI 回复追加到界面
      setMessages(prev => [...prev, { type: 'ai', text: reply }])
    } catch (err) {
      console.error('Chat error:', err)
      setError('发送失败，请稍后重试')
      setMessages(prev => [
        ...prev,
        { type: 'ai', text: '……（信号断了，等我一下）', isError: true },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // ── 按 Enter 发送（Shift+Enter 换行） ────────────────────
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── 渲染单条消息 ──────────────────────────────────────────
  function renderMessage(msg, idx) {
    if (msg.type === 'date') {
      return <div key={idx} className="date-tag">{msg.text}</div>
    }
    if (msg.type === 'ai') {
      return (
        <div key={idx} className="msg-row">
          <div>
            <div className={`bubble ai${msg.quote ? ' quote' : ''}${msg.isError ? ' error' : ''}`}>
              <TextWithBreaks text={msg.text} />
            </div>
            <div className="msg-actions" style={{ paddingLeft: 4 }}>引用</div>
          </div>
        </div>
      )
    }
    if (msg.type === 'me') {
      return (
        <div key={idx} className="msg-row me">
          <div>
            <div className="bubble me">
              <TextWithBreaks text={msg.text} />
            </div>
            <div className="msg-actions" style={{ textAlign: 'right', paddingRight: 4 }}>引用</div>
          </div>
        </div>
      )
    }
    return null
  }

  // ── 渲染 ─────────────────────────────────────────────────
  return (
    <div className="app-wrap">
      <div className="phone">
        <div className="paper-noise" />

        {/* 状态栏 */}
        <div className="status-bar">
          <span>{statusBarConfig.timeText}</span>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <i className="ti ti-wifi" style={{ fontSize: 13 }} />
            <i className="ti ti-battery" style={{ fontSize: 13 }} />
          </span>
        </div>

        {/* 顶部导航栏 */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="avatar">{topbarConfig.avatarText}</div>
            <div>
              <div className="ai-name">{topbarConfig.aiName}</div>
              <div className="ai-status">
                <span
                  className="dot-online"
                  style={{ background: isLoading ? '#c8a96e' : topbarConfig.statusDotColor }}
                />
                {isLoading ? '正在输入…' : topbarConfig.statusText}
              </div>
            </div>
          </div>
          <div className="topbar-icons">
            <i className="ti ti-bookmark" aria-hidden="true" />
            <svg className="star-icon" viewBox="0 0 16 16" width="17" height="17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 1 L9.1 6.3 L14.5 8 L9.1 9.7 L8 15 L6.9 9.7 L1.5 8 L6.9 6.3 Z" stroke="#8a8880" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
            </svg>
            <i className="ti ti-layout-grid" aria-hidden="true" />
          </div>
        </div>

        {/* Token 信息栏 */}
        {tokenBarConfig.show && (
          <div className="token-bar">
            <span>
              本次 输入 {tokenInfo.input} · 输出 {tokenInfo.output} · 缓存中 {tokenInfo.cache}
            </span>
            <span style={{ color: '#8aafc8' }}>详情</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-banner">{error}</div>
        )}

        {/* 聊天区域 */}
        <div className="chat-area">
          {messages.map((msg, idx) => renderMessage(msg, idx))}
          {isLoading && <TypingBubble />}
          <div ref={chatEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="input-area">
          <div className="plus-btn">
            <i className="ti ti-plus" aria-hidden="true" />
          </div>
          <div className="input-box">
            <textarea
              ref={inputRef}
              className="input-textarea"
              placeholder={inputPlaceholder}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            className={`send-btn${isLoading ? ' sending' : ''}`}
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim()}
            aria-label="发送"
          >
            {isLoading
              ? <i className="ti ti-loader-2" style={{ fontSize: 14 }} aria-hidden="true" />
              : <i className="ti ti-send"     style={{ fontSize: 14 }} aria-hidden="true" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
