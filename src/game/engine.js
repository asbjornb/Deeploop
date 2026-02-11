import { save, load, startAutoSave, stopAutoSave } from '../utils/save.js';
import { goldReward } from '../utils/math.js';
import {
  createParty,
  restoreParty,
  healParty,
  RACES,
  CLASSES,
  getSynergyBonuses,
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
  buyPrestigeUpgrade as buyPrestigeUpgradeFn,
  getPrestigeUpgradeValue,
  ACHIEVEMENTS,
  MUTATIONS,
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
      upgrades: {},
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
      challengesCompleted: {},
    },
    activeMutation: null,
    gamePhase: 'exploring',
    log: [{ type: 'important', text: 'The party enters the dungeon...' }],
    lastSafeRoomLogIndex: 0,
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
    if (this.state.lastSafeRoomLogIndex == null) this.state.lastSafeRoomLogIndex = 0;
    if (!this.state.prestige.upgrades) this.state.prestige.upgrades = {};
    if (!this.state.stats.challengesCompleted) this.state.stats.challengesCompleted = {};
    if (this.state.activeMutation === undefined) this.state.activeMutation = null;
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
      case 'prestige':
        // Paused, waiting for player to start over
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
        // Apply mutation effects to enemies
        if (this.state.activeMutation) {
          const mutation = MUTATIONS.find((m) => m.id === this.state.activeMutation);
          if (mutation && mutation.applyToEnemies) {
            mutation.applyToEnemies(room.enemies);
          }
        }
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

      case 'trap':
        this.handleTrap(room);
        break;

      case 'safe':
        this.state.gamePhase = 'safeRoom';
        this.state.shop = generateShop(this.state.dungeon.currentFloorNum, this.state.party, this.getShopTierBonus(), this.getEnchantLuckBonus());
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
    const upgradeXpBonus = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'xp_gain');
    const xpLog = awardXP(this.state.party, enemies, this.state.prestige.level, upgradeXpBonus);
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

    // Prestige upgrade gold bonus
    const upgradeGoldBonus = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'gold_find');
    if (upgradeGoldBonus > 0) {
      gold = Math.floor(gold * (1 + upgradeGoldBonus));
    }

    // Synergy gold bonus
    const synergyBonuses = getSynergyBonuses(this.state.party);
    const synergyPower = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'synergy_power');
    if (synergyBonuses.gold > 0) {
      gold = Math.floor(gold * (1 + synergyBonuses.gold * (1 + synergyPower)));
    }

    // Enchantment gold find bonus (from all party members)
    let totalGoldFind = 0;
    for (const char of this.state.party) {
      if (char.alive) {
        for (const slot of ['weapon', 'armor', 'accessory']) {
          const item = char.equipment[slot];
          if (item && item.enchantment && item.enchantment.stat === 'goldFind') {
            totalGoldFind += item.enchantment.value;
          }
        }
      }
    }
    if (totalGoldFind > 0) {
      gold = Math.floor(gold * (1 + totalGoldFind));
    }

    // Mutation gold multiplier
    if (this.state.activeMutation) {
      const mutation = MUTATIONS.find((m) => m.id === this.state.activeMutation);
      if (mutation && mutation.goldMultiplier) {
        gold = Math.floor(gold * mutation.goldMultiplier);
      }
    }

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
    this.state.gamePhase = 'prestige';
    this.state.stats.deaths++;
    this.pause();
    this.addLog('important', 'The party has been defeated!');
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
        if (this.state.activeMutation === 'ironman') {
          this.addLog('info', 'The waters shimmer but the curse prevents healing.');
        } else {
          healParty(this.state.party, event.value);
          this.addLog('heal', 'The party feels rejuvenated!');
        }
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
      case 'gamble': {
        const bet = Math.min(50 + this.state.dungeon.currentFloorNum * 10, this.state.inventory.gold);
        if (bet <= 0) {
          this.addLog('info', 'You have nothing to wager. The figure shrugs.');
          break;
        }
        const roll = Math.random();
        if (roll < 0.4) {
          const winnings = bet * 2;
          this.state.inventory.gold += winnings;
          this.state.stats.totalGold += winnings;
          this.addLog('gold', `Won ${winnings} gold! Lady luck smiles.`);
        } else if (roll < 0.7) {
          this.addLog('info', 'A draw. The figure nods respectfully.');
        } else {
          this.state.inventory.gold = Math.max(0, this.state.inventory.gold - bet);
          this.addLog('damage', `Lost ${bet} gold! The figure grins wickedly.`);
        }
        break;
      }
      case 'skill_xp': {
        for (const char of this.state.party) {
          if (char.alive) {
            for (const skill of char.skills) {
              skill.uses += event.value;
            }
          }
        }
        this.addLog('info', 'The party gains skill experience from ancient texts!');
        break;
      }
      case 'cursed_treasure': {
        const floorNum = this.state.dungeon.currentFloorNum;
        for (const char of this.state.party) {
          if (char.alive) {
            const dmg = Math.floor(char.maxHp * 0.2);
            char.hp = Math.max(1, char.hp - dmg);
          }
        }
        const gold = 20 + floorNum * 8;
        this.state.inventory.gold += gold;
        this.state.stats.totalGold += gold;
        this.addLog('damage', 'Dark energy lashes out! The party takes damage.');
        this.addLog('gold', `But found ${gold} gold inside the cursed chest!`);
        break;
      }
      case 'bonus_xp': {
        // Give bonus XP to all alive party members
        const floorNum = this.state.dungeon.currentFloorNum;
        const bonusXp = Math.floor(20 * (1 + floorNum * event.value));
        for (const char of this.state.party) {
          if (char.alive && char.hp > 0) {
            char.xp += bonusXp;
          }
        }
        this.addLog('info', `The spirit shares wisdom. Party gains ${bonusXp} bonus XP!`);
        break;
      }
      case 'buff_all': {
        for (const char of this.state.party) {
          if (char.alive) {
            char.buffs.push({ stat: 'atk', amount: event.value, turns: 10, name: 'Campfire' });
            char.buffs.push({ stat: 'def', amount: event.value, turns: 10, name: 'Campfire' });
          }
        }
        this.addLog('info', 'The warmth steels the party. ATK and DEF boosted!');
        break;
      }
      case 'buff_spd': {
        for (const char of this.state.party) {
          if (char.alive) {
            char.buffs.push({ stat: 'spd', amount: event.value, turns: 10, name: 'Mirror Pool' });
          }
        }
        this.addLog('info', 'Reflexes sharpen! SPD boosted.');
        break;
      }
      case 'sacrifice_gold': {
        const cost = 30 + this.state.dungeon.currentFloorNum * 5;
        if (this.state.inventory.gold >= cost) {
          this.state.inventory.gold -= cost;
          // Heal party and buff stats
          healParty(this.state.party, 0.4);
          for (const char of this.state.party) {
            if (char.alive) {
              char.buffs.push({ stat: 'atk', amount: 4, turns: 15, name: 'Altar' });
              char.buffs.push({ stat: 'mag', amount: 4, turns: 15, name: 'Altar' });
            }
          }
          this.addLog('gold', `Offered ${cost} gold. The altar blesses the party!`);
          this.addLog('heal', 'HP restored and stats boosted!');
        } else {
          this.addLog('info', 'Not enough gold for an offering. The altar remains silent.');
        }
        break;
      }
    }
  }

  handleRest(room) {
    if (room.used) return;
    room.used = true;
    // No Rest mutation blocks healing
    if (this.state.activeMutation === 'ironman') {
      this.addLog('info', 'The party tries to rest but the curse prevents recovery.');
      return;
    }
    const restBonus = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'rest_power');
    healParty(this.state.party, room.healAmount + restBonus);
    this.addLog('heal', 'The party rests and recovers some HP and MP.');
  }

  handleTrap(room) {
    if (room.resolved) return;
    room.resolved = true;

    const trap = room.trap;
    this.addLog('damage', trap.text);

    const trapReduction = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'trap_sense');
    const mult = 1 - trapReduction;

    switch (trap.effect) {
      case 'damage_all': {
        for (const char of this.state.party) {
          if (char.alive) {
            const dmg = Math.max(1, Math.floor(char.maxHp * trap.value * mult));
            char.hp = Math.max(1, char.hp - dmg);
          }
        }
        this.addLog('damage', 'The entire party takes damage!');
        break;
      }
      case 'damage_one': {
        const alive = this.state.party.filter((c) => c.alive);
        if (alive.length > 0) {
          const target = alive[Math.floor(Math.random() * alive.length)];
          const dmg = Math.max(1, Math.floor(target.maxHp * trap.value * mult));
          target.hp = Math.max(1, target.hp - dmg);
          this.addLog('damage', `${target.name} takes ${dmg} damage from the trap!`);
        }
        break;
      }
      case 'poison_all': {
        for (const char of this.state.party) {
          if (char.alive) {
            const dmg = Math.max(1, Math.floor(char.maxHp * trap.value * mult));
            char.hp = Math.max(1, char.hp - dmg);
          }
        }
        this.addLog('damage', 'The party is poisoned! Everyone takes damage.');
        break;
      }
      case 'debuff_stats': {
        for (const char of this.state.party) {
          if (char.alive) {
            const debuffAmt = Math.max(1, Math.floor(char[trap.stat] * trap.value * mult));
            char.buffs.push({
              stat: trap.stat,
              amount: -debuffAmt,
              turns: trap.duration,
              name: 'Trap Curse',
            });
          }
        }
        this.addLog('info', `The party's ${trap.stat.toUpperCase()} is reduced by the trap!`);
        break;
      }
      case 'drain_mp': {
        for (const char of this.state.party) {
          if (char.alive) {
            const drain = Math.floor(char.maxMp * trap.value * mult);
            char.mp = Math.max(0, char.mp - drain);
          }
        }
        this.addLog('info', 'The party loses MP!');
        break;
      }
    }
  }

  completeFloor() {
    const { floor } = this.state.dungeon;
    floor.completed = true;
    this.state.stats.floorsCleared++;

    const nextFloorNum = floor.number + 1;
    if (nextFloorNum > this.state.stats.highestFloor) {
      this.state.stats.highestFloor = nextFloorNum;
    }

    // Check mutation challenge completion
    if (this.state.activeMutation) {
      const mutation = MUTATIONS.find((m) => m.id === this.state.activeMutation);
      if (mutation && nextFloorNum >= mutation.goalFloor) {
        if (!this.state.stats.challengesCompleted) this.state.stats.challengesCompleted = {};
        if (!this.state.stats.challengesCompleted[mutation.id]) {
          this.state.stats.challengesCompleted[mutation.id] = true;
          this.addLog('important', `CHALLENGE COMPLETE: ${mutation.name}! Reached floor ${mutation.goalFloor}!`);
        }
      }
    }

    // If boss floor, go to safe room
    if (floor.isBossFloor) {
      this.addLog('important', `Floor ${floor.number} cleared! Boss defeated!`);
      this.state.gamePhase = 'safeRoom';
      this.state.shop = generateShop(nextFloorNum, this.state.party, this.getShopTierBonus(), this.getEnchantLuckBonus());
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
      // Safe room rest bonus (heal the party a bit)
      if (this.state.activeMutation !== 'ironman') {
        const restBonus = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'rest_power');
        if (restBonus > 0) {
          healParty(this.state.party, restBonus * 0.5);
        }
      }
      this.state.lastSafeRoomLogIndex = this.state.log.length;
      this.state.gamePhase = 'exploring';
      this.resume();
      this.addLog('info', 'The party ventures deeper...');
    }
  }

  startOver() {
    if (this.state.gamePhase !== 'prestige') return;

    // Reset game without new prestige bonuses
    const allSkills = this.hasProdigyUpgrade();
    const party = createParty(4, this.state.achievements, { allSkills });

    // Still apply existing prestige bonuses from previous prestiges
    if (this.state.prestige.level > 0) {
      const bonus = getPrestigeBonus(this.state.prestige.level);
      for (const char of party) {
        char.maxHp = Math.floor(char.maxHp * (1 + bonus.statBonus));
        char.hp = char.maxHp;
        char.atk = Math.floor(char.atk * (1 + bonus.statBonus));
        char.def = Math.floor(char.def * (1 + bonus.statBonus));
        char.spd = Math.floor(char.spd * (1 + bonus.statBonus));
        char.mag = Math.floor(char.mag * (1 + bonus.statBonus));
      }
    }

    // Apply prestige upgrade bonuses
    this.state.party = party;
    this.applyPrestigeUpgrades(party);

    const startingGold = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'starting_gold');

    this.state.dungeon = {
      currentFloorNum: 1,
      floor: generateFloor(1),
    };
    this.state.inventory = { gold: startingGold, items: [] };
    this.state.shop = [];
    this.state.activeMutation = null;
    this.state.gamePhase = 'exploring';
    this.state.log = [];
    this.state.lastSafeRoomLogIndex = 0;

    this.addLog('important', 'A new adventure begins...');
    if (startingGold > 0) this.addLog('gold', `Nest Egg: Starting with ${startingGold} gold!`);
    this.addLog('info', `Floor 1: ${this.state.dungeon.floor.description}`);

    this.resume();
    this.notify();
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

  sellItem(item) {
    const idx = this.state.inventory.items.indexOf(item);
    if (idx === -1) return false;

    const sellPrice = Math.floor(item.price * 0.5);
    this.state.inventory.items.splice(idx, 1);
    this.state.inventory.gold += sellPrice;
    this.state.stats.totalGold += sellPrice;
    this.addLog('gold', `Sold ${item.name} for ${sellPrice} gold.`);
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

  applyPrestigeUpgrades(party) {
    const upgrades = this.state.prestige.upgrades;

    // Starting skill points
    const spBonus = getPrestigeUpgradeValue(upgrades, 'starting_sp');
    if (spBonus > 0) {
      for (const char of party) {
        char.skillPoints += spBonus;
      }
    }

    // Starting level
    const startLevel = getPrestigeUpgradeValue(upgrades, 'starting_level');
    if (startLevel > 0) {
      for (const char of party) {
        for (let i = 0; i < startLevel; i++) {
          char.level++;
          const growths = CLASSES[char.class].growths;
          char.maxHp += growths.hp;
          char.maxMp += growths.mp;
          char.atk += growths.atk;
          char.def += growths.def;
          char.spd += growths.spd;
          char.mag += growths.mag;
          char.skillPoints++;
        }
        char.hp = char.maxHp;
        char.mp = char.maxMp;
      }
    }

    // Stat bonuses from upgrades
    const hpMult = getPrestigeUpgradeValue(upgrades, 'vitality');
    const atkMult = getPrestigeUpgradeValue(upgrades, 'might');
    const defMult = getPrestigeUpgradeValue(upgrades, 'resilience');
    const magMult = getPrestigeUpgradeValue(upgrades, 'arcana');

    for (const char of party) {
      if (hpMult > 0) {
        char.maxHp = Math.floor(char.maxHp * (1 + hpMult));
        char.hp = char.maxHp;
      }
      if (atkMult > 0) char.atk = Math.floor(char.atk * (1 + atkMult));
      if (defMult > 0) char.def = Math.floor(char.def * (1 + defMult));
      if (magMult > 0) char.mag = Math.floor(char.mag * (1 + magMult));
    }

    // Apply synergy stat bonuses
    const synergyBonuses = getSynergyBonuses(party);
    const synergyPower = getPrestigeUpgradeValue(upgrades, 'synergy_power');
    for (const char of party) {
      if (synergyBonuses.hp > 0) {
        const bonus = synergyBonuses.hp * (1 + synergyPower);
        char.maxHp = Math.floor(char.maxHp * (1 + bonus));
        char.hp = char.maxHp;
      }
      if (synergyBonuses.atk > 0) char.atk = Math.floor(char.atk * (1 + synergyBonuses.atk * (1 + synergyPower)));
      if (synergyBonuses.def > 0) char.def = Math.floor(char.def * (1 + synergyBonuses.def * (1 + synergyPower)));
      if (synergyBonuses.spd > 0) char.spd = Math.floor(char.spd * (1 + synergyBonuses.spd * (1 + synergyPower)));
      if (synergyBonuses.mag > 0) char.mag = Math.floor(char.mag * (1 + synergyBonuses.mag * (1 + synergyPower)));
    }
  }

  getShopTierBonus() {
    return getPrestigeUpgradeValue(this.state.prestige.upgrades, 'shop_tier');
  }

  getEnchantLuckBonus() {
    return getPrestigeUpgradeValue(this.state.prestige.upgrades, 'enchant_luck');
  }

  hasProdigyUpgrade() {
    return getPrestigeUpgradeValue(this.state.prestige.upgrades, 'three_skills') >= 1;
  }

  performPrestige() {
    if (this.state.stats.highestFloor < 5) return;
    const points = calculatePrestigePoints(this.state.stats.highestFloor);

    this.state.prestige.level++;
    this.state.prestige.points += points;
    this.state.prestige.totalPoints += points;
    this.state.stats.totalPrestige++;

    // Reset game but keep prestige, achievements, stats, upgrades
    const allSkills = this.hasProdigyUpgrade();
    const party = createParty(4, this.state.achievements, { allSkills });

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

    // Apply prestige upgrade bonuses
    this.state.party = party;
    this.applyPrestigeUpgrades(party);

    // Starting gold from upgrades
    const startingGold = getPrestigeUpgradeValue(this.state.prestige.upgrades, 'starting_gold');

    this.state.dungeon = {
      currentFloorNum: 1,
      floor: generateFloor(1),
    };
    this.state.inventory = { gold: startingGold, items: [] };
    this.state.shop = [];
    this.state.activeMutation = null;
    this.state.gamePhase = 'exploring';
    this.state.log = [];
    this.state.lastSafeRoomLogIndex = 0;

    this.addLog('important', `PRESTIGE ${this.state.prestige.level}! Earned ${points} prestige points.`);
    this.addLog('info', `Bonuses: +${(bonus.statBonus * 100).toFixed(0)}% stats, +${(bonus.xpBonus * 100).toFixed(0)}% XP, +${(bonus.goldBonus * 100).toFixed(0)}% gold`);
    if (startingGold > 0) this.addLog('gold', `Nest Egg: Starting with ${startingGold} gold!`);
    this.addLog('info', 'A new adventure begins with ancient wisdom...');

    this.resume();
    this.notify();
  }

  activateMutation(mutationId) {
    if (mutationId === null) {
      this.state.activeMutation = null;
      this.addLog('info', 'No challenge mutation active.');
      this.notify();
      return;
    }
    const mutation = MUTATIONS.find((m) => m.id === mutationId);
    if (!mutation) return;
    this.state.activeMutation = mutationId;
    // Apply party effects
    if (mutation.applyToParty) {
      mutation.applyToParty(this.state.party);
    }
    this.addLog('important', `Challenge activated: ${mutation.name}! ${mutation.description}`);
    this.notify();
  }

  buyPrestigeUpgradeAction(upgradeId) {
    const result = buyPrestigeUpgradeFn(this.state.prestige, upgradeId);
    if (result.success) {
      this.addLog('important', result.message);
    }
    this.notify();
    return result;
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
      const trimCount = this.state.log.length - 100;
      this.state.log = this.state.log.slice(-100);
      this.state.lastSafeRoomLogIndex = Math.max(0, this.state.lastSafeRoomLogIndex - trimCount);
    }
  }

  notify() {
    if (this.onUpdate) {
      this.onUpdate(this.state);
    }
  }
}
