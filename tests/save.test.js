import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  save,
  load,
  deleteSave,
  hasSave,
  startAutoSave,
  stopAutoSave,
  getAutoSaveTimer,
  SAVE_KEY,
  SAVE_VERSION,
} from '../src/utils/save.js';

describe('Save System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    stopAutoSave();
    localStorage.clear();
  });

  describe('save()', () => {
    it('saves game state to localStorage', () => {
      const state = { party: [{ name: 'Test' }], gold: 100 };
      const result = save(state);

      expect(result).toBe(true);
      const raw = localStorage.getItem(SAVE_KEY);
      expect(raw).toBeTruthy();

      const data = JSON.parse(raw);
      expect(data.version).toBe(SAVE_VERSION);
      expect(data.state).toEqual(state);
      expect(data.timestamp).toBeTypeOf('number');
    });

    it('returns false on error', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('quota exceeded');
        });

      const result = save({ test: true });
      expect(result).toBe(false);

      spy.mockRestore();
    });
  });

  describe('load()', () => {
    it('returns null when no save exists', () => {
      expect(load()).toBeNull();
    });

    it('loads saved game state', () => {
      const state = { party: [{ name: 'Hero' }], gold: 500 };
      save(state);

      const loaded = load();
      expect(loaded).toEqual(state);
    });

    it('returns null for invalid JSON', () => {
      localStorage.setItem(SAVE_KEY, 'not json');
      expect(load()).toBeNull();
    });

    it('returns null for wrong version', () => {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ version: 999, state: {} }),
      );
      expect(load()).toBeNull();
    });
  });

  describe('deleteSave()', () => {
    it('removes save from localStorage', () => {
      save({ test: true });
      expect(hasSave()).toBe(true);

      deleteSave();
      expect(hasSave()).toBe(false);
      expect(load()).toBeNull();
    });
  });

  describe('hasSave()', () => {
    it('returns false when no save exists', () => {
      expect(hasSave()).toBe(false);
    });

    it('returns true when save exists', () => {
      save({ test: true });
      expect(hasSave()).toBe(true);
    });
  });

  describe('Auto-save', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('starts auto-save timer', () => {
      const getState = () => ({ tick: 1 });
      startAutoSave(getState);

      expect(getAutoSaveTimer()).toBeTruthy();
    });

    it('auto-saves at interval', () => {
      let counter = 0;
      const getState = () => ({ tick: ++counter });
      startAutoSave(getState);

      vi.advanceTimersByTime(10000);
      const loaded = load();
      expect(loaded).toEqual({ tick: 1 });

      vi.advanceTimersByTime(10000);
      const loaded2 = load();
      expect(loaded2).toEqual({ tick: 2 });
    });

    it('stops auto-save timer', () => {
      startAutoSave(() => ({}));
      expect(getAutoSaveTimer()).toBeTruthy();

      stopAutoSave();
      expect(getAutoSaveTimer()).toBeNull();
    });

    it('replaces previous auto-save timer', () => {
      startAutoSave(() => ({ first: true }));
      const timer1 = getAutoSaveTimer();

      startAutoSave(() => ({ second: true }));
      const timer2 = getAutoSaveTimer();

      expect(timer1).not.toBe(timer2);
    });
  });

  describe('Data integrity', () => {
    it('preserves complex nested state', () => {
      const state = {
        party: [
          {
            id: 1,
            name: 'Hero',
            level: 5,
            skills: [{ id: 'slash', level: 2, uses: 10 }],
            equipment: { weapon: { name: 'Sword', atk: 5 }, armor: null },
          },
        ],
        dungeon: { currentFloorNum: 3, floor: { number: 3, rooms: [] } },
        inventory: { gold: 1000, items: [{ name: 'Potion' }] },
        prestige: { level: 1, points: 50 },
        achievements: ['first_blood', 'floor_5'],
        stats: { monstersKilled: 42, highestFloor: 5 },
      };

      save(state);
      const loaded = load();
      expect(loaded).toEqual(state);
    });

    it('handles empty state', () => {
      save({});
      expect(load()).toEqual({});
    });

    it('handles state with special characters', () => {
      const state = { name: 'Aric "the Bold" O\'Malley', desc: 'Line\nbreak' };
      save(state);
      expect(load()).toEqual(state);
    });
  });
});
