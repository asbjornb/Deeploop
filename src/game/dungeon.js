import { randInt, randChoice, shuffle, floorScaling } from '../utils/math.js';

const ROOM_TYPES = ['combat', 'combat', 'combat', 'treasure', 'event', 'rest'];

export const MONSTER_TYPES = [
  { name: 'Slime', baseHp: 15, baseAtk: 5, baseDef: 2, baseSpd: 3, xp: 10 },
  { name: 'Rat', baseHp: 10, baseAtk: 7, baseDef: 1, baseSpd: 8, xp: 8 },
  { name: 'Skeleton', baseHp: 20, baseAtk: 8, baseDef: 5, baseSpd: 4, xp: 15 },
  { name: 'Bat', baseHp: 8, baseAtk: 6, baseDef: 1, baseSpd: 12, xp: 7 },
  { name: 'Goblin Scout', baseHp: 18, baseAtk: 9, baseDef: 3, baseSpd: 7, xp: 12 },
  { name: 'Spider', baseHp: 12, baseAtk: 10, baseDef: 2, baseSpd: 9, xp: 11 },
  { name: 'Zombie', baseHp: 30, baseAtk: 6, baseDef: 3, baseSpd: 2, xp: 14 },
  { name: 'Ghost', baseHp: 15, baseAtk: 11, baseDef: 1, baseSpd: 10, xp: 16 },
  { name: 'Orc', baseHp: 35, baseAtk: 12, baseDef: 7, baseSpd: 5, xp: 20 },
  { name: 'Mimic', baseHp: 25, baseAtk: 14, baseDef: 8, baseSpd: 6, xp: 25 },
];

export const BOSS_TYPES = [
  { name: 'Dragon Hatchling', baseHp: 80, baseAtk: 18, baseDef: 12, baseSpd: 8, xp: 100 },
  { name: 'Lich King', baseHp: 60, baseAtk: 22, baseDef: 8, baseSpd: 10, xp: 120 },
  { name: 'Spider Queen', baseHp: 70, baseAtk: 16, baseDef: 10, baseSpd: 14, xp: 110 },
  { name: 'Demon Lord', baseHp: 90, baseAtk: 20, baseDef: 14, baseSpd: 7, xp: 150 },
  { name: 'Ancient Golem', baseHp: 120, baseAtk: 14, baseDef: 20, baseSpd: 3, xp: 130 },
];

export const EVENT_TYPES = [
  {
    id: 'fountain',
    text: 'The party discovers a mysterious fountain. Its waters shimmer invitingly.',
    effect: 'heal',
    value: 0.3,
  },
  {
    id: 'trap',
    text: 'A hidden trap springs! Darts fly from the walls!',
    effect: 'damage',
    value: 0.15,
  },
  {
    id: 'shrine',
    text: 'A forgotten shrine hums with ancient power.',
    effect: 'buff_atk',
    value: 3,
  },
  {
    id: 'mushroom',
    text: 'Strange glowing mushrooms line the corridor. Someone decides to eat one.',
    effect: 'random',
    value: 0,
  },
  {
    id: 'statue',
    text: 'A crumbling statue whispers words of encouragement. Probably.',
    effect: 'buff_def',
    value: 3,
  },
];

