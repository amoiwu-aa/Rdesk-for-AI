import { useState, useEffect } from 'react'
import type { Peer, AbTag } from '../types'
import { useT } from '../i18n'

interface Props {
  open: boolean
  mode: 'add' | 'edit'
  peer?: Peer
  tags: AbTag[]
  onClose: () => void
  onSubmit: (peer: { id: string; alias: string; tags: string[]; note: string }) => Promise<void>
}

export default function AddPeerDialog({ open, mode, peer, tags, onClose, onSubmit }: Props) {
  const t = useT()
  const [id, setId] = useState('')
  const [alias, setAlias] = useState('')
  const [note, setNote] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && peer && mode === 'edit') {
      setId(peer.id)
      setAlias(peer.alias || '')
      setNote(peer.note || '')
      setSelectedTags(peer.tags || [])
    } else if (open && mode === 'add') {
      setId('')
      setAlias('')
      setNote('')
      setSelectedTags([])
    }
    setError('')
  }, [open, peer, mode])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id.trim()) { setError(t('addPeer.deviceIdRequired')); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit({ id: id.trim(), alias, tags: selectedTags, note })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('addPeer.operationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (name: string) => {
    setSelectedTags(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    )
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-[420px] animate-slide-up">
        <div className="glass rounded-2xl shadow-2xl overflow-hidden">
          {/* Header accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />

          <div className="flex items-center justify-between px-7 pt-7 pb-2">
            <h2 className="text-base font-bold text-text-primary">
              {mode === 'add' ? t('addPeer.addDevice') : t('addPeer.editDevice')}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:bg-surface-lighter/50 transition-all duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 10 10">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-7 pb-7 pt-3">
            {error && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider">{t('addPeer.deviceId')}</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={mode === 'edit'}
                  placeholder={t('addPeer.deviceIdPlaceholder')}
                  autoFocus={mode === 'add'}
                  className="w-full bg-surface/80 border border-surface-lighter/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50 disabled:opacity-40"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider">{t('addPeer.alias')}</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder={t('addPeer.displayName')}
                  className="w-full bg-surface/80 border border-surface-lighter/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider">{t('addPeer.note')}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('addPeer.optionalNote')}
                  className="w-full bg-surface/80 border border-surface-lighter/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
                />
              </div>
              {tags.length > 0 && (
                <div>
                  <label className="block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider">{t('addPeer.tags')}</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          selectedTags.includes(tag.name)
                            ? 'bg-primary text-white shadow-glow-sm'
                            : 'bg-surface-lighter/40 text-text-secondary hover:text-text-primary hover:bg-surface-lighter/60'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface-lighter/50 transition-all duration-200 font-medium"
              >
                {t('addPeer.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !id.trim()}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('addPeer.saving')}
                  </span>
                ) : mode === 'add' ? t('addPeer.add') : t('addPeer.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
