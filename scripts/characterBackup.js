import { API_BASE_URL } from "./helper.js";

let parentContainer = null;

const injectCharacterBackupStyles = () => {
  if (document.getElementById("character-backup-styles")) return;
  const style = document.createElement("style");
  style.id = "character-backup-styles";
  style.innerHTML = `
    .cb-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      color: #f4f4f5;
      padding: 15px 20px;
      overflow-y: auto;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      box-sizing: border-box;
    }
    .cb-container::-webkit-scrollbar {
      width: 6px;
    }
    .cb-container::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 10px;
    }
    .cb-world-card {
      background: rgba(24, 24, 27, 0.4);
      border: 1px solid #3f3f46;
      border-radius: 8px;
      margin-bottom: 15px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      transition: border-color 0.2s;
    }
    .cb-world-card:hover {
      border-color: #52525b;
    }
    .cb-world-header {
      background: rgba(39, 39, 42, 0.7);
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid #3f3f46;
      transition: background-color 0.2s;
    }
    .cb-world-header:hover {
      background: rgba(63, 63, 70, 0.8);
    }
    .cb-world-title {
      font-weight: 700;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: 0.5px;
    }
    .cb-world-badge {
      font-size: 9px;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cb-world-badge.active {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
      animation: cb-pulse 2s infinite;
    }
    .cb-world-badge.cached {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
    }
    .cb-card-content {
      padding: 15px;
    }
    .cb-section-title {
      font-size: 11px;
      font-weight: 700;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .cb-actors-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .cb-actor-card {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
    }
    .cb-actor-card:hover {
      border-color: #52525b;
      background: rgba(0, 0, 0, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .cb-actor-img {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      object-fit: cover;
      border: 1px solid #3f3f46;
      background: #18181b;
      flex-shrink: 0;
    }
    .cb-actor-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .cb-actor-name {
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #f4f4f5;
      margin-bottom: 2px;
    }
    .cb-actor-type {
      font-size: 10px;
      color: #a1a1aa;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .cb-btn-action {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      flex-shrink: 0;
    }
    .cb-btn-action:hover {
      background: #3b82f6;
      color: #ffffff;
      border-color: #3b82f6;
    }
    .cb-toggle-icon {
      color: #a1a1aa;
      font-size: 12px;
      transition: transform 0.2s;
    }
    .cb-empty-state {
      text-align: center;
      color: #71717a;
      width: 100%;
      padding: 20px;
      font-size: 13px;
      font-style: italic;
    }
    @keyframes cb-pulse {
      0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
      100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
    }
  `;
  document.head.appendChild(style);
};

function saveCurrentWorldState() {
  try {
    const worldId = game.world.id;
    const worldTitle = game.world.title;
    const actors = game.actors.contents
      .filter(a => a.type === "character" || a.type === "pc" || a.type === "npc")
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img || "icons/svg/mystery-man.svg",
        type: a.type
      }));

    let backups = {};
    try {
      const stored = localStorage.getItem("heraldSilane_worldBackups");
      if (stored) backups = JSON.parse(stored);
    } catch (e) {}

    backups[worldId] = {
      id: worldId,
      title: worldTitle,
      lastUpdated: new Date().toISOString(),
      actors: actors
    };

    localStorage.setItem("heraldSilane_worldBackups", JSON.stringify(backups));
    return backups;
  } catch (e) {
    console.error("Failed to save current world state:", e);
    return {};
  }
}

