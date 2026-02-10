import { describe, it, expect, beforeEach } from 'vitest';
import {
  randInt,
  randChoice,
  shuffle,
  xpForLevel,
  calculateDamage,
  calculateMagicDamage,
  floorScaling,
  formatNumber,
  clamp,
} from '../src/utils/math.js';
import {
  createCharacter,
  createParty,
  restoreParty,
  healParty,
  isPartyAlive,
  getEffectiveStat,
  CLASSES,
  RACES,
  resetCharacterId,
} from '../src/game/party.js';
import { generateFloor, MONSTER_TYPES, BOSS_TYPES } from '../src/game/dungeon.js';
import { resolveCombatTurn, checkCombatResult } from '../src/game/combat.js';
import {
  awardXP,
  equipItem,
  calculatePrestigePoints,
  getPrestigeBonus,
  checkAchievements,
  SKILLS,
  ACHIEVEMENTS,
} from '../src/game/progression.js';
import { createInitialState } from '../src/game/engine.js';

describe('Math Utilities', () => {
  it('randInt returns values within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('randChoice picks from array', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randChoice(arr));
    }
  });

  it('shuffle returns all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('shuffle does not mutate original', () => {
    const arr = [1, 2, 3];
    shuffle(arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('xpForLevel increases with level', () => {
    const xp1 = xpForLevel(1);
    const xp5 = xpForLevel(5);
    const xp10 = xpForLevel(10);
    expect(xp5).toBeGreaterThan(xp1);
    expect(xp10).toBeGreaterThan(xp5);
  });

  it('calculateDamage returns at least 1', () => {
    const dmg = calculateDamage(1, 100);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it('calculateMagicDamage returns at least 1', () => {
    const dmg = calculateMagicDamage(1, 100);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it('floorScaling increases with floor', () => {
    expect(floorScaling(5)).toBeGreaterThan(floorScaling(1));
    expect(floorScaling(10)).toBeGreaterThan(floorScaling(5));
  });

  it('formatNumber formats large numbers', () => {
    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(1500000000)).toBe('1.5B');
  });

  it('clamp restricts values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('Party System', () => {
  beforeEach(() => {
    resetCharacterId(1);
  });

  it('creates a character with valid stats', () => {
    const char = createCharacter('warrior', 'human');
    expect(char.class).toBe('warrior');
    expect(char.race).toBe('human');
    expect(char.level).toBe(1);
    expect(char.hp).toBeGreaterThan(0);
    expect(char.maxHp).toBe(char.hp);
    expect(char.atk).toBeGreaterThan(0);
    expect(char.skills).toHaveLength(3);
    expect(char.alive).toBe(true);
  });

  it('creates party with 4 members', () => {
    const party = createParty(4);
    expect(party).toHaveLength(4);

    // All different classes
    const classes = party.map((c) => c.class);
    expect(new Set(classes).size).toBe(4);
  });

  it('creates party with unique IDs', () => {
    const party = createParty(4);
    const ids = party.map((c) => c.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('restores party to full HP/MP', () => {
    const party = createParty(4);
    party[0].hp = 1;
    party[0].mp = 0;
    party[0].alive = false;

    restoreParty(party);
    expect(party[0].hp).toBe(party[0].maxHp);
    expect(party[0].mp).toBe(party[0].maxMp);
    expect(party[0].alive).toBe(true);
  });

  it('heals party by fraction', () => {
    const party = createParty(4);
    const original = party[0].maxHp;
    party[0].hp = 1;

    healParty(party, 0.5);
    expect(party[0].hp).toBeGreaterThan(1);
    expect(party[0].hp).toBeLessThanOrEqual(original);
  });

  it('isPartyAlive returns correct values', () => {
    const party = createParty(2);
    expect(isPartyAlive(party)).toBe(true);

    party[0].alive = false;
    party[0].hp = 0;
    expect(isPartyAlive(party)).toBe(true);

    party[1].alive = false;
    party[1].hp = 0;
    expect(isPartyAlive(party)).toBe(false);
  });

  it('getEffectiveStat includes equipment bonuses', () => {
    const char = createCharacter('warrior', 'human');
    const baseAtk = char.atk;

    char.equipment.weapon = { name: 'Sword', slot: 'weapon', atk: 5 };
    expect(getEffectiveStat(char, 'atk')).toBe(baseAtk + 5);
  });

  it('all classes have valid skill references', () => {
    for (const [, cls] of Object.entries(CLASSES)) {
      for (const skillId of cls.skills) {
        expect(SKILLS[skillId]).toBeDefined();
      }
    }
  });

  it('all races have stat mods', () => {
    for (const [, race] of Object.entries(RACES)) {
      expect(race.statMods).toBeDefined();
      expect(race.perk).toBeDefined();
    }
  });
});

describe('Dungeon Generation', () => {
  it('generates a floor with rooms', () => {
    const floor = generateFloor(1);
    expect(floor.number).toBe(1);
    expect(floor.rooms.length).toBeGreaterThan(0);
    expect(floor.currentRoom).toBe(0);
    expect(floor.completed).toBe(false);
  });

  it('boss floors have a single boss room', () => {
    const floor = generateFloor(5);
    expect(floor.isBossFloor).toBe(true);
    expect(floor.rooms).toHaveLength(1);
    expect(floor.rooms[0].type).toBe('boss');
    expect(floor.rooms[0].enemies[0].isBoss).toBe(true);
  });

  it('non-boss floors end with safe room', () => {
    const floor = generateFloor(1);
    expect(floor.isBossFloor).toBe(false);
    const lastRoom = floor.rooms[floor.rooms.length - 1];
    expect(lastRoom.type).toBe('safe');
  });

  it('enemies scale with floor number', () => {
    const floor1 = generateFloor(1);
    const floor10 = generateFloor(10);

    const combatRoom1 = floor1.rooms.find((r) => r.type === 'combat');
    const combatRoom10 = floor10.rooms.find(
      (r) => r.type === 'combat' || r.type === 'boss',
    );

    if (combatRoom1 && combatRoom10) {
      const maxHp1 = Math.max(...combatRoom1.enemies.map((e) => e.maxHp));
      const maxHp10 = Math.max(...combatRoom10.enemies.map((e) => e.maxHp));
      expect(maxHp10).toBeGreaterThan(maxHp1);
    }
  });

  it('floor has a description', () => {
    const floor = generateFloor(1);
    expect(floor.description).toBeTruthy();
    expect(typeof floor.description).toBe('string');
  });
});

describe('Combat System', () => {
  it('resolves a combat turn', () => {
    resetCharacterId(1);
    const party = createParty(4);
    const enemies = [
      { name: 'Slime', hp: 10, maxHp: 10, atk: 3, def: 1, spd: 2, xp: 5, isBoss: false },
    ];

    const log = resolveCombatTurn(party, enemies);
    expect(log.length).toBeGreaterThan(0);
  });

  it('checkCombatResult detects victory', () => {
    const party = [{ alive: true, hp: 10 }];
    const enemies = [{ hp: 0 }];
    expect(checkCombatResult(party, enemies)).toBe('victory');
  });

  it('checkCombatResult detects defeat', () => {
    const party = [{ alive: false, hp: 0 }];
    const enemies = [{ hp: 10 }];
    expect(checkCombatResult(party, enemies)).toBe('defeat');
  });

  it('checkCombatResult returns null for ongoing combat', () => {
    const party = [{ alive: true, hp: 10 }];
    const enemies = [{ hp: 10 }];
    expect(checkCombatResult(party, enemies)).toBeNull();
  });

  it('defeated enemies are skipped in turn order', () => {
    resetCharacterId(1);
    const party = createParty(4);
    // Give party high ATK so they kill the enemy
    for (const c of party) c.atk = 100;

    const enemies = [
      { name: 'Weak', hp: 1, maxHp: 1, atk: 1, def: 0, spd: 1, xp: 1, isBoss: false },
    ];

    resolveCombatTurn(party, enemies);
    expect(enemies[0].hp).toBeLessThanOrEqual(0);
  });
});

describe('Progression System', () => {
  it('awards XP to alive party members', () => {
    resetCharacterId(1);
    const party = createParty(2);
    party[1].alive = false;

    const enemies = [{ xp: 100 }];
    awardXP(party, enemies, 0);

    expect(party[0].xp).toBeGreaterThan(0);
    expect(party[1].xp).toBe(0);
  });

  it('humans get XP bonus', () => {
    resetCharacterId(1);
    const human = createCharacter('warrior', 'human');
    const dwarf = createCharacter('warrior', 'dwarf');

    const enemies = [{ xp: 100 }];
    awardXP([human], enemies, 0);
    awardXP([dwarf], enemies, 0);

    expect(human.xp).toBeGreaterThan(dwarf.xp);
  });

  it('equips items and returns previous', () => {
    resetCharacterId(1);
    const char = createCharacter('warrior', 'human');
    const sword = { name: 'Sword', slot: 'weapon', atk: 5 };

    const prev = equipItem(char, sword);
    expect(prev).toBeNull();
    expect(char.equipment.weapon).toBe(sword);

    const betterSword = { name: 'Better Sword', slot: 'weapon', atk: 10 };
    const prev2 = equipItem(char, betterSword);
    expect(prev2).toBe(sword);
    expect(char.equipment.weapon).toBe(betterSword);
  });

  it('prestige points scale with floor', () => {
    const pts5 = calculatePrestigePoints(5);
    const pts10 = calculatePrestigePoints(10);
    const pts20 = calculatePrestigePoints(20);

    expect(pts10).toBeGreaterThan(pts5);
    expect(pts20).toBeGreaterThan(pts10);
  });

  it('prestige bonuses scale with level', () => {
    const bonus1 = getPrestigeBonus(1);
    const bonus5 = getPrestigeBonus(5);

    expect(bonus5.statBonus).toBeGreaterThan(bonus1.statBonus);
    expect(bonus5.xpBonus).toBeGreaterThan(bonus1.xpBonus);
    expect(bonus5.goldBonus).toBeGreaterThan(bonus1.goldBonus);
  });

  it('checks achievements correctly', () => {
    const stats = { monstersKilled: 5, highestFloor: 3 };
    const unlocked = checkAchievements(stats, []);
    expect(unlocked).toContain('first_blood');
    expect(unlocked).not.toContain('floor_5');
  });

  it('does not re-unlock achievements', () => {
    const stats = { monstersKilled: 5 };
    const unlocked = checkAchievements(stats, ['first_blood']);
    expect(unlocked).not.toContain('first_blood');
  });

  it('all skills have required properties', () => {
    for (const [id, skill] of Object.entries(SKILLS)) {
      expect(skill.name).toBeTruthy();
      expect(skill.type).toBeTruthy();
      expect(skill.target).toBeTruthy();
      expect(typeof skill.mpCost).toBe('number');
      expect(skill.description).toBeTruthy();
    }
  });

  it('all achievements have required properties', () => {
    for (const ach of ACHIEVEMENTS) {
      expect(ach.id).toBeTruthy();
      expect(ach.name).toBeTruthy();
      expect(ach.description).toBeTruthy();
      expect(typeof ach.condition).toBe('function');
      expect(ach.reward).toBeTruthy();
    }
  });
});

describe('Game Engine State', () => {
  it('creates valid initial state', () => {
    resetCharacterId(1);
    const state = createInitialState();

    expect(state.party).toHaveLength(4);
    expect(state.dungeon.currentFloorNum).toBe(1);
    expect(state.dungeon.floor).toBeDefined();
    expect(state.inventory.gold).toBe(0);
    expect(state.prestige.level).toBe(0);
    expect(state.achievements).toEqual([]);
    expect(state.gamePhase).toBe('exploring');
    expect(state.log.length).toBeGreaterThan(0);
  });

  it('initial state is serializable', () => {
    resetCharacterId(1);
    const state = createInitialState();
    const json = JSON.stringify(state);
    const parsed = JSON.parse(json);

    expect(parsed.party).toHaveLength(4);
    expect(parsed.dungeon.currentFloorNum).toBe(1);
  });
});
