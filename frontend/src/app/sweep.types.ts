export interface ScanRow {
  file: string;
  type: 'movie' | 'series' | 'delete';
  action: 'move' | 'delete' | 'skip';
  newFilename: string;
  targetPath: string;
  valid: 'Yes' | 'No' | '-';
  suggested: string;
}

export interface ScanResponse {
  rows: ScanRow[];
  nonVideos: string[];
}

export interface ProceedResult {
  moved: number;
  deleted: number;
  errors: string[];
  failedFiles: string[];
}

export type ProceedEvent =
  | { type: 'progress'; current: number; total: number }
  | ({ type: 'done' } & ProceedResult);

export interface DirectoryConfig {
  sourceDir: string;
  moviesDir: string;
  seriesDir: string;
}
