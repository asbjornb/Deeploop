import { save, load, startAutoSave, stopAutoSave } from '../utils/save.js';
import { goldReward } from '../utils/math.js';
import {
  createParty,
  restoreParty,
  healParty,
  RACES,
} from './party.js';
import { generateFloor, generateShop } from './dungeon.js';
import { resolveCombatTurn, checkCombatResult } from './combat.js';
import {
  awardXP,
  equipItem,
  calculatePrestigePoints,
  getPrestigeBonus,
  checkAchievements,
  getAchievementBonuses,
  learnSkill as learnSkillFn,
  upgradeSkill as upgradeSkillFn,
  ACHIEVEMENTS,
} from './progression.js';

const TICK_INTERVAL = 600;

export function createInitialState() {
  const party = createParty(4);
  const floor = generateFloor(1);

  return {
    party,
    dungeon: {
      currentFloorNum: 1,
      floor,
    },
    inventory: {
      gold: 0,
      items: [],
    },
    shop: [],
    prestige: {
      level: 0,
      points: 0,
      totalPoints: 0,
    },
    achievements: [],
    stats: {
      monstersKilled: 0,
      bossesKilled: 0,
      highestFloor: 1,
      highestLevel: 1,
      totalGold: 0,
      deaths: 0,
      totalPrestige: 0,
      floorsCleared: 0,
    },
    gamePhase: 'exploring',
    log: [{ type: 'important', text: 'The party enters the dungeon...' }],
    tickCount: 0,
  };
}

export class GameEngine {
  constructor(onUpdate) {
    this.state = null;
    this.onUpdate = onUpdate;
    this.tickTimer = null;
    this.paused = false;
  }

  newGame() {
    this.state = createInitialState();
    this.addLog('important', 'A new adventure begins!');
    this.addLog('info', `Floor 1: ${this.state.dungeon.floor.description}`);
    startAutoSave(() => this.state);
    this.startTicking();
    this.notify();
  }

  loadGame() {
    const saved = load();
    if (!saved) return false;

    this.state = saved;
    // Restore missing fields from old saves
    if (!this.state.shop) this.state.shop = [];
    for (const char of this.state.party) {
      if (!char.buffs) char.buffs = [];
    }
    this.addLog('info', 'Game loaded successfully.');
    startAutoSave(() => this.state);
    this.startTicking();
    this.notify();
    return true;
  }

  saveGame() {
    if (this.state) {
      save(this.state);
    }
  }

  destroy() {
    this.stopTicking();
    stopAutoSave();
  }

