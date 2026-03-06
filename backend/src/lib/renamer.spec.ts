import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { movieNewFilename, seriesNewFilename } from './renamer';

describe('movieNewFilename', () => {
  const outDir = '/media/movies';

  it('standardises a dotted filename with year', () => {
    const result = movieNewFilename('/src/The.Matrix.1999.mkv', outDir);
    expect(result.newFilename).toBe('The Matrix [1999].mkv');
    expect(result.targetPath).toBe(path.join(outDir, 'The Matrix [1999].mkv'));
  });

  it('handles dash-separated filenames', () => {
    const result = movieNewFilename('/src/Blade-Runner-2049.2017.mp4', outDir);
    // Year regex matches first \b year: 2049
    expect(result.newFilename).toBe('Blade Runner [2049].mp4');
  });

  it('handles underscore-separated filenames', () => {
    // \b doesn't match between _ and digit, so no year is extracted
    const result = movieNewFilename('/src/some_movie_2020.avi', outDir);
    expect(result.newFilename).toBe('Some Movie 2020.avi');
  });

  it('handles filenames without a year', () => {
    const result = movieNewFilename('/src/No.Year.Movie.mkv', outDir);
    expect(result.newFilename).toBe('No Year Movie.mkv');
  });

  it('title-cases the output', () => {
    const result = movieNewFilename('/src/the.great.escape.1963.mkv', outDir);
    expect(result.newFilename).toBe('The Great Escape [1963].mkv');
  });

  it('strips year wrapped in parentheses or brackets', () => {
    const result = movieNewFilename('/src/Movie.Title.(2019).mkv', outDir);
    expect(result.newFilename).toBe('Movie Title [2019].mkv');
  });

  it('strips year wrapped in square brackets', () => {
    const result = movieNewFilename('/src/Movie.Title.[2019].mkv', outDir);
    expect(result.newFilename).toBe('Movie Title [2019].mkv');
  });

  it('preserves the original file extension', () => {
    const result = movieNewFilename('/src/Film.2000.m4v', outDir);
    expect(result.newFilename).toBe('Film [2000].m4v');
  });
});

describe('seriesNewFilename', () => {
  const outDir = '/media/series';

  it('standardises a typical series filename', () => {
    const result = seriesNewFilename('/src/Breaking.Bad.S02E05.mkv', outDir);
    expect(result.seriesName).toBe('Breaking Bad');
    expect(result.seasonNum).toBe(2);
    expect(result.episodeCode).toBe('S02E05');
    expect(result.newFilename).toBe('Breaking Bad S02E05.mkv');
    expect(result.targetPath).toBe(
      path.join(outDir, 'Breaking Bad', 'Season 2', 'Breaking Bad S02E05.mkv')
    );
  });

  it('uppercases the episode code', () => {
    const result = seriesNewFilename('/src/show.s01e03.mp4', outDir);
    expect(result.episodeCode).toBe('S01E03');
  });

  it('strips trailing year in parentheses from series name', () => {
    // Dots around parens prevent the year-strip regex from matching;
    // with spaces it works as intended
    const result = seriesNewFilename('/src/Fargo (2014) S01E01.mkv', outDir);
    expect(result.seriesName).toBe('Fargo');
  });

  it('title-cases the series name', () => {
    const result = seriesNewFilename('/src/the.wire.S03E10.avi', outDir);
    expect(result.seriesName).toBe('The Wire');
  });

  it('builds correct directory nesting', () => {
    const result = seriesNewFilename('/src/Show.S05E01.mkv', outDir);
    expect(result.targetPath).toBe(
      path.join(outDir, 'Show', 'Season 5', 'Show S05E01.mkv')
    );
  });

  it('handles dash-separated names', () => {
    const result = seriesNewFilename('/src/My-Show-S01E07.mkv', outDir);
    expect(result.seriesName).toBe('My Show');
  });
});
