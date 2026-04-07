import { useEffect, useState } from 'react'
import { useGroupStore } from '../stores/group'
import { useAuthStore } from '../stores/auth'
import type { AccessiblePeer } from '../types'
import { useT } from '../i18n'

export default function AccessibleDevices() {
  const t = useT()
  const auth = useAuthStore()
  const store = useGroupStore()
  const [tab, setTab] = useState<'groups' | 'users'>('groups')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (auth.isLoggedIn) {
      store.fetchAll()
    }
  }, [auth.isLoggedIn])

  const filteredPeers = store.getFilteredPeers().filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.id.toLowerCase().includes(q) ||
      p.info.device_name?.toLowerCase().includes(q) ||
      p.info.username?.toLowerCase().includes(q)
  })

  if (!auth.isLoggedIn) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-text-secondary/50">
          <div className="animate-float">
            <svg className="mx-auto mb-4 text-text-secondary/20" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="text-sm font-medium mb-1">{t('devices.loginRequired')}</div>
          <div className="text-xs">{t('devices.loginHint')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Left Panel */}
      <div className="w-56 border-r border-surface-lighter/30 flex flex-col shrink-0 bg-surface/50">
        {/* Tabs */}
        <div className="flex border-b border-surface-lighter/30 relative">
          {/* Sliding indicator */}
          <div
            className="absolute bottom-0 h-[2px] bg-gradient-primary rounded-full transition-all duration-300 ease-spring"
            style={{
              width: '50%',
              left: tab === 'groups' ? '0%' : '50%',
            }}
          />
          <button
            onClick={() => { setTab('groups'); store.clearSelection() }}
            className={`flex-1 py-3 text-xs font-semibold transition-colors duration-200 ${
              tab === 'groups' ? 'text-primary' : 'text-text-secondary/60 hover:text-text-secondary'
            }`}
          >
            {t('devices.groups')} ({store.groups.length})
          </button>
          <button
            onClick={() => { setTab('users'); store.clearSelection() }}
            className={`flex-1 py-3 text-xs font-semibold transition-colors duration-200 ${
              tab === 'users' ? 'text-primary' : 'text-text-secondary/60 hover:text-text-secondary'
            }`}
          >
            {t('devices.users')} ({store.users.length})
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-2 stagger-children">
          {/* All */}
          <button
            onClick={() => store.clearSelection()}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 mb-1 font-medium ${
              !store.selectedName
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary'
            }`}
          >
            {t('devices.allDevices')}
          </button>

          {tab === 'groups' ? (
            store.groups.length === 0 ? (
              <div className="text-xs text-text-secondary/30 text-center py-6">{t('devices.noGroups')}</div>
            ) : (
              store.groups.map(g => (
                <button
                  key={g.name}
                  onClick={() => store.selectGroup(g.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${
                    store.selectedType === 'group' && store.selectedName === g.name
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary'
                  }`}
                >
                  {g.name}
                </button>
              ))
            )
          ) : (
            store.users.length === 0 ? (
              <div className="text-xs text-text-secondary/30 text-center py-6">{t('devices.noUsers')}</div>
            ) : (
              store.users.map(u => (
                <button
                  key={u.name}
                  onClick={() => store.selectUser(u.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${
                    store.selectedType === 'user' && store.selectedName === u.name
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary'
                  }`}
                >
                  {u.name}
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('devices.searchDevices')}
            className="flex-1 max-w-xs bg-surface-light/80 border border-surface-lighter/40 rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
          />
          <span className="text-[11px] text-text-secondary/50 font-medium">
            {t('devices.deviceCount').replace('{0}', String(filteredPeers.length))}
            {store.selectedName && (
              <span className="ml-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px]">{store.selectedName}</span>
            )}
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {store.loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredPeers.length === 0 ? (
            <div className="text-center py-16 text-text-secondary/30 animate-fade-in-up">
              <div className="animate-float">
                <svg className="mx-auto mb-4 text-text-secondary/15" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="1" y="3" width="15" height="11" rx="1.5" /><rect x="10" y="10" width="13" height="10" rx="1.5" />
                </svg>
              </div>
              <div className="text-sm font-medium">{t('devices.noDevices')}</div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl hover:translate-y-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-lighter/20 text-[10px] text-text-secondary/50 uppercase tracking-widest font-semibold bg-surface/30">
                <span className="w-28">ID</span>
                <span className="flex-1">{t('devices.headerDeviceName')}</span>
                <span className="w-24">{t('devices.headerUser')}</span>
                <span className="w-20">{t('devices.headerOS')}</span>
                <span className="w-20">{t('devices.headerGroup')}</span>
                <span className="w-16">{t('devices.headerStatus')}</span>
              </div>
              {filteredPeers.map((peer) => (
                <PeerRow key={peer.id} peer={peer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PeerRow({ peer }: { peer: AccessiblePeer }) {
  const t = useT()
  const handleConnect = () => {
    const sessionId = crypto.randomUUID()
    window.api.native.openRemoteWindow(peer.id, sessionId, false)
  }

  return (
    <div
      onDoubleClick={handleConnect}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-lighter/30 cursor-pointer transition-all duration-200 group border-b border-surface-lighter/15 last:border-0"
    >
      <span className="w-28 text-sm font-mono text-text-primary truncate group-hover:text-primary transition-colors">{peer.id}</span>
      <span className="flex-1 text-sm text-text-primary/80 truncate">{peer.info.device_name || '-'}</span>
      <span className="w-24 text-[11px] text-text-secondary/60 truncate">{peer.user_name || peer.info.username || '-'}</span>
      <span className="w-20 text-[11px] text-text-secondary/60 truncate">{peer.info.os || '-'}</span>
      <span className="w-20 text-[11px] text-text-secondary/60 truncate">{peer.device_group_name || '-'}</span>
      <div className="w-16 flex items-center gap-1.5">
        <div className={`relative w-2 h-2 rounded-full ${peer.status === 1 ? 'bg-accent' : 'bg-text-secondary/30'}`}>
          {peer.status === 1 && <div className="absolute inset-0 rounded-full bg-accent animate-pulse-dot" />}
        </div>
        <span className={`text-[10px] font-medium ${peer.status === 1 ? 'text-accent' : 'text-text-secondary/40'}`}>
          {peer.status === 1 ? t('devices.online') : t('devices.offline')}
        </span>
      </div>
    </div>
  )
}
