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

  // Paladin
  holy_strike: {
    name: 'Holy Strike',
    type: 'physical',
    target: 'single',
    mpCost: 2,
    basePower: 1.4,
    magScaling: 0.3,
    description: 'A strike infused with holy power.',
  },
  lay_on_hands: {
    name: 'Lay on Hands',
    type: 'heal',
    target: 'single_ally',
    mpCost: 5,
    basePower: 1.3,
    description: 'A powerful healing touch.',
  },
  divine_aura: {
    name: 'Divine Aura',
    type: 'buff',
    target: 'party',
    mpCost: 6,
    buffStat: 'def',
    buffAmount: 0.3,
    duration: 4,
    description: 'Shields the party with holy light.',
  },

  // Necromancer
  soul_bolt: {
    name: 'Soul Bolt',
    type: 'magic',
    target: 'single',
    mpCost: 4,
    basePower: 1.8,
    description: 'Tears at the target with dark energy.',
  },
  drain_life: {
    name: 'Drain Life',
    type: 'magic',
    target: 'single',
    mpCost: 5,
    basePower: 1.3,
    effect: 'life_steal',
    lifeStealRatio: 0.5,
    description: 'Steals life from the target.',
  },
  bone_shield: {
    name: 'Bone Shield',
    type: 'buff',
    target: 'self',
    mpCost: 4,
    buffStat: 'def',
    buffAmount: 0.5,
    duration: 3,
    description: 'Surrounds self with a barrier of bones.',
  },

  // Berserker
  reckless_blow: {
    name: 'Reckless Blow',
    type: 'physical',
    target: 'single',
    mpCost: 0,
    basePower: 2.2,
    selfDamage: 0.1,
    description: 'Devastating hit. Hurts yourself too.',
  },
  blood_rage: {
    name: 'Blood Rage',
    type: 'buff',
    target: 'self',
    mpCost: 2,
    buffStat: 'atk',
    buffAmount: 0.5,
    duration: 4,
    description: 'Fury made physical. Massively boosts ATK.',
  },
  cleave: {
    name: 'Cleave',
    type: 'physical',
    target: 'all',
    mpCost: 3,
    basePower: 1.3,
    description: 'Slash through all enemies.',
  },

  // Monk
  palm_strike: {
    name: 'Palm Strike',
    type: 'physical',
    target: 'single',
    mpCost: 1,
    basePower: 1.6,
    effect: 'stun',
    description: 'Focused strike. May stun.',
  },
  inner_peace: {
    name: 'Inner Peace',
    type: 'heal',
    target: 'self_heal',
    mpCost: 3,
    healPct: 0.3,
    description: 'Meditate briefly. Restore 30% HP.',
  },
  flurry: {
    name: 'Flurry',
    type: 'physical',
    target: 'multi',
    mpCost: 4,
    basePower: 0.8,
    hitCount: 3,
    description: 'Three rapid strikes on random enemies.',
  },
};

/**
 * Skills that can be learned in safe rooms by spending skill points.
 * Some are gated behind achievements. Each has class restrictions.
 */
