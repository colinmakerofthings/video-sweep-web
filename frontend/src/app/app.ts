import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SweepService } from './sweep.service';
import { ScanRow, ScanResponse, ProceedResult, DirectoryConfig } from './sweep.types';

type AppState = 'idle' | 'scanning' | 'ready' | 'proceeding' | 'done' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  state: AppState = 'idle';
  rows: ScanRow[] = [];
  nonVideos: string[] = [];
  cleanUp = true;
  showNonVideos = true;
  result: ProceedResult | null = null;
  errorMessage = '';
  config: DirectoryConfig | null = null;

  constructor(private sweepService: SweepService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.sweepService.getConfig().subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.cdr.detectChanges();
      },
      error: () => setTimeout(() => this.loadConfig(), 2000),
    });
  }

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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error ?? err.message ?? 'Scan failed';
        this.state = 'error';
        this.cdr.detectChanges();
      },
    });
  }

  proceed(): void {
    this.state = 'proceeding';
    this.sweepService.proceed(this.rows, this.nonVideos, this.cleanUp).subscribe({
      next: (data: ProceedResult) => {
        this.result = data;
        this.state = 'done';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error ?? err.message ?? 'Proceed failed';
        this.state = 'error';
        this.cdr.detectChanges();
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

  get deleteCount(): number {
    return this.rows.filter((r) => r.type === 'delete').length;
  }

  get visibleRows(): ScanRow[] {
    return this.showNonVideos ? this.rows : this.rows.filter((r) => r.type !== 'delete');
  }
}
