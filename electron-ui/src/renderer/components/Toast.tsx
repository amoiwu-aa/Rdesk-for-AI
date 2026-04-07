import { create } from 'zustand'
import { useState, useEffect } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: ToastItem[]
  add: (message: string, type: ToastItem['type']) => void
  remove: (id: number) => void
}

let nextId = 0

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type) => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}))

export function showToast(message: string, type: ToastItem['type'] = 'info') {
  useToastStore.getState().add(message, type)
}

const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
}

const accentColors = {
  success: 'from-emerald-500/90 to-emerald-600/90',
  error: 'from-red-500/90 to-red-600/90',
  info: 'from-blue-500/90 to-blue-600/90'
}

const barColors = {
  success: 'bg-emerald-300',
  error: 'bg-red-300',
  info: 'bg-blue-300'
}

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onRemove, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onRemove])

  return (
    <div
      className={`relative bg-gradient-to-r ${accentColors[item.type]} backdrop-blur-lg text-white pl-3.5 pr-3 py-3 rounded-xl shadow-lg max-w-xs flex items-center gap-2.5 overflow-hidden ${
        exiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <div className="shrink-0 opacity-90">{icons[item.type]}</div>
      <span className="flex-1 text-sm font-medium leading-snug">{item.message}</span>
      <button
        onClick={() => { setExiting(true); setTimeout(onRemove, 300) }}
        className="opacity-60 hover:opacity-100 shrink-0 transition-opacity ml-1"
      >
        <svg width="12" height="12" viewBox="0 0 10 10">
          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]">
        <div className={`h-full ${barColors[item.type]} opacity-50`} style={{ animation: 'progress-bar 3s linear forwards' }} />
      </div>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  const remove = useToastStore(s => s.remove)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-14 right-4 z-[9999] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <ToastItem key={t.id} item={t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  )
}
