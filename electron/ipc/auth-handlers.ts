import { ipcMain } from 'electron';
import { setPin, verifyPin, hasPin, removePin, getAuthMode, setAuthMode } from '../services/auth-service';

export function registerAuthHandlers() {
  ipcMain.handle('auth:has-pin', () => hasPin());
  ipcMain.handle('auth:set-pin', (_event, pin: string) => {
    setPin(pin);
    return true;
  });
  ipcMain.handle('auth:verify-pin', (_event, pin: string) => verifyPin(pin));
  ipcMain.handle('auth:remove-pin', (_event, currentPin: string) => removePin(currentPin));
  ipcMain.handle('auth:get-mode', () => getAuthMode());
  ipcMain.handle('auth:set-mode', (_event, mode: 'personal' | 'managed') => {
    setAuthMode(mode);
    return true;
  });
}
