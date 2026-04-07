import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { showToast } from './Toast'
import { useT } from '../i18n'

interface Props {
  open: boolean
  onClose: () => void
}

export default function LoginDialog({ open, onClose }: Props) {
  const t = useT()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuthStore()
  const { apiServer, updateSetting } = useSettingsStore()
  const [serverUrl, setServerUrl] = useState(apiServer)

  useEffect(() => {
    if (apiServer && !serverUrl) {
      setServerUrl(apiServer)
    }
  }, [apiServer])

  useEffect(() => {
    if (open && apiServer) {
      setServerUrl(apiServer)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (serverUrl !== apiServer) {
      await updateSetting('apiServer', serverUrl)
    }
    try {
      await login(username, password)
      showToast(t('login.success'), 'success')
      onClose()
    } catch {
      // error is already set in store
    }
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-[400px] animate-slide-up">
        {/* Glass card */}
        <div className="glass rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient accent */}
          <div className="relative px-7 pt-7 pb-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{t('login.title')}</h2>
                <p className="text-[11px] text-text-secondary/60 mt-0.5">{t('login.apiServerHint')}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:bg-surface-lighter/50 transition-all duration-200"
              >
                <svg width="12" height="12" viewBox="0 0 10 10">
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-7 pb-7 pt-4">
            {error && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider">{t('login.apiServer')}</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full bg-surface/80 border border-surface-lighter/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider">{t('login.username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.enterUsername')}
                  autoFocus
                  className="w-full bg-surface/80 border border-surface-lighter/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider">{t('login.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.enterPassword')}
                  className="w-full bg-surface/80 border border-surface-lighter/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password || !serverUrl}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('login.loggingIn')}
                </span>
              ) : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
