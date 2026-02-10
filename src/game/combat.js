import { calculateDamage, calculateMagicDamage, randChoice } from '../utils/math.js';
import { getEffectiveStat, RACES } from './party.js';
import { SKILLS } from './progression.js';

/**
 * Resolve a single combat turn. Returns an array of log entries.
 * Mutates party and enemies in place.
 */
export function resolveCombatTurn(party, enemies) {
  const log = [];

  // Build turn order from all alive combatants
  const combatants = [];

  for (const char of party) {
    if (char.alive && char.hp > 0) {
      combatants.push({ type: 'party', entity: char, spd: getEffectiveStat(char, 'spd') });
    }
  }
  for (const enemy of enemies) {
    if (enemy.hp > 0) {
      combatants.push({ type: 'enemy', entity: enemy, spd: enemy.spd });
    }
  }

  // Sort by speed (highest first), with random tiebreaker
  combatants.sort((a, b) => b.spd - a.spd || Math.random() - 0.5);

  for (const combatant of combatants) {
    // Skip if dead (may have died this turn)
    if (combatant.type === 'party' && (!combatant.entity.alive || combatant.entity.hp <= 0))
      continue;
    if (combatant.type === 'enemy' && combatant.entity.hp <= 0) continue;

    // Check if stunned
    if (combatant.entity.stunned) {
      log.push({
        type: 'info',
        text: `${combatant.entity.name} is stunned and cannot act!`,
      });
      combatant.entity.stunned = false;
      continue;
    }

    if (combatant.type === 'party') {
      const entries = executeCharacterTurn(combatant.entity, party, enemies);
      log.push(...entries);
    } else {
      const entries = executeEnemyTurn(combatant.entity, party);
      log.push(...entries);
    }

    // Check if combat is over
    if (enemies.every((e) => e.hp <= 0)) break;
    if (party.every((c) => !c.alive || c.hp <= 0)) break;
  }

  // Tick down buffs
  for (const char of party) {
    tickBuffs(char);
  }

  // Tick poison on enemies
  for (const enemy of enemies) {
    if (enemy.poison && enemy.poison > 0 && enemy.hp > 0) {
      const poisonDmg = enemy.poison;
      enemy.hp -= poisonDmg;
      log.push({ type: 'damage', text: `${enemy.name} takes ${poisonDmg} poison damage!` });
      enemy.poisonTurns = (enemy.poisonTurns || 1) - 1;
      if (enemy.poisonTurns <= 0) {
        enemy.poison = 0;
      }
    }
  }

  return log;
}

