import fetch from 'node-fetch';
import stringSimilarity from 'string-similarity';
import logger from './logger';

const OMDB_BASE = 'http://www.omdbapi.com/';

export interface OmdbResult {
  valid: 'Yes' | 'No' | '-';
  suggested: string;
}

interface OmdbMovie {
  Title: string;
  Year: string;
  Response: string;
  Error?: string;
}

interface OmdbSearch {
  Search?: Array<{ Title: string; Year: string }>;
  Response: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn({ status: res.status }, 'omdb http error');
      return null;
    }
    return (await res.json()) as T;
  } catch (err: unknown) {
    logger.warn({ err }, 'omdb fetch failed');
    return null;
  }
}

/**
 * Try progressively shorter substrings of the title until we get a hit.
 */
async function searchFuzzy(
  title: string,
  year: string,
  apiKey: string
): Promise<string | null> {
  const words = title.split(' ').filter(Boolean);
  const thresholdWithYear = 0.8;
  const thresholdWithoutYear = 0.9;

  for (let len = words.length; len >= 1; len--) {
    const partial = words.slice(0, len).join(' ');
    const query = year
      ? `${OMDB_BASE}?apikey=${apiKey}&s=${encodeURIComponent(partial)}&y=${year}&type=movie`
      : `${OMDB_BASE}?apikey=${apiKey}&s=${encodeURIComponent(partial)}&type=movie`;

    const data = await fetchJson<OmdbSearch>(query);
    if (!data || data.Response !== 'True' || !data.Search) continue;

    for (const item of data.Search) {
      const score = stringSimilarity.compareTwoStrings(
        title.toLowerCase(),
        item.Title.toLowerCase()
      );
      const threshold = year ? thresholdWithYear : thresholdWithoutYear;
      if (score >= threshold) {
        return `${item.Title} [${item.Year}]`;
      }
    }
  }
  return null;
}

export async function validateMovie(
  title: string,
  year: string,
  apiKey: string
): Promise<OmdbResult> {
  if (!apiKey) return { valid: '-', suggested: '' };
  logger.debug({ title, year }, 'omdb lookup');

  // Direct title lookup
  const directUrl = year
    ? `${OMDB_BASE}?apikey=${apiKey}&t=${encodeURIComponent(title)}&y=${year}&type=movie`
    : `${OMDB_BASE}?apikey=${apiKey}&t=${encodeURIComponent(title)}&type=movie`;

  const direct = await fetchJson<OmdbMovie>(directUrl);

  if (direct && direct.Response === 'True') {
    const canonical = `${direct.Title} [${direct.Year}]`;
    const input = year ? `${title} [${year}]` : title;
    const match =
      stringSimilarity.compareTwoStrings(
        input.toLowerCase(),
        canonical.toLowerCase()
      ) >= 0.8;

    if (match) {
      logger.debug({ title, canonical }, 'omdb direct match');
      return { valid: 'Yes', suggested: canonical };
    } else {
      logger.debug({ title, canonical }, 'omdb direct hit but low similarity');
      return { valid: 'No', suggested: canonical };
    }
  }

  // Fallback: fuzzy search
  logger.debug({ title }, 'omdb trying fuzzy search');
  const fuzzy = await searchFuzzy(title, year, apiKey);
  if (fuzzy) {
    return { valid: 'No', suggested: fuzzy };
  }

  return { valid: '-', suggested: '' };
}
