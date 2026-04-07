import { type ReactNode } from 'react'

export function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 animate-fade-in-up">
      <h2 className="text-[11px] font-semibold text-text-secondary/60 uppercase tracking-widest mb-2.5 flex items-center gap-2">
        <div className="w-1 h-3 rounded-full bg-gradient-primary" />
        {title}
      </h2>
      <div className="glass-card rounded-2xl p-5 space-y-4 hover:translate-y-0">
        {children}
      </div>
    </div>
  )
}

export function SettingInput({ label, value, onChange, placeholder, type = 'text', disabled }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-32 text-sm text-text-secondary/80 shrink-0 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-surface/80 border border-surface-lighter/50 rounded-xl px-3.5 py-2 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50 transition-all duration-200 disabled:opacity-40"
      />
    </div>
  )
}

export function SettingSelect({ label, value, options, onChange }: {
  label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-32 text-sm text-text-secondary/80 shrink-0 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-surface/80 border border-surface-lighter/50 rounded-xl px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all duration-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function SettingToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-text-primary font-medium">{label}</div>
        {description && <div className="text-[11px] text-text-secondary/60 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${
          checked ? 'bg-gradient-primary shadow-glow-sm' : 'bg-surface-lighter/80'
        }`}
      >
        <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-md transition-all duration-300 ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`} />
      </button>
    </div>
  )
}

export function SettingSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-32 text-sm text-text-secondary/80 shrink-0 font-medium">{label}</label>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step || 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="text-sm font-mono text-text-primary w-10 text-right font-medium">{value}</span>
    </div>
  )
}

export function SettingInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-32 text-sm text-text-secondary/80 shrink-0 font-medium">{label}</label>
      <span className="text-sm text-text-primary/80 font-mono">{value}</span>
    </div>
  )
}

export function SettingButton({ label, buttonText, onClick, variant = 'primary' }: {
  label: string; buttonText: string; onClick: () => void
  variant?: 'primary' | 'danger' | 'secondary'
}) {
  const styles = {
    primary: 'btn-primary',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:-translate-y-px text-white',
    secondary: 'bg-surface-lighter/60 hover:bg-surface-lighter text-text-primary'
  }
  return (
    <div className="flex items-center gap-4">
      <label className="w-32 text-sm text-text-secondary/80 shrink-0 font-medium">{label}</label>
      <button
        onClick={onClick}
        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${styles[variant]}`}
      >
        {buttonText}
      </button>
    </div>
  )
}
