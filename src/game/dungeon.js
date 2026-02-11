import { randInt, randChoice, shuffle, floorScaling } from '../utils/math.js';

const ROOM_TYPES = ['combat', 'combat', 'combat', 'treasure', 'event', 'rest', 'trap'];

export const MONSTER_TYPES = [
  { name: 'Slime', baseHp: 15, baseAtk: 5, baseDef: 2, baseSpd: 3, xp: 10,
    ability: { name: 'Acid Splash', chance: 0.25, type: 'single_debuff', power: 0.8, debuffStat: 'def', debuffRatio: 0.2, debuffDuration: 2 } },
  { name: 'Rat', baseHp: 10, baseAtk: 7, baseDef: 1, baseSpd: 8, xp: 8,
    ability: { name: 'Frenzy', chance: 0.3, type: 'multi', power: 0.7, hits: 2 } },
  { name: 'Skeleton', baseHp: 20, baseAtk: 8, baseDef: 5, baseSpd: 4, xp: 15,
    ability: { name: 'Bone Throw', chance: 0.25, type: 'snipe', power: 1.3 } },
  { name: 'Bat', baseHp: 8, baseAtk: 6, baseDef: 1, baseSpd: 12, xp: 7,
    ability: { name: 'Screech', chance: 0.2, type: 'aoe', power: 0.4 } },
  { name: 'Goblin Scout', baseHp: 18, baseAtk: 9, baseDef: 3, baseSpd: 7, xp: 12,
    ability: { name: 'Cheap Shot', chance: 0.3, type: 'single_stun', power: 1.0, stunChance: 0.4 } },
  { name: 'Spider', baseHp: 12, baseAtk: 10, baseDef: 2, baseSpd: 9, xp: 11,
    ability: { name: 'Web Snare', chance: 0.25, type: 'single_stun', power: 0.5, stunChance: 0.7 } },
  { name: 'Zombie', baseHp: 30, baseAtk: 6, baseDef: 3, baseSpd: 2, xp: 14,
    ability: { name: 'Infectious Grasp', chance: 0.2, type: 'single_debuff', power: 0.8, debuffStat: 'spd', debuffRatio: 0.25, debuffDuration: 2 } },
  { name: 'Ghost', baseHp: 15, baseAtk: 11, baseDef: 1, baseSpd: 10, xp: 16,
    ability: { name: 'Terrify', chance: 0.25, type: 'single_debuff', power: 0.6, debuffStat: 'atk', debuffRatio: 0.2, debuffDuration: 2 } },
  { name: 'Orc', baseHp: 35, baseAtk: 12, baseDef: 7, baseSpd: 5, xp: 20,
    ability: { name: 'Crushing Blow', chance: 0.3, type: 'heavy', power: 1.8 } },
  { name: 'Mimic', baseHp: 25, baseAtk: 14, baseDef: 8, baseSpd: 6, xp: 25,
    ability: { name: 'Chomp', chance: 0.35, type: 'multi', power: 0.9, hits: 2 } },
];

export const BOSS_TYPES = [
  { name: 'Dragon Hatchling', baseHp: 80, baseAtk: 18, baseDef: 12, baseSpd: 8, xp: 100,
    ability: { name: 'Fire Breath', chance: 0.4, type: 'aoe', power: 0.8 } },
  { name: 'Lich King', baseHp: 60, baseAtk: 22, baseDef: 8, baseSpd: 10, xp: 120,
    ability: { name: 'Dark Bolt', chance: 0.45, type: 'drain', power: 1.5, healRatio: 0.3 } },
  { name: 'Spider Queen', baseHp: 70, baseAtk: 16, baseDef: 10, baseSpd: 14, xp: 110,
    ability: { name: 'Venom Cloud', chance: 0.35, type: 'aoe_debuff', power: 0.5, debuffStat: 'def', debuffRatio: 0.15, debuffDuration: 2 } },
  { name: 'Demon Lord', baseHp: 90, baseAtk: 20, baseDef: 14, baseSpd: 7, xp: 150,
    ability: { name: 'Hellfire', chance: 0.4, type: 'aoe_debuff', power: 1.0, debuffStat: 'def', debuffRatio: 0.2, debuffDuration: 2 } },
  { name: 'Ancient Golem', baseHp: 120, baseAtk: 14, baseDef: 20, baseSpd: 3, xp: 130,
    ability: { name: 'Earthquake', chance: 0.35, type: 'aoe_stun', power: 0.7, stunChance: 0.3 } },
];

