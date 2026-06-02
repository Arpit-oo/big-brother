import { ipcMain } from 'electron';
import { getLogs, getStats, clearLogs } from '../services/log-service';

export function registerLogHandlers() {
  ipcMain.handle('logs:list', (_event, filter?) => getLogs(filter));
  ipcMain.handle('logs:stats', () => getStats());
  ipcMain.handle('logs:clear', () => clearLogs());
}
