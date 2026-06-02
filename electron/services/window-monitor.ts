import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PS_COMMAND = `Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@
$hwnd = [Win32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null
$pid = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
"$($sb.ToString())|$($proc.ProcessName)"`

export interface ActiveWindow {
  title: string
  processName: string
}

let intervalId: NodeJS.Timeout | null = null
let lastTitle = ''
let onMatch: ((title: string, processName: string) => void) | null = null

export async function getActiveWindow(): Promise<ActiveWindow | null> {
  try {
    const escaped = PS_COMMAND.replace(/"/g, '\\"')
    const { stdout } = await execAsync(
      `powershell -NoProfile -Command "${escaped}"`,
      { timeout: 3000 }
    )
    const trimmed = stdout.trim()
    const separatorIndex = trimmed.lastIndexOf('|')
    if (separatorIndex === -1) return null

    const title = trimmed.slice(0, separatorIndex)
    const processName = trimmed.slice(separatorIndex + 1) || 'unknown'

    if (!title) return null
    return { title, processName }
  } catch {
    return null
  }
}

export function startWindowMonitor(
  callback: (title: string, processName: string) => void,
  intervalMs = 1500
): void {
  onMatch = callback

  intervalId = setInterval(async () => {
    const win = await getActiveWindow()
    if (!win || win.title === lastTitle) return
    lastTitle = win.title
    onMatch?.(win.title, win.processName)
  }, intervalMs)
}

export function stopWindowMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  onMatch = null
  lastTitle = ''
}
