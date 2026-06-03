import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface AddKeywordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
  editKeyword?: Keyword | null
}

const defaultForm = {
  term: '',
  category: '',
  match_mode: 'contains' as const,
  action_type: 'close_tab' as const,
  action_config: {} as Record<string, any>,
  bypass_mode: 'none' as const,
  bypass_cooldown_seconds: 300,
}

export function AddKeywordDialog({ open, onOpenChange, onAdded, editKeyword }: AddKeywordDialogProps) {
  const [form, setForm] = useState(editKeyword ? {
    term: editKeyword.term,
    category: editKeyword.category,
    match_mode: editKeyword.match_mode,
    action_type: editKeyword.action_type,
    action_config: editKeyword.action_config,
    bypass_mode: editKeyword.bypass_mode,
    bypass_cooldown_seconds: editKeyword.bypass_cooldown_seconds,
  } : { ...defaultForm })
  const [saving, setSaving] = useState(false)

  const isEditing = !!editKeyword

  const handleSave = async () => {
    if (!form.term.trim()) {
      toast.error('Keyword term is required')
      return
    }

    setSaving(true)
    try {
      const api = (window as any).bigBrother
      if (isEditing) {
        await api.updateKeyword(editKeyword.id, form)
        toast.success('Keyword updated')
      } else {
        await api.addKeyword({ ...form, enabled: true })
        toast.success('Keyword added')
      }
      onAdded()
      onOpenChange(false)
      setForm({ ...defaultForm })
    } catch (err) {
      toast.error('Failed to save keyword')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: string, value: string) => {
    setForm((f) => ({ ...f, action_config: { ...f.action_config, [key]: value } }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[85vw] bg-zinc-950 border-zinc-800 p-0 rounded-none sm:max-w-4xl">
        <div className="p-8 pb-0">
          <DialogHeader className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
              {isEditing ? 'Edit' : 'New'} Keyword
            </p>
            <DialogTitle className="text-2xl font-black text-zinc-100 font-['Plus_Jakarta_Sans']">
              {isEditing ? 'Edit Keyword' : 'Add Keyword'}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              {isEditing
                ? 'Modify keyword matching rules and actions.'
                : 'Configure a new keyword to monitor. Set matching rules and actions.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-b border-zinc-800/50 mt-4" />

        <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-8">
          {/* Term */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Keyword Term
            </label>
            <input
              value={form.term}
              onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
              placeholder="e.g. explicit-content"
              className="w-full bg-transparent border-b border-zinc-700 pb-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Category
            </label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. adult, violence, gambling"
              className="w-full bg-transparent border-b border-zinc-700 pb-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Match Mode */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Match Mode
            </label>
            <Select
              value={form.match_mode}
              onValueChange={(v) => setForm((f) => ({ ...f, match_mode: v as any }))}
            >
              <SelectTrigger className="bg-transparent border-0 border-b border-zinc-700 rounded-none text-zinc-100 text-sm h-auto pb-2 px-0 focus:ring-0 focus:border-red-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 rounded-none">
                <SelectItem value="exact">Exact</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="smart">Smart</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Action Type
            </label>
            <Select
              value={form.action_type}
              onValueChange={(v) => setForm((f) => ({ ...f, action_type: v as any }))}
            >
              <SelectTrigger className="bg-transparent border-0 border-b border-zinc-700 rounded-none text-zinc-100 text-sm h-auto pb-2 px-0 focus:ring-0 focus:border-red-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 rounded-none">
                <SelectItem value="close_tab">Close Tab</SelectItem>
                <SelectItem value="close_and_media">Close & Play Media</SelectItem>
                <SelectItem value="close_and_redirect">Close & Redirect</SelectItem>
                <SelectItem value="overlay">Show Overlay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional: Media Path */}
          {form.action_type === 'close_and_media' && (
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Media File Path
              </label>
              <input
                value={form.action_config.mediaPath || ''}
                onChange={(e) => updateConfig('mediaPath', e.target.value)}
                placeholder="C:\path\to\media.mp4"
                className="w-full bg-transparent border-b border-zinc-700 pb-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          )}

          {/* Conditional: Redirect URL */}
          {form.action_type === 'close_and_redirect' && (
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Redirect URL
              </label>
              <input
                value={form.action_config.redirectUrl || ''}
                onChange={(e) => updateConfig('redirectUrl', e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-transparent border-b border-zinc-700 pb-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          )}

          {/* Conditional: Overlay Message */}
          {form.action_type === 'overlay' && (
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Overlay Message
              </label>
              <textarea
                value={form.action_config.overlayMessage || ''}
                onChange={(e) => updateConfig('overlayMessage', e.target.value)}
                placeholder="This content has been blocked."
                rows={3}
                className="w-full bg-transparent border-b border-zinc-700 pb-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>
          )}

          {/* Bypass Mode */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Bypass Mode
            </label>
            <Select
              value={form.bypass_mode}
              onValueChange={(v) => setForm((f) => ({ ...f, bypass_mode: v as any }))}
            >
              <SelectTrigger className="bg-transparent border-0 border-b border-zinc-700 rounded-none text-zinc-100 text-sm h-auto pb-2 px-0 focus:ring-0 focus:border-red-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 rounded-none">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="cooldown">Cooldown</SelectItem>
                <SelectItem value="password">Password</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cooldown Seconds (visible when bypass=cooldown) */}
          {form.bypass_mode === 'cooldown' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Cooldown (seconds)
              </label>
              <input
                type="number"
                value={form.bypass_cooldown_seconds}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bypass_cooldown_seconds: parseInt(e.target.value) || 0 }))
                }
                className="w-full bg-transparent border-b border-zinc-700 pb-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800/50" />

        <DialogFooter className="p-8 pt-6 gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-none text-xs uppercase tracking-wider font-semibold h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 text-white hover:bg-red-700 rounded-none text-xs uppercase tracking-wider font-semibold h-10 px-6"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Keyword' : 'Add Keyword'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
