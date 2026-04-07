import { useState, useEffect, useCallback, useRef } from 'react'

export interface MenuItem {
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  separator?: boolean
}

interface MenuState {
  visible: boolean
  x: number
  y: number
  items: MenuItem[]
}

const initial: MenuState = { visible: false, x: 0, y: 0, items: [] }

let _setState: ((s: MenuState) => void) | null = null

export function showContextMenu(e: React.MouseEvent, items: MenuItem[]) {
  e.preventDefault()
  e.stopPropagation()
  _setState?.({ visible: true, x: e.clientX, y: e.clientY, items })
}

export function ContextMenuContainer() {
  const [state, setState] = useState<MenuState>(initial)
  const ref = useRef<HTMLDivElement>(null)

  _setState = setState

  const close = useCallback(() => setState(initial), [])

  useEffect(() => {
    if (!state.visible) return
    const handler = () => close()
    document.addEventListener('click', handler)
    document.addEventListener('contextmenu', handler)
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('contextmenu', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [state.visible, close])

  useEffect(() => {
    if (!state.visible || !ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    let { x, y } = state
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8
    if (x !== state.x || y !== state.y) setState({ ...state, x, y })
  }, [state.visible])

  if (!state.visible) return null

  return (
    <div
      ref={ref}
      className="fixed z-[8000] glass rounded-xl shadow-2xl py-1.5 min-w-[170px] animate-scale-in"
      style={{ left: state.x, top: state.y }}
    >
      {state.items.map((item, i) =>
        item.separator ? (
          <div key={i} className="border-t border-surface-lighter/30 my-1 mx-3" />
        ) : (
          <button
            key={i}
            onClick={() => { close(); item.onClick() }}
            disabled={item.disabled}
            className={`w-full text-left px-4 py-2 text-[13px] transition-all duration-150 ${
              item.disabled
                ? 'text-text-secondary/30 cursor-not-allowed'
                : item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-text-primary hover:bg-surface-lighter/40 hover:pl-5'
            }`}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  )
}
