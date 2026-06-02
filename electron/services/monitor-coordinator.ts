import { EventEmitter } from 'events';
import { matchText, MatchResult } from './matcher';
import { listKeywords, Keyword } from './keyword-service';
import { logIntervention } from './log-service';

export interface MonitorEvent {
  source: 'browser_url' | 'browser_search' | 'browser_title' | 'app_title' | 'keystroke';
  text: string;
  detail?: string;
  tabId?: number;
}

class MonitorCoordinator extends EventEmitter {
  private keywords: Keyword[] = [];
  private enabled = true;

  refreshKeywords() {
    this.keywords = listKeywords();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getKeywordCount(): number {
    return this.keywords.length;
  }

  getSampleTerms(): string[] {
    return this.keywords.slice(0, 5).map(k => k.term);
  }

  check(event: MonitorEvent): MatchResult | null {
    if (!this.enabled) return null;
    if (!this.keywords.length) this.refreshKeywords();

    const result = matchText(event.text, this.keywords);
    if (event.source === 'keystroke') {
      console.log('[Big Brother] Checking keystroke:', JSON.stringify(event.text), '→', result ? 'MATCH: ' + result.keyword.term : 'no match');
    }
    if (result) {
      logIntervention({
        keywordId: result.keyword.id,
        matchedText: event.text,
        source: event.source,
        sourceDetail: event.detail,
        actionTaken: result.keyword.action_type,
      });

      this.emit('match', { result, event });
    }

    return result;
  }
}

export const coordinator = new MonitorCoordinator();
