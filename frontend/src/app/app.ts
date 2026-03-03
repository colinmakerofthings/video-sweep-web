import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SweepService } from './sweep.service';
import { ScanRow, ScanResponse, ProceedResult } from './sweep.types';

type AppState = 'idle' | 'scanning' | 'ready' | 'proceeding' | 'done' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  state: AppState = 'idle';
  rows: ScanRow[] = [];
  nonVideos: string[] = [];
  cleanUp = false;
  result: ProceedResult | null = null;
  errorMessage = '';

  constructor(private sweepService: SweepService) {}

  scan(): void {
    this.state = 'scanning';
    this.rows = [];
    this.nonVideos = [];
    this.errorMessage = '';
    this.result = null;

    this.sweepService.scan().subscribe({
      next: (data: ScanResponse) => {
        this.rows = data.rows;
        this.nonVideos = data.nonVideos;
        this.state = 'ready';
      },
      error: (err) => {
        this.errorMessage = err?.error?.error ?? err.message ?? 'Scan failed';
        this.state = 'error';
      },
    });
  }

  proceed(): void {
    this.state = 'proceeding';
    this.sweepService.proceed(this.rows, this.nonVideos, this.cleanUp).subscribe({
      next: (data: ProceedResult) => {
        this.result = data;
        this.state = 'done';
      },
      error: (err) => {
        this.errorMessage = err?.error?.error ?? err.message ?? 'Proceed failed';
        this.state = 'error';
      },
    });
  }

  reset(): void {
    this.state = 'idle';
    this.rows = [];
    this.nonVideos = [];
    this.result = null;
    this.errorMessage = '';
  }

  get hasOmdb(): boolean {
    return this.rows.some((r) => r.valid !== '-');
  }

  get movieCount(): number {
    return this.rows.filter((r) => r.type === 'movie').length;
  }

  get seriesCount(): number {
    return this.rows.filter((r) => r.type === 'series').length;
  }
}
