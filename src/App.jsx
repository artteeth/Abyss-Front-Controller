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
  const [isTyping, setIsTyping]   = useState(false)   // 区分"等后端"和"AI正在逐条打字"
  const [tokenInfo, setTokenInfo] = useState({ input: 0, output: 0, cache: 0 })
  const [error, setError]         = useState(null)

  const chatEndRef  = useRef(null)
  const inputRef    = useRef(null)
  const sessionId   = useRef(null)
  const timersRef   = useRef([])  // 存所有 setTimeout 句柄，组件卸载时清掉

  // ── 启动时自动创建会话 ────────────────────────────────────
  useEffect(() => {
    async function initSession() {
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

  // 组件卸载时清掉所有未执行的定时器（避免内存泄漏 / 状态错乱）
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
      timersRef.current = []
    }
  }, [])

  // 每次消息列表更新，滚到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isTyping])  // 多加一个 isTyping 依赖

  // ── 逐条播放 segments ─────────────────────────────────
  // 返回一个 Promise，全部播完才 resolve
  function playSegments(segments) {
    return new Promise(resolve => {
      let acc = 0  // 累计延迟（毫秒）

      segments.forEach((seg, idx) => {
        // (1) 在这段开始前显示"正在输入..."
        const t1 = setTimeout(() => setIsTyping(true), acc)
        timersRef.current.push(t1)

        acc += seg.delay_ms

        // (2) 延迟到了：关掉 typing，推入这条气泡
        const t2 = setTimeout(() => {
          setIsTyping(false)
          setMessages(prev => [...prev, { type: 'ai', text: seg.content }])
        }, acc)
        timersRef.current.push(t2)

        // (3) 每段之间留 250ms 间隔（让用户看清气泡分开）
        acc += 250
      })

      // 全部播完
      const tEnd = setTimeout(() => {
        setIsTyping(false)
        resolve()
      }, acc)
      timersRef.current.push(tEnd)
    })
  }

  // ── 发送消息 ──────────────────────────────────────────────
  async function sendMessage() {
    const text = inputText.trim()
    if (!text || isLoading || sessionId.current === null) return

    setError(null)
    setInputText('')

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

      // token 信息更新（保持原样）
      if (data.usage) {
        setTokenInfo({
          input:  data.usage.prompt_tokens     ?? 0,
          output: data.usage.completion_tokens ?? 0,
          cache:  data.usage.cached_tokens     ?? 0,
        })
      }

      //  ── 关键改动：用 segments 逐条播放 ───────────────
      if (Array.isArray(data.segments) && data.segments.length > 0) {
        await playSegments(data.segments)
      } else {
        // 兜底：万一后端没返回 segments，就整段显示（保留旧逻辑）
        setMessages(prev => [...prev, { type: 'ai', text: data.reply ?? '' }])
      }
    } catch (err) {
      console.error('Chat error:', err)
      setError('发送失败，请稍后重试')
      setMessages(prev => [
        ...prev,
        { type: 'ai', text: '……（信号断了，等我一下）', isError: true },
      ])
    } finally {
      setIsLoading(false)
      setIsTyping(false)  // 兜底，确保异常情况下也关掉 typing
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

      
        <div className="status-bar">
          <span>{statusBarConfig.timeText}</span>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <i className="ti ti-wifi" style={{ fontSize: 13 }} />
            <i className="ti ti-battery" style={{ fontSize: 13 }} />
          </span>
        </div>

       
        <div className="topbar">
          <div className="topbar-left">
            <div className="avatar">{topbarConfig.avatarText}</div>
            <div>
              <div className="ai-name">{topbarConfig.aiName}</div>
              <div className="ai-status">
                <span
                  className="dot-online"
                  style={{
                    background: (isLoading || isTyping) ? '#c8a96e' : topbarConfig.statusDotColor   // 加上 isTyping
                  }}
                />
                {(isLoading || isTyping) ? '正在输入…' : topbarConfig.statusText}
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

   
        {tokenBarConfig.show && (
          <div className="token-bar">
            <span>
              本次 输入 {tokenInfo.input} · 输出 {tokenInfo.output} · 缓存中 {tokenInfo.cache}
            </span>
            <span style={{ color: '#8aafc8' }}>详情</span>
          </div>
        )}

   
        {error && (
          <div className="error-banner">{error}</div>
        )}


        <div className="chat-area">
          {messages.map((msg, idx) => renderMessage(msg, idx))}
          {(isLoading || isTyping) && <TypingBubble />}
          <div ref={chatEndRef} />
        </div>

  
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
              disabled={isLoading || isTyping}   /* AI 正在打字时也禁用 */
            />
          </div>
          <button
            className={`send-btn${(isLoading || isTyping) ? ' sending' : ''}`}
            onClick={sendMessage}
            disabled={isLoading || isTyping || !inputText.trim()}   /* 同上 */
            aria-label="发送"
          >
            {(isLoading || isTyping)
              ? <i className="ti ti-loader-2" style={{ fontSize: 14 }} aria-hidden="true" />
              : <i className="ti ti-send"     style={{ fontSize: 14 }} aria-hidden="true" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
