import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import {
  Monitor,
  Shield,
  Rocket,
  Palette,
  Database,
  Loader2,
} from 'lucide-react'
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
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure Big Brother behavior</p>
      </div>

      {/* Monitoring */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
            <Monitor className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-base text-zinc-200">Monitoring</CardTitle>
            <CardDescription className="text-zinc-500">Choose what to monitor</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Browser Monitoring"
            description="Watch browser tabs and URLs"
            checked={isEnabled('browser_monitoring')}
            onChange={() => toggleSetting('browser_monitoring')}
          />
          <Separator className="bg-zinc-800/60" />
          <SettingRow
            label="App Monitoring"
            description="Monitor application window titles"
            checked={isEnabled('app_monitoring')}
            onChange={() => toggleSetting('app_monitoring')}
          />
          <Separator className="bg-zinc-800/60" />
          <SettingRow
            label="Keystroke Monitoring"
            description="Detect keywords from keyboard input"
            checked={isEnabled('keystroke_monitoring')}
            onChange={() => toggleSetting('keystroke_monitoring')}
          />
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10">
            <Shield className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <CardTitle className="text-base text-zinc-200">Security</CardTitle>
            <CardDescription className="text-zinc-500">Authentication and access control</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-zinc-300">Auth Mode</Label>
              <p className="text-xs text-zinc-600 mt-0.5">Personal for self-use, managed for parental control</p>
            </div>
            <Select value={authMode} onValueChange={(v) => handleChangeAuthMode(v as any)}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="managed">Managed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator className="bg-zinc-800/60" />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-zinc-300">PIN Protection</Label>
              <p className="text-xs text-zinc-600 mt-0.5">
                {hasPin ? 'PIN is set' : 'No PIN configured'}
              </p>
            </div>
            <div className="flex gap-2">
              {hasPin ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs"
                    onClick={() => setPinAction('change')}
                  >
                    Change PIN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                    onClick={() => setPinAction('remove')}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700 text-xs"
                  onClick={() => setPinAction('set')}
                >
                  Set PIN
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Startup */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10">
            <Rocket className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-base text-zinc-200">Startup</CardTitle>
            <CardDescription className="text-zinc-500">Launch behavior</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Auto-start"
            description="Launch when your computer starts"
            checked={isEnabled('auto_start', false)}
            onChange={() => toggleSetting('auto_start')}
          />
          <Separator className="bg-zinc-800/60" />
          <SettingRow
            label="Start Hidden"
            description="Start minimized to system tray"
            checked={isEnabled('start_hidden', false)}
            onChange={() => toggleSetting('start_hidden')}
          />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/10">
            <Palette className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-base text-zinc-200">Appearance</CardTitle>
            <CardDescription className="text-zinc-500">Visual preferences</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SettingRow
            label="Stealth Mode"
            description="Hide from taskbar and alt-tab"
            checked={isEnabled('stealth_mode', false)}
            onChange={() => toggleSetting('stealth_mode')}
          />
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10">
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-base text-zinc-200">Data</CardTitle>
            <CardDescription className="text-zinc-500">Export and manage data</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            Export Logs
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmClearData(true)}
            className="border-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20"
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* PIN Dialog */}
      <Dialog open={pinAction !== null} onOpenChange={(v) => !v && setPinAction(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {pinAction === 'set' ? 'Set PIN' : pinAction === 'change' ? 'Change PIN' : 'Remove PIN'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              {pinAction === 'remove'
                ? 'Enter your current PIN to remove it.'
                : 'Enter a PIN (at least 4 characters) to protect settings.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(pinAction === 'change' || pinAction === 'remove') && (
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Current PIN</Label>
                <Input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              </div>
            )}
            {pinAction !== 'remove' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">New PIN</Label>
                  <Input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Confirm PIN</Label>
                  <Input
                    type="password"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPinAction(null)}
              className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button onClick={handleSetPin} className="bg-red-600 text-white hover:bg-red-700">
              {pinAction === 'remove' ? 'Remove PIN' : 'Save PIN'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={confirmClearData} onOpenChange={setConfirmClearData}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Clear All Data</DialogTitle>
            <DialogDescription className="text-zinc-500">
              This will permanently delete all logs and activity data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmClearData(false)}
              className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button onClick={handleClearData} className="bg-red-600 text-white hover:bg-red-700">
              Clear All
            </Button>
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
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm text-zinc-300">{label}</Label>
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
