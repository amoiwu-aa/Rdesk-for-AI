import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import { ToastContainer } from './components/Toast'
import { DialogContainer } from './components/Dialog'
import { ContextMenuContainer } from './components/ContextMenu'
import Home from './pages/Home'
import AddressBook from './pages/AddressBook'
import AccessibleDevices from './pages/AccessibleDevices'
import Settings from './pages/Settings'
import FloatingBall from './pages/FloatingBall'
import RemoteDesktop from './pages/RemoteDesktop'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'

function MainLayout() {
  const initAuth = useAuthStore(s => s.initFromConfig)
  const loadSettings = useSettingsStore(s => s.loadFromConfig)

  useEffect(() => {
    loadSettings().then(() => initAuth())
  }, [])

  return (
    <div className="h-screen flex flex-col bg-surface">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/address-book" element={<AddressBook />} />
            <Route path="/accessible" element={<AccessibleDevices />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
      <DialogContainer />
      <ContextMenuContainer />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/floating-ball" element={<FloatingBall />} />
        <Route path="/remote/:peerId" element={<RemoteDesktop />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </HashRouter>
  )
}
