import { xpForLevel, randInt } from '../utils/math.js';
import { CLASSES, RACES } from './party.js';

export const SKILLS = {
  // Warrior
  slash: {
    name: 'Slash',
    type: 'physical',
    target: 'single',
    mpCost: 0,
    basePower: 1.5,
    description: 'A powerful sword swing.',
  },
  shield_bash: {
    name: 'Shield Bash',
    type: 'physical',
    target: 'single',
    mpCost: 2,
    basePower: 1.2,
    effect: 'stun',
    description: 'Bash with shield. May stun.',
  },
  war_cry: {
    name: 'War Cry',
    type: 'buff',
    target: 'party',
    mpCost: 3,
    buffStat: 'atk',
    buffAmount: 0.2,
    duration: 3,
    description: 'Boosts party ATK.',
  },

  // Mage
  fireball: {
    name: 'Fireball',
    type: 'magic',
    target: 'all',
    mpCost: 5,
    basePower: 1.0,
    description: 'Fire damage to all enemies.',
  },
  ice_shard: {
    name: 'Ice Shard',
    type: 'magic',
    target: 'single',
    mpCost: 3,
    basePower: 1.3,
    effect: 'slow',
    description: 'Ice damage. Slows target.',
  },
  arcane_blast: {
    name: 'Arcane Blast',
    type: 'magic',
    target: 'single',
    mpCost: 8,
    basePower: 2.0,
    description: 'Massive magic damage.',
  },

  // Rogue
  backstab: {
    name: 'Backstab',
    type: 'physical',
    target: 'single',
    mpCost: 2,
    basePower: 2.0,
    critBonus: 0.3,
    description: 'High damage. High crit chance.',
  },
  poison_blade: {
    name: 'Poison Blade',
    type: 'physical',
    target: 'single',
    mpCost: 3,
    basePower: 1.0,
    effect: 'poison',
    description: 'Poisons the target.',
  },
  evasion: {
    name: 'Evasion',
    type: 'buff',
    target: 'self',
    mpCost: 2,
    effect: 'dodge',
    duration: 1,
    description: 'Dodge the next attack.',
  },

  // Healer
  heal: {
    name: 'Heal',
    type: 'heal',
    target: 'single_ally',
    mpCost: 4,
    basePower: 1.5,
    description: 'Restore HP to an ally.',
  },
  bless: {
    name: 'Bless',
    type: 'buff',
    target: 'party',
    mpCost: 5,
    buffStat: 'def',
    buffAmount: 0.25,
    duration: 3,
    description: 'Boosts party DEF.',
  },
  smite: {
    name: 'Smite',
    type: 'magic',
    target: 'single',
    mpCost: 3,
    basePower: 1.5,
    description: 'Holy damage to one enemy.',
  },
};

/**
 * Award XP to the party from defeated enemies.
 * Returns log entries for any level-ups.
 */
export function awardXP(party, enemies, prestigeLevel) {
  const log = [];
  const totalXP = enemies.reduce((sum, e) => sum + e.xp, 0);

  for (const char of party) {
    if (!char.alive || char.hp <= 0) continue;

    let xpGain = totalXP;

    // Human XP bonus
    if (char.race === 'human') {
      xpGain = Math.floor(xpGain * (1 + RACES.human.perkValue));
    }

    // Prestige XP bonus
    xpGain = Math.floor(xpGain * (1 + prestigeLevel * 0.05));

    char.xp += xpGain;

    // Check for level up
    while (char.xp >= xpForLevel(char.level)) {
      char.xp -= xpForLevel(char.level);
      char.level++;
      const entries = applyLevelUp(char);
      log.push(...entries);
    }
  }

  return log;
}

function applyLevelUp(char) {
  const log = [];
  const growths = CLASSES[char.class].growths;

  char.maxHp += growths.hp + randInt(0, 2);
  char.hp = char.maxHp;
  char.maxMp += growths.mp + randInt(0, 1);
  char.mp = char.maxMp;
  char.atk += growths.atk + randInt(0, 1);
  char.def += growths.def + randInt(0, 1);
  char.spd += growths.spd + randInt(0, 1);
  char.mag += growths.mag + randInt(0, 1);
  char.skillPoints++;

  log.push({
    type: 'level',
    text: `${char.name} reached level ${char.level}!`,
  });

  // Check for skill level ups
  for (const skill of char.skills) {
    const threshold = skill.level * 5;
    if (skill.uses >= threshold) {
      skill.level++;
      skill.uses = 0;
      log.push({
        type: 'level',
        text: `${char.name}'s ${SKILLS[skill.id].name} improved to level ${skill.level}!`,
      });
    }
  }

  return log;
}

