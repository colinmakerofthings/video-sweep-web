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
