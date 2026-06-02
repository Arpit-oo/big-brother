import { uIOhook, UiohookKey } from 'uiohook-napi';

let buffer = '';
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_DELAY_MS = 800;
const MAX_BUFFER = 200;

let onFlush: ((text: string) => void) | null = null;

// Build a reverse keycode-to-char map for printable characters
const KEYCODE_TO_CHAR: Record<number, string> = {};

// Letters A-Z (keycodes vary by platform, uiohook uses specific codes)
const letterCodes: Record<string, number> = {
  Q: UiohookKey.Q, W: UiohookKey.W, E: UiohookKey.E, R: UiohookKey.R,
  T: UiohookKey.T, Y: UiohookKey.Y, U: UiohookKey.U, I: UiohookKey.I,
  O: UiohookKey.O, P: UiohookKey.P, A: UiohookKey.A, S: UiohookKey.S,
  D: UiohookKey.D, F: UiohookKey.F, G: UiohookKey.G, H: UiohookKey.H,
  J: UiohookKey.J, K: UiohookKey.K, L: UiohookKey.L, Z: UiohookKey.Z,
  X: UiohookKey.X, C: UiohookKey.C, V: UiohookKey.V, B: UiohookKey.B,
  N: UiohookKey.N, M: UiohookKey.M,
};

for (const [letter, code] of Object.entries(letterCodes)) {
  KEYCODE_TO_CHAR[code] = letter.toLowerCase();
}

// Numbers 0-9
const numberCodes: Record<string, number> = {
  '0': UiohookKey.Num0, '1': UiohookKey.Num1, '2': UiohookKey.Num2,
  '3': UiohookKey.Num3, '4': UiohookKey.Num4, '5': UiohookKey.Num5,
  '6': UiohookKey.Num6, '7': UiohookKey.Num7, '8': UiohookKey.Num8,
  '9': UiohookKey.Num9,
};

for (const [num, code] of Object.entries(numberCodes)) {
  KEYCODE_TO_CHAR[code] = num;
}

function handleKeyDown(event: { keycode: number }) {
  const char = KEYCODE_TO_CHAR[event.keycode];

  if (char) {
    buffer += char;
  } else if (event.keycode === UiohookKey.Space) {
    buffer += ' ';
  } else if (event.keycode === UiohookKey.Enter) {
    flushBuffer();
    return;
  } else if (event.keycode === UiohookKey.Backspace) {
    buffer = buffer.slice(0, -1);
    return;
  } else {
    // Non-printable key, ignore
    return;
  }

  if (buffer.length > MAX_BUFFER) {
    buffer = buffer.slice(-MAX_BUFFER);
  }

  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(flushBuffer, FLUSH_DELAY_MS);
}

function flushBuffer() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  const text = buffer.trim();
  if (text.length >= 3 && onFlush) {
    onFlush(text);
  }
  buffer = '';
}

export function startKeystrokeMonitor(callback: (text: string) => void) {
  onFlush = callback;
  uIOhook.on('keydown', handleKeyDown);
  uIOhook.start();
}

export function stopKeystrokeMonitor() {
  uIOhook.stop();
  uIOhook.removeAllListeners();
  buffer = '';
  onFlush = null;
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
}
