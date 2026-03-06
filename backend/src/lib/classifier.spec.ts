import { describe, it, expect } from 'vitest';
import { classify } from './classifier';

describe('classify', () => {
  it('classifies filenames with SxxEyy as series', () => {
    expect(classify('Fargo.S01E01.mkv')).toBe('series');
    expect(classify('show.s02e03.mp4')).toBe('series');
    expect(classify('Another.Show.S10E25.720p.mkv')).toBe('series');
  });

  it('classifies filenames without SxxEyy as movie', () => {
    expect(classify('Blade.Runner.1982.mkv')).toBe('movie');
    expect(classify('No.Country.for.Old.Men.2007.720p.mp4')).toBe('movie');
    expect(classify('the-shining.avi')).toBe('movie');
  });

  it('is case-insensitive', () => {
    expect(classify('show.S01e02.mkv')).toBe('series');
    expect(classify('show.s01E02.mkv')).toBe('series');
  });
});
