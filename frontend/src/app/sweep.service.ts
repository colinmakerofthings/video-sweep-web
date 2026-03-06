import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectoryConfig, ProceedEvent, ProceedResult, ScanResponse, ScanRow } from './sweep.types';

@Injectable({ providedIn: 'root' })
export class SweepService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  scan(): Observable<ScanResponse> {
    return this.http.post<ScanResponse>(`${this.base}/scan`, {});
  }

  proceed(rows: ScanRow[], deleteEmptyFolders: boolean = true): Observable<ProceedEvent> {
    return new Observable(observer => {
      fetch(`${this.base}/proceed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, deleteEmptyFolders }),
      }).then(async (res) => {
        if (!res.ok || !res.body) {
          observer.error(new Error(`HTTP ${res.status}`));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) { observer.complete(); return; }
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop()!;
          for (const part of parts) {
            const line = part.trim();
            if (line.startsWith('data: ')) {
              try { observer.next(JSON.parse(line.slice(6))); } catch { /* skip malformed */ }
            }
          }
        }
      }).catch(err => observer.error(err));
    });
  }

  getConfig(): Observable<DirectoryConfig> {
    return this.http.get<DirectoryConfig>(`${this.base}/config`);
  }
}
