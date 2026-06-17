import { topbarConfig, statusBarConfig, tokenBarConfig, messages, inputPlaceholder } from './chatConfig'
import './App.css'

// 把 \n 换行符转成 <br>
function TextWithBreaks({ text }) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ))
}

function App() {
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
                  style={{ background: topbarConfig.statusDotColor }}
                />
                {topbarConfig.statusText}
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
              本次 输入 {tokenBarConfig.inputCount} · 输出 {tokenBarConfig.outputCount} · 缓存中 {tokenBarConfig.cacheCount}
            </span>
            <span style={{ color: '#8aafc8' }}>详情</span>
          </div>
        )}

        {/* 聊天区域 */}
        <div className="chat-area">
          {messages.map((msg, idx) => {
            if (msg.type === 'date') {
              return <div key={idx} className="date-tag">{msg.text}</div>
            }
            if (msg.type === 'ai') {
              return (
                <div key={idx} className="msg-row">
                  <div>
                    <div className={`bubble ai${msg.quote ? ' quote' : ''}`}>
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
          })}
        </div>

        {/* 输入区域 */}
        <div className="input-area">
          <div className="plus-btn">
            <i className="ti ti-plus" aria-hidden="true" />
          </div>
          <div className="input-box">
            <span className="input-placeholder">{inputPlaceholder}</span>
          </div>
          <div className="send-btn">
            <i className="ti ti-send" style={{ fontSize: 14 }} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
