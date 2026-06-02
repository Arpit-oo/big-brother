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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <DialogContent className="max-w-4xl w-[85vw] bg-zinc-950 border-zinc-800 p-8">
        <DialogHeader>
          <DialogTitle className="text-xl text-zinc-100">
            {isEditing ? 'Edit Keyword' : 'Add Keyword'}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {isEditing
              ? 'Modify keyword matching rules and actions.'
              : 'Configure a new keyword to monitor. Set matching rules and actions.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Term */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Keyword Term</Label>
            <Input
              value={form.term}
              onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
              placeholder="e.g. explicit-content"
              className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Category</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. adult, violence, gambling"
              className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          {/* Match Mode */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Match Mode</Label>
            <Select
              value={form.match_mode}
              onValueChange={(v) => setForm((f) => ({ ...f, match_mode: v as any }))}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="exact">Exact</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="smart">Smart</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Action Type</Label>
            <Select
              value={form.action_type}
              onValueChange={(v) => setForm((f) => ({ ...f, action_type: v as any }))}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
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
              <Label className="text-zinc-300">Media File Path</Label>
              <Input
                value={form.action_config.mediaPath || ''}
                onChange={(e) => updateConfig('mediaPath', e.target.value)}
                placeholder="C:\\path\\to\\media.mp4"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          )}

          {/* Conditional: Redirect URL */}
          {form.action_type === 'close_and_redirect' && (
            <div className="space-y-2 col-span-2">
              <Label className="text-zinc-300">Redirect URL</Label>
              <Input
                value={form.action_config.redirectUrl || ''}
                onChange={(e) => updateConfig('redirectUrl', e.target.value)}
                placeholder="https://example.com"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          )}

          {/* Conditional: Overlay Message */}
          {form.action_type === 'overlay' && (
            <div className="space-y-2 col-span-2">
              <Label className="text-zinc-300">Overlay Message</Label>
              <textarea
                value={form.action_config.overlayMessage || ''}
                onChange={(e) => updateConfig('overlayMessage', e.target.value)}
                placeholder="This content has been blocked."
                rows={3}
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              />
            </div>
          )}

          {/* Bypass Mode */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Bypass Mode</Label>
            <Select
              value={form.bypass_mode}
              onValueChange={(v) => setForm((f) => ({ ...f, bypass_mode: v as any }))}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
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
              <Label className="text-zinc-300">Cooldown (seconds)</Label>
              <Input
                type="number"
                value={form.bypass_cooldown_seconds}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bypass_cooldown_seconds: parseInt(e.target.value) || 0 }))
                }
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Keyword' : 'Add Keyword'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