export const TREASURE_ITEMS = [
  // Tier 1 weapons
  { name: 'Rusty Sword', slot: 'weapon', atk: 3, def: 0, spd: 0, mag: 0, tier: 1, price: 30, classReq: ['warrior', 'rogue'] },
  { name: 'Gnarled Staff', slot: 'weapon', atk: 1, def: 0, spd: 0, mag: 3, tier: 1, price: 30, classReq: ['mage', 'healer'] },
  // Tier 1 armor
  { name: 'Wooden Shield', slot: 'armor', atk: 0, def: 3, spd: 0, mag: 0, tier: 1, price: 30, classReq: ['warrior', 'healer'] },
  { name: 'Leather Vest', slot: 'armor', atk: 0, def: 2, spd: 1, mag: 0, tier: 1, price: 30, classReq: ['rogue'] },
  { name: 'Cloth Robe', slot: 'armor', atk: 0, def: 1, spd: 0, mag: 2, tier: 1, price: 30, classReq: ['mage', 'healer'] },
  // Tier 1 accessories
  { name: 'Swift Boots', slot: 'accessory', atk: 0, def: 0, spd: 3, mag: 0, tier: 1, price: 25 },
  { name: 'Iron Ring', slot: 'accessory', atk: 2, def: 1, spd: 0, mag: 0, tier: 1, price: 25 },

  // Tier 2 weapons
  { name: 'Iron Blade', slot: 'weapon', atk: 6, def: 0, spd: 0, mag: 0, tier: 2, price: 80, classReq: ['warrior', 'rogue'] },
  { name: 'Arcane Wand', slot: 'weapon', atk: 1, def: 0, spd: 1, mag: 6, tier: 2, price: 80, classReq: ['mage', 'healer'] },
  // Tier 2 armor
  { name: 'Chain Mail', slot: 'armor', atk: 0, def: 6, spd: -1, mag: 0, tier: 2, price: 80, classReq: ['warrior'] },
  { name: 'Reinforced Leather', slot: 'armor', atk: 1, def: 4, spd: 1, mag: 0, tier: 2, price: 80, classReq: ['rogue'] },
  { name: 'Enchanted Robe', slot: 'armor', atk: 0, def: 3, spd: 0, mag: 4, tier: 2, price: 80, classReq: ['mage', 'healer'] },
  // Tier 2 accessories
  { name: 'Magic Ring', slot: 'accessory', atk: 0, def: 0, spd: 0, mag: 5, tier: 2, price: 70 },
  { name: 'War Pendant', slot: 'accessory', atk: 4, def: 1, spd: 0, mag: 0, tier: 2, price: 70, classReq: ['warrior'] },
  { name: "Thief's Charm", slot: 'accessory', atk: 1, def: 0, spd: 4, mag: 0, tier: 2, price: 70, classReq: ['rogue'] },

  // Tier 3 weapons
  { name: 'Flame Sword', slot: 'weapon', atk: 10, def: 0, spd: 0, mag: 3, tier: 3, price: 200, classReq: ['warrior'], levelReq: 5 },
  { name: 'Shadow Dagger', slot: 'weapon', atk: 8, def: 0, spd: 4, mag: 0, tier: 3, price: 200, classReq: ['rogue'], levelReq: 5 },
  { name: 'Crystal Staff', slot: 'weapon', atk: 2, def: 0, spd: 0, mag: 10, tier: 3, price: 200, classReq: ['mage', 'healer'], levelReq: 5 },
  // Tier 3 armor
  { name: 'Plate Armor', slot: 'armor', atk: 0, def: 10, spd: -2, mag: 0, tier: 3, price: 200, classReq: ['warrior'], levelReq: 5 },
  { name: 'Nightweave', slot: 'armor', atk: 2, def: 5, spd: 3, mag: 0, tier: 3, price: 200, classReq: ['rogue'], levelReq: 5 },
  { name: 'Mystic Vestments', slot: 'armor', atk: 0, def: 5, spd: 0, mag: 7, tier: 3, price: 200, classReq: ['mage', 'healer'], levelReq: 5 },
  // Tier 3 accessories
  { name: 'Amulet of Speed', slot: 'accessory', atk: 2, def: 2, spd: 5, mag: 2, tier: 3, price: 180, levelReq: 4 },
  { name: "Healer's Brooch", slot: 'accessory', atk: 0, def: 3, spd: 0, mag: 6, tier: 3, price: 180, classReq: ['healer'], levelReq: 4 },

  // Tier 4 weapons
  { name: 'Void Edge', slot: 'weapon', atk: 15, def: 0, spd: 2, mag: 5, tier: 4, price: 500, classReq: ['warrior'], levelReq: 8 },
  { name: "Assassin's Blade", slot: 'weapon', atk: 12, def: 0, spd: 6, mag: 0, tier: 4, price: 500, classReq: ['rogue'], levelReq: 8 },
  { name: 'Elder Staff', slot: 'weapon', atk: 3, def: 2, spd: 0, mag: 15, tier: 4, price: 500, classReq: ['mage', 'healer'], levelReq: 8 },
  // Tier 4 armor
  { name: 'Dragon Scale', slot: 'armor', atk: 3, def: 15, spd: 0, mag: 3, tier: 4, price: 500, classReq: ['warrior'], levelReq: 8 },
  { name: 'Shadowcloak', slot: 'armor', atk: 4, def: 8, spd: 5, mag: 2, tier: 4, price: 500, classReq: ['rogue'], levelReq: 8 },
  { name: 'Archmage Robes', slot: 'armor', atk: 0, def: 8, spd: 2, mag: 14, tier: 4, price: 500, classReq: ['mage', 'healer'], levelReq: 8 },
  // Tier 4 accessories
  { name: 'Crown of Stars', slot: 'accessory', atk: 5, def: 5, spd: 5, mag: 5, tier: 4, price: 450, levelReq: 7 },
];

const FLOOR_DESCRIPTIONS = [
  'Damp stone walls echo with distant dripping.',
  'Cobwebs thick as curtains hang from the ceiling.',
  'The air smells faintly of sulfur and bad decisions.',
  'Luminescent fungi cast an eerie green glow.',
  'Ancient carvings depict heroes who probably did better than you.',
  'The floor is suspiciously sticky.',
  'A cold wind howls through unseen passages.',
  'Someone scratched "TURN BACK" on the wall. How helpful.',
  'The walls seem to shift when you look away.',
  'A faded sign reads "Welcome to level ???". Very informative.',
  'Mushrooms grow in the shape of a face. It does not look happy.',
  'Tiny footprints lead in circles around a rock.',
];

