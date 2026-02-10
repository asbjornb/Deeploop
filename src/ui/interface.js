import { CLASSES, RACES, getEffectiveStat } from '../game/party.js';
import { SKILLS, ACHIEVEMENTS, getPrestigeBonus, calculatePrestigePoints } from '../game/progression.js';
import { formatNumber } from '../utils/math.js';
import { hasSave } from '../utils/save.js';

export class GameUI {
  constructor(container, engine) {
    this.container = container;
    this.engine = engine;
    this.currentModal = null;
  }

  renderStartScreen() {
    const hasExistingSave = hasSave();
    this.container.innerHTML = `
      <div class="start-screen">
        <h1>DEEPLOOP</h1>
        <p class="tagline">A minimalist incremental RPG adventure</p>
        <p class="tagline">Build a party. Explore the depths. Die. Repeat.</p>
        <div class="menu-buttons">
          <button id="btn-new-game">New Game</button>
          <button id="btn-load-game" ${hasExistingSave ? '' : 'disabled'}>
            Continue${hasExistingSave ? '' : ' (no save found)'}
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-new-game').addEventListener('click', () => {
      this.engine.newGame();
    });

    if (hasExistingSave) {
      this.container.querySelector('#btn-load-game').addEventListener('click', () => {
        this.engine.loadGame();
      });
    }
  }

  render(state) {
    if (!state) {
      this.renderStartScreen();
      return;
    }

    this.container.innerHTML = '';

    // Header
    const header = this.createHeader(state);
    this.container.appendChild(header);

    // Main area
    const main = document.createElement('div');
    main.className = 'main-area';

    const dungeonPanel = this.createDungeonPanel(state);
    const partyPanel = this.createPartyPanel(state);

    main.appendChild(dungeonPanel);
    main.appendChild(partyPanel);
    this.container.appendChild(main);

    // Action bar
    const actionBar = this.createActionBar(state);
    this.container.appendChild(actionBar);

    // Scroll combat log to bottom
    const logEl = this.container.querySelector('.combat-log');
    if (logEl) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  createHeader(state) {
    const header = document.createElement('div');
    header.className = 'header';

    const floorNum = state.dungeon.currentFloorNum;
    const phase = state.gamePhase;
    const phaseText =
      phase === 'combat'
        ? 'In Combat'
        : phase === 'safeRoom'
          ? 'Safe Room'
          : phase === 'defeated'
            ? 'Defeated'
            : 'Exploring';

    header.innerHTML = `
      <h1>DEEPLOOP</h1>
      <div class="header-info">
        <span>Floor <span class="value">${floorNum}</span></span>
        <span>Gold <span class="value">${formatNumber(state.inventory.gold)}</span></span>
        <span>Status: <span class="value">${phaseText}</span></span>
        ${state.prestige.level > 0 ? `<span>Prestige <span class="value">${state.prestige.level}</span></span>` : ''}
      </div>
    `;
    return header;
  }

  createDungeonPanel(state) {
    const panel = document.createElement('div');
    panel.className = 'dungeon-panel';

    // Dungeon view
    const view = document.createElement('div');
    view.className = 'dungeon-view';

    const floor = state.dungeon.floor;
    const room = floor.rooms[floor.currentRoom];

    // Floor progress dots
    const progress = document.createElement('div');
    progress.className = 'floor-progress';
    for (let i = 0; i < floor.rooms.length; i++) {
      const dot = document.createElement('div');
      const r = floor.rooms[i];
      dot.className = `room-dot ${r.type}${i === floor.currentRoom ? ' current' : ''}${r.explored ? ' explored' : ''}`;
      dot.title = `Room ${i + 1}: ${r.type}`;
      progress.appendChild(dot);
    }
    view.appendChild(progress);

    // Room title
    const title = document.createElement('div');
    title.className = 'room-title';
    title.textContent = this.getRoomTitle(room, state);
    view.appendChild(title);

    // Room description
    const desc = document.createElement('div');
    desc.className = 'room-description';
    desc.textContent = floor.description;
    view.appendChild(desc);

    // Room content
    const content = document.createElement('div');
    content.className = 'room-content';

    if (state.gamePhase === 'combat' && room.enemies) {
      content.appendChild(this.createEnemyList(room.enemies));
    } else if (state.gamePhase === 'safeRoom') {
      content.appendChild(this.createSafeRoomContent(state));
    } else if (state.gamePhase === 'defeated') {
      content.innerHTML = `
        <div class="defeat-message">
          Your party has fallen.
          <div class="sub">But the dungeon remains. Try again?</div>
        </div>
      `;
    } else if (room.type === 'treasure' && room.collected) {
      content.innerHTML = `<p>An empty treasure chest sits here.</p>`;
    } else if (room.type === 'event' && room.resolved) {
      content.innerHTML = `<p>The room is quiet now.</p>`;
    }

    view.appendChild(content);
    panel.appendChild(view);

    // Combat log
    const logContainer = document.createElement('div');
    logContainer.className = 'combat-log';
    const recentLogs = state.log.slice(-50);
    for (const entry of recentLogs) {
      const line = document.createElement('div');
      line.className = `log-entry ${entry.type}`;
      line.textContent = `> ${entry.text}`;
      logContainer.appendChild(line);
    }
    panel.appendChild(logContainer);

    return panel;
  }

  getRoomTitle(room, state) {
    if (state.gamePhase === 'defeated') return 'Defeat';
    if (state.gamePhase === 'safeRoom') return 'Safe Room';

    switch (room.type) {
      case 'combat':
        return room.defeated ? 'Cleared Room' : 'Combat!';
      case 'boss':
        return room.defeated ? 'Boss Defeated!' : 'BOSS FIGHT!';
      case 'treasure':
        return 'Treasure Room';
      case 'event':
        return 'Strange Discovery';
      case 'rest':
        return 'Rest Point';
      case 'safe':
        return 'Safe Room';
      default:
        return 'Dungeon';
    }
  }

  createEnemyList(enemies) {
    const list = document.createElement('div');
    list.className = 'enemy-list';
    for (const enemy of enemies) {
      const card = document.createElement('div');
      card.className = `enemy-card${enemy.hp <= 0 ? ' dead' : ''}`;
      card.innerHTML = `
        <div>
          <span class="enemy-name">${enemy.name}</span>
          ${enemy.isBoss ? ' [BOSS]' : ''}
          ${enemy.poison ? ' [poisoned]' : ''}
          ${enemy.stunned ? ' [stunned]' : ''}
        </div>
        <div class="enemy-hp">HP: ${Math.max(0, enemy.hp)}/${enemy.maxHp}</div>
      `;
      list.appendChild(card);
    }
    return list;
  }

  createSafeRoomContent(state) {
    const container = document.createElement('div');
    container.innerHTML = `
      <p>The party rests in a safe room. What would you like to do?</p>
      <div class="safe-room-actions">
        <button id="btn-continue">
          Continue Deeper
          <span class="btn-desc">Venture to the next floor</span>
        </button>
        <button id="btn-manage-inventory">
          Manage Equipment
          <span class="btn-desc">Equip items from inventory (${state.inventory.items.length} items)</span>
        </button>
        <button id="btn-view-skills">
          View Skills
          <span class="btn-desc">Check party skills and progression</span>
        </button>
      </div>
    `;

    // Defer event binding
    setTimeout(() => {
      const btnCont = document.getElementById('btn-continue');
      const btnInv = document.getElementById('btn-manage-inventory');
      const btnSkills = document.getElementById('btn-view-skills');

      if (btnCont) btnCont.addEventListener('click', () => this.engine.continueExploring());
      if (btnInv) btnInv.addEventListener('click', () => this.showInventoryModal(state));
      if (btnSkills) btnSkills.addEventListener('click', () => this.showSkillsModal(state));
    }, 0);

    return container;
  }

  createPartyPanel(state) {
    const panel = document.createElement('div');
    panel.className = 'party-panel';

    for (const char of state.party) {
      const card = document.createElement('div');
      card.className = `char-card${!char.alive || char.hp <= 0 ? ' dead' : ''}`;

      const hpPct = char.maxHp > 0 ? Math.max(0, (char.hp / char.maxHp) * 100) : 0;
      const mpPct = char.maxMp > 0 ? Math.max(0, (char.mp / char.maxMp) * 100) : 0;
      const xpPct = char.level > 0 ? (char.xp / (xpForLevelSafe(char.level))) * 100 : 0;

      card.innerHTML = `
        <div class="char-name">${char.name}</div>
        <div class="char-class">Lv.${char.level} ${RACES[char.race].name} ${CLASSES[char.class].name}</div>
        <div class="stat-bar hp">
          <div class="bar-fill" style="width:${hpPct}%"></div>
          <div class="bar-label">HP ${Math.max(0, char.hp)}/${char.maxHp}</div>
        </div>
        <div class="stat-bar mp">
          <div class="bar-fill" style="width:${mpPct}%"></div>
          <div class="bar-label">MP ${Math.max(0, char.mp)}/${char.maxMp}</div>
        </div>
        <div class="stat-bar xp">
          <div class="bar-fill" style="width:${Math.min(100, xpPct)}%"></div>
        </div>
        <div class="char-stats">
          <span>ATK ${getEffectiveStat(char, 'atk')}</span>
          <span>DEF ${getEffectiveStat(char, 'def')}</span>
          <span>SPD ${getEffectiveStat(char, 'spd')}</span>
          <span>MAG ${getEffectiveStat(char, 'mag')}</span>
        </div>
      `;
      panel.appendChild(card);
    }

    return panel;
  }

  createActionBar(state) {
    const bar = document.createElement('div');
    bar.className = 'action-bar';

    if (state.gamePhase === 'defeated') {
      const btnRetry = document.createElement('button');
      btnRetry.textContent = 'Try Again';
      btnRetry.addEventListener('click', () => this.engine.retryAfterDefeat());
      bar.appendChild(btnRetry);
    }

    // Inventory
    const btnInv = document.createElement('button');
    btnInv.textContent = `Inventory (${state.inventory.items.length})`;
    btnInv.addEventListener('click', () => this.showInventoryModal(state));
    bar.appendChild(btnInv);

    // Achievements
    const btnAch = document.createElement('button');
    btnAch.textContent = `Achievements (${state.achievements.length}/${ACHIEVEMENTS.length})`;
    btnAch.addEventListener('click', () => this.showAchievementsModal(state));
    bar.appendChild(btnAch);

    // Prestige
    const btnPres = document.createElement('button');
    const prestigePts = calculatePrestigePoints(state.stats.highestFloor);
    btnPres.textContent = `Prestige (${prestigePts} pts)`;
    btnPres.disabled = state.stats.highestFloor < 5;
    btnPres.addEventListener('click', () => this.showPrestigeModal(state));
    bar.appendChild(btnPres);

    // Save
    const btnSave = document.createElement('button');
    btnSave.textContent = 'Save';
    btnSave.addEventListener('click', () => {
      this.engine.saveGame();
      btnSave.textContent = 'Saved!';
      setTimeout(() => {
        btnSave.textContent = 'Save';
      }, 1000);
    });
    bar.appendChild(btnSave);

    return bar;
  }

  // Modals

  showModal(title, contentFn) {
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });

    const modal = document.createElement('div');
    modal.className = 'modal';

    const header = document.createElement('h2');
    header.textContent = title;
    modal.appendChild(header);

    const content = document.createElement('div');
    contentFn(content);
    modal.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.marginTop = '16px';
    closeBtn.addEventListener('click', () => this.closeModal());
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.currentModal = overlay;
  }

  closeModal() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  showInventoryModal(state) {
    this.showModal('Inventory', (content) => {
      if (state.inventory.items.length === 0) {
        content.innerHTML = '<p style="color:var(--text-dim)">No items. Keep exploring!</p>';
        return;
      }

      for (const item of state.inventory.items) {
        const card = document.createElement('div');
        card.className = 'item-card';

        const statsArr = [];
        if (item.atk) statsArr.push(`ATK +${item.atk}`);
        if (item.def) statsArr.push(`DEF +${item.def}`);
        if (item.spd) statsArr.push(`SPD +${item.spd}`);
        if (item.mag) statsArr.push(`MAG +${item.mag}`);

        card.innerHTML = `
          <div>
            <span class="item-name item-tier-${item.tier}">${item.name}</span>
            <span class="item-stats">${statsArr.join(' ')}</span>
          </div>
          <div>${item.slot}</div>
        `;

        // Equip buttons per character
        const btnContainer = document.createElement('div');
        for (const char of state.party) {
          const btn = document.createElement('button');
          btn.textContent = char.name.split(' ')[0];
          btn.style.fontSize = '0.7rem';
          btn.style.padding = '2px 6px';
          btn.addEventListener('click', () => {
            this.engine.equipItemOnCharacter(char.id, item);
            this.closeModal();
            this.showInventoryModal(this.engine.state);
          });
          btnContainer.appendChild(btn);
        }
        card.appendChild(btnContainer);
        content.appendChild(card);
      }

      // Show equipped items
      const section = document.createElement('div');
      section.className = 'modal-section';
      section.innerHTML = '<h3>Currently Equipped</h3>';

      for (const char of state.party) {
        const charDiv = document.createElement('div');
        charDiv.style.marginBottom = '12px';
        charDiv.innerHTML = `<strong>${char.name}</strong>`;

        for (const slot of ['weapon', 'armor', 'accessory']) {
          const item = char.equipment[slot];
          const slotDiv = document.createElement('div');
          slotDiv.className = 'equip-slot';
          slotDiv.innerHTML = `
            <span class="slot-name">${slot}</span>
            ${item ? `<span class="slot-item">${item.name}</span>` : '<span class="slot-empty">empty</span>'}
          `;
          charDiv.appendChild(slotDiv);
        }
        section.appendChild(charDiv);
      }
      content.appendChild(section);
    });
  }

  showSkillsModal(state) {
    this.showModal('Party Skills', (content) => {
      for (const char of state.party) {
        const section = document.createElement('div');
        section.className = 'modal-section';
        section.innerHTML = `<h3>${char.name} - ${CLASSES[char.class].name}</h3>`;

        for (const charSkill of char.skills) {
          const skillDef = SKILLS[charSkill.id];
          if (!skillDef) continue;

          const row = document.createElement('div');
          row.className = 'skill-row';
          row.innerHTML = `
            <span class="skill-name">${skillDef.name}</span>
            <span class="skill-level">Lv.${charSkill.level} (${charSkill.uses} uses)</span>
          `;
          section.appendChild(row);

          const desc = document.createElement('div');
          desc.style.cssText = 'font-size:0.7rem;color:var(--text-dim);margin-bottom:4px;';
          desc.textContent = skillDef.description;
          section.appendChild(desc);
        }

        content.appendChild(section);
      }
    });
  }

  showAchievementsModal(state) {
    this.showModal('Achievements', (content) => {
      for (const ach of ACHIEVEMENTS) {
        const unlocked = state.achievements.includes(ach.id);
        const div = document.createElement('div');
        div.className = `achievement${unlocked ? ' unlocked' : ''}`;
        div.innerHTML = `
          <span class="ach-name">${unlocked ? ach.name : '???'}</span>
          <div class="ach-desc">${unlocked ? ach.description : 'Not yet discovered.'}</div>
          ${unlocked ? `<div class="ach-desc" style="color:var(--accent-gold)">${ach.reward}</div>` : ''}
        `;
        content.appendChild(div);
      }
    });
  }

  showPrestigeModal(state) {
    const points = calculatePrestigePoints(state.stats.highestFloor);
    const nextBonus = getPrestigeBonus(state.prestige.level + 1);

    this.showModal('Prestige', (content) => {
      content.innerHTML = `
        <div class="prestige-info">
          <div class="prestige-level">Prestige Level: ${state.prestige.level}</div>
          <div class="prestige-bonus">Total Points: ${state.prestige.totalPoints}</div>
          <p style="margin:16px 0;color:var(--text-secondary)">
            Prestige resets your party, floor, gold, and items.<br>
            In return, you gain permanent stat bonuses.
          </p>
          <p style="color:var(--accent-gold)">
            Points earned: ${points}<br>
            Next level bonuses: +${(nextBonus.statBonus * 100).toFixed(0)}% stats,
            +${(nextBonus.xpBonus * 100).toFixed(0)}% XP,
            +${(nextBonus.goldBonus * 100).toFixed(0)}% gold
          </p>
          <p style="margin-top:8px;font-size:0.75rem;color:var(--text-dim)">
            Highest floor: ${state.stats.highestFloor} |
            Monsters killed: ${state.stats.monstersKilled} |
            Deaths: ${state.stats.deaths}
          </p>
        </div>
      `;

      if (state.stats.highestFloor >= 5) {
        const btn = document.createElement('button');
        btn.className = 'danger';
        btn.textContent = 'Prestige Now';
        btn.addEventListener('click', () => {
          this.closeModal();
          this.engine.performPrestige();
        });
        content.appendChild(btn);
      } else {
        const note = document.createElement('p');
        note.style.cssText = 'color:var(--text-dim);font-size:0.8rem;margin-top:8px;';
        note.textContent = 'Reach floor 5 to unlock prestige.';
        content.appendChild(note);
      }
    });
  }
}

function xpForLevelSafe(level) {
  return Math.floor(50 * Math.pow(level, 1.8));
}
