import { randChoice, randInt, shuffle, pickN } from '../utils/math.js';

export const CLASSES = {
  warrior: {
    name: 'Warrior',
    description: 'Hits things. Gets hit. Keeps going.',
    baseStats: { hp: 45, mp: 5, atk: 12, def: 10, spd: 6, mag: 2 },
    growths: { hp: 8, mp: 1, atk: 3, def: 2, spd: 1, mag: 0 },
    skills: ['slash', 'shield_bash', 'war_cry'],
  },
  mage: {
    name: 'Mage',
    description: "Turns MP into someone else's problem.",
    baseStats: { hp: 25, mp: 30, atk: 3, def: 4, spd: 7, mag: 14 },
    growths: { hp: 3, mp: 5, atk: 0, def: 1, spd: 1, mag: 4 },
    skills: ['fireball', 'ice_shard', 'arcane_blast'],
  },
  rogue: {
    name: 'Rogue',
    description: 'Fast, sneaky, questionable morals.',
    baseStats: { hp: 30, mp: 10, atk: 10, def: 5, spd: 14, mag: 5 },
    growths: { hp: 4, mp: 2, atk: 2, def: 1, spd: 3, mag: 1 },
    skills: ['backstab', 'poison_blade', 'evasion'],
  },
  healer: {
    name: 'Healer',
    description: 'Keeps everyone alive. Mostly.',
    baseStats: { hp: 30, mp: 25, atk: 4, def: 6, spd: 8, mag: 12 },
    growths: { hp: 5, mp: 4, atk: 0, def: 1, spd: 1, mag: 3 },
    skills: ['heal', 'bless', 'smite'],
  },
  paladin: {
    name: 'Paladin',
    description: 'Faith is armor. Also, actual armor.',
    baseStats: { hp: 40, mp: 15, atk: 10, def: 12, spd: 5, mag: 8 },
    growths: { hp: 7, mp: 2, atk: 2, def: 3, spd: 0, mag: 2 },
    skills: ['holy_strike', 'lay_on_hands', 'divine_aura'],
    unlockReq: 'floor_50',
  },
  necromancer: {
    name: 'Necromancer',
    description: 'Death is just another resource to manage.',
    baseStats: { hp: 22, mp: 35, atk: 2, def: 3, spd: 6, mag: 16 },
    growths: { hp: 2, mp: 6, atk: 0, def: 0, spd: 1, mag: 5 },
    skills: ['soul_bolt', 'drain_life', 'bone_shield'],
    unlockReq: 'prestige_3',
  },
  berserker: {
    name: 'Berserker',
    description: 'Defense is for people who plan to survive.',
    baseStats: { hp: 35, mp: 5, atk: 16, def: 3, spd: 10, mag: 1 },
    growths: { hp: 6, mp: 0, atk: 4, def: 0, spd: 2, mag: 0 },
    skills: ['reckless_blow', 'blood_rage', 'cleave'],
    unlockReq: 'killer_500',
  },
  monk: {
    name: 'Monk',
    description: 'Punches things at the speed of enlightenment.',
    baseStats: { hp: 32, mp: 12, atk: 9, def: 7, spd: 16, mag: 6 },
    growths: { hp: 5, mp: 2, atk: 2, def: 1, spd: 4, mag: 1 },
    skills: ['palm_strike', 'inner_peace', 'flurry'],
    unlockReq: 'floor_100',
  },
};

export const RACES = {
  human: {
    name: 'Human',
    description: 'Versatile and stubborn.',
    statMods: { hp: 0, mp: 0, atk: 1, def: 1, spd: 1, mag: 1 },
    perk: 'xp_bonus',
    perkValue: 0.1,
    perkDesc: '+10% XP',
  },
  elf: {
    name: 'Elf',
    description: 'Graceful, magical, slightly smug.',
    statMods: { hp: -5, mp: 5, atk: -1, def: 0, spd: 2, mag: 3 },
    perk: 'skill_xp_bonus',
    perkValue: 0.15,
    perkDesc: '+15% skill XP',
  },
  dwarf: {
    name: 'Dwarf',
    description: 'Short, stout, unbreakable.',
    statMods: { hp: 10, mp: -3, atk: 2, def: 3, spd: -2, mag: -1 },
    perk: 'damage_reduction',
    perkValue: 0.1,
    perkDesc: '-10% damage taken',
  },
  goblin: {
    name: 'Goblin',
    description: 'Small, chaotic, surprisingly effective.',
    statMods: { hp: -5, mp: 0, atk: 0, def: -2, spd: 4, mag: 0 },
    perk: 'gold_bonus',
    perkValue: 0.2,
    perkDesc: '+20% gold',
  },
};

