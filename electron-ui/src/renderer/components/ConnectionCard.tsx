interface ConnectionCardProps {
  id: string
  name: string
  os: string
  online: boolean
  onClick?: () => void
}

export default function ConnectionCard({ id, name, os, online, onClick }: ConnectionCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-surface-light rounded-lg p-4 cursor-pointer hover:bg-surface-lighter transition-colors border border-surface-lighter hover:border-primary/50 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <OsIcon os={os} />
          <div>
            <div className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">
              {name}
            </div>
            <div className="text-xs text-text-secondary font-mono">{id}</div>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 ${online ? 'bg-accent' : 'bg-gray-500'}`} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{os}</span>
        <button className="text-xs text-primary hover:text-primary-dark transition-colors opacity-0 group-hover:opacity-100">
          Connect
        </button>
      </div>
    </div>
  )
}

function OsIcon({ os }: { os: string }) {
  const isWindows = os.toLowerCase().includes('windows')
  const isMac = os.toLowerCase().includes('mac')
  const isLinux = os.toLowerCase().includes('linux')

  return (
    <div className="w-8 h-8 rounded bg-surface flex items-center justify-center text-text-secondary">
      {isWindows && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 2.3l6.5-.9v6.3H0V2.3zm7.3-1l8.7-1.3v7.7H7.3V1.3zM16 8.5v7.7l-8.7-1.2V8.5H16zM6.5 14.7L0 13.8V8.5h6.5v6.2z" />
        </svg>
      )}
      {isMac && (
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
          <path d="M11.2 8.4c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7C2.6 3.6.8 4.9.8 8.5c0 2.1.8 4.4 1.8 5.8.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.8-1.1-2.8-4.2zM9 2.3c.7-.8 1.1-1.9 1-3-.9 0-2.1.7-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.5 2.8-1.5z" />
        </svg>
      )}
      {isLinux && (
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
          <path d="M7 0C4.8 0 3.3 2.2 3.3 5c0 1.5.4 2.8 1.1 3.8-.8.5-2.4 1.7-2.4 3.4 0 2 1.5 3.8 5 3.8s5-1.8 5-3.8c0-1.7-1.6-2.9-2.4-3.4.7-1 1.1-2.3 1.1-3.8C10.7 2.2 9.2 0 7 0z" />
        </svg>
      )}
      {!isWindows && !isMac && !isLinux && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )}
    </div>
  )
}
