import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { SettingSection, SettingInput, SettingSelect, SettingSlider, SettingInfo, SettingButton } from '../components/SettingWidgets'
import LoginDialog from '../components/LoginDialog'
import { showToast } from '../components/Toast'
import { useT } from '../i18n'

export default function Settings() {
  const t = useT()
  const auth = useAuthStore()
  const settings = useSettingsStore()
  const [loginOpen, setLoginOpen] = useState(false)
  const [platformInfo, setPlatformInfo] = useState({ platform: '', arch: '', hostname: '', version: '' })
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    window.api.getPlatformInfo().then(setPlatformInfo)
    window.api.getAppVersion().then(setAppVersion)
  }, [])

  const handleFetchConfig = async () => {
    try {
      await settings.fetchServerConfig()
      showToast(t('settings.fetchSuccess'), 'success')
    } catch {
      showToast(t('settings.fetchFailed'), 'error')
    }
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <h1 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2.5">
        <div className="w-1 h-5 rounded-full bg-gradient-primary" />
        {t('settings.title')}
      </h1>
      <div className="max-w-lg stagger-children">

        {/* Account */}
        <SettingSection title={t('settings.account')}>
          {auth.isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                  {auth.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{auth.user?.name}</div>
                  <div className="text-[11px] text-text-secondary/60 flex items-center gap-1.5">
                    {auth.user?.email || ''}
                    {auth.user?.is_admin && (
                      <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-md text-[9px] font-semibold uppercase">Admin</span>
                    )}
                  </div>
                </div>
              </div>
              <SettingButton label="" buttonText={t('settings.logout')} onClick={() => { auth.logout(); showToast(t('settings.loggedOut'), 'info') }} variant="danger" />
            </>
          ) : (
            <SettingButton label={t('settings.notLoggedIn')} buttonText={t('settings.login')} onClick={() => setLoginOpen(true)} />
          )}
        </SettingSection>

        {/* General */}
        <SettingSection title={t('settings.general')}>
          <SettingSelect
            label={t('settings.language')}
            value={settings.language}
            options={[
              { value: 'zh-CN', label: t('settings.langZh') },
              { value: 'en', label: t('settings.langEn') },
            ]}
            onChange={(v) => settings.updateSetting('language', v)}
          />
          <SettingSelect
            label={t('settings.theme')}
            value={settings.theme}
            options={[
              { value: 'dark', label: t('settings.themeDark') },
              { value: 'light', label: t('settings.themeLight') },
            ]}
            onChange={(v) => settings.updateSetting('theme', v)}
          />
        </SettingSection>

        {/* Security */}
        <SettingSection title={t('settings.security')}>
          <div className="text-xs text-text-secondary/50 bg-surface/50 rounded-xl px-4 py-3 border border-surface-lighter/20 leading-relaxed">
            {t('settings.securityHint')}
          </div>
        </SettingSection>

        {/* Network */}
        <SettingSection title={t('settings.network')}>
          <SettingInput
            label={t('settings.apiServer')}
            value={settings.apiServer}
            onChange={(v) => settings.updateSetting('apiServer', v)}
            placeholder="https://api.example.com"
          />
          <SettingInput
            label={t('settings.idServer')}
            value={settings.idServer}
            onChange={(v) => settings.updateSetting('idServer', v)}
            placeholder="ID/Rendezvous server"
          />
          <SettingInput
            label={t('settings.relayServer')}
            value={settings.relayServer}
            onChange={(v) => settings.updateSetting('relayServer', v)}
            placeholder="Relay server"
          />
          <SettingInput
            label={t('settings.key')}
            value={settings.key}
            onChange={(v) => settings.updateSetting('key', v)}
            placeholder="Public key"
          />
          <SettingButton label="" buttonText={t('settings.fetchConfig')} onClick={handleFetchConfig} />
        </SettingSection>

        {/* Display */}
        <SettingSection title={t('settings.display')}>
          <SettingSelect
            label={t('settings.quality')}
            value={settings.displayQuality}
            options={[
              { value: 'auto', label: t('settings.qualityAuto') },
              { value: 'best', label: t('settings.qualityBest') },
              { value: 'balanced', label: t('settings.qualityBalanced') },
              { value: 'low', label: t('settings.qualityLow') },
            ]}
            onChange={(v) => settings.updateSetting('displayQuality', v)}
          />
          <SettingSlider
            label={t('settings.fps')}
            value={settings.fps}
            min={5}
            max={60}
            step={5}
            onChange={(v) => settings.updateSetting('fps', v)}
          />
          <SettingSelect
            label={t('settings.codec')}
            value={settings.codec}
            options={[
              { value: 'auto', label: t('settings.qualityAuto') },
              { value: 'vp9', label: 'VP9' },
              { value: 'h264', label: 'H.264' },
              { value: 'h265', label: 'H.265' },
            ]}
            onChange={(v) => settings.updateSetting('codec', v)}
          />
          <div className="text-xs text-text-secondary/50 bg-surface/50 rounded-xl px-4 py-3 border border-surface-lighter/20 leading-relaxed">
            {t('settings.displayHint')}
          </div>
        </SettingSection>

        {/* About */}
        <SettingSection title={t('settings.about')}>
          <SettingInfo label={t('settings.app')} value="RDesk Electron UI" />
          <SettingInfo label={t('settings.version')} value={appVersion || '0.1.0'} />
          <SettingInfo label={t('settings.platform')} value={`${platformInfo.platform} ${platformInfo.arch}`} />
          <SettingInfo label={t('settings.hostname')} value={platformInfo.hostname} />
          <SettingInfo label={t('settings.osVersion')} value={platformInfo.version} />
        </SettingSection>

      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
