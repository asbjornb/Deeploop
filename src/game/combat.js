import { calculateDamage, calculateMagicDamage, randChoice, randInt } from '../utils/math.js';
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
      const atk = getEffectiveStat(char, 'atk');
      const power = skill.basePower + (charSkill ? (charSkill.level - 1) * 0.1 : 0);

      if (skill.target === 'all') {
        // AoE physical (Whirlwind)
        for (const target of aliveEnemies) {
          let dmg = calculateDamage(Math.floor(atk * power), target.def);
          target.hp = Math.max(0, target.hp - dmg);
          log.push({ type: 'damage', text: `${char.name}'s ${skill.name} hits ${target.name} for ${dmg} damage!` });
          if (target.hp <= 0) {
            log.push({ type: 'info', text: `${target.name} is defeated!` });
          }
        }
      } else {
        // Single target physical
        const target = action.target || randChoice(aliveEnemies);
        let dmg = calculateDamage(Math.floor(atk * power), target.def);

        // Crit check (guaranteed or chance-based)
        const isCrit = skill.guaranteedCrit || (skill.critBonus && Math.random() < skill.critBonus);
        if (isCrit) {
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
      } else if (skill.target === 'multi') {
        // Multi-target magic (Chain Lightning) - hits N random enemies
        const hitCount = skill.hitCount || 2;
        for (let i = 0; i < hitCount; i++) {
          const remaining = aliveEnemies.filter((e) => e.hp > 0);
          if (remaining.length === 0) break;
          const target = randChoice(remaining);
          const dmg = calculateMagicDamage(Math.floor(mag * power), target.def);
          target.hp = Math.max(0, target.hp - dmg);
          log.push({ type: 'damage', text: `${char.name}'s ${skill.name} chains to ${target.name} for ${dmg} damage!` });
          if (target.hp <= 0) {
            log.push({ type: 'info', text: `${target.name} is defeated!` });
          }
        }
      } else {
        // Single target magic
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

        // Life steal effect
        if (skill.effect === 'life_steal') {
          const healAmt = Math.floor(dmg * (skill.lifeStealRatio || 0.5));
          const oldHp = char.hp;
          char.hp = Math.min(char.maxHp, char.hp + healAmt);
          const actualHeal = char.hp - oldHp;
          if (actualHeal > 0) {
            log.push({ type: 'heal', text: `${char.name} drains ${actualHeal} HP!` });
          }
        }
      }
      break;
    }

    case 'heal': {
      const mag = getEffectiveStat(char, 'mag');
      const power = skill.basePower ? skill.basePower + (charSkill ? (charSkill.level - 1) * 0.15 : 0) : 0;
      const aliveParty = party.filter((c) => c.alive && c.hp > 0);

      if (skill.target === 'party') {
        // Mass Heal - heal all allies
        for (const member of aliveParty) {
          const healAmt = Math.floor(mag * power);
          const oldHp = member.hp;
          member.hp = Math.min(member.maxHp, member.hp + healAmt);
          const actualHeal = member.hp - oldHp;
          if (actualHeal > 0) {
            log.push({ type: 'heal', text: `${char.name}'s ${skill.name} heals ${member.name} for ${actualHeal} HP!` });
          }
        }
      } else if (skill.target === 'party_pct') {
        // Rally - percentage-based party heal
        const pct = skill.healPct || 0.15;
        for (const member of aliveParty) {
          const healAmt = Math.floor(member.maxHp * pct);
          const oldHp = member.hp;
          member.hp = Math.min(member.maxHp, member.hp + healAmt);
          const actualHeal = member.hp - oldHp;
          if (actualHeal > 0) {
            log.push({ type: 'heal', text: `${char.name}'s ${skill.name} restores ${actualHeal} HP to ${member.name}!` });
          }
        }
      } else {
        // Single target heal
        const target = action.target || aliveParty.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b));
        const healAmt = Math.floor(mag * power);
        const oldHp = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + healAmt);
        const actualHeal = target.hp - oldHp;
        log.push({ type: 'heal', text: `${char.name} heals ${target.name} for ${actualHeal} HP!` });
      }
      break;
    }

    case 'buff': {
      if (skill.target === 'party' && skill.effect === 'dodge') {
        // Smoke Bomb - party dodge
        for (const member of party) {
          if (member.alive && member.hp > 0) {
            member.buffs.push({ stat: 'dodge', amount: 1, turns: skill.duration, name: skill.name });
          }
        }
        log.push({ type: 'info', text: `${char.name} uses ${skill.name}! Party is shrouded!` });
      } else if (skill.target === 'party') {
        // Standard party stat buff (War Cry, Bless)
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
      } else if (skill.target === 'self' && skill.effect === 'mana_shield') {
        char.buffs.push({ stat: 'mana_shield', amount: 1, turns: skill.duration, name: skill.name });
        log.push({ type: 'info', text: `${char.name} conjures a Mana Shield!` });
      } else if (skill.target === 'self' && skill.effect === 'second_wind') {
        char.buffs.push({ stat: 'second_wind', amount: 1, turns: skill.duration, name: skill.name });
        log.push({ type: 'info', text: `${char.name} steels for a Second Wind!` });
      } else if (skill.target === 'self' && skill.buffStat) {
        // Generic self-buff (Fortify)
        const amount = Math.floor(
          skill.buffAmount * getEffectiveStat(char, skill.buffStat)
        );
        char.buffs.push({
          stat: skill.buffStat,
          amount,
          turns: skill.duration,
          name: skill.name,
        });
        log.push({ type: 'info', text: `${char.name} uses ${skill.name}! ${skill.buffStat.toUpperCase()} boosted!` });
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

  // Mana Shield: absorb damage using MP
  const manaShield = target.buffs.find((b) => b.stat === 'mana_shield');
  if (manaShield && target.mp > 0) {
    const absorbed = Math.min(dmg, target.mp);
    target.mp -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) {
      log.push({ type: 'info', text: `${target.name}'s Mana Shield absorbs ${absorbed} damage!` });
    }
    if (target.mp <= 0) {
      target.buffs = target.buffs.filter((b) => b !== manaShield);
      log.push({ type: 'info', text: `${target.name}'s Mana Shield shatters!` });
    }
  }

  target.hp = Math.max(0, target.hp - dmg);
  if (dmg > 0) {
    log.push({ type: 'damage', text: `${enemy.name} attacks ${target.name} for ${dmg} damage!` });
  }

  // Second Wind: auto-heal when below 20% HP, once per combat
  const secondWind = target.buffs.find((b) => b.stat === 'second_wind');
  if (secondWind && target.hp > 0 && target.hp < target.maxHp * 0.2) {
    const healAmt = Math.floor(target.maxHp * 0.25);
    target.hp = Math.min(target.maxHp, target.hp + healAmt);
    target.buffs = target.buffs.filter((b) => b !== secondWind);
    log.push({ type: 'heal', text: `${target.name}'s Second Wind activates! Restored ${healAmt} HP!` });
  }

  if (target.hp <= 0) {
    target.alive = false;
    log.push({ type: 'important', text: `${target.name} has fallen!` });
  }

  return log;
}

