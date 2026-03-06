import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { SweepService } from './sweep.service';
import { ScanRow, DirectoryConfig } from './sweep.types';
import { of, EMPTY } from 'rxjs';

function makeRow(overrides: Partial<ScanRow> = {}): ScanRow {
  return {
    file: '/media/source/Test.Movie.2020.mkv',
    type: 'movie',
    action: 'move',
    newFilename: 'Test Movie [2020].mkv',
    targetPath: '/media/movies/Test Movie [2020].mkv',
    valid: 'Yes',
    suggested: '',
    ...overrides,
  };
}

const mockConfig: DirectoryConfig = {
  sourceDir: '/media/source',
  moviesDir: '/media/movies',
  seriesDir: '/media/series',
};

describe('App', () => {
  let app: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: SweepService,
          useValue: {
            scan: () => EMPTY,
            proceed: () => EMPTY,
            getConfig: () => of(mockConfig),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    app.config = mockConfig;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('starts in idle state', () => {
    expect(app.state).toBe('idle');
    expect(app.rows).toEqual([]);
  });

  describe('acceptSuggestion', () => {
    it('updates filename, targetPath, valid, and action from the suggestion', () => {
      const row = makeRow({
        file: '/media/source/Bad.Title.1999.mkv',
        newFilename: 'Bad Title [1999].mkv',
        targetPath: '/media/movies/Bad Title [1999].mkv',
        valid: 'No',
        suggested: 'The Actual Title [1999]',
        action: 'skip',
      });
      app.rows = [row];

      app.acceptSuggestion(row);

      expect(row.newFilename).toBe('The Actual Title [1999].mkv');
      expect(row.targetPath).toBe('/media/movies/The Actual Title [1999].mkv');
      expect(row.valid).toBe('Yes');
      expect(row.action).toBe('move');
    });

    it('preserves the original file extension', () => {
      const row = makeRow({
        file: '/media/source/movie.2020.m4v',
        valid: 'No',
        suggested: 'Corrected Title [2020]',
        action: 'skip',
      });
      app.rows = [row];

      app.acceptSuggestion(row);

      expect(row.newFilename).toBe('Corrected Title [2020].m4v');
    });

    it('uses the configured moviesDir for the target path', () => {
      app.config = { ...mockConfig, moviesDir: '/custom/movies' };
      const row = makeRow({
        file: '/media/source/film.2021.mkv',
        valid: 'No',
        suggested: 'Proper Film [2021]',
        action: 'skip',
      });

      app.acceptSuggestion(row);

      expect(row.targetPath).toBe('/custom/movies/Proper Film [2021].mkv');
    });
  });

  describe('setAction', () => {
    it('sets the action when checked', () => {
      const row = makeRow({ action: 'skip' });
      app.setAction(row, 'move', true);
      expect(row.action).toBe('move');
    });

    it('sets action to skip when unchecked', () => {
      const row = makeRow({ action: 'move' });
      app.setAction(row, 'move', false);
      expect(row.action).toBe('skip');
    });

    it('can set action to delete', () => {
      const row = makeRow({ action: 'skip' });
      app.setAction(row, 'delete', true);
      expect(row.action).toBe('delete');
    });
  });

  describe('toggleAllMove', () => {
    it('sets all non-delete rows to move when checked', () => {
      app.rows = [
        makeRow({ type: 'movie', action: 'skip' }),
        makeRow({ type: 'series', action: 'skip' }),
        makeRow({ type: 'delete', action: 'delete' }),
      ];

      app.toggleAllMove(true);

      expect(app.rows[0].action).toBe('move');
      expect(app.rows[1].action).toBe('move');
      expect(app.rows[2].action).toBe('delete'); // delete-type unaffected
    });

    it('sets all non-delete rows to skip when unchecked', () => {
      app.rows = [
        makeRow({ type: 'movie', action: 'move' }),
        makeRow({ type: 'series', action: 'move' }),
      ];

      app.toggleAllMove(false);

      expect(app.rows[0].action).toBe('skip');
      expect(app.rows[1].action).toBe('skip');
    });
  });

  describe('toggleAllDelete', () => {
    it('sets all rows to delete when checked', () => {
      app.rows = [
        makeRow({ type: 'movie', action: 'move' }),
        makeRow({ type: 'delete', action: 'skip' }),
      ];

      app.toggleAllDelete(true);

      expect(app.rows[0].action).toBe('delete');
      expect(app.rows[1].action).toBe('delete');
    });

    it('sets all rows to skip when unchecked', () => {
      app.rows = [
        makeRow({ action: 'delete' }),
        makeRow({ action: 'delete' }),
      ];

      app.toggleAllDelete(false);

      expect(app.rows.every(r => r.action === 'skip')).toBe(true);
    });
  });

  describe('onCleanUpChange', () => {
    it('toggles delete-type rows between delete and skip', () => {
      app.rows = [
        makeRow({ type: 'delete', action: 'delete' }),
        makeRow({ type: 'movie', action: 'move' }),
      ];

      app.onCleanUpChange(false);
      expect(app.rows[0].action).toBe('skip');
      expect(app.rows[1].action).toBe('move'); // movie unaffected

      app.onCleanUpChange(true);
      expect(app.rows[0].action).toBe('delete');
    });
  });

  describe('computed counts', () => {
    beforeEach(() => {
      app.rows = [
        makeRow({ type: 'movie' }),
        makeRow({ type: 'movie' }),
        makeRow({ type: 'series' }),
        makeRow({ type: 'delete' }),
        makeRow({ type: 'delete' }),
        makeRow({ type: 'delete' }),
      ];
    });

    it('counts movies', () => {
      expect(app.movieCount).toBe(2);
    });

    it('counts series', () => {
      expect(app.seriesCount).toBe(1);
    });

    it('counts deletes', () => {
      expect(app.deleteCount).toBe(3);
    });
  });

  describe('visibleRows', () => {
    it('returns all rows when showNonVideos is true', () => {
      app.rows = [makeRow({ type: 'movie' }), makeRow({ type: 'delete' })];
      app.showNonVideos = true;
      expect(app.visibleRows).toHaveLength(2);
    });

    it('filters out delete-type rows when showNonVideos is false', () => {
      app.rows = [makeRow({ type: 'movie' }), makeRow({ type: 'delete' })];
      app.showNonVideos = false;
      expect(app.visibleRows).toHaveLength(1);
      expect(app.visibleRows[0].type).toBe('movie');
    });
  });

  describe('select-all state getters', () => {
    it('allMoveSelected is true when all eligible rows are move', () => {
      app.rows = [
        makeRow({ type: 'movie', action: 'move' }),
        makeRow({ type: 'series', action: 'move' }),
        makeRow({ type: 'delete', action: 'delete' }), // not eligible
      ];
      expect(app.allMoveSelected).toBe(true);
    });

    it('allMoveSelected is false when some eligible rows are not move', () => {
      app.rows = [
        makeRow({ type: 'movie', action: 'move' }),
        makeRow({ type: 'series', action: 'skip' }),
      ];
      expect(app.allMoveSelected).toBe(false);
    });

    it('someMoveSelected is true when partially selected', () => {
      app.rows = [
        makeRow({ type: 'movie', action: 'move' }),
        makeRow({ type: 'movie', action: 'skip' }),
      ];
      expect(app.someMoveSelected).toBe(true);
    });

    it('someMoveSelected is false when all or none selected', () => {
      app.rows = [
        makeRow({ type: 'movie', action: 'move' }),
        makeRow({ type: 'movie', action: 'move' }),
      ];
      expect(app.someMoveSelected).toBe(false);
    });

    it('allDeleteSelected is true when all rows are delete', () => {
      app.rows = [
        makeRow({ action: 'delete' }),
        makeRow({ action: 'delete' }),
      ];
      expect(app.allDeleteSelected).toBe(true);
    });

    it('someDeleteSelected is true when partially selected', () => {
      app.rows = [
        makeRow({ action: 'delete' }),
        makeRow({ action: 'skip' }),
      ];
      expect(app.someDeleteSelected).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears all state back to idle', () => {
      app.state = 'done' as any;
      app.rows = [makeRow()];
      app.result = { moved: 1, deleted: 0, errors: [], failedFiles: [] };
      app.errorMessage = 'something';

      app.reset();

      expect(app.state).toBe('idle');
      expect(app.rows).toEqual([]);
      expect(app.result).toBeNull();
      expect(app.errorMessage).toBe('');
    });
  });
});
