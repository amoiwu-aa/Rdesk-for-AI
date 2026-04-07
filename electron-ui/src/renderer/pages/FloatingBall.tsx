import { useState, useEffect } from 'react'
import { useT } from '../i18n'

interface ActiveConn {
  id: string
  peerId: string
  sessionId: string
}

export default function FloatingBall() {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const [connections, setConnections] = useState<ActiveConn[]>([])

  useEffect(() => {
    const cleanup1 = window.api.onBallExpanded((isExpanded: boolean) => {
      setExpanded(isExpanded)
    })
    const cleanup2 = window.api.onConnectionsChanged((conns) => {
      setConnections(conns)
    })
    return () => { cleanup1(); cleanup2() }
  }, [])

  const handleClick = () => {
    if (expanded) {
      window.api.collapseBall()
    } else {
      window.api.expandBall()
    }
  }

  const handleDoubleClick = () => {
    window.api.showMainWindow()
  }

  if (!expanded) {
    return (
      <div
        className="w-14 h-14 rounded-full bg-accent hover:bg-accent-dark cursor-pointer flex items-center justify-center shadow-lg transition-colors drag-region select-none"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        title={t('ball.hint')}
      >
        <div className="no-drag flex flex-col items-center" onClick={handleClick}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="text-white text-[10px] font-bold leading-none mt-0.5">
            {connections.length}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[320px] h-[420px] bg-surface rounded-xl border border-surface-lighter shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="drag-region flex items-center justify-between px-4 py-3 bg-surface-light border-b border-surface-lighter">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-sm font-semibold text-text-primary">
            {t('ball.connections')} ({connections.length})
          </span>
        </div>
        <div className="no-drag flex items-center gap-1">
          <button
            onClick={handleDoubleClick}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-surface-lighter transition-colors"
            title={t('ball.openMain')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A0A0B0" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button
            onClick={handleClick}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-surface-lighter transition-colors"
            title={t('ball.collapse')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0" y="4" width="10" height="2" fill="#A0A0B0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connection List */}
      <div className="flex-1 overflow-auto p-2">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary/50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span className="text-xs mt-2">{t('ball.noConnections')}</span>
            <span className="text-[10px] mt-1 text-center px-4">
              {t('ball.noConnectionsHint')}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071FF" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-primary font-medium">{conn.peerId}</div>
                    <div className="text-[10px] text-accent">{t('ball.connected')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-surface-lighter bg-surface-light/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-secondary">RDesk</span>
        </div>
      </div>
    </div>
  )
}