function hasSkill(char, skillId) {
  return char.skills.some((s) => s.id === skillId);
}

function chooseAction(char, party, enemies) {
  const cls = char.class;
  const aliveParty = party.filter((c) => c.alive && c.hp > 0);

  // Second Wind: activate at start of combat if not already buffed
  if (hasSkill(char, 'second_wind')) {
    const hasSecondWind = char.buffs.some((b) => b.stat === 'second_wind');
    if (!hasSecondWind && SKILLS.second_wind) {
      return { skillId: 'second_wind' };
    }
  }

  // Rally: any class can use if party is hurting (>50% of party below 40% HP)
  if (hasSkill(char, 'rally') && SKILLS.rally && char.mp >= SKILLS.rally.mpCost) {
    const hurtCount = aliveParty.filter((c) => c.hp < c.maxHp * 0.4).length;
    if (hurtCount >= Math.ceil(aliveParty.length * 0.5)) {
      return { skillId: 'rally' };
    }
  }

  switch (cls) {
    case 'healer': {
      // Mass Heal if multiple wounded allies
      if (hasSkill(char, 'mass_heal') && SKILLS.mass_heal && char.mp >= SKILLS.mass_heal.mpCost) {
        const woundedCount = aliveParty.filter((c) => c.hp < c.maxHp * 0.6).length;
        if (woundedCount >= 2) {
          return { skillId: 'mass_heal' };
        }
      }
      // Heal if any ally below 50% HP
      const wounded = aliveParty.find((c) => c.hp < c.maxHp * 0.5);
      if (wounded && char.mp >= SKILLS.heal.mpCost) {
        return { skillId: 'heal', target: wounded };
      }
      // Life Drain if HP is low and enemy exists
      if (hasSkill(char, 'life_drain') && SKILLS.life_drain && char.mp >= SKILLS.life_drain.mpCost) {
        if (char.hp < char.maxHp * 0.5) {
          const target = enemies.reduce((a, b) => (a.hp > b.hp ? a : b));
          return { skillId: 'life_drain', target };
        }
      }
      // Bless if not active
      const hasBlessing = aliveParty.some((c) => c.buffs.some((b) => b.name === 'Bless'));
      if (!hasBlessing && char.mp >= SKILLS.bless.mpCost) {
        return { skillId: 'bless' };
      }
      // Life Drain as offensive option
      if (hasSkill(char, 'life_drain') && SKILLS.life_drain && char.mp >= SKILLS.life_drain.mpCost) {
        const target = enemies.reduce((a, b) => (a.hp > b.hp ? a : b));
        return { skillId: 'life_drain', target };
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
      // Fortify if taking heavy damage and no DEF self-buff
      if (hasSkill(char, 'fortify') && SKILLS.fortify && char.mp >= SKILLS.fortify.mpCost) {
        const hasFortify = char.buffs.some((b) => b.name === 'Fortify');
        if (!hasFortify && char.hp < char.maxHp * 0.5) {
          return { skillId: 'fortify' };
        }
      }
      // Whirlwind if multiple enemies
      if (hasSkill(char, 'whirlwind') && SKILLS.whirlwind && enemies.length > 1 && char.mp >= SKILLS.whirlwind.mpCost) {
        return { skillId: 'whirlwind' };
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
      // Mana Shield if low HP and not already shielded
      if (hasSkill(char, 'mana_shield') && SKILLS.mana_shield && char.mp >= SKILLS.mana_shield.mpCost) {
        const hasShield = char.buffs.some((b) => b.stat === 'mana_shield');
        if (!hasShield && char.hp < char.maxHp * 0.4) {
          return { skillId: 'mana_shield' };
        }
      }
      // Chain Lightning if 2+ enemies
      if (hasSkill(char, 'chain_lightning') && SKILLS.chain_lightning && enemies.length >= 2 && char.mp >= SKILLS.chain_lightning.mpCost) {
        return { skillId: 'chain_lightning' };
      }
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
      // Smoke Bomb if no party dodge and enemies are dangerous
      if (hasSkill(char, 'smoke_bomb') && SKILLS.smoke_bomb && char.mp >= SKILLS.smoke_bomb.mpCost) {
        const hasSmoke = aliveParty.some((c) => c.buffs.some((b) => b.name === 'Smoke Bomb'));
        if (!hasSmoke && enemies.length >= 2) {
          return { skillId: 'smoke_bomb' };
        }
      }
      // Evasion if low HP
      if (char.hp < char.maxHp * 0.3 && char.mp >= SKILLS.evasion.mpCost) {
        const hasDodge = char.buffs.some((b) => b.stat === 'dodge');
        if (!hasDodge) {
          return { skillId: 'evasion' };
        }
      }
      // Shadow Strike for big damage on high-HP target
      if (hasSkill(char, 'shadow_strike') && SKILLS.shadow_strike && char.mp >= SKILLS.shadow_strike.mpCost) {
        const strongTarget = enemies.reduce((a, b) => (a.hp > b.hp ? a : b));
        if (strongTarget.hp > strongTarget.maxHp * 0.5) {
          return { skillId: 'shadow_strike', target: strongTarget };
        }
      }
      // Poison unpoisoned enemy
      const unpoisoned = enemies.find((e) => !e.poison || e.poison === 0);
      if (unpoisoned && char.mp >= SKILLS.poison_blade.mpCost) {
        return { skillId: 'poison_blade', target: unpoisoned };
      }
      // Shadow Strike as fallback
      if (hasSkill(char, 'shadow_strike') && SKILLS.shadow_strike && char.mp >= SKILLS.shadow_strike.mpCost) {
        const target = enemies.reduce((a, b) => (a.hp > b.hp ? a : b));
        return { skillId: 'shadow_strike', target };
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
