import { CLASSES, RACES, getEffectiveStat } from '../game/party.js';
import { SKILLS, ACHIEVEMENTS, LEARNABLE_SKILLS, getPrestigeBonus, calculatePrestigePoints, getAvailableSkills } from '../game/progression.js';
import { canEquip, getEquipDelta } from '../game/dungeon.js';
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

    // Prestige screen replaces the entire game view
    if (state.gamePhase === 'prestige') {
      const prestigeScreen = this.createPrestigeScreen(state);
      this.container.appendChild(prestigeScreen);
      return;
    }

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

    // Action bar only in safe rooms
    if (state.gamePhase === 'safeRoom') {
      const actionBar = this.createActionBar(state);
      this.container.appendChild(actionBar);
    }

    // Scroll combat log to bottom
    const logEl = this.container.querySelector('.combat-log');
    if (logEl) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  createPrestigeScreen(state) {
    const screen = document.createElement('div');
    screen.className = 'prestige-screen';

    const points = calculatePrestigePoints(state.stats.highestFloor);
    const canPrestige = state.stats.highestFloor >= 5;
    const nextBonus = getPrestigeBonus(state.prestige.level + 1);
    const currentBonus = getPrestigeBonus(state.prestige.level);

    screen.innerHTML = `
      <h1>THE LOOP ENDS</h1>
      <p class="prestige-subtitle">Your party fell on Floor ${state.dungeon.currentFloorNum}.</p>

      <div class="prestige-stats">
        <h2>Run Summary</h2>
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-label">Highest Floor</span>
            <span class="stat-value">${state.stats.highestFloor}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Floors Cleared</span>
            <span class="stat-value">${state.stats.floorsCleared}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Monsters Killed</span>
            <span class="stat-value">${state.stats.monstersKilled}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Bosses Slain</span>
            <span class="stat-value">${state.stats.bossesKilled}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Gold Earned</span>
            <span class="stat-value">${formatNumber(state.stats.totalGold)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Deaths</span>
            <span class="stat-value">${state.stats.deaths}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Highest Level</span>
            <span class="stat-value">${state.stats.highestLevel}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Achievements</span>
            <span class="stat-value">${state.achievements.length}/${ACHIEVEMENTS.length}</span>
          </div>
        </div>
      </div>

      ${state.prestige.level > 0 ? `
      <div class="prestige-current">
        <span class="label">Current Prestige Level</span>
        <span class="value">${state.prestige.level}</span>
        <span class="bonuses">+${(currentBonus.statBonus * 100).toFixed(0)}% stats | +${(currentBonus.xpBonus * 100).toFixed(0)}% XP | +${(currentBonus.goldBonus * 100).toFixed(0)}% gold</span>
      </div>
      ` : ''}

      <div class="prestige-actions">
        ${canPrestige ? `
          <div class="prestige-offer">
            <h2>Prestige Available</h2>
            <p class="prestige-points">+${points} prestige points</p>
            <p class="prestige-next">Next level: +${(nextBonus.statBonus * 100).toFixed(0)}% stats, +${(nextBonus.xpBonus * 100).toFixed(0)}% XP, +${(nextBonus.goldBonus * 100).toFixed(0)}% gold</p>
          </div>
        ` : `
          <div class="prestige-locked">
            <p>Reach floor 5 to unlock prestige bonuses.</p>
          </div>
        `}
      </div>
    `;

    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'prestige-buttons';

    if (canPrestige) {
      const prestigeBtn = document.createElement('button');
      prestigeBtn.className = 'btn-prestige';
      prestigeBtn.innerHTML = `Prestige & Start Over<span class="btn-desc">Gain permanent bonuses for the next run</span>`;
      prestigeBtn.addEventListener('click', () => {
        this.engine.performPrestige();
      });
      buttons.appendChild(prestigeBtn);
    }

    const restartBtn = document.createElement('button');
    restartBtn.className = 'btn-restart';
    restartBtn.innerHTML = `Start Over<span class="btn-desc">${canPrestige ? 'Restart without prestige bonuses' : 'Begin a new adventure'}</span>`;
    restartBtn.addEventListener('click', () => {
      this.engine.startOver();
    });
    buttons.appendChild(restartBtn);

    screen.appendChild(buttons);

    return screen;
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
    const shopCount = state.shop ? state.shop.length : 0;
    container.innerHTML = `
      <p>The party rests in a safe room. A merchant has set up shop here.</p>
      <div class="safe-room-actions">
        <button id="btn-shop">
          Visit Shop
          <span class="btn-desc">Browse ${shopCount} items for sale</span>
        </button>
        <button id="btn-manage-inventory">
          Manage Equipment
          <span class="btn-desc">Equip items from inventory (${state.inventory.items.length} items)</span>
        </button>
        <button id="btn-train-skills">
          Train Skills
          <span class="btn-desc">Spend skill points to upgrade or learn skills</span>
        </button>
        <button id="btn-continue">
          Continue Deeper
          <span class="btn-desc">Venture to the next floor</span>
        </button>
      </div>
    `;

    // Defer event binding
    setTimeout(() => {
      const btnCont = document.getElementById('btn-continue');
      const btnShop = document.getElementById('btn-shop');
      const btnInv = document.getElementById('btn-manage-inventory');
      const btnTrain = document.getElementById('btn-train-skills');

      if (btnCont) btnCont.addEventListener('click', () => this.engine.continueExploring());
      if (btnShop) btnShop.addEventListener('click', () => this.showShopModal(this.engine.state));
      if (btnInv) btnInv.addEventListener('click', () => this.showInventoryModal(this.engine.state));
      if (btnTrain) btnTrain.addEventListener('click', () => this.showTrainSkillsModal(this.engine.state));
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

  formatItemStats(item) {
    const parts = [];
    if (item.atk) parts.push(`ATK ${item.atk > 0 ? '+' : ''}${item.atk}`);
    if (item.def) parts.push(`DEF ${item.def > 0 ? '+' : ''}${item.def}`);
    if (item.spd) parts.push(`SPD ${item.spd > 0 ? '+' : ''}${item.spd}`);
    if (item.mag) parts.push(`MAG ${item.mag > 0 ? '+' : ''}${item.mag}`);
    return parts.join('  ');
  }

  formatDelta(delta) {
    const parts = [];
    for (const stat of ['atk', 'def', 'spd', 'mag']) {
      if (delta[stat] !== 0) {
        const cls = delta[stat] > 0 ? 'stat-up' : 'stat-down';
        const sign = delta[stat] > 0 ? '+' : '';
        parts.push(`<span class="${cls}">${stat.toUpperCase()} ${sign}${delta[stat]}</span>`);
      }
    }
    return parts.length > 0 ? parts.join(' ') : '<span class="stat-neutral">no change</span>';
  }

  createItemCharRow(char, item, actionLabel, onAction) {
    const row = document.createElement('div');
    row.className = 'item-char-row';

    const eligible = canEquip(char, item);
    const hasSlot = !char.equipment[item.slot];
    const delta = getEquipDelta(char, item);
    const firstName = char.name.split(' ')[0];

    if (!eligible) {
      const reason = [];
      if (item.classReq && !item.classReq.includes(char.class)) reason.push(CLASSES[char.class].name);
      if (item.levelReq && char.level < item.levelReq) reason.push(`Lv.${item.levelReq}`);
      row.innerHTML = `
        <span class="char-label">${firstName}</span>
        <span class="equip-blocked">Can't use${reason.length ? ' (' + reason.join(', ') + ')' : ''}</span>
      `;
      row.classList.add('ineligible');
      return row;
    }

    const slotLabel = hasSlot ? 'empty slot' : char.equipment[item.slot].name;
    row.innerHTML = `
      <span class="char-label">${firstName}</span>
      <span class="slot-info">${hasSlot ? '<em>empty slot</em>' : slotLabel}</span>
      <span class="delta-info">${this.formatDelta(delta)}</span>
    `;

    if (onAction) {
      const btn = document.createElement('button');
      btn.textContent = actionLabel;
      btn.className = 'btn-small';
      btn.addEventListener('click', () => onAction());
      row.appendChild(btn);
    }

    return row;
  }

  showShopModal(state) {
    this.showModal('Shop', (content) => {
      const goldDiv = document.createElement('div');
      goldDiv.className = 'shop-gold';
      goldDiv.innerHTML = `Gold: <span class="value">${formatNumber(state.inventory.gold)}</span>`;
      content.appendChild(goldDiv);

      const shop = state.shop || [];
      if (shop.length === 0) {
        content.innerHTML += '<p style="color:var(--text-dim)">The merchant has nothing left to sell.</p>';
        return;
      }

      for (const item of shop) {
        const card = document.createElement('div');
        card.className = 'shop-item-card';

        const affordable = state.inventory.gold >= item.price;

        // Item header
        const header = document.createElement('div');
        header.className = 'shop-item-header';
        header.innerHTML = `
          <div>
            <span class="item-name item-tier-${item.tier}">${item.name}</span>
            <span class="item-slot-label">${item.slot}</span>
          </div>
          <span class="item-price${affordable ? '' : ' too-expensive'}">${item.price}g</span>
        `;
        card.appendChild(header);

        // Item stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'item-stats-line';
        statsDiv.textContent = this.formatItemStats(item);
        card.appendChild(statsDiv);

        // Requirements line
        const reqs = [];
        if (item.classReq) reqs.push(item.classReq.map((c) => CLASSES[c].name).join('/'));
        if (item.levelReq) reqs.push(`Lv.${item.levelReq}+`);
        if (reqs.length) {
          const reqDiv = document.createElement('div');
          reqDiv.className = 'item-req-line';
          reqDiv.textContent = `Requires: ${reqs.join(', ')}`;
          card.appendChild(reqDiv);
        }

        // Per-character breakdown
        const charRows = document.createElement('div');
        charRows.className = 'item-char-rows';
        for (const char of state.party) {
          const row = this.createItemCharRow(char, item, null, null);
          charRows.appendChild(row);
        }
        card.appendChild(charRows);

        // Buy button
        const buyBtn = document.createElement('button');
        buyBtn.className = 'btn-buy';
        buyBtn.textContent = affordable ? `Buy (${item.price}g)` : 'Not enough gold';
        buyBtn.disabled = !affordable;
        buyBtn.addEventListener('click', () => {
          this.engine.buyItem(item);
          this.closeModal();
          this.showShopModal(this.engine.state);
        });
        card.appendChild(buyBtn);

        content.appendChild(card);
      }
    });
  }

  showInventoryModal(state) {
    this.showModal('Inventory', (content) => {
      // Show equipped items first
      const section = document.createElement('div');
      section.className = 'modal-section';
      section.innerHTML = '<h3>Currently Equipped</h3>';

      for (const char of state.party) {
        const charDiv = document.createElement('div');
        charDiv.style.marginBottom = '12px';
        charDiv.innerHTML = `<strong>${char.name}</strong> <span style="color:var(--text-dim);font-size:0.7rem">${CLASSES[char.class].name} Lv.${char.level}</span>`;

        for (const slot of ['weapon', 'armor', 'accessory']) {
          const item = char.equipment[slot];
          const slotDiv = document.createElement('div');
          slotDiv.className = 'equip-slot';
          if (item) {
            slotDiv.innerHTML = `
              <span class="slot-name">${slot}</span>
              <span class="slot-item">${item.name}</span>
              <span class="item-stats" style="font-size:0.65rem">${this.formatItemStats(item)}</span>
            `;
          } else {
            slotDiv.innerHTML = `
              <span class="slot-name">${slot}</span>
              <span class="slot-empty">empty</span>
            `;
          }
          charDiv.appendChild(slotDiv);
        }
        section.appendChild(charDiv);
      }
      content.appendChild(section);

      // Unequipped items
      const itemSection = document.createElement('div');
      itemSection.className = 'modal-section';
      itemSection.innerHTML = `<h3>Backpack (${state.inventory.items.length} items)</h3>`;

      if (state.inventory.items.length === 0) {
        itemSection.innerHTML += '<p style="color:var(--text-dim)">No items. Keep exploring!</p>';
      }

      for (const item of state.inventory.items) {
        const card = document.createElement('div');
        card.className = 'inv-item-card';

        // Item header
        const header = document.createElement('div');
        header.className = 'shop-item-header';
        header.innerHTML = `
          <div>
            <span class="item-name item-tier-${item.tier}">${item.name}</span>
            <span class="item-slot-label">${item.slot}</span>
          </div>
        `;
        card.appendChild(header);

        // Item stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'item-stats-line';
        statsDiv.textContent = this.formatItemStats(item);
        card.appendChild(statsDiv);

        // Requirements line
        const reqs = [];
        if (item.classReq) reqs.push(item.classReq.map((c) => CLASSES[c].name).join('/'));
        if (item.levelReq) reqs.push(`Lv.${item.levelReq}+`);
        if (reqs.length) {
          const reqDiv = document.createElement('div');
          reqDiv.className = 'item-req-line';
          reqDiv.textContent = `Requires: ${reqs.join(', ')}`;
          card.appendChild(reqDiv);
        }

        // Per-character equip options
        const charRows = document.createElement('div');
        charRows.className = 'item-char-rows';
        for (const char of state.party) {
          const row = this.createItemCharRow(char, item, 'Equip', () => {
            this.engine.equipItemOnCharacter(char.id, item);
            this.closeModal();
            this.showInventoryModal(this.engine.state);
          });
          charRows.appendChild(row);
        }
        card.appendChild(charRows);

        content.appendChild(card);
      }

      content.appendChild(itemSection);
    });
  }

  showSkillsModal(state) {
    this.showTrainSkillsModal(state);
  }

  showTrainSkillsModal(state) {
    this.showModal('Train Skills', (content) => {
      for (const char of state.party) {
        const section = document.createElement('div');
        section.className = 'modal-section';
        section.innerHTML = `
          <h3>${char.name} - ${CLASSES[char.class].name}</h3>
          <div class="skill-points-display">Skill Points: <span class="value">${char.skillPoints}</span></div>
        `;

        // Current skills with upgrade buttons
        const knownHeader = document.createElement('div');
        knownHeader.className = 'train-subheader';
        knownHeader.textContent = 'Known Skills';
        section.appendChild(knownHeader);

        for (const charSkill of char.skills) {
          const skillDef = SKILLS[charSkill.id];
          if (!skillDef) continue;

          const row = document.createElement('div');
          row.className = 'skill-row train-row';

          const maxLevel = 5;
          const upgradeCost = charSkill.level;
          const canUpgrade = charSkill.level < maxLevel && char.skillPoints >= upgradeCost;
          const atMax = charSkill.level >= maxLevel;

          row.innerHTML = `
            <div class="skill-info">
              <span class="skill-name">${skillDef.name}</span>
              <span class="skill-level">Lv.${charSkill.level}${atMax ? ' (MAX)' : ''}</span>
              <div class="skill-desc">${skillDef.description}</div>
              <div class="skill-usage">${charSkill.uses} uses | MP: ${skillDef.mpCost}</div>
            </div>
          `;

          if (!atMax) {
            const upgradeBtn = document.createElement('button');
            upgradeBtn.className = 'btn-small btn-upgrade';
            upgradeBtn.textContent = `Upgrade (${upgradeCost} SP)`;
            upgradeBtn.disabled = !canUpgrade;
            if (!canUpgrade && !atMax) {
              upgradeBtn.title = `Need ${upgradeCost} SP`;
            }
            upgradeBtn.addEventListener('click', () => {
              this.engine.upgradeCharacterSkill(char.id, charSkill.id);
              this.closeModal();
              this.showTrainSkillsModal(this.engine.state);
            });
            row.appendChild(upgradeBtn);
          }

          section.appendChild(row);
        }

        // Available new skills to learn
        const available = getAvailableSkills(char, state.achievements);
        const unlearnedSkills = available.filter((s) => !s.alreadyKnown);

        if (unlearnedSkills.length > 0) {
          const learnHeader = document.createElement('div');
          learnHeader.className = 'train-subheader';
          learnHeader.textContent = 'Learn New Skills';
          section.appendChild(learnHeader);

          for (const ls of unlearnedSkills) {
            const row = document.createElement('div');
            row.className = `skill-row train-row${ls.locked ? ' skill-locked' : ''}`;

            const canLearn = !ls.locked && char.skillPoints >= ls.cost;

            row.innerHTML = `
              <div class="skill-info">
                <span class="skill-name">${ls.locked ? '???' : ls.name}</span>
                <div class="skill-desc">${ls.description}</div>
                ${ls.locked ? `<div class="skill-lock-reason">Locked - Requires achievement: ${ls.lockReason}</div>` : ''}
              </div>
            `;

            if (!ls.locked) {
              const learnBtn = document.createElement('button');
              learnBtn.className = 'btn-small btn-learn';
              learnBtn.textContent = `Learn (${ls.cost} SP)`;
              learnBtn.disabled = !canLearn;
              if (!canLearn) {
                learnBtn.title = `Need ${ls.cost} SP`;
              }
              learnBtn.addEventListener('click', () => {
                this.engine.learnCharacterSkill(char.id, ls.skillId);
                this.closeModal();
                this.showTrainSkillsModal(this.engine.state);
              });
              row.appendChild(learnBtn);
            }

            section.appendChild(row);
          }
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