export const LEARNABLE_SKILLS = [
  // Warrior skills
  {
    skillId: 'fortify',
    name: 'Fortify',
    classes: ['warrior'],
    cost: 2,
    achievementReq: null,
    description: 'Self-buff: +40% DEF for 4 turns.',
  },
  {
    skillId: 'whirlwind',
    name: 'Whirlwind',
    classes: ['warrior'],
    cost: 3,
    achievementReq: 'killer_100',
    description: 'Physical AoE. Strike all enemies. Requires: Centurion.',
  },

  // Mage skills
  {
    skillId: 'mana_shield',
    name: 'Mana Shield',
    classes: ['mage'],
    cost: 2,
    achievementReq: null,
    description: 'Self-buff: absorb damage using MP for 3 turns.',
  },
  {
    skillId: 'chain_lightning',
    name: 'Chain Lightning',
    classes: ['mage'],
    cost: 3,
    achievementReq: 'floor_10',
    description: 'Magic damage to 2 random enemies. Requires: Spelunker.',
  },

  // Rogue skills
  {
    skillId: 'smoke_bomb',
    name: 'Smoke Bomb',
    classes: ['rogue'],
    cost: 2,
    achievementReq: null,
    description: 'Party buff: +dodge for 2 turns.',
  },
  {
    skillId: 'shadow_strike',
    name: 'Shadow Strike',
    classes: ['rogue'],
    cost: 3,
    achievementReq: 'boss_slayer',
    description: 'Guaranteed critical hit (2.5x). Requires: Boss Slayer.',
  },

  // Healer skills
  {
    skillId: 'mass_heal',
    name: 'Mass Heal',
    classes: ['healer'],
    cost: 2,
    achievementReq: 'floor_5',
    description: 'Heal all allies. Requires: Getting Deeper.',
  },
  {
    skillId: 'life_drain',
    name: 'Life Drain',
    classes: ['healer'],
    cost: 3,
    achievementReq: 'veteran',
    description: 'Magic damage; heal self for 50% dealt. Requires: Veteran.',
  },

  // Paladin skills
  {
    skillId: 'consecrate',
    name: 'Consecrate',
    classes: ['paladin'],
    cost: 3,
    achievementReq: null,
    description: 'Holy AoE. Damages all enemies with sacred fire.',
  },
  {
    skillId: 'martyrdom',
    name: 'Martyrdom',
    classes: ['paladin'],
    cost: 4,
    achievementReq: 'floor_25',
    description: 'Sacrifice HP to fully heal an ally. Requires: Deep Diver.',
  },

  // Necromancer skills
  {
    skillId: 'soul_siphon',
    name: 'Soul Siphon',
    classes: ['necromancer'],
    cost: 3,
    achievementReq: null,
    description: 'AoE magic damage that heals self for each enemy hit.',
  },
  {
    skillId: 'death_pact',
    name: 'Death Pact',
    classes: ['necromancer'],
    cost: 4,
    achievementReq: 'deaths_10',
    description: 'Massively boost MAG at the cost of max HP. Requires: Persistent.',
  },

  // Berserker skills
  {
    skillId: 'rampage',
    name: 'Rampage',
    classes: ['berserker'],
    cost: 3,
    achievementReq: null,
    description: 'Strike all enemies. Damage increases with missing HP.',
  },
  {
    skillId: 'undying_fury',
    name: 'Undying Fury',
    classes: ['berserker'],
    cost: 4,
    achievementReq: 'killer_100',
    description: 'Survive lethal damage once per combat with 1 HP. Requires: Centurion.',
  },

  // Monk skills
  {
    skillId: 'pressure_point',
    name: 'Pressure Point',
    classes: ['monk'],
    cost: 3,
    achievementReq: null,
    description: 'Single target. Ignores defense.',
  },
  {
    skillId: 'tranquility',
    name: 'Tranquility',
    classes: ['monk'],
    cost: 4,
    achievementReq: 'veteran',
    description: 'Full party dodge for 1 turn. Requires: Veteran.',
  },

  // Base class skills (learnable when not randomly selected at start)
  { skillId: 'slash', name: 'Slash', classes: ['warrior'], cost: 1, achievementReq: null, description: 'A powerful sword swing.' },
  { skillId: 'shield_bash', name: 'Shield Bash', classes: ['warrior'], cost: 1, achievementReq: null, description: 'Bash with shield. May stun.' },
  { skillId: 'war_cry', name: 'War Cry', classes: ['warrior'], cost: 1, achievementReq: null, description: 'Boosts party ATK.' },
  { skillId: 'fireball', name: 'Fireball', classes: ['mage'], cost: 1, achievementReq: null, description: 'Fire damage to all enemies.' },
  { skillId: 'ice_shard', name: 'Ice Shard', classes: ['mage'], cost: 1, achievementReq: null, description: 'Ice damage. Slows target.' },
  { skillId: 'arcane_blast', name: 'Arcane Blast', classes: ['mage'], cost: 1, achievementReq: null, description: 'Massive magic damage.' },
  { skillId: 'backstab', name: 'Backstab', classes: ['rogue'], cost: 1, achievementReq: null, description: 'High damage. High crit chance.' },
  { skillId: 'poison_blade', name: 'Poison Blade', classes: ['rogue'], cost: 1, achievementReq: null, description: 'Poisons the target.' },
  { skillId: 'evasion', name: 'Evasion', classes: ['rogue'], cost: 1, achievementReq: null, description: 'Dodge the next attack.' },
  { skillId: 'heal', name: 'Heal', classes: ['healer'], cost: 1, achievementReq: null, description: 'Restore HP to an ally.' },
  { skillId: 'bless', name: 'Bless', classes: ['healer'], cost: 1, achievementReq: null, description: 'Boosts party DEF.' },
  { skillId: 'smite', name: 'Smite', classes: ['healer'], cost: 1, achievementReq: null, description: 'Holy damage to one enemy.' },
  { skillId: 'holy_strike', name: 'Holy Strike', classes: ['paladin'], cost: 1, achievementReq: null, description: 'A strike infused with holy power.' },
  { skillId: 'lay_on_hands', name: 'Lay on Hands', classes: ['paladin'], cost: 1, achievementReq: null, description: 'A powerful healing touch.' },
  { skillId: 'divine_aura', name: 'Divine Aura', classes: ['paladin'], cost: 1, achievementReq: null, description: 'Shields the party with holy light.' },
  { skillId: 'soul_bolt', name: 'Soul Bolt', classes: ['necromancer'], cost: 1, achievementReq: null, description: 'Tears at the target with dark energy.' },
  { skillId: 'drain_life', name: 'Drain Life', classes: ['necromancer'], cost: 1, achievementReq: null, description: 'Steals life from the target.' },
  { skillId: 'bone_shield', name: 'Bone Shield', classes: ['necromancer'], cost: 1, achievementReq: null, description: 'Surrounds self with a barrier of bones.' },
  { skillId: 'reckless_blow', name: 'Reckless Blow', classes: ['berserker'], cost: 1, achievementReq: null, description: 'Devastating hit. Hurts yourself too.' },
  { skillId: 'blood_rage', name: 'Blood Rage', classes: ['berserker'], cost: 1, achievementReq: null, description: 'Fury made physical. Massively boosts ATK.' },
  { skillId: 'cleave', name: 'Cleave', classes: ['berserker'], cost: 1, achievementReq: null, description: 'Slash through all enemies.' },
  { skillId: 'palm_strike', name: 'Palm Strike', classes: ['monk'], cost: 1, achievementReq: null, description: 'Focused strike. May stun.' },
  { skillId: 'inner_peace', name: 'Inner Peace', classes: ['monk'], cost: 1, achievementReq: null, description: 'Meditate briefly. Restore 30% HP.' },
  { skillId: 'flurry', name: 'Flurry', classes: ['monk'], cost: 1, achievementReq: null, description: 'Three rapid strikes on random enemies.' },

  // Cross-class skills (any class can learn)
  {
    skillId: 'rally',
    name: 'Rally',
    classes: ['warrior', 'mage', 'rogue', 'healer', 'paladin', 'necromancer', 'berserker', 'monk'],
    cost: 3,
    achievementReq: 'deaths_10',
    description: 'Heal entire party for 15% max HP. Requires: Persistent.',
  },
  {
    skillId: 'second_wind',
    name: 'Second Wind',
    classes: ['warrior', 'mage', 'rogue', 'healer', 'paladin', 'necromancer', 'berserker', 'monk'],
    cost: 3,
    achievementReq: 'floor_25',
    description: 'Self-buff: auto-heal 25% HP when below 20%. Once per combat. Requires: Deep Diver.',
  },
];

