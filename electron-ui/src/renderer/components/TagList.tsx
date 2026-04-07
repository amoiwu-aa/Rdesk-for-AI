import { useState } from 'react'
import type { AbTag } from '../types'
import { useT } from '../i18n'

interface Props {
  tags: AbTag[]
  selectedTags: string[]
  onToggleTag: (tagName: string) => void
  onAddTag?: (name: string, color: number) => void
  peers?: { tags?: string[] }[]
  canEdit?: boolean
}

const TAG_COLORS = [
  0x0071FF, 0x21D375, 0xF59E0B, 0xEF4444, 0x8B5CF6,
  0xEC4899, 0x06B6D4, 0x84CC16, 0xF97316, 0x6366F1
]

export default function TagList({ tags, selectedTags, onToggleTag, onAddTag, peers = [], canEdit }: Props) {
  const t = useT()
  const [adding, setAdding] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  const getPeerCount = (tagName: string) => {
    if (tagName === '__all__') return peers.length
    if (tagName === '__untagged__') return peers.filter(p => !p.tags || p.tags.length === 0).length
    return peers.filter(p => p.tags?.includes(tagName)).length
  }

  const handleAdd = () => {
    if (!newTagName.trim()) return
    const color = TAG_COLORS[tags.length % TAG_COLORS.length]
    onAddTag?.(newTagName.trim(), color)
    setNewTagName('')
    setAdding(false)
  }

  const intToHex = (n: number) => {
    const hex = (n >>> 0).toString(16).padStart(6, '0')
    return `#${hex}`
  }

  return (
    <div className="space-y-0.5">
      {/* All */}
      <button
        onClick={() => {
          selectedTags.forEach(tag => onToggleTag(tag))
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${
          selectedTags.length === 0
            ? 'bg-primary/15 text-primary shadow-sm'
            : 'text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary'
        }`}
      >
        <span>{t('tag.all')}</span>
        <span className="text-[10px] opacity-50 font-mono">{getPeerCount('__all__')}</span>
      </button>

      {/* Tags */}
      {tags.map(tag => (
        <button
          key={tag.name}
          onClick={() => onToggleTag(tag.name)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${
            selectedTags.includes(tag.name)
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-surface"
              style={{
                backgroundColor: tag.color ? intToHex(tag.color) : '#0071FF',
                ringColor: tag.color ? `${intToHex(tag.color)}33` : 'rgba(0,113,255,0.2)',
              }}
            />
            <span className="truncate">{tag.name}</span>
          </div>
          <span className="text-[10px] opacity-50 shrink-0 font-mono">{getPeerCount(tag.name)}</span>
        </button>
      ))}

      {/* Untagged */}
      <button
        onClick={() => onToggleTag('__untagged__')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${
          selectedTags.includes('__untagged__')
            ? 'bg-primary/15 text-primary shadow-sm'
            : 'text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary'
        }`}
      >
        <span>{t('tag.untagged')}</span>
        <span className="text-[10px] opacity-50 font-mono">{getPeerCount('__untagged__')}</span>
      </button>

      {/* Add tag */}
      {canEdit !== false && (
        <div className="pt-3">
          {adding ? (
            <div className="flex gap-1.5 animate-fade-in">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={t('tag.tagName')}
                autoFocus
                className="flex-1 bg-surface/80 border border-surface-lighter/50 rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary/50"
              />
              <button onClick={handleAdd} className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors text-sm font-bold">+</button>
              <button onClick={() => { setAdding(false); setNewTagName('') }} className="w-7 h-7 rounded-lg bg-surface-lighter/30 text-text-secondary hover:bg-surface-lighter/50 flex items-center justify-center transition-colors text-xs">x</button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-[11px] text-text-secondary/40 hover:text-primary transition-all duration-200 py-2 rounded-lg hover:bg-primary/5 font-medium"
            >
              {t('tag.addTag')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