function executeCharacterTurn(char, party, enemies) {
  const log = [];
  const aliveEnemies = enemies.filter((e) => e.hp > 0);
  if (aliveEnemies.length === 0) return log;

  const action = chooseAction(char, party, aliveEnemies);

  if (!action) {
    // Basic attack
    const target = randChoice(aliveEnemies);
    const atk = getEffectiveStat(char, 'atk');
    const dmg = calculateDamage(atk, target.def);
    target.hp = Math.max(0, target.hp - dmg);
    log.push({ type: 'damage', text: `${char.name} attacks ${target.name} for ${dmg} damage!` });
    if (target.hp <= 0) {
      log.push({ type: 'info', text: `${target.name} is defeated!` });
    }
    return log;
  }

  const skill = SKILLS[action.skillId];
  const charSkill = char.skills.find((s) => s.id === action.skillId);

  // Use MP
  char.mp -= skill.mpCost;
  if (charSkill) {
    charSkill.uses++;
    const xpGain = 1 + (char.race === 'elf' ? 0.15 : 0);
    charSkill.xp += xpGain;
  }

  switch (skill.type) {
    case 'physical': {
      if (skill.target === 'single') {
        const target = action.target || randChoice(aliveEnemies);
        const atk = getEffectiveStat(char, 'atk');
        const power = skill.basePower + (charSkill ? (charSkill.level - 1) * 0.1 : 0);
        let dmg = calculateDamage(Math.floor(atk * power), target.def);

        // Crit check
        if (skill.critBonus && Math.random() < skill.critBonus) {
          dmg = Math.floor(dmg * 1.5);
          log.push({ type: 'damage', text: `CRITICAL! ${char.name} uses ${skill.name} on ${target.name} for ${dmg} damage!` });
        } else {
          log.push({ type: 'damage', text: `${char.name} uses ${skill.name} on ${target.name} for ${dmg} damage!` });
        }

        target.hp = Math.max(0, target.hp - dmg);
        if (target.hp <= 0) {
          log.push({ type: 'info', text: `${target.name} is defeated!` });
        }

        // Stun effect
        if (skill.effect === 'stun' && Math.random() < 0.3) {
          target.stunned = true;
          log.push({ type: 'info', text: `${target.name} is stunned!` });
        }

        // Poison effect
        if (skill.effect === 'poison') {
          const poisonDmg = Math.floor(atk * 0.3);
          target.poison = poisonDmg;
          target.poisonTurns = 3;
          log.push({ type: 'info', text: `${target.name} is poisoned!` });
        }
      }
      break;
    }

    case 'magic': {
      const mag = getEffectiveStat(char, 'mag');
      const power = skill.basePower + (charSkill ? (charSkill.level - 1) * 0.1 : 0);

      if (skill.target === 'all') {
        for (const target of aliveEnemies) {
          const dmg = calculateMagicDamage(Math.floor(mag * power), target.def);
          target.hp = Math.max(0, target.hp - dmg);
          log.push({ type: 'damage', text: `${char.name}'s ${skill.name} hits ${target.name} for ${dmg} damage!` });
          if (target.hp <= 0) {
            log.push({ type: 'info', text: `${target.name} is defeated!` });
          }
        }
      } else {
        const target = action.target || randChoice(aliveEnemies);
        const dmg = calculateMagicDamage(Math.floor(mag * power), target.def);
        target.hp = Math.max(0, target.hp - dmg);
        log.push({ type: 'damage', text: `${char.name} uses ${skill.name} on ${target.name} for ${dmg} damage!` });
        if (target.hp <= 0) {
          log.push({ type: 'info', text: `${target.name} is defeated!` });
        }

        // Slow effect
        if (skill.effect === 'slow') {
          target.spd = Math.floor(target.spd * 0.7);
          log.push({ type: 'info', text: `${target.name} is slowed!` });
        }
      }
      break;
    }

    case 'heal': {
      const mag = getEffectiveStat(char, 'mag');
      const power = skill.basePower + (charSkill ? (charSkill.level - 1) * 0.15 : 0);
      const aliveParty = party.filter((c) => c.alive && c.hp > 0);
      const target = action.target || aliveParty.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b));
      const healAmt = Math.floor(mag * power);
      const oldHp = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + healAmt);
      const actualHeal = target.hp - oldHp;
      log.push({ type: 'heal', text: `${char.name} heals ${target.name} for ${actualHeal} HP!` });
      break;
    }

    case 'buff': {
      if (skill.target === 'party') {
        const amount = Math.floor(
          skill.buffAmount *
            (getEffectiveStat(char, skill.buffStat === 'atk' ? 'atk' : 'def') +
              getEffectiveStat(char, 'mag'))
        );
        for (const member of party) {
          if (member.alive && member.hp > 0) {
            member.buffs.push({
              stat: skill.buffStat,
              amount,
              turns: skill.duration,
              name: skill.name,
            });
          }
        }
        log.push({ type: 'info', text: `${char.name} uses ${skill.name}! Party ${skill.buffStat.toUpperCase()} increased!` });
      } else if (skill.target === 'self' && skill.effect === 'dodge') {
        char.buffs.push({ stat: 'dodge', amount: 1, turns: skill.duration, name: skill.name });
        log.push({ type: 'info', text: `${char.name} prepares to evade!` });
      }
      break;
    }
  }

  return log;
}

function executeEnemyTurn(enemy, party) {
  const log = [];
  const aliveParty = party.filter((c) => c.alive && c.hp > 0);
  if (aliveParty.length === 0) return log;

  const target = randChoice(aliveParty);

  // Check for dodge buff
  const dodgeBuff = target.buffs.find((b) => b.stat === 'dodge');
  if (dodgeBuff) {
    log.push({ type: 'info', text: `${target.name} dodges ${enemy.name}'s attack!` });
    target.buffs = target.buffs.filter((b) => b !== dodgeBuff);
    return log;
  }

  let dmg = calculateDamage(enemy.atk, getEffectiveStat(target, 'def'));

  // Dwarf damage reduction
  if (target.race === 'dwarf') {
    dmg = Math.floor(dmg * (1 - RACES.dwarf.perkValue));
  }

  target.hp = Math.max(0, target.hp - dmg);
  log.push({ type: 'damage', text: `${enemy.name} attacks ${target.name} for ${dmg} damage!` });

  if (target.hp <= 0) {
    target.alive = false;
    log.push({ type: 'important', text: `${target.name} has fallen!` });
  }

  return log;
}

