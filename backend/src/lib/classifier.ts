export type VideoType = 'movie' | 'series';

const SERIES_REGEX = /S\d{2}E\d{2}/i;

export function classify(filename: string): VideoType {
  return SERIES_REGEX.test(filename) ? 'series' : 'movie';
}
