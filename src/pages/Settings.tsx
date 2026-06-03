import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'personal' | 'managed'>('personal')
  const [hasPin, setHasPin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [confirmPinInput, setConfirmPinInput] = useState('')
  const [pinAction, setPinAction] = useState<'set' | 'change' | 'remove' | null>(null)
  const [currentPinInput, setCurrentPinInput] = useState('')
  const [confirmClearData, setConfirmClearData] = useState(false)

  const api = (window as any).bigBrother

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      if (api?.getSettings) {
        const s = await api.getSettings()
        setSettings(s)
      }
      if (api?.auth) {
        const [mode, pin] = await Promise.all([api.auth.getMode(), api.auth.hasPin()])
        setAuthMode(mode)
        setHasPin(pin)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      setSettings((prev) => ({ ...prev, [key]: value }))
      if (api?.updateSettings) {
        await api.updateSettings(key, value)
      }
    } catch {
      toast.error('Failed to update setting')
    }
  }

  const toggleSetting = (key: string) => {
    const current = settings[key]
    updateSetting(key, current === 'true' ? 'false' : 'true')
  }

  const isEnabled = (key: string, defaultVal = true) => {
    if (settings[key] === undefined) return defaultVal
    return settings[key] === 'true'
  }

  const handleSetPin = async () => {
    if (pinInput.length < 4) {
      toast.error('PIN must be at least 4 characters')
      return
    }
    if (pinInput !== confirmPinInput) {
      toast.error('PINs do not match')
      return
    }
    try {
      if (pinAction === 'change' || pinAction === 'remove') {
        const valid = await api.auth.verifyPin(currentPinInput)
        if (!valid) {
          toast.error('Current PIN is incorrect')
          return
        }
      }
      if (pinAction === 'remove') {
        await api.auth.removePin(currentPinInput)
        setHasPin(false)
        toast.success('PIN removed')
      } else {
        await api.auth.setPin(pinInput)
        setHasPin(true)
        toast.success(pinAction === 'change' ? 'PIN changed' : 'PIN set')
      }
    } catch {
      toast.error('Failed to update PIN')
    } finally {
      setPinAction(null)
      setPinInput('')
      setConfirmPinInput('')
      setCurrentPinInput('')
    }
  }

  const handleChangeAuthMode = async (mode: 'personal' | 'managed') => {
    try {
      setAuthMode(mode)
      if (api?.auth) {
        await api.auth.setMode(mode)
      }
      toast.success(`Mode changed to ${mode}`)
    } catch {
      toast.error('Failed to change mode')
    }
  }

  const handleClearData = async () => {
    try {
      await api.clearLogs()
      toast.success('All data cleared')
    } catch {
      toast.error('Failed to clear data')
    } finally {
      setConfirmClearData(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <div className="p-10 space-y-12 overflow-y-auto h-full max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
          Settings
        </h1>
        <div className="border-b border-zinc-800/50 mt-4" />
      </div>

      {/* MONITORING */}
      <section className="space-y-0">
        <div className="pb-3 border-b border-zinc-800/40">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Monitoring
          </h2>
        </div>
        <div className="pt-2">
          <SettingRow
            label="Browser Monitoring"
            description="Watch browser tabs and URLs"
            checked={isEnabled('monitoring.browsers')}
            onChange={() => toggleSetting('monitoring.browsers')}
          />
          <SettingRow
            label="App Monitoring"
            description="Monitor application window titles"
            checked={isEnabled('monitoring.apps')}
            onChange={() => toggleSetting('monitoring.apps')}
          />
          <SettingRow
            label="Keystroke Monitoring"
            description="Detect keywords from keyboard input"
            checked={isEnabled('monitoring.keystrokes')}
            onChange={() => toggleSetting('monitoring.keystrokes')}
            last
          />
        </div>
      </section>

      {/* SECURITY */}
      <section className="space-y-0">
        <div className="pb-3 border-b border-zinc-800/40">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Security
          </h2>
        </div>
        <div className="pt-2">
          {/* Auth Mode */}
          <div className="flex items-center justify-between py-4 border-b border-zinc-800/30">
            <div>
              <p className="text-sm text-zinc-300">Auth Mode</p>
              <p className="text-xs text-zinc-600 mt-0.5">Personal for self-use, managed for parental control</p>
            </div>
            <Select value={authMode} onValueChange={(v) => handleChangeAuthMode(v as any)}>
              <SelectTrigger className="w-36 bg-transparent border-zinc-800 text-zinc-300 h-9 text-sm focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="managed">Managed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* PIN Protection */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-zinc-300">PIN Protection</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {hasPin ? 'PIN is set' : 'No PIN configured'}
              </p>
            </div>
            <div className="flex gap-3">
              {hasPin ? (
                <>
                  <button
                    className="text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
                    onClick={() => setPinAction('change')}
                  >
                    Change
                  </button>
                  <button
                    className="text-xs uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
                    onClick={() => setPinAction('remove')}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  className="text-xs uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
                  onClick={() => setPinAction('set')}
                >
                  Set PIN
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STARTUP */}
      <section className="space-y-0">
        <div className="pb-3 border-b border-zinc-800/40">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Startup
          </h2>
        </div>
        <div className="pt-2">
          <SettingRow
            label="Auto-start"
            description="Launch when your computer starts"
            checked={isEnabled('ui.auto_start', false)}
            onChange={() => toggleSetting('ui.auto_start')}
          />
          <SettingRow
            label="Start Hidden"
            description="Start minimized to system tray"
            checked={isEnabled('ui.start_hidden', false)}
            onChange={() => toggleSetting('ui.start_hidden')}
          />
          <SettingRow
            label="Stealth Mode"
            description="Hide from taskbar and alt-tab"
            checked={isEnabled('ui.stealth_mode', false)}
            onChange={() => toggleSetting('ui.stealth_mode')}
            last
          />
        </div>
      </section>

      {/* DATA */}
      <section className="space-y-0">
        <div className="pb-3 border-b border-zinc-800/40">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Data
          </h2>
        </div>
        <div className="flex items-center gap-6 pt-6">
          <button
            className="text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Export Logs
          </button>
          <button
            onClick={() => setConfirmClearData(true)}
            className="text-xs uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </section>

      {/* PIN Dialog */}
      <Dialog open={pinAction !== null} onOpenChange={(v) => !v && setPinAction(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 p-8">
          <DialogHeader>
            <DialogTitle className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
              {pinAction === 'set' ? 'Set PIN' : pinAction === 'change' ? 'Change PIN' : 'Remove PIN'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm mt-3">
              {pinAction === 'remove'
                ? 'Enter your current PIN to remove it.'
                : 'Enter a PIN (at least 4 characters) to protect settings.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(pinAction === 'change' || pinAction === 'remove') && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-zinc-500">Current PIN</Label>
                <Input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  className="bg-transparent border-0 border-b border-zinc-800 rounded-none text-zinc-100 focus-visible:ring-0 focus-visible:border-zinc-600 px-0"
                />
              </div>
            )}
            {pinAction !== 'remove' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">New PIN</Label>
                  <Input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="bg-transparent border-0 border-b border-zinc-800 rounded-none text-zinc-100 focus-visible:ring-0 focus-visible:border-zinc-600 px-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">Confirm PIN</Label>
                  <Input
                    type="password"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    className="bg-transparent border-0 border-b border-zinc-800 rounded-none text-zinc-100 focus-visible:ring-0 focus-visible:border-zinc-600 px-0"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-3 mt-4">
            <button
              onClick={() => setPinAction(null)}
              className="text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSetPin}
              className="text-xs uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
            >
              {pinAction === 'remove' ? 'Remove PIN' : 'Save PIN'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={confirmClearData} onOpenChange={setConfirmClearData}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 p-8">
          <DialogHeader>
            <DialogTitle className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
              Clear All Data
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm mt-3">
              This will permanently delete all logs and activity data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <button
              onClick={() => setConfirmClearData(false)}
              className="text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearData}
              className="text-xs uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
  last = false,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  last?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-4 ${last ? '' : 'border-b border-zinc-800/30'}`}>
      <div>
        <p className="text-sm text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-red-600"
      />
    </div>
  )
}
