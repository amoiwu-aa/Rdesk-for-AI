import { create } from 'zustand'
import { type ReactNode } from 'react'
import { useT } from '../i18n'

interface DialogConfig {
  title: string
  content?: ReactNode
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface DialogStore {
  isOpen: boolean
  config: DialogConfig | null
  open: (config: DialogConfig) => void
  close: () => void
}

export const useDialogStore = create<DialogStore>((set) => ({
  isOpen: false,
  config: null,
  open: (config) => set({ isOpen: true, config }),
  close: () => set({ isOpen: false, config: null })
}))

export function openDialog(config: DialogConfig) {
  useDialogStore.getState().open(config)
}

export function closeDialog() {
  useDialogStore.getState().close()
}

export function DialogContainer() {
  const t = useT()
  const { isOpen, config, close } = useDialogStore()

  if (!isOpen || !config) return null

  const handleConfirm = async () => {
    await config.onConfirm?.()
    close()
  }

  const handleCancel = () => {
    config.onCancel?.()
    close()
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in" onClick={handleCancel} />
      <div className="relative glass rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slide-up overflow-hidden">
        {/* Danger/primary accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${config.danger ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-primary'}`} />

        <div className="px-7 pt-7 pb-4">
          <h3 className="text-base font-bold text-text-primary mb-2">{config.title}</h3>
          {config.content && (
            <div className="text-sm text-text-secondary leading-relaxed">{config.content}</div>
          )}
        </div>
        <div className="flex justify-end gap-2.5 px-7 pb-6">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface-lighter/50 transition-all duration-200 font-medium"
          >
            {config.cancelText || t('dialog.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${
              config.danger
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:-translate-y-px'
                : 'btn-primary'
            }`}
          >
            {config.confirmText || t('dialog.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}