// Skill definitions for learnable skills (combat behavior)
export const LEARNABLE_SKILL_DEFS = {
  fortify: {
    name: 'Fortify',
    type: 'buff',
    target: 'self',
    mpCost: 3,
    buffStat: 'def',
    buffAmount: 0.4,
    duration: 4,
    description: 'Greatly boosts own DEF.',
  },
  whirlwind: {
    name: 'Whirlwind',
    type: 'physical',
    target: 'all',
    mpCost: 5,
    basePower: 1.2,
    description: 'Physical damage to all enemies.',
  },
  mana_shield: {
    name: 'Mana Shield',
    type: 'buff',
    target: 'self',
    mpCost: 4,
    effect: 'mana_shield',
    duration: 3,
    description: 'Absorb damage using MP.',
  },
  chain_lightning: {
    name: 'Chain Lightning',
    type: 'magic',
    target: 'multi',
    mpCost: 6,
    basePower: 1.5,
    hitCount: 2,
    description: 'Lightning strikes 2 random enemies.',
  },
  smoke_bomb: {
    name: 'Smoke Bomb',
    type: 'buff',
    target: 'party',
    mpCost: 4,
    effect: 'dodge',
    duration: 2,
    description: 'Grants dodge to entire party.',
  },
  shadow_strike: {
    name: 'Shadow Strike',
    type: 'physical',
    target: 'single',
    mpCost: 6,
    basePower: 2.5,
    guaranteedCrit: true,
    description: 'A guaranteed critical strike.',
  },
  mass_heal: {
    name: 'Mass Heal',
    type: 'heal',
    target: 'party',
    mpCost: 8,
    basePower: 1.0,
    description: 'Restore HP to all allies.',
  },
  life_drain: {
    name: 'Life Drain',
    type: 'magic',
    target: 'single',
    mpCost: 5,
    basePower: 1.3,
    effect: 'life_steal',
    lifeStealRatio: 0.5,
    description: 'Magic damage. Heals self for half dealt.',
  },
  // Paladin learnable
  consecrate: {
    name: 'Consecrate',
    type: 'magic',
    target: 'all',
    mpCost: 7,
    basePower: 1.2,
    description: 'Holy fire damages all enemies.',
  },
  martyrdom: {
    name: 'Martyrdom',
    type: 'heal',
    target: 'single_ally',
    mpCost: 0,
    selfDamagePct: 0.4,
    basePower: 99,
    description: 'Sacrifice 40% HP to fully heal an ally.',
  },
  // Necromancer learnable
  soul_siphon: {
    name: 'Soul Siphon',
    type: 'magic',
    target: 'all',
    mpCost: 8,
    basePower: 0.9,
    effect: 'life_steal',
    lifeStealRatio: 0.3,
    description: 'Dark AoE. Heals self for each enemy hit.',
  },
  death_pact: {
    name: 'Death Pact',
    type: 'buff',
    target: 'self',
    mpCost: 5,
    effect: 'death_pact',
    buffStat: 'mag',
    buffAmount: 0.8,
    duration: 5,
    selfDamagePct: 0.3,
    description: 'Sacrifice 30% max HP. Massively boost MAG.',
  },
  // Berserker learnable
  rampage: {
    name: 'Rampage',
    type: 'physical',
    target: 'all',
    mpCost: 2,
    basePower: 1.0,
    missingHpScaling: true,
    description: 'AoE that hits harder the lower your HP.',
  },
  undying_fury: {
    name: 'Undying Fury',
    type: 'buff',
    target: 'self',
    mpCost: 0,
    effect: 'undying',
    duration: 99,
    description: 'Survive one lethal hit with 1 HP.',
  },
  // Monk learnable
  pressure_point: {
    name: 'Pressure Point',
    type: 'physical',
    target: 'single',
    mpCost: 3,
    basePower: 1.5,
    ignoreDefense: true,
    description: 'Precise strike that ignores defense.',
  },
  tranquility: {
    name: 'Tranquility',
    type: 'buff',
    target: 'party',
    mpCost: 6,
    effect: 'dodge',
    duration: 1,
    description: 'Entire party dodges for 1 turn.',
  },
  rally: {
    name: 'Rally',
    type: 'heal',
    target: 'party_pct',
    mpCost: 6,
    healPct: 0.15,
    description: 'Heal entire party for 15% max HP.',
  },
  second_wind: {
    name: 'Second Wind',
    type: 'buff',
    target: 'self',
    mpCost: 0,
    effect: 'second_wind',
    duration: 99,
    description: 'Auto-heal 25% HP when below 20%. Once per combat.',
  },
};