export async function initCharacterBackupTab(container) {
  parentContainer = container;
  injectCharacterBackupStyles();

  parentContainer.innerHTML = `<div style="display:flex; justify-content:center; padding:40px; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  const backups = saveCurrentWorldState();
  const activeWorldId = game.world.id;

  // Separate active world from other cached worlds
  const activeWorldData = backups[activeWorldId] || {
    id: activeWorldId,
    title: game.world.title,
    actors: []
  };

  const otherWorlds = Object.values(backups).filter(w => w.id !== activeWorldId);

  // Generate actors HTML helper
  const getActorsHtml = (actors, worldId, worldTitle) => {
    // Filter to ensure only character/pc/npc type is shown
    const filteredActors = actors.filter(actor => actor.type === "character" || actor.type === "pc" || actor.type === "npc");

    if (filteredActors.length === 0) {
      return `<div class="cb-empty-state"><i class="fa-solid fa-user-slash" style="margin-right: 6px;"></i>No characters or NPCs found.</div>`;
    }
    
    const isActive = worldId === activeWorldId;
    return filteredActors.map(actor => `
      <div class="cb-actor-card">
        <img class="cb-actor-img" src="${actor.img}" onerror="this.src='icons/svg/mystery-man.svg'" />
        <div class="cb-actor-info">
          <div class="cb-actor-name" title="${actor.name}">${actor.name}</div>
          <div class="cb-actor-type">${actor.type}</div>
        </div>
        ${isActive ? `
          <button class="cb-btn-action cb-btn-backup-now" data-actor-id="${actor.id}" data-actor-name="${actor.name}" data-world-id="${worldId}" data-world-title="${worldTitle}" title="Backup to Cloud">
            <i class="fa-solid fa-cloud-arrow-up"></i>
          </button>
        ` : ""}
      </div>
    `).join("");
  };

  let html = `
    <div class="cb-container">
      <!-- ACTIVE WORLD -->
      <div class="cb-world-card" data-world-id="${activeWorldData.id}">
        <div class="cb-world-header" data-world-id="${activeWorldData.id}">
          <div class="cb-world-title">
            <i class="fa-solid fa-earth-asia" style="color: #10b981;"></i>
            <span>${activeWorldData.title}</span>
            <span class="cb-world-badge active">Active</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 12px; color: #a1a1aa;">${activeWorldData.actors.filter(a => a.type === "character" || a.type === "pc" || a.type === "npc").length} Characters & NPCs</span>
            <i class="fa-solid fa-chevron-up cb-toggle-icon"></i>
          </div>
        </div>
        <div class="cb-card-content" data-world-id="${activeWorldData.id}" style="display: block;">
          <div class="cb-section-title">Active World Characters & NPCs</div>
          <div class="cb-actors-list">
            ${getActorsHtml(activeWorldData.actors, activeWorldData.id, activeWorldData.title)}
          </div>
        </div>
      </div>
  `;

  // OTHER CACHED WORLDS
  if (otherWorlds.length > 0) {
    otherWorlds.forEach(world => {
      const filteredActorsCount = world.actors.filter(a => a.type === "character" || a.type === "pc" || a.type === "npc").length;
      html += `
        <div class="cb-world-card" data-world-id="${world.id}">
          <div class="cb-world-header" data-world-id="${world.id}">
            <div class="cb-world-title">
              <i class="fa-solid fa-globe" style="color: #60a5fa;"></i>
              <span>${world.title}</span>
              <span class="cb-world-badge cached">Cached</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 12px; color: #a1a1aa;">${filteredActorsCount} Characters & NPCs</span>
              <i class="fa-solid fa-chevron-down cb-toggle-icon"></i>
            </div>
          </div>
          <div class="cb-card-content" data-world-id="${world.id}" style="display: none;">
            <div class="cb-section-title">Cached Characters & NPCs</div>
            <div class="cb-actors-list">
              ${getActorsHtml(world.actors, world.id, world.title)}
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  parentContainer.innerHTML = html;

  attachToggleAndBackupEvents();
}

function attachToggleAndBackupEvents() {
  const containerEl = parentContainer.querySelector(".cb-container");
  if (!containerEl) return;

  // Header toggling (accordion)
  containerEl.addEventListener("click", (e) => {
    const header = e.target.closest(".cb-world-header");
    if (header) {
      const worldId = header.dataset.worldId;
      const content = containerEl.querySelector(`.cb-card-content[data-world-id="${worldId}"]`);
      const icon = header.querySelector(".cb-toggle-icon");

      if (content) {
        if (content.style.display === "none") {
          content.style.display = "block";
          icon.className = "fa-solid fa-chevron-up cb-toggle-icon";
        } else {
          content.style.display = "none";
          icon.className = "fa-solid fa-chevron-down cb-toggle-icon";
        }
      }
      return;
    }

    // Backup to cloud trigger
    const backupBtn = e.target.closest(".cb-btn-backup-now");
    if (backupBtn) {
      const actorId = backupBtn.dataset.actorId;
      const actorName = backupBtn.dataset.actorName;
      const worldId = backupBtn.dataset.worldId;
      const worldTitle = backupBtn.dataset.worldTitle;
      backupCharacter(actorId, actorName, worldId, worldTitle, backupBtn);
      return;
    }
  });
}

async function backupCharacter(actorId, name, worldId, worldTitle, btn) {
  const actor = game.actors.get(actorId);
  if (!actor) {
    ui.notifications?.warn(`Character "${name}" not found in current world.`);
    return;
  }

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
  ui.notifications?.info(`Backing up ${name} to Supabase...`);

  try {
    const actorData = actor.toObject();
    const token = localStorage.getItem("heraldSilane_token");

    const response = await fetch(`${API_BASE_URL}/api/silane_assets/character/backup/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        characterId: actorId,
        name: name,
        worldId: worldId,
        worldTitle: worldTitle,
        actorData: actorData
      })
    });

    if (response.ok) {
      ui.notifications?.info(`Success! Backup for ${name} has been saved to the cloud.`);
      await initCharacterBackupTab(parentContainer);
    } else {
      let errMsg = "Unknown error";
      try {
        const err = await response.json();
        errMsg = err.message || err.error || errMsg;
      } catch (e) {
        errMsg = `Server returned status ${response.status} (${response.statusText})`;
      }
      ui.notifications?.error(`Failed to save backup: ${errMsg}`);
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  } catch (error) {
    console.error("Backup error:", error);
    ui.notifications?.error(`Failed to connect to Silane server: ${error.message}`);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}
