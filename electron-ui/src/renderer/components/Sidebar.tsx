import { useNavigate, useLocation } from 'react-router-dom'
import { useT } from '../i18n'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()

  const navItems = [
    { path: '/', label: t('nav.remote'), icon: MonitorIcon },
    { path: '/address-book', label: t('nav.addressBook'), icon: BookIcon },
    { path: '/accessible', label: t('nav.devices'), icon: DevicesIcon },
    { path: '/settings', label: t('nav.settings'), icon: GearIcon },
  ]

  return (
    <div className="w-[68px] bg-surface flex flex-col items-center py-3 gap-0.5 border-r border-surface-lighter/50 shrink-0 relative">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      {navItems.map((item) => {
        const active = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path)
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`relative w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-spring group ${
              active
                ? 'text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title={item.label}
          >
            {/* Active / hover background */}
            <div className={`absolute inset-0 rounded-xl transition-all duration-300 ease-[var(--ease-smooth)] ${
              active
                ? 'bg-gradient-primary shadow-glow-sm opacity-100'
                : 'bg-surface-lighter/0 group-hover:bg-surface-lighter/40 opacity-100'
            }`} />
            <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
              <item.icon size={20} />
            </div>
            <span className="relative z-10 text-[9px] leading-none font-medium">{item.label}</span>
          </button>
        )
      })}

      {/* Bottom decorative line */}
      <div className="mt-auto w-6 h-[2px] rounded-full bg-surface-lighter/50" />
    </div>
  )
}

function MonitorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function BookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function DevicesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="11" rx="1.5" />
      <rect x="10" y="10" width="13" height="10" rx="1.5" />
      <line x1="5" y1="17" x2="12" y2="17" />
      <line x1="8.5" y1="14" x2="8.5" y2="17" />
    </svg>
  )
}

function GearIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