  startTicking() {
    this.stopTicking();
    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  stopTicking() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  pause() {
    this.paused = true;
    this.stopTicking();
  }

  resume() {
    this.paused = false;
    this.startTicking();
  }

  tick() {
    if (!this.state || this.paused) return;

    const { gamePhase } = this.state;

    switch (gamePhase) {
      case 'exploring':
        this.tickExplore();
        break;
      case 'combat':
        this.tickCombat();
        break;
      case 'safeRoom':
        // Paused, waiting for player
        break;
      case 'defeated':
        // Paused, waiting for player
        break;
    }

    this.state.tickCount++;
    this.checkAllAchievements();
    this.notify();
  }

  tickExplore() {
    const { floor } = this.state.dungeon;
    const room = floor.rooms[floor.currentRoom];

    if (room.explored) {
      // Move to next room
      if (floor.currentRoom < floor.rooms.length - 1) {
        floor.currentRoom++;
        this.notify();
        return;
      } else {
        // Floor completed
        this.completeFloor();
        return;
      }
    }

    room.explored = true;

    switch (room.type) {
      case 'combat':
      case 'boss':
        this.state.gamePhase = 'combat';
        if (room.type === 'boss') {
          this.addLog('important', `BOSS: ${room.enemies[0].name} appears!`);
        } else {
          const names = room.enemies.map((e) => e.name).join(', ');
          this.addLog('info', `Encountered: ${names}`);
        }
        break;

      case 'treasure':
        this.handleTreasure(room);
        break;

      case 'event':
        this.handleEvent(room);
        break;

      case 'rest':
        this.handleRest(room);
        break;

      case 'safe':
        this.state.gamePhase = 'safeRoom';
        this.state.shop = generateShop(this.state.dungeon.currentFloorNum, this.state.party);
        this.pause();
        this.addLog('important', 'The party reaches a safe room. A merchant awaits.');
        break;
    }
  }

  tickCombat() {
    const { floor } = this.state.dungeon;
    const room = floor.rooms[floor.currentRoom];
    const enemies = room.enemies;

    const log = resolveCombatTurn(this.state.party, enemies);
    for (const entry of log) {
      this.addLog(entry.type, entry.text);
    }

    const result = checkCombatResult(this.state.party, enemies);

    if (result === 'victory') {
      this.handleVictory(room);
    } else if (result === 'defeat') {
      this.handleDefeat();
    }
  }

  handleVictory(room) {
    const enemies = room.enemies;
    room.defeated = true;

    // Award XP
    const xpLog = awardXP(this.state.party, enemies, this.state.prestige.level);
    for (const entry of xpLog) {
      this.addLog(entry.type, entry.text);
    }

    // Award gold
    const { floor } = this.state.dungeon;
    let gold = goldReward(floor.number, enemies.length);

    // Goblin gold bonus
    const hasGoblin = this.state.party.some((c) => c.race === 'goblin' && c.alive);
    if (hasGoblin) {
      gold = Math.floor(gold * (1 + RACES.goblin.perkValue));
    }

    // Achievement gold bonus
    const achBonuses = getAchievementBonuses(this.state.achievements);
    gold = Math.floor(gold * (1 + achBonuses.gold));

    // Prestige gold bonus
    const prestBonuses = getPrestigeBonus(this.state.prestige.level);
    gold = Math.floor(gold * (1 + prestBonuses.goldBonus));

    this.state.inventory.gold += gold;
    this.state.stats.totalGold += gold;
    this.addLog('gold', `Found ${gold} gold!`);

    // Update stats
    for (const e of enemies) {
      this.state.stats.monstersKilled++;
      if (e.isBoss) this.state.stats.bossesKilled++;
    }

    // Update highest level stat
    for (const char of this.state.party) {
      if (char.level > this.state.stats.highestLevel) {
        this.state.stats.highestLevel = char.level;
      }
    }

    this.state.gamePhase = 'exploring';
  }

  handleDefeat() {
    this.state.gamePhase = 'defeated';
    this.state.stats.deaths++;
    this.pause();
    this.addLog('important', 'The party has been defeated!');
    this.addLog('info', 'You can try again from the current floor.');
  }

  handleTreasure(room) {
    if (room.collected) return;
    room.collected = true;

    this.state.inventory.items.push(room.item);
    this.state.inventory.gold += room.gold;
    this.state.stats.totalGold += room.gold;

    this.addLog('gold', `Found ${room.gold} gold and a ${room.item.name}!`);
  }

  handleEvent(room) {
    if (room.resolved) return;
    room.resolved = true;

    const event = room.event;
    this.addLog('info', event.text);

    switch (event.effect) {
      case 'heal':
        healParty(this.state.party, event.value);
        this.addLog('heal', 'The party feels rejuvenated!');
        break;
      case 'damage': {
        for (const char of this.state.party) {
          if (char.alive) {
            const dmg = Math.floor(char.maxHp * event.value);
            char.hp = Math.max(1, char.hp - dmg);
          }
        }
        this.addLog('damage', 'The party takes damage!');
        break;
      }
      case 'buff_atk':
        for (const char of this.state.party) {
          if (char.alive) {
            char.buffs.push({ stat: 'atk', amount: event.value, turns: 10, name: 'Shrine' });
          }
        }
        this.addLog('info', 'The party feels empowered! ATK increased.');
        break;
      case 'buff_def':
        for (const char of this.state.party) {
          if (char.alive) {
            char.buffs.push({ stat: 'def', amount: event.value, turns: 10, name: 'Statue' });
          }
        }
        this.addLog('info', 'The party feels tougher! DEF increased.');
        break;
      case 'random': {
        const roll = Math.random();
        if (roll < 0.4) {
          healParty(this.state.party, 0.2);
          this.addLog('heal', 'The mushroom was healing! HP restored.');
        } else if (roll < 0.7) {
          for (const char of this.state.party) {
            if (char.alive) {
              char.buffs.push({ stat: 'mag', amount: 4, turns: 15, name: 'Mushroom' });
            }
          }
          this.addLog('info', 'Everything looks... sparkly. MAG boosted!');
        } else {
          for (const char of this.state.party) {
            if (char.alive) {
              const dmg = Math.floor(char.maxHp * 0.1);
              char.hp = Math.max(1, char.hp - dmg);
            }
          }
          this.addLog('damage', 'That tasted terrible. Minor damage taken.');
        }
        break;
      }
    }
  }

  handleRest(room) {
    if (room.used) return;
    room.used = true;
    healParty(this.state.party, room.healAmount);
    this.addLog('heal', 'The party rests and recovers some HP and MP.');
  }

  completeFloor() {
    const { floor } = this.state.dungeon;
    floor.completed = true;
    this.state.stats.floorsCleared++;

    const nextFloorNum = floor.number + 1;
    if (nextFloorNum > this.state.stats.highestFloor) {
      this.state.stats.highestFloor = nextFloorNum;
    }

    // If boss floor, go to safe room
    if (floor.isBossFloor) {
      this.addLog('important', `Floor ${floor.number} cleared! Boss defeated!`);
      this.state.gamePhase = 'safeRoom';
      this.state.shop = generateShop(nextFloorNum, this.state.party);
      this.pause();
      this.addLog('important', 'The party finds a safe room. A merchant awaits.');
    }

    // Generate next floor
    this.state.dungeon.currentFloorNum = nextFloorNum;
    this.state.dungeon.floor = generateFloor(nextFloorNum);
    this.addLog('info', `Entering Floor ${nextFloorNum}: ${this.state.dungeon.floor.description}`);

    // Non-boss floors with safe room handled by safe room type
    if (!floor.isBossFloor) {
      this.state.gamePhase = 'exploring';
    }
  }

  // Player actions (called from UI)

  continueExploring() {
    if (this.state.gamePhase === 'safeRoom') {
      this.state.gamePhase = 'exploring';
      this.resume();
      this.addLog('info', 'The party ventures deeper...');
    }
  }

  retryAfterDefeat() {
    if (this.state.gamePhase === 'defeated') {
      // Restore party and stay on current floor
      restoreParty(this.state.party);
      const floorNum = this.state.dungeon.currentFloorNum;
      this.state.dungeon.floor = generateFloor(floorNum);
      this.state.gamePhase = 'exploring';
      this.resume();
      this.addLog('info', `The party regroups and re-enters Floor ${floorNum}.`);
    }
  }

  buyItem(item) {
    if (!this.state.shop.find((i) => i.id === item.id)) return false;
    if (this.state.inventory.gold < item.price) return false;

    this.state.inventory.gold -= item.price;
    this.state.inventory.items.push(item);
    this.state.shop = this.state.shop.filter((i) => i.id !== item.id);
    this.addLog('gold', `Purchased ${item.name} for ${item.price} gold.`);
    this.notify();
    return true;
  }

  equipItemOnCharacter(charId, item) {
    const char = this.state.party.find((c) => c.id === charId);
    if (!char) return;

    const prev = equipItem(char, item);
    this.state.inventory.items = this.state.inventory.items.filter((i) => i !== item);
    if (prev) {
      this.state.inventory.items.push(prev);
    }
    this.addLog('info', `${char.name} equips ${item.name}.`);
    this.notify();
  }

  learnCharacterSkill(charId, skillId) {
    const char = this.state.party.find((c) => c.id === charId);
    if (!char) return { success: false, message: 'Character not found.' };

    const result = learnSkillFn(char, skillId, this.state.achievements);
    if (result.success) {
      this.addLog('important', result.message);
    }
    this.notify();
    return result;
  }

  upgradeCharacterSkill(charId, skillId) {
    const char = this.state.party.find((c) => c.id === charId);
    if (!char) return { success: false, message: 'Character not found.' };

    const result = upgradeSkillFn(char, skillId);
    if (result.success) {
      this.addLog('level', result.message);
    }
    this.notify();
    return result;
  }

  performPrestige() {
    const points = calculatePrestigePoints(this.state.stats.highestFloor);
    if (points <= 0) return;

    this.state.prestige.level++;
    this.state.prestige.points += points;
    this.state.prestige.totalPoints += points;
    this.state.stats.totalPrestige++;

    // Reset game but keep prestige, achievements, stats
    const party = createParty(4);

    // Apply prestige stat bonuses
    const bonus = getPrestigeBonus(this.state.prestige.level);
    for (const char of party) {
      char.maxHp = Math.floor(char.maxHp * (1 + bonus.statBonus));
      char.hp = char.maxHp;
      char.atk = Math.floor(char.atk * (1 + bonus.statBonus));
      char.def = Math.floor(char.def * (1 + bonus.statBonus));
      char.spd = Math.floor(char.spd * (1 + bonus.statBonus));
      char.mag = Math.floor(char.mag * (1 + bonus.statBonus));
    }

    this.state.party = party;
    this.state.dungeon = {
      currentFloorNum: 1,
      floor: generateFloor(1),
    };
    this.state.inventory = { gold: 0, items: [] };
    this.state.shop = [];
    this.state.gamePhase = 'exploring';
    this.state.log = [];

    this.addLog('important', `PRESTIGE ${this.state.prestige.level}! Earned ${points} prestige points.`);
    this.addLog('info', `Bonuses: +${(bonus.statBonus * 100).toFixed(0)}% stats, +${(bonus.xpBonus * 100).toFixed(0)}% XP, +${(bonus.goldBonus * 100).toFixed(0)}% gold`);
    this.addLog('info', 'A new adventure begins with ancient wisdom...');

    this.resume();
    this.notify();
  }

  checkAllAchievements() {
    const newIds = checkAchievements(this.state.stats, this.state.achievements);
    for (const id of newIds) {
      this.state.achievements.push(id);
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) {
        this.addLog('important', `Achievement unlocked: ${ach.name}!`);
      }
    }
  }

  addLog(type, text) {
    this.state.log.push({ type, text });
    // Keep log manageable
    if (this.state.log.length > 200) {
      this.state.log = this.state.log.slice(-100);
    }
  }

  notify() {
    if (this.onUpdate) {
      this.onUpdate(this.state);
    }
  }
}