export const EVENT_TYPES = [
  {
    id: 'fountain',
    text: 'The party discovers a mysterious fountain. Its waters shimmer invitingly.',
    effect: 'heal',
    value: 0.3,
  },
  {
    id: 'dart_trap',
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
  {
    id: 'gambling_den',
    text: 'A shady figure beckons from behind a makeshift table. "Care to wager?"',
    effect: 'gamble',
    value: 0,
  },
  {
    id: 'ancient_library',
    text: 'Dusty tomes line the walls. The party takes a moment to study.',
    effect: 'skill_xp',
    value: 3,
  },
  {
    id: 'cursed_chest',
    text: 'A chest radiates dark energy. Something valuable lies within... at a cost.',
    effect: 'cursed_treasure',
    value: 0,
  },
  {
    id: 'spirit_guide',
    text: 'A spectral figure materializes and shares wisdom from beyond.',
    effect: 'bonus_xp',
    value: 0.5,
  },
  {
    id: 'campfire',
    text: 'The remains of a campfire still glow. The party warms up and shares stories.',
    effect: 'buff_all',
    value: 2,
  },
  {
    id: 'mirror_pool',
    text: 'A still pool reflects not faces, but potential. Each member glimpses their future self.',
    effect: 'buff_spd',
    value: 3,
  },
  {
    id: 'sacrificial_altar',
    text: 'An altar demands an offering. Gold glints in the cracks. Pay tribute or walk away?',
    effect: 'sacrifice_gold',
    value: 0,
  },
];

export const TRAP_TYPES = [
  {
    id: 'spike_pit',
    text: 'The floor gives way! Spikes line the bottom of the pit!',
    effect: 'damage_all',
    value: 0.2,
  },
  {
    id: 'poison_gas',
    text: 'Green gas hisses from vents in the walls. It burns the lungs!',
    effect: 'poison_all',
    value: 0.08,
    duration: 3,
  },
  {
    id: 'cursed_rune',
    text: 'Ancient runes flare to life underfoot! A curse settles on the party.',
    effect: 'debuff_stats',
    stat: 'atk',
    value: 0.15,
    duration: 8,
  },
  {
    id: 'mana_drain',
    text: 'Crystals embedded in the walls pulse and drain magical energy!',
    effect: 'drain_mp',
    value: 0.4,
  },
  {
    id: 'arrow_volley',
    text: 'A tripwire! Arrows rain from hidden slits in the ceiling!',
    effect: 'damage_all',
    value: 0.15,
  },
  {
    id: 'cave_in',
    text: 'The ceiling trembles and rocks crash down! One member takes the worst of it.',
    effect: 'damage_one',
    value: 0.35,
  },
  {
    id: 'hex_ward',
    text: 'A warding glyph blazes with violet light. Defense feels... thinner.',
    effect: 'debuff_stats',
    stat: 'def',
    value: 0.15,
    duration: 8,
  },
];

export const ENCHANTMENTS = [
  { id: 'keen', name: 'Keen', description: '+crit chance', stat: 'critChance', value: 0.1 },
  { id: 'vampiric', name: 'Vampiric', description: 'life steal on hit', stat: 'lifeSteal', value: 0.08 },
  { id: 'fortified', name: 'Fortified', description: '+HP', stat: 'hp', value: 15 },
  { id: 'swift', name: 'Swift', description: '+SPD', stat: 'spd', value: 3 },
  { id: 'venomous', name: 'Venomous', description: 'chance to poison', stat: 'poisonChance', value: 0.2 },
  { id: 'gilded', name: 'Gilded', description: '+gold find', stat: 'goldFind', value: 0.15 },
  { id: 'arcane', name: 'Arcane', description: '+MAG', stat: 'mag', value: 3 },
  { id: 'brutal', name: 'Brutal', description: '+ATK', stat: 'atk', value: 3 },
  { id: 'warding', name: 'Warding', description: '+DEF', stat: 'def', value: 3 },
  { id: 'resilient', name: 'Resilient', description: 'damage reduction', stat: 'damageReduction', value: 0.05 },
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

  // Tier 1 general accessories
  { name: 'Bone Charm', slot: 'accessory', atk: 1, def: 1, spd: 1, mag: 0, tier: 1, price: 20 },
  { name: 'Lucky Coin', slot: 'accessory', atk: 0, def: 0, spd: 2, mag: 1, tier: 1, price: 25 },

  // Tier 2 general accessories
  { name: 'Bloodstone Ring', slot: 'accessory', atk: 3, def: 0, spd: 0, mag: 3, tier: 2, price: 65 },
  { name: 'Windwalker Boots', slot: 'accessory', atk: 0, def: 1, spd: 5, mag: 0, tier: 2, price: 70 },
  { name: 'Toughness Amulet', slot: 'accessory', atk: 0, def: 4, spd: 0, mag: 1, tier: 2, price: 65 },

  // Tier 2 trade-off items
  { name: 'Berserker Band', slot: 'accessory', atk: 6, def: -2, spd: 0, mag: 0, tier: 2, price: 60 },
  { name: 'Glass Cannon Staff', slot: 'weapon', atk: 0, def: -2, spd: 0, mag: 9, tier: 2, price: 75, classReq: ['mage', 'necromancer'] },

  // Tier 3 general accessories
  { name: 'Ring of Thorns', slot: 'accessory', atk: 4, def: 3, spd: 0, mag: 0, tier: 3, price: 170, levelReq: 4 },
  { name: 'Cloak of Shadows', slot: 'accessory', atk: 0, def: 2, spd: 6, mag: 2, tier: 3, price: 175, levelReq: 4 },
  { name: 'Mindstone Pendant', slot: 'accessory', atk: 0, def: 0, spd: 2, mag: 8, tier: 3, price: 180, levelReq: 4, classReq: ['mage', 'healer', 'necromancer'] },

  // Tier 3 trade-off items
  { name: 'Cursed Greatsword', slot: 'weapon', atk: 14, def: -3, spd: -2, mag: 0, tier: 3, price: 180, classReq: ['warrior', 'berserker'], levelReq: 5 },
  { name: 'Voidheart Amulet', slot: 'accessory', atk: 0, def: -3, spd: 0, mag: 10, tier: 3, price: 165, levelReq: 5, classReq: ['mage', 'necromancer'] },

  // Tier 4 general accessories
  { name: 'Champion Belt', slot: 'accessory', atk: 7, def: 3, spd: 3, mag: 0, tier: 4, price: 420, levelReq: 7 },
  { name: 'Ethereal Mantle', slot: 'accessory', atk: 0, def: 4, spd: 4, mag: 8, tier: 4, price: 440, levelReq: 7 },
  { name: 'Blood Pact Ring', slot: 'accessory', atk: 8, def: -2, spd: 2, mag: 8, tier: 4, price: 400, levelReq: 7 },

  // Healer-specific weapons
  { name: 'Prayer Beads', slot: 'weapon', atk: 0, def: 2, spd: 0, mag: 5, tier: 2, price: 80, classReq: ['healer'] },
  { name: 'Scepter of Light', slot: 'weapon', atk: 1, def: 3, spd: 0, mag: 12, tier: 3, price: 210, classReq: ['healer'], levelReq: 5 },
  { name: 'Staff of Salvation', slot: 'weapon', atk: 2, def: 5, spd: 0, mag: 18, tier: 4, price: 510, classReq: ['healer'], levelReq: 8 },

  // Healer-specific armor
  { name: 'Vestments of Grace', slot: 'armor', atk: 0, def: 3, spd: 1, mag: 4, tier: 2, price: 80, classReq: ['healer'] },
  { name: 'Robe of Renewal', slot: 'armor', atk: 0, def: 6, spd: 0, mag: 8, tier: 3, price: 200, classReq: ['healer'], levelReq: 5 },
  { name: 'Divine Raiment', slot: 'armor', atk: 0, def: 10, spd: 1, mag: 13, tier: 4, price: 500, classReq: ['healer'], levelReq: 8 },

  // Paladin gear
  { name: 'Blessed Mace', slot: 'weapon', atk: 7, def: 2, spd: 0, mag: 4, tier: 2, price: 90, classReq: ['paladin'] },
  { name: 'Holy Avenger', slot: 'weapon', atk: 12, def: 3, spd: 0, mag: 8, tier: 3, price: 220, classReq: ['paladin'], levelReq: 5 },
  { name: 'Seraph Blade', slot: 'weapon', atk: 16, def: 4, spd: 0, mag: 12, tier: 4, price: 520, classReq: ['paladin'], levelReq: 8 },
  { name: 'Templar Shield', slot: 'armor', atk: 0, def: 8, spd: -1, mag: 2, tier: 2, price: 90, classReq: ['paladin'] },
  { name: 'Crusader Plate', slot: 'armor', atk: 2, def: 13, spd: -2, mag: 4, tier: 3, price: 220, classReq: ['paladin'], levelReq: 5 },
  { name: 'Radiant Aegis', slot: 'armor', atk: 3, def: 18, spd: 0, mag: 6, tier: 4, price: 520, classReq: ['paladin'], levelReq: 8 },

  // Necromancer gear
  { name: 'Bone Wand', slot: 'weapon', atk: 0, def: 0, spd: 1, mag: 8, tier: 2, price: 90, classReq: ['necromancer'] },
  { name: 'Skull Staff', slot: 'weapon', atk: 1, def: 0, spd: 0, mag: 13, tier: 3, price: 220, classReq: ['necromancer'], levelReq: 5 },
  { name: 'Lich Scepter', slot: 'weapon', atk: 2, def: 0, spd: 2, mag: 18, tier: 4, price: 520, classReq: ['necromancer'], levelReq: 8 },
  { name: 'Shroud of Shadows', slot: 'armor', atk: 0, def: 2, spd: 1, mag: 5, tier: 2, price: 85, classReq: ['necromancer'] },
  { name: 'Deathweave Robe', slot: 'armor', atk: 0, def: 4, spd: 1, mag: 9, tier: 3, price: 210, classReq: ['necromancer'], levelReq: 5 },
  { name: 'Voidcloak', slot: 'armor', atk: 0, def: 6, spd: 2, mag: 16, tier: 4, price: 510, classReq: ['necromancer'], levelReq: 8 },

  // Berserker gear
  { name: 'Jagged Axe', slot: 'weapon', atk: 9, def: 0, spd: 1, mag: 0, tier: 2, price: 85, classReq: ['berserker'] },
  { name: 'Gore Cleaver', slot: 'weapon', atk: 14, def: -1, spd: 2, mag: 0, tier: 3, price: 210, classReq: ['berserker'], levelReq: 5 },
  { name: 'Worldbreaker', slot: 'weapon', atk: 20, def: -2, spd: 3, mag: 0, tier: 4, price: 510, classReq: ['berserker'], levelReq: 8 },
  { name: 'Spiked Hide', slot: 'armor', atk: 3, def: 3, spd: 1, mag: 0, tier: 2, price: 80, classReq: ['berserker'] },
  { name: 'Warchief Harness', slot: 'armor', atk: 5, def: 5, spd: 2, mag: 0, tier: 3, price: 200, classReq: ['berserker'], levelReq: 5 },
  { name: 'Bloodsteel Armor', slot: 'armor', atk: 7, def: 10, spd: 3, mag: 0, tier: 4, price: 500, classReq: ['berserker'], levelReq: 8 },

  // Monk gear
  { name: 'Iron Fists', slot: 'weapon', atk: 5, def: 1, spd: 3, mag: 0, tier: 2, price: 80, classReq: ['monk'] },
  { name: 'Tiger Claws', slot: 'weapon', atk: 8, def: 1, spd: 5, mag: 1, tier: 3, price: 200, classReq: ['monk'], levelReq: 5 },
  { name: 'Dragon Fists', slot: 'weapon', atk: 12, def: 2, spd: 8, mag: 2, tier: 4, price: 500, classReq: ['monk'], levelReq: 8 },
  { name: 'Gi of the Wind', slot: 'armor', atk: 1, def: 3, spd: 4, mag: 0, tier: 2, price: 80, classReq: ['monk'] },
  { name: 'Flowing Silk', slot: 'armor', atk: 2, def: 5, spd: 6, mag: 1, tier: 3, price: 200, classReq: ['monk'], levelReq: 5 },
  { name: 'Grandmaster Vestments', slot: 'armor', atk: 4, def: 8, spd: 10, mag: 3, tier: 4, price: 500, classReq: ['monk'], levelReq: 8 },
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
    case 'trap':
      room.trap = { ...randChoice(TRAP_TYPES) };
      room.resolved = false;
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
        ability: template.ability || null,
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
      ability: template.ability || null,
    };
  });
}