// Merge learnable skill defs into SKILLS so combat can reference them all
Object.assign(SKILLS, LEARNABLE_SKILL_DEFS);

/**
 * Get available learnable skills for a character given their class and unlocked achievements.
 * Returns array of { ...learnableDef, locked: bool, lockReason: string|null, alreadyKnown: bool }.
 */
export function getAvailableSkills(char, unlockedAchievements) {
  return LEARNABLE_SKILLS
    .filter((ls) => ls.classes.includes(char.class))
    .map((ls) => {
      const alreadyKnown = char.skills.some((s) => s.id === ls.skillId);
      const locked = ls.achievementReq && !unlockedAchievements.includes(ls.achievementReq);
      const achDef = locked ? ACHIEVEMENTS.find((a) => a.id === ls.achievementReq) : null;
      return {
        ...ls,
        alreadyKnown,
        locked,
        lockReason: achDef ? achDef.name : null,
      };
    });
}

/**
 * Learn a new skill for a character. Deducts skill points.
 * Returns { success, message }.
 */
export function learnSkill(char, skillId, unlockedAchievements) {
  const def = LEARNABLE_SKILLS.find((ls) => ls.skillId === skillId);
  if (!def) return { success: false, message: 'Skill not found.' };
  if (!def.classes.includes(char.class)) return { success: false, message: 'Class cannot learn this skill.' };

  if (char.skills.some((s) => s.id === skillId)) {
    return { success: false, message: 'Already known.' };
  }

  if (def.achievementReq && !unlockedAchievements.includes(def.achievementReq)) {
    return { success: false, message: 'Achievement required.' };
  }

  if (char.skillPoints < def.cost) {
    return { success: false, message: `Need ${def.cost} skill points (have ${char.skillPoints}).` };
  }

  char.skillPoints -= def.cost;
  char.skills.push({ id: skillId, level: 1, xp: 0, uses: 0 });
  return { success: true, message: `${char.name} learned ${def.name}!` };
}

