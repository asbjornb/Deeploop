import { randInt, randChoice, floorScaling } from '../utils/math.js';

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
  { name: 'Rusty Sword', slot: 'weapon', atk: 3, def: 0, spd: 0, mag: 0, tier: 1 },
  { name: 'Wooden Shield', slot: 'armor', atk: 0, def: 3, spd: 0, mag: 0, tier: 1 },
  { name: 'Swift Boots', slot: 'accessory', atk: 0, def: 0, spd: 3, mag: 0, tier: 1 },
  { name: 'Iron Blade', slot: 'weapon', atk: 6, def: 0, spd: 0, mag: 0, tier: 2 },
  { name: 'Chain Mail', slot: 'armor', atk: 0, def: 6, spd: -1, mag: 0, tier: 2 },
  { name: 'Magic Ring', slot: 'accessory', atk: 0, def: 0, spd: 0, mag: 5, tier: 2 },
  { name: 'Flame Sword', slot: 'weapon', atk: 10, def: 0, spd: 0, mag: 3, tier: 3 },
  { name: 'Plate Armor', slot: 'armor', atk: 0, def: 10, spd: -2, mag: 0, tier: 3 },
  { name: 'Amulet of Speed', slot: 'accessory', atk: 2, def: 2, spd: 5, mag: 2, tier: 3 },
  { name: 'Void Edge', slot: 'weapon', atk: 15, def: 0, spd: 2, mag: 5, tier: 4 },
  { name: 'Dragon Scale', slot: 'armor', atk: 3, def: 15, spd: 0, mag: 3, tier: 4 },
  { name: 'Crown of Stars', slot: 'accessory', atk: 5, def: 5, spd: 5, mag: 5, tier: 4 },
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