function generateTreasure(floorNum, enchantLuckBonus = 0) {
  const maxTier = Math.min(4, 1 + Math.floor(floorNum / 5));
  const available = TREASURE_ITEMS.filter((item) => item.tier <= maxTier);
  const item = randChoice(available);
  const result = { ...item, id: Date.now() + Math.random() };
  maybeEnchant(result, floorNum, enchantLuckBonus);
  return result;
}

/**
 * Roll for an enchantment on an item. Higher floors and tiers increase the chance.
 */
function maybeEnchant(item, floorNum, enchantLuckBonus = 0) {
  const baseChance = 0.05 + (floorNum * 0.01) + (item.tier * 0.03) + enchantLuckBonus;
  if (Math.random() < Math.min(0.5, baseChance)) {
    const ench = randChoice(ENCHANTMENTS);
    item.enchantment = { ...ench };
    item.name = `${ench.name} ${item.name}`;
  }
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
export function generateShop(floorNum, party, shopTierBonus = 0, enchantLuckBonus = 0) {
  const maxTier = Math.min(4, 1 + Math.floor(floorNum / 5) + shopTierBonus);
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
      const item = { ...template, id: Date.now() + Math.random() + i };
      maybeEnchant(item, floorNum, enchantLuckBonus);
      if (item.enchantment) {
        item.price = Math.floor(item.price * 1.4);
      }
      items.push(item);
    }
  }

  // Fill remaining with any available items
  const shuffledAll = shuffle([...usable, ...other]);
  for (const template of shuffledAll) {
    if (items.length >= shopSize) break;
    const key = template.name + template.slot;
    if (!used.has(key)) {
      used.add(key);
      const item = { ...template, id: Date.now() + Math.random() + items.length };
      maybeEnchant(item, floorNum, enchantLuckBonus);
      if (item.enchantment) {
        item.price = Math.floor(item.price * 1.4);
      }
      items.push(item);
    }
  }

  return items;
}
