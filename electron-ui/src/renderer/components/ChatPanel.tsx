import { useState, useRef, useEffect } from 'react'
import { useT } from '../i18n'

interface ChatMessage {
  id: string
  text: string
  isMe: boolean
  time: number
}

interface ChatPanelProps {
  sessionId: string
  onClose: () => void
}

export default function ChatPanel({ sessionId, onClose }: ChatPanelProps) {
  const t = useT()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Listen for incoming chat messages
  useEffect(() => {
    const unsub = window.api.native.onEvent((sid, eventJson) => {
      if (sid !== sessionId) return
      try {
        const evt = JSON.parse(eventJson)
        if (evt.name === 'chat_client_mode') {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            text: evt.text || '',
            isMe: false,
            time: Date.now()
          }])
        }
      } catch {}
    })
    return unsub
  }, [sessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      text,
      isMe: true,
      time: Date.now()
    }])
    window.api.native.sendChat(sessionId, text).catch(() => {})
  }

  return (
    <div className="w-72 h-full flex flex-col bg-surface border-l border-surface-lighter">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-lighter">
        <span className="text-xs font-semibold text-text-primary">{t('chat.title')}</span>
        <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-lighter text-text-secondary transition-colors">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-xs text-text-secondary/40 text-center py-8">{t('chat.noMessages')}</div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
              msg.isMe
                ? 'bg-primary/20 text-text-primary rounded-br-sm'
                : 'bg-surface-lighter/50 text-text-primary rounded-bl-sm'
            }`}>
              {msg.text}
              <div className={`text-[9px] mt-0.5 ${msg.isMe ? 'text-primary/50' : 'text-text-secondary/30'}`}>
                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-surface-lighter">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.placeholder')}
            className="flex-1 bg-surface-light border border-surface-lighter/50 rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-3 py-1.5 bg-primary/80 hover:bg-primary disabled:bg-surface-lighter rounded-lg text-white text-xs transition-colors"
          >
            {t('chat.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
