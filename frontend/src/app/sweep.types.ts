export interface ScanRow {
  file: string;
  type: 'movie' | 'series';
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
}

export interface DirectoryConfig {
  sourceDir: string;
  moviesDir: string;
  seriesDir: string;
}
