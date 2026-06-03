import { useEffect, useState, useCallback } from 'react'

export default function Overlay() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const bypassMode = params.get('bypassMode') || 'cooldown'
  const cooldown = parseInt(params.get('cooldown') || '30', 10)
  const message = params.get('message') || 'Big Brother is watching.'
  const keyword = params.get('keyword') || ''

  const [remaining, setRemaining] = useState(cooldown)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Cooldown timer
  useEffect(() => {
    if (bypassMode !== 'cooldown') return
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval)
          window.close()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [bypassMode, cooldown])

  // Prevent keyboard shortcuts to close/escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (bypassMode === 'none') {
        e.preventDefault()
        return
      }
      if (e.key === 'F4' && e.altKey) e.preventDefault()
      if (e.key === 'w' && e.ctrlKey) e.preventDefault()
      if (e.key === 'Escape') e.preventDefault()
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [bypassMode])

  const handleSoftDismiss = useCallback(() => {
    setDismissed(true)
    setTimeout(() => window.close(), 300)
  }, [])

  const handlePinSubmit = useCallback(async () => {
    const api = (window as any).bigBrother
    if (!api?.auth?.verifyPin) {
      window.close()
      return
    }
    const ok = await api.auth.verifyPin(pin)
    if (ok) {
      window.close()
    } else {
      setPinError(true)
      setPin('')
      setTimeout(() => setPinError(false), 2000)
    }
  }, [pin])

  if (dismissed) {
    return <div className="fixed inset-0 bg-black" />
  }

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center select-none"
      style={{ cursor: 'default' }}
    >
      <div className="text-center max-w-3xl mx-auto px-12 animate-in fade-in duration-500">
        {/* BLOCKED */}
        <h1 className="text-white text-7xl font-black uppercase tracking-widest mb-6">
          Blocked
        </h1>

        {keyword && (
          <p className="text-red-500 text-sm font-mono mb-8 tracking-wide">
            {keyword}
          </p>
        )}

        <p className="text-zinc-500 text-lg mb-16 max-w-lg mx-auto leading-relaxed">
          {message}
        </p>

        {/* Cooldown mode */}
        {bypassMode === 'cooldown' && (
          <div className="space-y-8">
            <p className="text-zinc-700 text-xs uppercase tracking-[0.3em]">
              Auto-dismiss in
            </p>
            <div className="text-white text-8xl font-black tabular-nums">
              {remaining}
            </div>
            {/* Thin progress line */}
            <div className="w-64 h-px mx-auto bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-red-500/60 transition-all duration-1000 ease-linear"
                style={{ width: `${(remaining / cooldown) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Soft dismiss mode */}
        {bypassMode === 'soft' && (
          <div className="space-y-8">
            <p className="text-zinc-600 text-sm">
              This attempt has been logged.
            </p>
            <button
              onClick={handleSoftDismiss}
              className="text-xs uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              I understand, let me continue
            </button>
          </div>
        )}

        {/* Password/PIN mode */}
        {bypassMode === 'password' && (
          <div className="space-y-6">
            <p className="text-zinc-700 text-xs uppercase tracking-[0.3em]">
              Enter PIN to dismiss
            </p>
            <div className="flex gap-4 justify-center items-end">
              <input
                type="password"
                placeholder="----"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePinSubmit()
                }}
                className={`bg-transparent border-0 border-b ${
                  pinError ? 'border-red-500' : 'border-zinc-800'
                } text-white text-center text-lg w-48 py-2 focus:outline-none focus:border-zinc-500 transition-colors font-mono`}
                autoFocus
              />
              <button
                onClick={handlePinSubmit}
                className="text-xs uppercase tracking-[0.2em] text-red-500 hover:text-red-400 transition-colors pb-2"
              >
                Unlock
              </button>
            </div>
            {pinError && (
              <p className="text-red-500 text-xs uppercase tracking-wider animate-in fade-in">
                Wrong PIN
              </p>
            )}
          </div>
        )}

        {/* Hard block - no bypass */}
        {bypassMode === 'none' && (
          <p className="text-zinc-700 text-xs uppercase tracking-[0.2em]">
            This content is permanently blocked. Contact your administrator.
          </p>
        )}
      </div>
    </div>
  )
}
