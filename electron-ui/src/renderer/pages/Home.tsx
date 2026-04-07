import { useState, useEffect } from 'react'
import { useConnectionStore } from '../stores/connection'
import { showToast } from '../components/Toast'
import { useT } from '../i18n'

export default function Home() {
  const t = useT()
  const [remoteId, setRemoteId] = useState('')
  const [forceRelay, setForceRelay] = useState(false)
  const { myId, myPassword, recentConnections, loadRecent, setMyId, addRecentConnection } = useConnectionStore()

  useEffect(() => {
    loadRecent()
    window.api.native.getDeviceId().then((id) => {
      if (id) setMyId(id)
    }).catch(() => {})
  }, [])

  const handleConnect = () => {
    const cleanId = remoteId.replace(/\s/g, '')
    if (!cleanId) return
    const sessionId = crypto.randomUUID()
    addRecentConnection({ id: cleanId, name: '', lastConnected: Date.now() })
    window.api.native.openRemoteWindow(cleanId, sessionId, forceRelay)
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Device Info Section */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary mb-5 flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-gradient-primary" />
          {t('home.title')}
        </h1>

        <div className="grid grid-cols-2 gap-5 max-w-xl stagger-children">
          {/* My ID */}
          <div className="glass-card rounded-2xl p-5 group">
            <div className="text-[10px] text-text-secondary mb-3 uppercase tracking-widest font-medium">{t('home.yourId')}</div>
            {myId ? (
              <div
                className="text-2xl font-mono font-bold tracking-wider cursor-pointer transition-all duration-300 bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent hover:drop-shadow-[0_0_8px_rgba(33,211,117,0.4)]"
                onClick={() => { navigator.clipboard.writeText(myId); showToast(t('home.idCopied'), 'success') }}
              >
                {myId}
              </div>
            ) : (
              <div className="text-sm text-text-secondary/50">
                {t('home.notRegistered')}
                <div className="text-[10px] mt-1.5 text-text-secondary/30">{t('home.requiresCore')}</div>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="glass-card rounded-2xl p-5 group">
            <div className="text-[10px] text-text-secondary mb-3 uppercase tracking-widest font-medium">{t('home.password')}</div>
            {myPassword ? (
              <div className="flex items-center gap-3">
                <div className="text-2xl font-mono font-bold text-text-primary tracking-wider">
                  {myPassword}
                </div>
                <button
                  onClick={() => showToast(t('home.passwordRefreshHint'), 'info')}
                  className="w-7 h-7 rounded-lg bg-surface-lighter/50 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-sm text-text-secondary/50">
                <span className="font-mono tracking-[0.3em]">------</span>
                <div className="text-[10px] mt-1.5 text-text-secondary/30">{t('home.requiresCore')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Section */}
      <div className="mb-8 max-w-xl">
        <div className="text-xs text-text-secondary mb-3 font-medium uppercase tracking-wider">{t('home.connectTo')}</div>
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder={t('home.enterRemoteId')}
              className="w-full bg-surface-light border border-surface-lighter/60 rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-primary/50 transition-all duration-200 font-mono text-sm"
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={!remoteId.trim()}
            className="btn-primary px-7 py-3 rounded-xl text-sm"
          >
            {t('home.connect')}
          </button>
        </div>
        <label className="flex items-center gap-2.5 mt-3 text-xs text-text-secondary/70 cursor-pointer select-none hover:text-text-secondary transition-colors">
          <input
            type="checkbox"
            checked={forceRelay}
            onChange={(e) => setForceRelay(e.target.checked)}
          />
          {t('home.forceRelay')}
        </label>
      </div>

      {/* Recent Connections */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{t('home.recentConnections')}</span>
          {recentConnections.length > 0 && (
            <button
              onClick={() => useConnectionStore.getState().clearRecentConnections()}
              className="text-[11px] text-text-secondary/50 hover:text-red-400 transition-colors"
            >
              {t('home.clear')}
            </button>
          )}
        </div>
        {recentConnections.length === 0 ? (
          <div className="text-center py-16 text-text-secondary/30 animate-fade-in-up">
            <div className="animate-float">
              <svg className="mx-auto mb-4 text-text-secondary/20" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="text-sm font-medium">{t('home.noRecent')}</div>
            <div className="text-xs mt-1.5">{t('home.noRecentHint')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {recentConnections.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  const sid = crypto.randomUUID()
                  addRecentConnection({ id: c.id, name: c.name, lastConnected: Date.now() })
                  window.api.native.openRemoteWindow(c.id, sid, forceRelay)
                }}
                className="glass-card rounded-xl p-3.5 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">{c.name || c.id}</div>
                    <div className="text-[11px] text-text-secondary/60 font-mono mt-0.5">{c.id}</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
