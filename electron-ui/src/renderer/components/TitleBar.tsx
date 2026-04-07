import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/auth'
import LoginDialog from './LoginDialog'
import { useT } from '../i18n'

export default function TitleBar() {
  const t = useT()
  const [maximized, setMaximized] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { isLoggedIn, user, logout } = useAuthStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.isMaximized().then(setMaximized)
  }, [])

  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [userMenuOpen])

  const handleMaximize = () => {
    window.api.maximize()
    setMaximized(!maximized)
  }

  return (
    <div className="drag-region h-10 bg-surface/80 backdrop-blur-md flex items-center justify-between px-3 select-none shrink-0 border-b border-surface-lighter/30 relative">
      {/* Subtle highlight line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Left: App title */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="w-5 h-5 rounded-md bg-gradient-primary flex items-center justify-center shadow-glow-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
        </div>
        <span className="text-[13px] font-semibold text-text-primary tracking-tight">RDesk</span>
      </div>

      {/* Right: User + Window controls */}
      <div className="no-drag flex items-center gap-0.5">
        {/* User area */}
        {isLoggedIn ? (
          <div className="relative mr-1.5" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-[11px] font-semibold hover:shadow-glow-sm transition-all duration-200 hover:scale-105"
              title={user?.name || 'User'}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-9 glass rounded-xl shadow-lg py-1 min-w-[160px] z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-surface-lighter/30">
                  <div className="text-xs font-semibold text-text-primary">{user?.name}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{user?.email || ''}</div>
                </div>
                <button
                  onClick={() => { logout(); setUserMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors rounded-b-xl"
                >
                  {t('settings.logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setLoginOpen(true)}
            className="mr-1.5 text-[11px] text-text-secondary hover:text-primary transition-all duration-200 px-2.5 py-1 rounded-lg hover:bg-primary/10"
          >
            {t('titlebar.login')}
          </button>
        )}

        {/* Window controls */}
        <button
          onClick={() => window.api.minimize()}
          className="w-10 h-8 flex items-center justify-center rounded-md hover:bg-surface-lighter/50 transition-colors duration-150"
          title={t('titlebar.minimize')}
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" className="text-text-secondary" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center rounded-md hover:bg-surface-lighter/50 transition-colors duration-150"
          title={maximized ? t('titlebar.restore') : t('titlebar.maximize')}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-text-secondary">
              <path d="M2 0h8v8h-2v2H0V2h2V0zm1 1v1h5v5h1V1H3zM1 3v6h6V3H1z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-text-secondary">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </button>
        <button
          onClick={() => window.api.close()}
          className="w-10 h-8 flex items-center justify-center rounded-md hover:bg-red-500/80 hover:text-white transition-colors duration-150 text-text-secondary"
          title={t('titlebar.close')}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