const FIRST_NAMES = [
  'Aric', 'Bren', 'Cael', 'Dorn', 'Elm', 'Finn', 'Gale', 'Holt',
  'Iris', 'Jade', 'Kael', 'Luna', 'Moss', 'Nyx', 'Orin', 'Pike',
  'Quinn', 'Ren', 'Sage', 'Thorn', 'Uma', 'Vale', 'Wren', 'Xia',
  'Yew', 'Zara', 'Ash', 'Briar', 'Cliff', 'Dawn', 'Echo', 'Flint',
];

const TITLES = [
  'the Bold', 'the Wise', 'Ironjaw', 'Lightfoot', 'Stormborn',
  'the Unlikely', 'Mudfoot', 'the Hungry', 'Goldtooth', 'the Lost',
  'the Brave', 'Shadowstep', 'Fireheart', 'the Meek', 'Sparkfinger',
  'the Sleepy', 'Rockbiter', 'the Lucky', 'Moonwhisper', 'Dirthand',
];

let nextId = 1;

export function generateName() {
  return `${randChoice(FIRST_NAMES)} ${randChoice(TITLES)}`;
}

export function createCharacter(classId = null, raceId = null, { allSkills = false } = {}) {
  const cls = classId || randChoice(Object.keys(CLASSES));
  const race = raceId || randChoice(Object.keys(RACES));
  const classDef = CLASSES[cls];
  const raceDef = RACES[race];

  const baseHp = classDef.baseStats.hp + raceDef.statMods.hp + randInt(-2, 2);
  const baseMp = classDef.baseStats.mp + raceDef.statMods.mp + randInt(-1, 1);

  // Start with 2 random skills from the class's 3, unless allSkills is true
  const startSkills = allSkills ? classDef.skills : pickN(classDef.skills, 2);

  return {
    id: nextId++,
    name: generateName(),
    class: cls,
    race: race,
    level: 1,
    xp: 0,
    hp: baseHp,
    maxHp: baseHp,
    mp: Math.max(0, baseMp),
    maxMp: Math.max(0, baseMp),
    atk: classDef.baseStats.atk + raceDef.statMods.atk + randInt(-1, 1),
    def: classDef.baseStats.def + raceDef.statMods.def + randInt(-1, 1),
    spd: classDef.baseStats.spd + raceDef.statMods.spd + randInt(-1, 1),
    mag: classDef.baseStats.mag + raceDef.statMods.mag + randInt(-1, 1),
    skills: startSkills.map((id) => ({
      id,
      level: 1,
      xp: 0,
      uses: 0,
    })),
    equipment: { weapon: null, armor: null, accessory: null },
    skillPoints: 0,
    alive: true,
    buffs: [],
  };
}

export function getUnlockedClassIds(unlockedAchievements = []) {
  return Object.keys(CLASSES).filter((id) => {
    const cls = CLASSES[id];
    return !cls.unlockReq || unlockedAchievements.includes(cls.unlockReq);
  });
}

export function createParty(size = 4, unlockedAchievements = [], { allSkills = false } = {}) {
  const available = getUnlockedClassIds(unlockedAchievements);
  const classIds = shuffle(available).slice(0, size);
  return classIds.map((cls) => createCharacter(cls, null, { allSkills }));
}

export function restoreParty(party) {
  for (const char of party) {
    char.hp = char.maxHp;
    char.mp = char.maxMp;
    char.alive = true;
    char.buffs = [];
  }
}

export function healParty(party, fraction) {
  for (const char of party) {
    if (char.alive) {
      char.hp = Math.min(char.maxHp, char.hp + Math.floor(char.maxHp * fraction));
      char.mp = Math.min(char.maxMp, char.mp + Math.floor(char.maxMp * fraction));
    }
  }
}

export function isPartyAlive(party) {
  return party.some((c) => c.alive && c.hp > 0);
}

export function getEffectiveStat(char, stat) {
  let base = char[stat];
  // Equipment bonuses
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const item = char.equipment[slot];
    if (item && item[stat] !== undefined) {
      base += item[stat];
    }
  }
  // Buff bonuses
  for (const buff of char.buffs) {
    if (buff.stat === stat) {
      base += buff.amount;
    }
  }
  return Math.max(0, base);
}

export function resetCharacterId(startId = 1) {
  nextId = startId;
}
