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
      // Block Alt+F4, Ctrl+W, etc in overlay
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
    <div className="fixed inset-0 bg-black flex items-center justify-center select-none" style={{ cursor: 'default' }}>
      <div className="text-center max-w-2xl mx-auto p-12 animate-in fade-in duration-500">
        {/* Eye icon */}
        <div className="relative mb-10">
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-red-500/30 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-red-500/60 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-red-500 animate-pulse" />
            </div>
          </div>
        </div>

        <h1 className="text-white text-5xl font-bold mb-3 tracking-tight">BLOCKED</h1>

        {keyword && (
          <p className="text-red-400/70 text-sm font-mono mb-6">
            Detected: {keyword}
          </p>
        )}

        <p className="text-zinc-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
          {message}
        </p>

        {/* Cooldown mode */}
        {bypassMode === 'cooldown' && (
          <div className="space-y-6">
            <p className="text-zinc-600 text-sm uppercase tracking-widest">
              Auto-dismiss in
            </p>
            <div className="text-red-500 text-8xl font-mono font-bold tabular-nums">
              {remaining}
            </div>
            {/* Progress ring */}
            <div className="w-48 h-1 mx-auto bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500/50 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(remaining / cooldown) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Soft dismiss mode */}
        {bypassMode === 'soft' && (
          <div className="space-y-6">
            <p className="text-zinc-600 text-sm">
              This attempt has been logged.
            </p>
            <button
              onClick={handleSoftDismiss}
              className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg hover:bg-zinc-800 hover:text-zinc-400 transition-colors text-sm"
            >
              I understand, let me continue
            </button>
          </div>
        )}

        {/* Password/PIN mode */}
        {bypassMode === 'password' && (
          <div className="space-y-4">
            <p className="text-zinc-600 text-sm">
              Enter PIN to dismiss
            </p>
            <div className="flex gap-3 justify-center items-center">
              <input
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit() }}
                className={`px-6 py-3 bg-zinc-900 border ${pinError ? 'border-red-500' : 'border-zinc-800'} text-white rounded-lg text-center text-lg w-48 focus:outline-none focus:border-zinc-600 transition-colors`}
                autoFocus
              />
              <button
                onClick={handlePinSubmit}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
              >
                Unlock
              </button>
            </div>
            {pinError && (
              <p className="text-red-500 text-sm animate-in fade-in">
                Wrong PIN. Try again.
              </p>
            )}
          </div>
        )}

        {/* Hard block - no bypass */}
        {bypassMode === 'none' && (
          <p className="text-zinc-700 text-sm">
            This content is permanently blocked. Contact your administrator.
          </p>
        )}
      </div>
    </div>
  )
}
