import * as path from 'path';

// Characters forbidden in Windows/common paths
const FORBIDDEN_RE = /[<>:"/\\|?*]/g;

function sanitize(str: string): string {
  return str.replace(FORBIDDEN_RE, '').trim();
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export interface MovieRenameResult {
  newFilename: string;
  targetPath: string;
}

export interface SeriesRenameResult {
  seriesName: string;
  seasonNum: number;
  episodeCode: string;
  newFilename: string;
  targetPath: string;
}

/**
 * Build a standardised movie filename: "Title [YYYY].ext"
 * The original file sits in sourceDir, destination is movieOutputDir.
 */
export function movieNewFilename(
  filePath: string,
  movieOutputDir: string
): MovieRenameResult {
  const base = path.basename(filePath);
  const ext = path.extname(base);
  const stem = base.slice(0, -ext.length);

  // Try to find a 4-digit year
  const yearMatch = stem.match(/\b((?:19|20)\d{2})\b/);

  let title: string;
  let year: string;

  if (yearMatch) {
    year = yearMatch[1];
    // Everything before the year
    title = stem.slice(0, yearMatch.index!).replace(/[._\-]+/g, ' ').trim();
  } else {
    // No year — use full stem as title
    title = stem.replace(/[._\-]+/g, ' ').trim();
    year = '';
  }

  title = sanitize(toTitleCase(title));
  const newFilename = year ? `${title} [${year}]${ext}` : `${title}${ext}`;
  const targetPath = path.join(movieOutputDir, newFilename);

  return { newFilename, targetPath };
}

/**
 * Build a standardised series filename: "SeriesName SxxEyy.ext"
 * Destination: seriesOutputDir/SeriesName/Season N/SeriesName SxxEyy.ext
 */
export function seriesNewFilename(
  filePath: string,
  seriesOutputDir: string
): SeriesRenameResult {
  const base = path.basename(filePath);
  const ext = path.extname(base);
  const stem = base.slice(0, -ext.length);

  // Extract episode code (SxxEyy)
  const epMatch = stem.match(/\b(S(\d{2})E\d{2})\b/i);
  const episodeCode = epMatch ? epMatch[1].toUpperCase() : 'S01E01';
  const seasonNum = epMatch ? parseInt(epMatch[2], 10) : 1;

  // Series name = everything before the episode code
  const beforeCode = epMatch
    ? stem.slice(0, stem.search(/\bS\d{2}E\d{2}\b/i))
    : stem;

  // Remove trailing year in parentheses, e.g. "(2014)"
  const seriesName = sanitize(
    toTitleCase(
      beforeCode
        .replace(/\(\d{4}\)\s*$/, '')
        .replace(/[._\-]+/g, ' ')
        .trim()
    )
  );

  const newFilename = `${seriesName} ${episodeCode}${ext}`;
  const seasonFolder = `Season ${seasonNum}`;
  const targetPath = path.join(
    seriesOutputDir,
    seriesName,
    seasonFolder,
    newFilename
  );

  return { seriesName, seasonNum, episodeCode, newFilename, targetPath };
}
