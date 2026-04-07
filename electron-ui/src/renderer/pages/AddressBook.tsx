import { useEffect, useState } from 'react'
import { useAddressBookStore } from '../stores/addressBook'
import { useAuthStore } from '../stores/auth'
import PeerCard from '../components/PeerCard'
import TagList from '../components/TagList'
import AddPeerDialog from '../components/AddPeerDialog'
import { openDialog } from '../components/Dialog'
import { showToast } from '../components/Toast'
import type { Peer, ViewMode } from '../types'
import { useT } from '../i18n'

export default function AddressBook() {
  const t = useT()
  const auth = useAuthStore()
  const ab = useAddressBookStore()
  const [peerDialog, setPeerDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; peer?: Peer }>({
    open: false, mode: 'add'
  })

  useEffect(() => {
    if (auth.isLoggedIn) {
      ab.fetchPersonalAb()
      ab.fetchSharedProfiles()
    }
  }, [auth.isLoggedIn])

  const filteredPeers = ab.getFilteredPeers()
  const canEdit = ab.currentAbRule === 0 || ab.currentAbRule >= 2

  const handleSelectAb = async (guid: string) => {
    if (guid === ab.personalGuid) {
      await ab.selectAb(guid, t('ab.myAddressBook'), 0)
    } else {
      const profile = ab.sharedProfiles.find(p => p.guid === guid)
      if (profile) {
        await ab.selectAb(guid, profile.name, profile.rule)
      }
    }
  }

  const handleDeletePeer = (peerId: string) => {
    openDialog({
      title: t('ab.deleteDevice'),
      content: <span>{t('ab.deleteConfirm')} <strong className="text-text-primary">{peerId}</strong></span>,
      confirmText: t('ab.delete'),
      danger: true,
      onConfirm: async () => {
        try {
          await ab.deletePeers([peerId])
          showToast(t('ab.deviceRemoved'), 'success')
        } catch {
          showToast(t('ab.deleteFailed'), 'error')
        }
      }
    })
  }

  const handlePeerSubmit = async (peer: { id: string; alias: string; tags: string[]; note: string }) => {
    if (peerDialog.mode === 'add') {
      await ab.addPeer(peer)
      showToast(t('ab.deviceAdded'), 'success')
    } else {
      await ab.updatePeer(peer)
      showToast(t('ab.deviceUpdated'), 'success')
    }
  }

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
          <div className="text-sm font-medium mb-1">{t('ab.loginRequired')}</div>
          <div className="text-xs">{t('ab.loginHint')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Left Panel */}
      <div className="w-56 border-r border-surface-lighter/30 flex flex-col p-3 shrink-0 bg-surface/50">
        {/* AB Selector */}
        <select
          value={ab.currentAbGuid}
          onChange={(e) => handleSelectAb(e.target.value)}
          className="w-full bg-surface/80 border border-surface-lighter/40 rounded-xl px-3 py-2 text-xs text-text-primary mb-3 focus:outline-none focus:border-primary/50"
        >
          {ab.personalGuid && <option value={ab.personalGuid}>{t('ab.myAddressBook')}</option>}
          {ab.sharedProfiles.map(p => (
            <option key={p.guid} value={p.guid}>
              {p.name} ({p.rule >= 2 ? 'RW' : 'R'})
            </option>
          ))}
        </select>

        {/* Tag Filter */}
        <div className="flex-1 overflow-auto">
          <div className="text-[10px] text-text-secondary/50 uppercase tracking-widest mb-2 font-semibold">{t('ab.tags')}</div>
          <TagList
            tags={ab.tags}
            selectedTags={ab.selectedTags}
            onToggleTag={ab.toggleTag}
            onAddTag={canEdit ? ab.addTag : undefined}
            peers={ab.peers}
            canEdit={canEdit}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={ab.searchQuery}
            onChange={(e) => ab.setSearch(e.target.value)}
            placeholder={t('ab.searchDevices')}
            className="flex-1 max-w-xs bg-surface-light/80 border border-surface-lighter/40 rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
          />

          {/* View mode toggle */}
          <div className="flex bg-surface-light/60 rounded-xl border border-surface-lighter/30 p-0.5">
            {(['grid', 'tile', 'list'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => ab.setViewMode(mode)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                  ab.viewMode === mode
                    ? 'bg-gradient-primary text-white shadow-glow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {mode === 'grid' ? '▦' : mode === 'tile' ? '▣' : '☰'}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-text-secondary/50 font-medium">{t('ab.deviceCount').replace('{0}', String(filteredPeers.length))}</span>

          {canEdit && (
            <button
              onClick={() => setPeerDialog({ open: true, mode: 'add' })}
              className="ml-auto btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
            >
              {t('ab.addDevice')}
            </button>
          )}
        </div>

        {/* Peer List */}
        <div className="flex-1 overflow-auto">
          {ab.loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredPeers.length === 0 ? (
            <div className="text-center py-16 text-text-secondary/30 animate-fade-in-up">
              <div className="animate-float">
                <svg className="mx-auto mb-4 text-text-secondary/15" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="text-sm font-medium">{t('ab.noDevices')}</div>
              <div className="text-xs mt-1">
                {ab.searchQuery ? t('ab.noDevicesSearch') : canEdit ? t('ab.noDevicesAdd') : t('ab.noDevicesEmpty')}
              </div>
            </div>
          ) : ab.viewMode === 'list' ? (
            <div className="glass-card rounded-2xl hover:translate-y-0 overflow-hidden">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-lighter/20 text-[10px] text-text-secondary/50 uppercase tracking-widest font-semibold bg-surface/30">
                <span className="w-7" />
                <span className="w-28">ID</span>
                <span className="flex-1">{t('ab.listHeaderName')}</span>
                <span className="w-24">{t('ab.listHeaderUser')}</span>
                <span className="w-20">{t('ab.listHeaderPlatform')}</span>
                <span className="w-20">{t('ab.listHeaderTags')}</span>
                <span className="w-14" />
              </div>
              {filteredPeers.map(peer => (
                <PeerCard
                  key={peer.id}
                  peer={peer}
                  viewMode="list"
                  canEdit={canEdit}
                  onEdit={(p) => setPeerDialog({ open: true, mode: 'edit', peer: p })}
                  onDelete={handleDeletePeer}
                />
              ))}
            </div>
          ) : (
            <div className={`grid gap-3 stagger-children ${
              ab.viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {filteredPeers.map(peer => (
                <PeerCard
                  key={peer.id}
                  peer={peer}
                  viewMode={ab.viewMode}
                  canEdit={canEdit}
                  onEdit={(p) => setPeerDialog({ open: true, mode: 'edit', peer: p })}
                  onDelete={handleDeletePeer}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddPeerDialog
        open={peerDialog.open}
        mode={peerDialog.mode}
        peer={peerDialog.peer}
        tags={ab.tags}
        onClose={() => setPeerDialog({ open: false, mode: 'add' })}
        onSubmit={handlePeerSubmit}
      />
    </div>
  )
}
