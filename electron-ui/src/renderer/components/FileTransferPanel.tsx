import { useState, useEffect, useCallback } from 'react'
import { useT } from '../i18n'

interface FileEntry {
  name: string
  isDir: boolean
  size: number
  modified: number
}

interface TransferJob {
  id: number
  fileName: string
  isUpload: boolean
  progress: number
  speed: string
  status: 'transferring' | 'done' | 'error'
  error?: string
}

interface FileTransferPanelProps {
  sessionId: string
  onClose: () => void
}

export default function FileTransferPanel({ sessionId, onClose }: FileTransferPanelProps) {
  const t = useT()
  const [localPath, setLocalPath] = useState('C:\\')
  const [remotePath, setRemotePath] = useState('/')
  const [localEntries, setLocalEntries] = useState<FileEntry[]>([])
  const [remoteEntries, setRemoteEntries] = useState<FileEntry[]>([])
  const [jobs, setJobs] = useState<TransferJob[]>([])
  const [activeTab, setActiveTab] = useState<'browser' | 'transfers'>('browser')
  const [nextJobId, setNextJobId] = useState(1)

  // Load local directory
  const loadLocal = useCallback(async (path: string) => {
    try {
      const result = await window.api.native.readLocalDir(path, false)
      const data = JSON.parse(result)
      if (data.entries) {
        setLocalEntries(data.entries)
        setLocalPath(data.path)
      }
    } catch {}
  }, [])

  // Load remote directory
  const loadRemote = useCallback((path: string) => {
    setRemotePath(path)
    window.api.native.readRemoteDir(sessionId, path, false).catch(() => {})
  }, [sessionId])

  // Listen for remote file events
  useEffect(() => {
    const unsub = window.api.native.onEvent((sid, eventJson) => {
      if (sid !== sessionId) return
      try {
        const evt = JSON.parse(eventJson)
        if (evt.name === 'file_dir' && evt.is_local === 'false') {
          const fd = JSON.parse(evt.value || '{}')
          if (fd.entries) {
            const entries: FileEntry[] = fd.entries.map((e: { name: string; is_dir?: boolean; size?: number; modified_time?: number }) => ({
              name: e.name,
              isDir: e.is_dir || false,
              size: e.size || 0,
              modified: e.modified_time || 0
            }))
            setRemoteEntries(entries)
            if (fd.path) setRemotePath(fd.path)
          }
        } else if (evt.name === 'job_progress') {
          setJobs(prev => prev.map(j =>
            j.id === Number(evt.id) ? { ...j, progress: Number(evt.finished_size) || 0, speed: evt.speed || '', status: 'transferring' as const } : j
          ))
        } else if (evt.name === 'job_done') {
          setJobs(prev => prev.map(j =>
            j.id === Number(evt.id) ? { ...j, status: 'done' as const, progress: 100 } : j
          ))
        } else if (evt.name === 'job_error') {
          setJobs(prev => prev.map(j =>
            j.id === Number(evt.id) ? { ...j, status: 'error' as const, error: evt.err } : j
          ))
        }
      } catch {}
    })
    return unsub
  }, [sessionId])

  // Initial load
  useEffect(() => {
    loadLocal(localPath)
    loadRemote(remotePath)
  }, [])

  const navigateLocal = (entry: FileEntry) => {
    if (!entry.isDir) return
    const sep = localPath.includes('\\') ? '\\' : '/'
    const newPath = localPath.endsWith(sep) ? localPath + entry.name : localPath + sep + entry.name
    loadLocal(newPath)
  }

  const navigateRemote = (entry: FileEntry) => {
    if (!entry.isDir) return
    const newPath = remotePath.endsWith('/') ? remotePath + entry.name : remotePath + '/' + entry.name
    loadRemote(newPath)
  }

  const goUpLocal = () => {
    const sep = localPath.includes('\\') ? '\\' : '/'
    const parts = localPath.split(sep).filter(Boolean)
    if (parts.length <= 1) {
      loadLocal(localPath.includes('\\') ? parts[0] + '\\' : '/')
    } else {
      parts.pop()
      loadLocal(parts.join(sep) + sep)
    }
  }

  const goUpRemote = () => {
    const parts = remotePath.split('/').filter(Boolean)
    if (parts.length <= 0) return
    parts.pop()
    loadRemote('/' + parts.join('/'))
  }

  const uploadFile = (entry: FileEntry) => {
    if (entry.isDir) return
    const id = nextJobId
    setNextJobId(id + 1)
    const sep = localPath.includes('\\') ? '\\' : '/'
    const from = localPath.endsWith(sep) ? localPath + entry.name : localPath + sep + entry.name
    const to = remotePath.endsWith('/') ? remotePath : remotePath + '/'
    setJobs(prev => [...prev, { id, fileName: entry.name, isUpload: true, progress: 0, speed: '', status: 'transferring' }])
    setActiveTab('transfers')
    window.api.native.sendFiles(sessionId, id, from, to, 0, false, false).catch(() => {})
  }

  const downloadFile = (entry: FileEntry) => {
    if (entry.isDir) return
    const id = nextJobId
    setNextJobId(id + 1)
    const from = remotePath.endsWith('/') ? remotePath + entry.name : remotePath + '/' + entry.name
    const to = localPath.endsWith('\\') || localPath.endsWith('/') ? localPath : localPath + '\\'
    setJobs(prev => [...prev, { id, fileName: entry.name, isUpload: false, progress: 0, speed: '', status: 'transferring' }])
    setActiveTab('transfers')
    window.api.native.sendFiles(sessionId, id, from, to, 0, false, true).catch(() => {})
  }

  const cancelJob = (id: number) => {
    window.api.native.cancelJob(sessionId, id).catch(() => {})
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-lighter shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">{t('file.title')}</span>
          <div className="flex bg-surface-light/60 rounded-lg border border-surface-lighter/30 p-0.5">
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-2.5 py-1 text-[10px] rounded transition-colors ${activeTab === 'browser' ? 'bg-primary/20 text-primary' : 'text-text-secondary'}`}
            >
              {t('file.browser')}
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-2.5 py-1 text-[10px] rounded transition-colors ${activeTab === 'transfers' ? 'bg-primary/20 text-primary' : 'text-text-secondary'}`}
            >
              {t('file.transfers')} {jobs.length > 0 && `(${jobs.length})`}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-lighter text-text-secondary transition-colors">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {activeTab === 'browser' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Local */}
          <div className="flex-1 flex flex-col border-r border-surface-lighter/30 min-w-0">
            <div className="px-3 py-1.5 border-b border-surface-lighter/20 flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-text-secondary font-semibold uppercase">{t('file.local')}</span>
              <button onClick={goUpLocal} className="text-[10px] text-primary hover:text-primary-dark">..</button>
              <div className="flex-1 text-[10px] text-text-secondary/60 truncate font-mono">{localPath}</div>
            </div>
            <div className="flex-1 overflow-auto">
              {localEntries.map(entry => (
                <div
                  key={entry.name}
                  onDoubleClick={() => navigateLocal(entry)}
                  className="flex items-center gap-2 px-3 py-1 hover:bg-surface-lighter/30 cursor-pointer group text-xs"
                >
                  <span className="text-text-secondary/60">{entry.isDir ? '📁' : '📄'}</span>
                  <span className="flex-1 text-text-primary truncate">{entry.name}</span>
                  <span className="text-[10px] text-text-secondary/40">{entry.isDir ? '' : formatSize(entry.size)}</span>
                  {!entry.isDir && (
                    <button
                      onClick={(e) => { e.stopPropagation(); uploadFile(entry) }}
                      className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary rounded transition-opacity"
                      title={t('file.upload')}
                    >
                      →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Remote */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-3 py-1.5 border-b border-surface-lighter/20 flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-text-secondary font-semibold uppercase">{t('file.remote')}</span>
              <button onClick={goUpRemote} className="text-[10px] text-primary hover:text-primary-dark">..</button>
              <div className="flex-1 text-[10px] text-text-secondary/60 truncate font-mono">{remotePath}</div>
            </div>
            <div className="flex-1 overflow-auto">
              {remoteEntries.map(entry => (
                <div
                  key={entry.name}
                  onDoubleClick={() => navigateRemote(entry)}
                  className="flex items-center gap-2 px-3 py-1 hover:bg-surface-lighter/30 cursor-pointer group text-xs"
                >
                  <span className="text-text-secondary/60">{entry.isDir ? '📁' : '📄'}</span>
                  <span className="flex-1 text-text-primary truncate">{entry.name}</span>
                  <span className="text-[10px] text-text-secondary/40">{entry.isDir ? '' : formatSize(entry.size)}</span>
                  {!entry.isDir && (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadFile(entry) }}
                      className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 bg-accent/20 text-accent rounded transition-opacity"
                      title={t('file.download')}
                    >
                      ←
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Transfers tab */
        <div className="flex-1 overflow-auto p-3">
          {jobs.length === 0 ? (
            <div className="text-xs text-text-secondary/40 text-center py-8">{t('file.noTransfers')}</div>
          ) : jobs.map(job => (
            <div key={job.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-light/50 mb-1.5">
              <span className="text-text-secondary/60 text-xs">{job.isUpload ? '↑' : '↓'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text-primary truncate">{job.fileName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1 bg-surface-lighter rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        job.status === 'done' ? 'bg-accent' : job.status === 'error' ? 'bg-danger' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, job.progress)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-text-secondary/50">
                    {job.status === 'done' ? t('file.completed') : job.status === 'error' ? t('file.failed') : job.speed || '...'}
                  </span>
                </div>
              </div>
              {job.status === 'transferring' && (
                <button onClick={() => cancelJob(job.id)} className="text-text-secondary/50 hover:text-danger text-xs transition-colors">✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
