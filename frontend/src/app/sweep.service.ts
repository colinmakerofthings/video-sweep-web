import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProceedResult, ScanResponse, ScanRow } from './sweep.types';

@Injectable({ providedIn: 'root' })
export class SweepService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  scan(): Observable<ScanResponse> {
    return this.http.post<ScanResponse>(`${this.base}/scan`, {});
  }

  proceed(rows: ScanRow[], nonVideos: string[], cleanUp: boolean): Observable<ProceedResult> {
    return this.http.post<ProceedResult>(`${this.base}/proceed`, { rows, nonVideos, cleanUp });
  }
}
