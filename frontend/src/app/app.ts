import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SweepService } from './sweep.service';
import { ScanRow, ScanResponse, ProceedResult, ProceedEvent, DirectoryConfig } from './sweep.types';
import { version } from '../../package.json';

type AppState = 'idle' | 'scanning' | 'ready' | 'proceeding' | 'done' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly appVersion = version;
  state: AppState = 'idle';
  rows: ScanRow[] = [];
  nonVideos: string[] = [];

  private _cleanUp = localStorage.getItem('opt.cleanUp') !== 'false';
  get cleanUp() { return this._cleanUp; }
  set cleanUp(v: boolean) { this._cleanUp = v; localStorage.setItem('opt.cleanUp', String(v)); }

  private _deleteEmptyFolders = localStorage.getItem('opt.deleteEmptyFolders') !== 'false';
  get deleteEmptyFolders() { return this._deleteEmptyFolders; }
  set deleteEmptyFolders(v: boolean) { this._deleteEmptyFolders = v; localStorage.setItem('opt.deleteEmptyFolders', String(v)); }

  private _showNonVideos = localStorage.getItem('opt.showNonVideos') !== 'false';
  get showNonVideos() { return this._showNonVideos; }
  set showNonVideos(v: boolean) { this._showNonVideos = v; localStorage.setItem('opt.showNonVideos', String(v)); }

  progressCurrent = 0;
  progressTotal = 0;
  result: ProceedResult | null = null;
  errorMessage = '';
  config: DirectoryConfig | null = null;
  selectedRow: ScanRow | null = null;

  constructor(private sweepService: SweepService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  private refreshIcons(): void {
    setTimeout(() => (window as any).lucide?.createIcons(), 0);
  }

  private loadConfig(): void {
    this.sweepService.getConfig().subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.cdr.detectChanges();
        this.refreshIcons();
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
    this.selectedRow = null;

    this.sweepService.scan().subscribe({
      next: (data: ScanResponse) => {
        this.rows = data.rows.map(r => ({
          ...r,
          action: r.type === 'delete' ? (this.cleanUp ? 'delete' : 'skip')
                : r.valid === 'No'   ? 'skip'
                : 'move',
        }));
        this.nonVideos = data.nonVideos;
        this.state = 'ready';
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error ?? err.message ?? 'Scan failed';
        this.state = 'error';
        this.cdr.detectChanges();
      },
    });
  }

  proceed(): void {
    const toProcess = this.rows.filter(r => r.action !== 'skip');
    this.state = 'proceeding';
    this.progressCurrent = 0;
    this.progressTotal = toProcess.length;

    this.sweepService.proceed(toProcess, this.deleteEmptyFolders).subscribe({
      next: (event: ProceedEvent) => {
        if (event.type === 'progress') {
          this.progressCurrent = event.current;
        } else {
          this.result = event;
          const failedSet = new Set(event.failedFiles);
          this.rows = this.rows.filter(r => r.action === 'skip' || failedSet.has(r.file));
          this.state = 'done';
        }
        this.cdr.detectChanges();
        this.refreshIcons();
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
    this.selectedRow = null;
    this.refreshIcons();
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

  get suggestedCount(): number {
    return this.rows.filter((r) => r.valid === 'No' && !!r.suggested).length;
  }

  get visibleRows(): ScanRow[] {
    return this.showNonVideos ? this.rows : this.rows.filter((r) => r.type !== 'delete');
  }

  setAction(row: ScanRow, action: 'move' | 'delete', checked: boolean): void {
    row.action = checked ? action : 'skip';
  }

  toggleAllMove(checked: boolean): void {
    this.rows.filter(r => r.type !== 'delete').forEach(r => r.action = checked ? 'move' : 'skip');
  }

  toggleAllDelete(checked: boolean): void {
    this.rows.forEach(r => r.action = checked ? 'delete' : 'skip');
  }

  get allMoveSelected(): boolean {
    const eligible = this.rows.filter(r => r.type !== 'delete');
    return eligible.length > 0 && eligible.every(r => r.action === 'move');
  }

  get someMoveSelected(): boolean {
    const eligible = this.rows.filter(r => r.type !== 'delete');
    return eligible.some(r => r.action === 'move') && !this.allMoveSelected;
  }

  get allDeleteSelected(): boolean {
    return this.rows.length > 0 && this.rows.every(r => r.action === 'delete');
  }

  get someDeleteSelected(): boolean {
    return this.rows.some(r => r.action === 'delete') && !this.allDeleteSelected;
  }

  selectRow(row: ScanRow): void {
    this.selectedRow = this.selectedRow === row ? null : row;
  }

  acceptSuggestion(row: ScanRow): void {
    const ext = row.file.substring(row.file.lastIndexOf('.'));
    row.newFilename = row.suggested + ext;
    row.targetPath = this.config!.moviesDir + '/' + row.newFilename;
    row.valid = 'Yes';
    row.action = 'move';
  }

  onCleanUpChange(checked: boolean): void {
    this.cleanUp = checked;
    this.rows.filter(r => r.type === 'delete').forEach(r => r.action = checked ? 'delete' : 'skip');
  }
}