function chooseAction(char, party, enemies) {
  // AI logic per class
  const cls = char.class;
  const aliveParty = party.filter((c) => c.alive && c.hp > 0);

  switch (cls) {
    case 'healer': {
      // Heal if any ally below 50% HP
      const wounded = aliveParty.find((c) => c.hp < c.maxHp * 0.5);
      if (wounded && char.mp >= SKILLS.heal.mpCost) {
        return { skillId: 'heal', target: wounded };
      }
      // Bless if not active and enough MP
      const hasBlessing = aliveParty.some((c) => c.buffs.some((b) => b.name === 'Bless'));
      if (!hasBlessing && char.mp >= SKILLS.bless.mpCost) {
        return { skillId: 'bless' };
      }
      // Smite otherwise
      if (char.mp >= SKILLS.smite.mpCost) {
        return { skillId: 'smite' };
      }
      return null;
    }

    case 'warrior': {
      // War Cry if no party ATK buff
      const hasWarCry = aliveParty.some((c) => c.buffs.some((b) => b.name === 'War Cry'));
      if (!hasWarCry && char.mp >= SKILLS.war_cry.mpCost) {
        return { skillId: 'war_cry' };
      }
      // Shield Bash single strong enemy
      if (enemies.length === 1 && char.mp >= SKILLS.shield_bash.mpCost) {
        return { skillId: 'shield_bash', target: enemies[0] };
      }
      // Slash
      if (char.mp >= SKILLS.slash.mpCost) {
        const target = enemies.reduce((a, b) => (a.hp > b.hp ? a : b));
        return { skillId: 'slash', target };
      }
      return null;
    }

    case 'mage': {
      // Fireball if multiple enemies
      if (enemies.length > 1 && char.mp >= SKILLS.fireball.mpCost) {
        return { skillId: 'fireball' };
      }
      // Arcane Blast on high-HP single target
      if (enemies.length === 1 && char.mp >= SKILLS.arcane_blast.mpCost) {
        return { skillId: 'arcane_blast', target: enemies[0] };
      }
      // Ice Shard
      if (char.mp >= SKILLS.ice_shard.mpCost) {
        const target = enemies.reduce((a, b) => (a.hp > b.hp ? a : b));
        return { skillId: 'ice_shard', target };
      }
      // Fireball as fallback
      if (char.mp >= SKILLS.fireball.mpCost) {
        return { skillId: 'fireball' };
      }
      return null;
    }

    case 'rogue': {
      // Evasion if low HP
      if (char.hp < char.maxHp * 0.3 && char.mp >= SKILLS.evasion.mpCost) {
        const hasDodge = char.buffs.some((b) => b.stat === 'dodge');
        if (!hasDodge) {
          return { skillId: 'evasion' };
        }
      }
      // Poison unpoisoned enemy
      const unpoisoned = enemies.find((e) => !e.poison || e.poison === 0);
      if (unpoisoned && char.mp >= SKILLS.poison_blade.mpCost) {
        return { skillId: 'poison_blade', target: unpoisoned };
      }
      // Backstab
      if (char.mp >= SKILLS.backstab.mpCost) {
        const target = enemies.reduce((a, b) => (a.hp > b.hp ? a : b));
        return { skillId: 'backstab', target };
      }
      return null;
    }

    default:
      return null;
  }
}

function tickBuffs(char) {
  char.buffs = char.buffs.filter((b) => {
    b.turns--;
    return b.turns > 0;
  });
}

/**
 * Check if combat is over.
 * Returns 'victory', 'defeat', or null if ongoing.
 */
export function checkCombatResult(party, enemies) {
  if (enemies.every((e) => e.hp <= 0)) return 'victory';
  if (party.every((c) => !c.alive || c.hp <= 0)) return 'defeat';
  return null;
}
