import type { Peer, ViewMode } from '../types'
import { showContextMenu, type MenuItem } from './ContextMenu'
import { showToast } from './Toast'
import { useT } from '../i18n'

interface Props {
  peer: Peer
  viewMode: ViewMode
  canEdit?: boolean
  onEdit?: (peer: Peer) => void
  onDelete?: (peerId: string) => void
}

export default function PeerCard({ peer, viewMode, canEdit, onEdit, onDelete }: Props) {
  const t = useT()

  const handleConnect = () => {
    const sessionId = crypto.randomUUID()
    window.api.native.openRemoteWindow(peer.id, sessionId, false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    const items: MenuItem[] = [
      { label: t('peer.connect'), onClick: handleConnect },
      { label: t('peer.copyId'), onClick: () => { navigator.clipboard.writeText(peer.id); showToast(t('peer.idCopied'), 'success') } },
    ]
    if (canEdit !== false) {
      items.push(
        { label: '', onClick: () => {}, separator: true },
        { label: t('peer.edit'), onClick: () => onEdit?.(peer) },
        { label: t('peer.delete'), onClick: () => onDelete?.(peer.id), danger: true }
      )
    }
    showContextMenu(e, items)
  }

  if (viewMode === 'list') return (
    <div
      onContextMenu={handleContextMenu}
      onDoubleClick={handleConnect}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-lighter/40 cursor-pointer transition-all duration-200 group border-b border-surface-lighter/30 last:border-0"
    >
      <PlatformIcon platform={peer.platform} />
      <span className="w-28 text-sm font-mono text-text-primary truncate">{peer.id}</span>
      <span className="flex-1 text-sm text-text-primary truncate">{peer.alias || peer.hostname || '-'}</span>
      <span className="w-24 text-xs text-text-secondary/70 truncate">{peer.username || '-'}</span>
      <span className="w-20 text-xs text-text-secondary/70 truncate">{peer.platform || '-'}</span>
      {peer.tags && peer.tags.length > 0 && (
        <div className="flex gap-1">
          {peer.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium">{tag}</span>
          ))}
          {peer.tags.length > 2 && <span className="text-[10px] text-text-secondary/50">+{peer.tags.length - 2}</span>}
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); handleConnect() }}
        className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-blue-400"
      >
        {t('peer.connect')}
      </button>
    </div>
  )

  if (viewMode === 'tile') return (
    <div
      onContextMenu={handleContextMenu}
      onDoubleClick={handleConnect}
      className="glass-card rounded-xl p-3 cursor-pointer group w-40"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <PlatformIcon platform={peer.platform} size={14} />
        <span className="text-[11px] font-mono text-text-secondary/60 truncate">{peer.id}</span>
      </div>
      <div className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">{peer.alias || peer.hostname || peer.id}</div>
    </div>
  )

  // Grid mode (default)
  return (
    <div
      onContextMenu={handleContextMenu}
      onDoubleClick={handleConnect}
      className="glass-card rounded-2xl p-4 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <PlatformIcon platform={peer.platform} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors duration-200">
              {peer.alias || peer.hostname || peer.id}
            </div>
            <div className="text-[11px] text-text-secondary/50 font-mono mt-0.5">{peer.id}</div>
          </div>
        </div>
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      {peer.username && (
        <div className="text-[11px] text-text-secondary/60 mb-2 truncate">{peer.username}</div>
      )}
      {peer.tags && peer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {peer.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium">{tag}</span>
          ))}
        </div>
      )}
      {peer.platform && (
        <div className="text-[11px] text-text-secondary/40 font-medium">{peer.platform}</div>
      )}
    </div>
  )
}

function PlatformIcon({ platform, size = 16 }: { platform?: string; size?: number }) {
  const p = (platform || '').toLowerCase()
  const isWin = p.includes('windows') || p.includes('win')
  const isMac = p.includes('mac') || p.includes('darwin')
  const isLinux = p.includes('linux') || p.includes('ubuntu') || p.includes('debian')

  const bgColor = isWin ? 'bg-blue-500/10 text-blue-400' : isMac ? 'bg-gray-400/10 text-gray-400' : isLinux ? 'bg-orange-500/10 text-orange-400' : 'bg-surface-lighter/50 text-text-secondary/50'

  return (
    <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105`}>
      {isWin ? (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 2.3l6.5-.9v6.3H0V2.3zm7.3-1l8.7-1.3v7.7H7.3V1.3zM16 8.5v7.7l-8.7-1.2V8.5H16zM6.5 14.7L0 13.8V8.5h6.5v6.2z" />
        </svg>
      ) : isMac ? (
        <svg width={size - 2} height={size} viewBox="0 0 14 16" fill="currentColor">
          <path d="M11.2 8.4c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7C2.6 3.6.8 4.9.8 8.5c0 2.1.8 4.4 1.8 5.8.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.8-1.1-2.8-4.2zM9 2.3c.7-.8 1.1-1.9 1-3-.9 0-2.1.7-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.5 2.8-1.5z" />
        </svg>
      ) : isLinux ? (
        <svg width={size - 2} height={size} viewBox="0 0 14 16" fill="currentColor">
          <path d="M7 0C4.8 0 3.3 2.2 3.3 5c0 1.5.4 2.8 1.1 3.8-.8.5-2.4 1.7-2.4 3.4 0 2 1.5 3.8 5 3.8s5-1.8 5-3.8c0-1.7-1.6-2.9-2.4-3.4.7-1 1.1-2.3 1.1-3.8C10.7 2.2 9.2 0 7 0z" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )}
    </div>
  )
}