export function generateFloor(floorNum) {
  const isBossFloor = floorNum % 5 === 0;
  const roomCount = isBossFloor ? 1 : randInt(3, 4 + Math.floor(floorNum / 5));

  const rooms = [];

  if (isBossFloor) {
    rooms.push(generateBossRoom(floorNum));
  } else {
    for (let i = 0; i < roomCount; i++) {
      if (i === roomCount - 1) {
        rooms.push({ type: 'safe', explored: false });
      } else {
        rooms.push(generateRoom(randChoice(ROOM_TYPES), floorNum));
      }
    }
  }

  return {
    number: floorNum,
    rooms,
    currentRoom: 0,
    completed: false,
    isBossFloor,
    description: FLOOR_DESCRIPTIONS[(floorNum - 1) % FLOOR_DESCRIPTIONS.length],
  };
}

function generateRoom(type, floorNum) {
  const room = { type, explored: false };

  switch (type) {
    case 'combat':
      room.enemies = generateEnemies(floorNum);
      room.defeated = false;
      break;
    case 'treasure':
      room.item = generateTreasure(floorNum);
      room.gold = randInt(10, 30) + floorNum * 5;
      room.collected = false;
      break;
    case 'event':
      room.event = { ...randChoice(EVENT_TYPES) };
      room.resolved = false;
      break;
    case 'rest':
      room.healAmount = 0.25;
      room.used = false;
      break;
    default:
      break;
  }

  return room;
}

function generateBossRoom(floorNum) {
  const scaling = floorScaling(floorNum);
  const template = randChoice(BOSS_TYPES);

  return {
    type: 'boss',
    explored: false,
    defeated: false,
    enemies: [
      {
        name: template.name,
        hp: Math.floor(template.baseHp * scaling),
        maxHp: Math.floor(template.baseHp * scaling),
        atk: Math.floor(template.baseAtk * scaling),
        def: Math.floor(template.baseDef * scaling),
        spd: Math.floor(template.baseSpd * scaling),
        xp: Math.floor(template.xp * scaling),
        isBoss: true,
      },
    ],
  };
}

function generateEnemies(floorNum) {
  const count = randInt(1, Math.min(3, 1 + Math.floor(floorNum / 3)));
  const scaling = floorScaling(floorNum);

  return Array.from({ length: count }, () => {
    const template = randChoice(MONSTER_TYPES);
    return {
      name: template.name,
      hp: Math.floor(template.baseHp * scaling),
      maxHp: Math.floor(template.baseHp * scaling),
      atk: Math.floor(template.baseAtk * scaling),
      def: Math.floor(template.baseDef * scaling),
      spd: Math.floor(template.baseSpd * scaling),
      xp: Math.floor(template.xp * scaling),
      isBoss: false,
    };
  });
}

function generateTreasure(floorNum) {
  const maxTier = Math.min(4, 1 + Math.floor(floorNum / 5));
  const available = TREASURE_ITEMS.filter((item) => item.tier <= maxTier);
  const item = randChoice(available);
  return { ...item, id: Date.now() + Math.random() };
}

/**
 * Check if a character meets the requirements to equip an item.
 */
export function canEquip(char, item) {
  if (item.classReq && !item.classReq.includes(char.class)) return false;
  if (item.levelReq && char.level < item.levelReq) return false;
  return true;
}

/**
 * Get stat deltas from equipping an item on a character.
 * Returns { atk, def, spd, mag } with positive = improvement.
 */
export function getEquipDelta(char, item) {
  const current = char.equipment[item.slot];
  const stats = ['atk', 'def', 'spd', 'mag'];
  const delta = {};
  for (const stat of stats) {
    const gain = item[stat] || 0;
    const lose = current ? (current[stat] || 0) : 0;
    delta[stat] = gain - lose;
  }
  return delta;
}

/**
 * Generate shop inventory for a given floor and party.
 * Returns an array of items biased toward what the party can use.
 */
export function generateShop(floorNum, party) {
  const maxTier = Math.min(4, 1 + Math.floor(floorNum / 5));
  const available = TREASURE_ITEMS.filter((item) => item.tier <= maxTier);

  // Split items into party-usable vs not
  const usable = available.filter((item) =>
    party.some((char) => canEquip(char, item))
  );
  const other = available.filter((item) =>
    !party.some((char) => canEquip(char, item))
  );

  const shopSize = randInt(3, 5);
  const items = [];
  const used = new Set();

  // At least 2 items should be usable by someone in the party
  const usableCount = Math.min(usable.length, Math.max(2, shopSize - 1));
  const shuffledUsable = shuffle(usable);
  for (let i = 0; i < usableCount && items.length < shopSize; i++) {
    const template = shuffledUsable[i];
    const key = template.name + template.slot;
    if (!used.has(key)) {
      used.add(key);
      items.push({ ...template, id: Date.now() + Math.random() + i });
    }
  }

  // Fill remaining with any available items
  const shuffledAll = shuffle([...usable, ...other]);
  for (const template of shuffledAll) {
    if (items.length >= shopSize) break;
    const key = template.name + template.slot;
    if (!used.has(key)) {
      used.add(key);
      items.push({ ...template, id: Date.now() + Math.random() + items.length });
    }
  }

  return items;
}