/**
 * Equip an item on a character.
 * Returns the previously equipped item (or null).
 */
export function equipItem(char, item) {
  const prev = char.equipment[item.slot];
  char.equipment[item.slot] = item;
  return prev;
}

/**
 * Calculate prestige points earned based on highest floor.
 */
export function calculatePrestigePoints(highestFloor) {
  return Math.floor(Math.pow(highestFloor, 1.2));
}

/**
 * Get prestige bonus multiplier for a given prestige level.
 */
export function getPrestigeBonus(prestigeLevel) {
  return {
    statBonus: prestigeLevel * 0.03,
    xpBonus: prestigeLevel * 0.05,
    goldBonus: prestigeLevel * 0.1,
  };
}

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Defeat your first monster.',
    condition: (stats) => stats.monstersKilled >= 1,
    reward: 'Unlocks: Nothing, but it feels good.',
  },
  {
    id: 'floor_5',
    name: 'Getting Deeper',
    description: 'Reach floor 5.',
    condition: (stats) => stats.highestFloor >= 5,
    reward: '+5% party HP',
  },
  {
    id: 'floor_10',
    name: 'Spelunker',
    description: 'Reach floor 10.',
    condition: (stats) => stats.highestFloor >= 10,
    reward: '+5% party ATK',
  },
  {
    id: 'floor_25',
    name: 'Deep Diver',
    description: 'Reach floor 25.',
    condition: (stats) => stats.highestFloor >= 25,
    reward: '+10% party DEF',
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Defeat a boss.',
    condition: (stats) => stats.bossesKilled >= 1,
    reward: '+5% all stats',
  },
  {
    id: 'hoarder',
    name: 'Hoarder',
    description: 'Accumulate 1,000 gold total.',
    condition: (stats) => stats.totalGold >= 1000,
    reward: '+10% gold find',
  },
  {
    id: 'rich',
    name: 'Filthy Rich',
    description: 'Accumulate 10,000 gold total.',
    condition: (stats) => stats.totalGold >= 10000,
    reward: '+20% gold find',
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Reach a party member to level 10.',
    condition: (stats) => stats.highestLevel >= 10,
    reward: '+10% XP',
  },
  {
    id: 'prestige_1',
    name: 'New Beginnings',
    description: 'Perform your first prestige.',
    condition: (stats) => stats.totalPrestige >= 1,
    reward: 'Permanent +5% all stats per prestige level',
  },
  {
    id: 'killer_100',
    name: 'Centurion',
    description: 'Defeat 100 monsters.',
    condition: (stats) => stats.monstersKilled >= 100,
    reward: '+3% ATK',
  },
  {
    id: 'deaths_10',
    name: 'Persistent',
    description: 'Get defeated 10 times. Never give up.',
    condition: (stats) => stats.deaths >= 10,
    reward: '+10% HP',
  },
];

/**
 * Check for newly earned achievements.
 * Returns array of newly unlocked achievement ids.
 */
export function checkAchievements(stats, unlockedIds) {
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (!unlockedIds.includes(ach.id) && ach.condition(stats)) {
      newlyUnlocked.push(ach.id);
    }
  }

  return newlyUnlocked;
}

/**
 * Get stat multiplier from unlocked achievements.
 */
export function getAchievementBonuses(unlockedIds) {
  const bonuses = { hp: 0, atk: 0, def: 0, spd: 0, mag: 0, xp: 0, gold: 0 };

  for (const id of unlockedIds) {
    switch (id) {
      case 'floor_5':
        bonuses.hp += 0.05;
        break;
      case 'floor_10':
        bonuses.atk += 0.05;
        break;
      case 'floor_25':
        bonuses.def += 0.1;
        break;
      case 'boss_slayer':
        bonuses.hp += 0.05;
        bonuses.atk += 0.05;
        bonuses.def += 0.05;
        bonuses.spd += 0.05;
        bonuses.mag += 0.05;
        break;
      case 'hoarder':
        bonuses.gold += 0.1;
        break;
      case 'rich':
        bonuses.gold += 0.2;
        break;
      case 'veteran':
        bonuses.xp += 0.1;
        break;
      case 'killer_100':
        bonuses.atk += 0.03;
        break;
      case 'deaths_10':
        bonuses.hp += 0.1;
        break;
    }
  }

  return bonuses;
}