/**
 * Upgrade an existing skill with skill points.
 * Cost: current level (1 SP at level 1, 2 SP at level 2, etc.)
 * Returns { success, message }.
 */
export function upgradeSkill(char, skillId) {
  const charSkill = char.skills.find((s) => s.id === skillId);
  if (!charSkill) return { success: false, message: 'Skill not known.' };

  const cost = charSkill.level;
  if (char.skillPoints < cost) {
    return { success: false, message: `Need ${cost} skill points (have ${char.skillPoints}).` };
  }

  const maxLevel = 5;
  if (charSkill.level >= maxLevel) {
    return { success: false, message: 'Skill already at max level.' };
  }

  char.skillPoints -= cost;
  charSkill.level++;
  const skillName = SKILLS[skillId]?.name || skillId;
  return { success: true, message: `${char.name}'s ${skillName} upgraded to level ${charSkill.level}!` };
}

/**
 * Award XP to the party from defeated enemies.
 * Returns log entries for any level-ups.
 */
export function awardXP(party, enemies, prestigeLevel, upgradeXpBonus = 0) {
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

    // Prestige upgrade XP bonus
    if (upgradeXpBonus > 0) {
      xpGain = Math.floor(xpGain * (1 + upgradeXpBonus));
    }

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

// Prestige upgrade definitions (permanent upgrades bought with prestige points)
export const PRESTIGE_UPGRADES = [
  {
    id: 'starting_gold',
    name: 'Nest Egg',
    description: 'Start each run with bonus gold.',
    maxLevel: 5,
    costs: [3, 8, 15, 25, 40],
    values: [50, 150, 300, 500, 800],
  },
  {
    id: 'starting_sp',
    name: 'Innate Talent',
    description: 'Party members start with extra skill points.',
    maxLevel: 3,
    costs: [5, 15, 30],
    values: [1, 2, 3],
  },
  {
    id: 'vitality',
    name: 'Vitality',
    description: 'Permanent HP bonus for all party members.',
    maxLevel: 5,
    costs: [2, 5, 10, 18, 30],
    values: [0.05, 0.10, 0.18, 0.28, 0.40],
  },
  {
    id: 'might',
    name: 'Might',
    description: 'Permanent ATK bonus for all party members.',
    maxLevel: 5,
    costs: [2, 5, 10, 18, 30],
    values: [0.05, 0.10, 0.18, 0.28, 0.40],
  },
  {
    id: 'arcana',
    name: 'Arcana',
    description: 'Permanent MAG bonus for all party members.',
    maxLevel: 3,
    costs: [3, 8, 18],
    values: [0.08, 0.18, 0.30],
  },
  {
    id: 'resilience',
    name: 'Resilience',
    description: 'Permanent DEF bonus for all party members.',
    maxLevel: 3,
    costs: [3, 8, 18],
    values: [0.08, 0.18, 0.30],
  },
  {
    id: 'gold_find',
    name: 'Golden Touch',
    description: 'Find more gold from all sources.',
    maxLevel: 5,
    costs: [2, 5, 10, 18, 30],
    values: [0.10, 0.25, 0.40, 0.60, 0.85],
  },
  {
    id: 'xp_gain',
    name: 'Quick Learner',
    description: 'Gain more XP from combat.',
    maxLevel: 5,
    costs: [2, 5, 10, 18, 30],
    values: [0.10, 0.20, 0.35, 0.50, 0.70],
  },
  {
    id: 'three_skills',
    name: 'Prodigy',
    description: 'Party members start with all 3 class skills.',
    maxLevel: 1,
    costs: [20],
    values: [1],
  },
  {
    id: 'shop_tier',
    name: 'Merchant Connections',
    description: 'Shops offer higher tier items earlier.',
    maxLevel: 3,
    costs: [5, 12, 25],
    values: [1, 2, 3],
  },
  {
    id: 'enchant_luck',
    name: 'Enchanter\'s Eye',
    description: 'Higher chance of finding enchanted items.',
    maxLevel: 3,
    costs: [4, 10, 22],
    values: [0.05, 0.12, 0.20],
  },
  {
    id: 'trap_sense',
    name: 'Trap Sense',
    description: 'Reduce damage from dungeon traps.',
    maxLevel: 3,
    costs: [3, 8, 16],
    values: [0.20, 0.40, 0.60],
  },
  {
    id: 'rest_power',
    name: 'Deep Rest',
    description: 'Rest rooms and safe rooms restore more HP/MP.',
    maxLevel: 3,
    costs: [3, 8, 16],
    values: [0.10, 0.20, 0.35],
  },
  {
    id: 'synergy_power',
    name: 'Bonds of Fellowship',
    description: 'Party synergy bonuses are stronger.',
    maxLevel: 3,
    costs: [5, 12, 25],
    values: [0.25, 0.50, 1.00],
  },
  {
    id: 'starting_level',
    name: 'Head Start',
    description: 'Party members start at a higher level.',
    maxLevel: 3,
    costs: [8, 20, 40],
    values: [2, 4, 6],
  },
];

/**
 * Get the current level of a prestige upgrade.
 */
export function getPrestigeUpgradeLevel(upgrades, upgradeId) {
  return (upgrades && upgrades[upgradeId]) || 0;
}

/**
 * Get the effective value of a prestige upgrade at its current level.
 * Returns 0 if not purchased.
 */
export function getPrestigeUpgradeValue(upgrades, upgradeId) {
  const level = getPrestigeUpgradeLevel(upgrades, upgradeId);
  if (level === 0) return 0;
  const def = PRESTIGE_UPGRADES.find((u) => u.id === upgradeId);
  if (!def) return 0;
  return def.values[level - 1];
}

/**
 * Buy a prestige upgrade. Returns { success, message }.
 */
export function buyPrestigeUpgrade(prestige, upgradeId) {
  const def = PRESTIGE_UPGRADES.find((u) => u.id === upgradeId);
  if (!def) return { success: false, message: 'Upgrade not found.' };

  if (!prestige.upgrades) prestige.upgrades = {};
  const currentLevel = prestige.upgrades[upgradeId] || 0;

  if (currentLevel >= def.maxLevel) {
    return { success: false, message: `${def.name} is already at max level.` };
  }

  const cost = def.costs[currentLevel];
  if (prestige.points < cost) {
    return { success: false, message: `Need ${cost} prestige points (have ${prestige.points}).` };
  }

  prestige.points -= cost;
  prestige.upgrades[upgradeId] = currentLevel + 1;
  return {
    success: true,
    message: `${def.name} upgraded to level ${currentLevel + 1}!`,
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
  {
    id: 'floor_50',
    name: 'Abyssal Explorer',
    description: 'Reach floor 50.',
    condition: (stats) => stats.highestFloor >= 50,
    reward: 'Unlocks the Paladin class.',
  },
  {
    id: 'floor_100',
    name: 'Rock Bottom',
    description: 'Reach floor 100. There is no deeper.',
    condition: (stats) => stats.highestFloor >= 100,
    reward: 'Unlocks the Monk class.',
  },
  {
    id: 'prestige_3',
    name: 'Eternal Return',
    description: 'Prestige 3 times. Some loops run deeper.',
    condition: (stats) => stats.totalPrestige >= 3,
    reward: 'Unlocks the Necromancer class.',
  },
  {
    id: 'killer_500',
    name: 'Slaughter',
    description: 'Defeat 500 monsters. The dungeon knows your name.',
    condition: (stats) => stats.monstersKilled >= 500,
    reward: 'Unlocks the Berserker class.',
  },
  // Challenge mutation achievements
  {
    id: 'challenge_glass_cannon',
    name: 'Glass Half Empty',
    description: 'Reach floor 15 with Glass Cannon mutation active.',
    condition: (stats) => stats.challengesCompleted && stats.challengesCompleted.glass_cannon,
    reward: '+8% ATK, +5% MAG',
  },
  {
    id: 'challenge_cursed',
    name: 'Unbreakable',
    description: 'Reach floor 15 with Cursed Dungeon mutation active.',
    condition: (stats) => stats.challengesCompleted && stats.challengesCompleted.cursed,
    reward: '+5% all stats',
  },
  {
    id: 'challenge_speed_run',
    name: 'Lightning Reflexes',
    description: 'Reach floor 15 with Speed Demons mutation active.',
    condition: (stats) => stats.challengesCompleted && stats.challengesCompleted.speed_run,
    reward: '+10% SPD',
  },
  {
    id: 'challenge_treasure_hunter',
    name: 'Midas Touch',
    description: 'Reach floor 15 with Treasure Hunter mutation active.',
    condition: (stats) => stats.challengesCompleted && stats.challengesCompleted.treasure_hunter,
    reward: '+15% gold find',
  },
  {
    id: 'challenge_fragile_foes',
    name: 'Overkill',
    description: 'Reach floor 15 with Fragile Foes mutation active.',
    condition: (stats) => stats.challengesCompleted && stats.challengesCompleted.fragile_foes,
    reward: '+5% ATK, +5% SPD',
  },
  {
    id: 'challenge_ironman',
    name: 'Iron Will',
    description: 'Reach floor 15 with No Rest mutation active.',
    condition: (stats) => stats.challengesCompleted && stats.challengesCompleted.ironman,
    reward: '+10% HP, +10% DEF',
  },
];

// Challenge mutation definitions
export const MUTATIONS = [
  {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'Party has -50% HP but +50% ATK.',
    applyToParty: (party) => {
      for (const c of party) {
        c.maxHp = Math.floor(c.maxHp * 0.5);
        c.hp = c.maxHp;
        c.atk = Math.floor(c.atk * 1.5);
      }
    },
    applyToEnemies: null,
    goalFloor: 15,
    achievementId: 'challenge_glass_cannon',
  },
  {
    id: 'cursed',
    name: 'Cursed Dungeon',
    description: 'All enemies have +30% stats.',
    applyToParty: null,
    applyToEnemies: (enemies) => {
      for (const e of enemies) {
        e.hp = Math.floor(e.hp * 1.3);
        e.maxHp = Math.floor(e.maxHp * 1.3);
        e.atk = Math.floor(e.atk * 1.3);
        e.def = Math.floor(e.def * 1.3);
        e.spd = Math.floor(e.spd * 1.3);
      }
    },
    goalFloor: 15,
    achievementId: 'challenge_cursed',
  },
  {
    id: 'speed_run',
    name: 'Speed Demons',
    description: 'Enemies have +50% SPD.',
    applyToParty: null,
    applyToEnemies: (enemies) => {
      for (const e of enemies) {
        e.spd = Math.floor(e.spd * 1.5);
      }
    },
    goalFloor: 15,
    achievementId: 'challenge_speed_run',
  },
  {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: '+60% gold found, but party has -25% ATK.',
    applyToParty: (party) => {
      for (const c of party) {
        c.atk = Math.floor(c.atk * 0.75);
      }
    },
    applyToEnemies: null,
    goldMultiplier: 1.6,
    goalFloor: 15,
    achievementId: 'challenge_treasure_hunter',
  },
  {
    id: 'fragile_foes',
    name: 'Fragile Foes',
    description: 'Enemies have -40% HP but +60% ATK.',
    applyToParty: null,
    applyToEnemies: (enemies) => {
      for (const e of enemies) {
        e.hp = Math.floor(e.hp * 0.6);
        e.maxHp = Math.floor(e.maxHp * 0.6);
        e.atk = Math.floor(e.atk * 1.6);
      }
    },
    goalFloor: 15,
    achievementId: 'challenge_fragile_foes',
  },
  {
    id: 'ironman',
    name: 'No Rest',
    description: 'Rest rooms and healing events do nothing.',
    applyToParty: null,
    applyToEnemies: null,
    disableHealing: true,
    goalFloor: 15,
    achievementId: 'challenge_ironman',
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
      case 'floor_50':
        bonuses.hp += 0.1;
        bonuses.def += 0.05;
        break;
      case 'floor_100':
        bonuses.spd += 0.1;
        bonuses.hp += 0.05;
        break;
      case 'prestige_3':
        bonuses.mag += 0.1;
        bonuses.hp += 0.05;
        break;
      case 'killer_500':
        bonuses.atk += 0.1;
        bonuses.hp += 0.05;
        break;
      case 'challenge_glass_cannon':
        bonuses.atk += 0.08;
        bonuses.mag += 0.05;
        break;
      case 'challenge_cursed':
        bonuses.hp += 0.05;
        bonuses.atk += 0.05;
        bonuses.def += 0.05;
        bonuses.spd += 0.05;
        bonuses.mag += 0.05;
        break;
      case 'challenge_speed_run':
        bonuses.spd += 0.1;
        break;
      case 'challenge_treasure_hunter':
        bonuses.gold += 0.15;
        break;
      case 'challenge_fragile_foes':
        bonuses.atk += 0.05;
        bonuses.spd += 0.05;
        break;
      case 'challenge_ironman':
        bonuses.hp += 0.1;
        bonuses.def += 0.1;
        break;
    }
  }

  return bonuses;
}
