import { API_BASE_URL } from "./helper.js";

let parentContainer = null;
let activeSubTab = "backup";
let storageUpdateCallback = null;

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
    .cb-tab-nav {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid #27272a;
      padding-bottom: 12px;
      flex-shrink: 0;
    }
    .cb-tab-btn {
      flex: 1;
      justify-content: center;
      background: rgba(39, 39, 42, 0.4);
      border: 1px solid #27272a;
      color: #a1a1aa;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      outline: none;
    }
    .cb-tab-btn:hover {
      background: rgba(39, 39, 42, 0.8);
      color: white;
      border-color: #3f3f46;
    }
    .cb-tab-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .cb-gear-btn {
      background: transparent;
      border: none;
      color: #a1a1aa;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
      outline: none;
      margin-left: 8px;
    }
    .cb-gear-btn:hover {
      color: #3b82f6;
    }
    .cb-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 22px;
    }
    .cb-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .cb-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #3f3f46;
      transition: .3s;
      border-radius: 22px;
    }
    .cb-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
    .cb-switch input:checked + .cb-slider {
      background-color: #3b82f6;
    }
    .cb-switch input:checked + .cb-slider:before {
      transform: translateX(22px);
    }
    .cb-select {
      background: #18181b;
      border: 1px solid #3f3f46;
      color: #f4f4f5;
      padding: 6px 12px;
      border-radius: 6px;
      outline: none;
      cursor: pointer;
      font-size: 12px;
    }
    .cb-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cb-controls-column {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
      width: 100%;
    }
    .cb-search-input {
      background: #18181b;
      border: 1px solid #3f3f46;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
      box-sizing: border-box;
    }
    .cb-search-input:focus {
      border-color: #3b82f6;
    }
    .cb-btn-secondary {
      background: rgba(39, 39, 42, 0.6);
      border: 1px solid #3f3f46;
      color: #e4e4e7;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cb-btn-secondary:hover:not(:disabled) {
      background: #27272a;
      border-color: #52525b;
      color: white;
    }
    .cb-btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
      gap: 2px;
      letter-spacing: 0.5px;
    }
    .cb-world-badge {
      font-size: 9px;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 8px;
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
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      width: 100%;
    }
    @media (min-width: 700px) {
      .cb-actors-list {
        grid-template-columns: 1fr 1fr;
      }
    }
    .cb-actor-card {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
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
    .cb-actor-checkbox-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cb-actor-checkbox, .cb-folder-actor-checkbox {
      width: 15px;
      height: 15px;
      cursor: pointer;
      accent-color: #3b82f6;
      margin: 0;
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
    .cb-actor-meta {
      font-size: 10px;
      color: #a1a1aa;
      font-weight: 500;
      display: flex;
      flex-direction: column;
    }
    .cb-actor-type {
      text-transform: uppercase;
      font-weight: 600;
      font-size: 8px;
      color: #71717a;
      letter-spacing: 0.5px;
    }
    .cb-actor-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .cb-btn-action {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 12px;
      flex-shrink: 0;
    }
    .cb-btn-action:hover:not(:disabled) {
      background: #3b82f6;
      color: #ffffff;
      border-color: #3b82f6;
    }
    .cb-btn-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cb-btn-restore {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .cb-btn-restore:hover:not(:disabled) {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }
    .cb-btn-delete {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .cb-btn-delete:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
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
    .cb-error-container {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      color: #f87171;
      margin-top: 10px;
    }
    .cb-modal-actors-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 10px;
      background: rgba(0,0,0,0.2);
    }
    @media (min-width: 500px) {
      .cb-modal-actors-list {
        grid-template-columns: 1fr 1fr;
      }
    }
    .cb-modal-actor-card {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
      background: rgba(0,0,0,0.3);
      border: 1px solid #27272a;
      box-sizing: border-box;
      transition: border-color 0.2s, background-color 0.2s;
    }
    .cb-modal-actor-card:hover {
      border-color: #52525b;
      background: rgba(255, 255, 255, 0.05);
    }
    .cb-modal-actors-list::-webkit-scrollbar {
      width: 4px;
    }
    .cb-modal-actors-list::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 10px;
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

async function fetchCloudBackups() {
  try {
    const token = localStorage.getItem("heraldSilane_token");
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/character/backup/list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const resData = await response.json();
      return resData.data || [];
    }
  } catch (error) {
    console.error("Failed to fetch cloud backups:", error);
    throw error;
  }
  return [];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return dateStr;
  }
}

function groupBackupsIntoFolders(backups) {
  backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const folders = [];
  backups.forEach(backup => {
    const backupTime = new Date(backup.created_at);
    
    const matchingFolder = folders.find(folder => {
      if (folder.worldId !== backup.world_id) return false;
      const folderTime = new Date(folder.createdAt);
      const diffSeconds = Math.abs(backupTime - folderTime) / 1000;
      return diffSeconds <= 60;
    });

    if (matchingFolder) {
      matchingFolder.actors.push(backup);
    } else {
      folders.push({
        worldId: backup.world_id,
        worldTitle: backup.world_title,
        createdAt: backup.created_at,
        actors: [backup]
      });
    }
  });

  return folders;
}

function formatFolderName(worldTitle, createdAtStr) {
  try {
    const d = new Date(createdAtStr);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${worldTitle} - ${y}-${m}-${date} - ${h}:${min}`;
  } catch (e) {
    return `${worldTitle} - Backup`;
  }
}

function getRestoreFolderName(createdAtStr, actorName = "") {
  try {
    const d = new Date(createdAtStr);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    const namePart = actorName ? `${actorName} - ` : "";
    return `silane restore - ${namePart}${y}-${m}-${date} - ${h}:${min}`;
  } catch (e) {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const date = now.getDate().toString().padStart(2, '0');
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const namePart = actorName ? `${actorName} - ` : "";
    return `silane restore - ${namePart}${y}-${m}-${date} - ${h}:${min}`;
  }
}

function findActorMetadata(characterId, worldId, localCache) {
  if (localCache && localCache[worldId]) {
    const actor = localCache[worldId].actors.find(a => a.id === characterId);
    if (actor) {
      return {
        img: actor.img || "icons/svg/mystery-man.svg",
        type: actor.type || "character"
      };
    }
  }
  
  if (localCache) {
    for (const world of Object.values(localCache)) {
      const actor = world.actors.find(a => a.id === characterId);
      if (actor) {
        return {
          img: actor.img || "icons/svg/mystery-man.svg",
          type: actor.type || "character"
        };
      }
    }
  }

  return {
    img: "icons/svg/mystery-man.svg",
    type: "character"
  };
}

function renderBackupActorsListHtml(world) {
  if (world.actors.length === 0) {
    return `<div class="cb-empty-state"><i class="fa-solid fa-user-slash" style="margin-right: 6px;"></i>No characters found.</div>`;
  }

  return world.actors.map(actor => {
    return `
      <div class="cb-actor-card" data-actor-name="${actor.name.toLowerCase()}" data-actor-id="${actor.id}">
        ${world.isActive ? `
          <div class="cb-actor-checkbox-wrapper">
            <input type="checkbox" class="cb-actor-checkbox" data-actor-id="${actor.id}" title="Select for immediate backup">
          </div>
        ` : ""}
        <img class="cb-actor-img" src="${actor.img}" onerror="this.src='icons/svg/mystery-man.svg'" />
        <div class="cb-actor-info">
          <div class="cb-actor-name" title="${actor.name}">${actor.name}</div>
          <div class="cb-actor-meta">
            <span class="cb-actor-type">${actor.type}</span>
          </div>
        </div>
        <div class="cb-actor-actions">
          ${world.isActive ? `
            <button class="cb-btn-action cb-btn-backup-now" data-actor-id="${actor.id}" data-actor-name="${actor.name}" data-world-id="${world.id}" data-world-title="${world.title}" title="Backup to Cloud">
              <i class="fa-solid fa-cloud-arrow-up"></i>
            </button>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function renderRestoreActorsListHtml(actors, localCache, folderIdx) {
  return actors.map(actor => {
    const meta = findActorMetadata(actor.character_id, actor.world_id, localCache);
    const backupDateStr = formatDate(actor.created_at);

    return `
      <div class="cb-actor-card" data-actor-name="${actor.name.toLowerCase()}">
        <div class="cb-actor-checkbox-wrapper">
          <input type="checkbox" class="cb-folder-actor-checkbox" data-folder-id="${folderIdx}" data-backup-id="${actor.id}" data-actor-name="${actor.name}" title="Select for restoring">
        </div>
        <img class="cb-actor-img" src="${meta.img}" onerror="this.src='icons/svg/mystery-man.svg'" />
        <div class="cb-actor-info">
          <div class="cb-actor-name" title="${actor.name}">${actor.name}</div>
          <div class="cb-actor-meta">
            <span class="cb-actor-type">${meta.type}</span>
            <span style="color: #a1a1aa; font-size: 9px; margin-top: 1px;">
              <i class="fa-solid fa-clock" style="margin-right: 3px; color: #fbbf24;"></i>
              ${backupDateStr}
            </span>
          </div>
        </div>
        <div class="cb-actor-actions">
          <button class="cb-btn-action cb-btn-restore" data-backup-id="${actor.id}" data-actor-name="${actor.name}" data-backup-date="${actor.created_at}" title="Restore/Import to Active World">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </button>
          <button class="cb-btn-action cb-btn-delete" data-backup-id="${actor.id}" data-actor-name="${actor.name}" title="Delete Backup">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

export async function initCharacterBackupTab(container, onUpdateCallback) {
  parentContainer = container;
  if (onUpdateCallback) {
    storageUpdateCallback = onUpdateCallback;
  }
  injectCharacterBackupStyles();

  parentContainer.innerHTML = `
    <div class="cb-container">
      <div class="cb-tab-nav">
        <button class="cb-tab-btn ${activeSubTab === 'backup' ? 'active' : ''}" data-tab="backup">
          <i class="fa-solid fa-cloud-arrow-up"></i> Backup
        </button>
        <button class="cb-tab-btn ${activeSubTab === 'restore' ? 'active' : ''}" data-tab="restore">
          <i class="fa-solid fa-clock-rotate-left"></i> Restore
        </button>
      </div>
      <div id="cb-tab-content">
        <div style="display:flex; justify-content:center; padding:40px; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>
      </div>
    </div>
  `;

  const tabs = parentContainer.querySelectorAll(".cb-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", async (e) => {
      const selectedTab = e.currentTarget.dataset.tab;
      if (selectedTab !== activeSubTab) {
        activeSubTab = selectedTab;
        await initCharacterBackupTab(parentContainer);
      }
    });
  });

  const tabContentEl = parentContainer.querySelector("#cb-tab-content");

  if (activeSubTab === "backup") {
    await renderBackupTab(tabContentEl);
  } else {
    await renderRestoreTab(tabContentEl);
  }
}

async function renderBackupTab(container) {
  const activeWorldId = game.world.id;
  const activeWorldTitle = game.world.title;

  saveCurrentWorldState();

  let localCache = {};
  try {
    const stored = localStorage.getItem("heraldSilane_worldBackups");
    if (stored) localCache = JSON.parse(stored);
  } catch (e) {}

  const activeWorld = {
    id: activeWorldId,
    title: activeWorldTitle,
    isActive: true,
    actors: game.actors.contents
      .filter(a => a.type === "character" || a.type === "pc" || a.type === "npc")
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img || "icons/svg/mystery-man.svg",
        type: a.type
      }))
  };

  const otherWorlds = Object.values(localCache).filter(w => w.id !== activeWorldId);

  let html = `
    <div class="cb-world-card" data-world-id="${activeWorld.id}">
      <div class="cb-world-header" data-world-id="${activeWorld.id}">
        <div class="cb-world-title">
          <i class="fa-solid fa-earth-asia" style="color: #10b981;"></i>
          <span>${activeWorld.title}</span>
          <span class="cb-world-badge active">Active</span>
          <button id="cb-btn-gear-settings" class="cb-gear-btn" title="Auto-Backup Settings">
            <i class="fa-solid fa-gear"></i>
          </button>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 12px; color: #a1a1aa;">${activeWorld.actors.length} Characters & NPCs</span>
          <i class="fa-solid fa-chevron-up cb-toggle-icon"></i>
        </div>
      </div>
      <div class="cb-card-content" data-world-id="${activeWorld.id}" style="display: block;">

        <div class="cb-controls-column">
          <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
            <input type="text" id="cb-search-actors" class="cb-search-input" placeholder="Search characters..." style="flex: 1;">
            <span style="font-size: 11px; color: #a1a1aa; white-space: nowrap;" id="cb-selected-count">0/0 Selected</span>
          </div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <button id="cb-btn-select-all" class="cb-btn-secondary" style="flex: 1; justify-content: center;">Select All</button>
            <button id="cb-btn-deselect-all" class="cb-btn-secondary" style="flex: 1; justify-content: center;">Deselect All</button>
            <button id="cb-btn-backup-selected" class="cb-btn-secondary" style="flex: 1.5; justify-content: center; background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #34d399;">
              <i class="fa-solid fa-cloud-arrow-up"></i> Backup Selected
            </button>
          </div>
        </div>

        <div class="cb-actors-list" id="cb-active-actors-list">
          ${renderBackupActorsListHtml(activeWorld)}
        </div>
      </div>
    </div>
  `;

  if (otherWorlds.length > 0) {
    otherWorlds.forEach(world => {
      html += `
        <div class="cb-world-card" data-world-id="${world.id}">
          <div class="cb-world-header" data-world-id="${world.id}">
            <div class="cb-world-title">
              <i class="fa-solid fa-globe" style="color: #60a5fa;"></i>
              <span>${world.title}</span>
              <span class="cb-world-badge cached">Cached</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 12px; color: #a1a1aa;">${world.actors.length} Characters</span>
              <i class="fa-solid fa-chevron-down cb-toggle-icon"></i>
            </div>
          </div>
          <div class="cb-card-content" data-world-id="${world.id}" style="display: none;">
            <div class="cb-actors-list">
              ${renderBackupActorsListHtml(world)}
            </div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
  attachBackupTabEvents();
  updateSelectedCount();
}

async function renderRestoreTab(container) {
  container.innerHTML = `<div style="display:flex; justify-content:center; padding:40px; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  try {
    const cloudBackups = await fetchCloudBackups();
    if (cloudBackups.length === 0) {
      container.innerHTML = `
        <div class="cb-empty-state" style="padding: 40px; text-align: center; color: #71717a;">
          <i class="fa-solid fa-cloud-slash fa-3x" style="margin-bottom: 12px; color: #3f3f46;"></i>
          <div>Tidak ada data backup ditemukan di cloud.</div>
        </div>
      `;
      return;
    }

    let localCache = {};
    try {
      const stored = localStorage.getItem("heraldSilane_worldBackups");
      if (stored) localCache = JSON.parse(stored);
    } catch (e) {}

    const folders = groupBackupsIntoFolders(cloudBackups);

    let html = `
      <div class="cb-controls-column" style="margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
          <input type="text" id="cb-search-restore-actors" class="cb-search-input" placeholder="Search characters..." style="flex: 1;">
        </div>
      </div>
    `;
    folders.forEach((folder, idx) => {
      const folderName = formatFolderName(folder.worldTitle, folder.createdAt);
      
      html += `
        <div class="cb-world-card" data-folder-id="${idx}" data-folder-created-at="${folder.createdAt}">
          <div class="cb-world-header cb-folder-header" data-folder-id="${idx}">
            <div class="cb-world-title">
              <i class="fa-solid fa-folder-open" style="color: #fbbf24; margin-right: 6px;"></i>
              <span>${folderName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 12px; color: #a1a1aa;">${folder.actors.length} Characters</span>
              <i class="fa-solid fa-chevron-down cb-toggle-icon"></i>
            </div>
          </div>
          <div class="cb-card-content cb-folder-content" data-folder-id="${idx}" style="display: none;">
            
            <div class="cb-controls-column" style="margin-bottom: 12px;">
              <div style="display: flex; gap: 8px; width: 100%;">
                <button type="button" class="cb-btn-secondary cb-btn-folder-select-all" data-folder-id="${idx}" style="flex: 1; justify-content: center; padding: 6px 12px; font-size: 11px;">Select All</button>
                <button type="button" class="cb-btn-secondary cb-btn-folder-deselect-all" data-folder-id="${idx}" style="flex: 1; justify-content: center; padding: 6px 12px; font-size: 11px;">Deselect All</button>
                <button type="button" class="cb-btn-secondary cb-btn-folder-restore-selected" data-folder-id="${idx}" style="flex: 1.5; justify-content: center; padding: 6px 12px; font-size: 11px; background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #34d399;">
                  <i class="fa-solid fa-clock-rotate-left" style="margin-right: 4px;"></i> Restore Selected
                </button>
              </div>
            </div>

            <div class="cb-actors-list">
              ${renderRestoreActorsListHtml(folder.actors, localCache, idx)}
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    attachRestoreTabEvents();

  } catch (error) {
    console.error("Error loading restore tab:", error);
    container.innerHTML = `
      <div class="cb-error-container">
        <i class="fa-solid fa-triangle-exclamation fa-2x" style="margin-bottom: 10px;"></i>
        <div style="font-weight: bold; font-size: 14px;">Gagal Menghubungkan ke Server</div>
        <p style="font-size: 12px; margin-top: 5px; color: #fca5a5;">Server backend Silane offline atau tidak dapat diakses. Silakan coba lagi beberapa saat lagi.</p>
      </div>
    `;
  }
}

function openBackupSettingsModal() {
  const settings = game.settings.get("heralds-silane", "backupSettings") || {
    enabled: false,
    hour: "12:00",
    targets: {}
  };

  const activeActors = game.actors.contents
    .filter(a => a.type === "character" || a.type === "pc" || a.type === "npc")
    .map(a => ({
      id: a.id,
      name: a.name,
      img: a.img || "icons/svg/mystery-man.svg",
      type: a.type
    }));

  let currentHourVal = settings.hour;
  if (typeof currentHourVal === "number") {
    currentHourVal = `${currentHourVal.toString().padStart(2, '0')}:00`;
  } else if (!currentHourVal) {
    currentHourVal = "12:00";
  }

  const modalHtml = `
    <div class="cb-modal-container" style="color: #f4f4f5; font-family: 'Inter', sans-serif; padding: 15px;">
      <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 15px;">Configure your automatic daily character backup settings below.</p>
      
      <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 6px; border: 1px solid #27272a;">
          <span style="font-size: 13px; font-weight: 600;">Enable Auto Backup</span>
          <label class="cb-switch">
            <input type="checkbox" id="modal-cb-auto-enabled" ${settings.enabled ? "checked" : ""}>
            <span class="cb-slider"></span>
          </label>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 6px; border: 1px solid #27272a;">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 13px; font-weight: 600;">Schedule Backup Time (HH:MM)</span>
            <span style="font-size: 10px; color: #a1a1aa;">Runs based on GM local system time. (e.g. 14:30)</span>
          </div>
          <input type="text" id="modal-cb-auto-hour" class="cb-search-input" value="${currentHourVal}" placeholder="12:00" style="width: 100px; text-align: center; font-weight: 600;" ${settings.enabled ? "" : "disabled"}>
        </div>
      </div>

      <div style="margin-top: 15px; margin-bottom: 8px;">
        <span style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">Auto-Backup Characters</span>
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <button type="button" id="modal-cb-select-all" class="cb-btn-secondary" style="flex: 1; justify-content: center; padding: 6px 12px;">Select All</button>
          <button type="button" id="modal-cb-deselect-all" class="cb-btn-secondary" style="flex: 1; justify-content: center; padding: 6px 12px;">Deselect All</button>
        </div>
      </div>
      
      <div class="cb-modal-actors-list">
        ${activeActors.map(actor => {
          const isChecked = settings.targets?.[actor.id] === true;
          return `
            <label class="cb-modal-actor-card">
              <input type="checkbox" class="cb-modal-actor-checkbox" data-actor-id="${actor.id}" ${isChecked ? "checked" : ""} style="width: 14px; height: 14px; accent-color: #3b82f6; cursor: pointer; margin: 0; flex-shrink: 0;">
              <img src="${actor.img}" onerror="this.src='icons/svg/mystery-man.svg'" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover; border: 1px solid #3f3f46; flex-shrink: 0;" />
              <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                <span style="font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f4f4f5;">${actor.name}</span>
                <span style="font-size: 9px; font-weight: 600; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.5px;">${actor.type}</span>
              </div>
            </label>
          `;
        }).join("")}
        ${activeActors.length === 0 ? `<div style="grid-column: span 2; text-align: center; color: #71717a; padding: 10px; font-size: 12px; font-style: italic;">No characters in world</div>` : ""}
      </div>
    </div>
  `;

  new Dialog({
    title: "Auto-Backup Configuration",
    content: modalHtml,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Save Settings",
        callback: async (html) => {
          const isEnabled = html.find("#modal-cb-auto-enabled")[0].checked;
          const hourVal = html.find("#modal-cb-auto-hour")[0].value.trim() || "12:00";

          const targets = {};
          const checkboxes = html[0].querySelectorAll(".cb-modal-actor-checkbox");
          checkboxes.forEach(cb => {
            targets[cb.dataset.actorId] = cb.checked;
          });

          const updated = {
            enabled: isEnabled,
            hour: hourVal,
            targets: targets
          };

          await game.settings.set("heralds-silane", "backupSettings", updated);
          ui.notifications?.info("Auto-backup settings saved successfully!");
          
          if (parentContainer) {
            await initCharacterBackupTab(parentContainer);
          }
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    default: "save",
    render: (html) => {
      const enabledCheckbox = html.find("#modal-cb-auto-enabled");
      const hourInput = html.find("#modal-cb-auto-hour");
      
      hourInput.prop("disabled", !enabledCheckbox[0].checked);

      enabledCheckbox.on("change", (e) => {
        hourInput.prop("disabled", !e.target.checked);
      });

      html.find("#modal-cb-select-all").on("click", () => {
        html.find(".cb-modal-actor-checkbox").prop("checked", true);
      });
      html.find("#modal-cb-deselect-all").on("click", () => {
        html.find(".cb-modal-actor-checkbox").prop("checked", false);
      });

      try {
        const dialogEl = html.closest(".app")?.[0] || html.closest(".dialog")?.[0];
        const contentEl = dialogEl?.querySelector(".window-content");
        if (contentEl) {
          contentEl.style.backgroundColor = "#18181b";
          contentEl.style.color = "white";
          contentEl.style.backgroundImage = "none";
        }
        dialogEl?.querySelectorAll(".dialog-buttons button").forEach(btn => {
          btn.style.color = "white";
          btn.style.border = "1px solid #3f3f46";
          btn.style.background = "rgba(0,0,0,0.4)";
          btn.style.fontSize = "12px";
          btn.style.padding = "6px 12px";
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, {
    width: 600,
    classes: ["cb-settings-dialog"]
  }).render(true);
}

function updateSelectedCount() {
  if (!parentContainer) return;
  const all = parentContainer.querySelectorAll("#cb-active-actors-list .cb-actor-checkbox");
  const checked = parentContainer.querySelectorAll("#cb-active-actors-list .cb-actor-checkbox:checked");
  const countEl = parentContainer.querySelector("#cb-selected-count");
  if (countEl) {
    countEl.innerText = `${checked.length}/${all.length} Selected`;
  }
}

function attachBackupTabEvents() {
  const containerEl = parentContainer.querySelector("#cb-tab-content");
  if (!containerEl) return;

  const gearBtn = containerEl.querySelector("#cb-btn-gear-settings");
  if (gearBtn) {
    gearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openBackupSettingsModal();
    });
  }

  const selectAllBtn = containerEl.querySelector("#cb-btn-select-all");
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      const checkboxes = containerEl.querySelectorAll("#cb-active-actors-list .cb-actor-checkbox");
      checkboxes.forEach(cb => cb.checked = true);
      updateSelectedCount();
    });
  }

  const deselectAllBtn = containerEl.querySelector("#cb-btn-deselect-all");
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener("click", () => {
      const checkboxes = containerEl.querySelectorAll("#cb-active-actors-list .cb-actor-checkbox");
      checkboxes.forEach(cb => cb.checked = false);
      updateSelectedCount();
    });
  }

  containerEl.addEventListener("change", (e) => {
    if (e.target.classList.contains("cb-actor-checkbox")) {
      updateSelectedCount();
    }
  });

  const searchInput = containerEl.querySelector("#cb-search-actors");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const cards = containerEl.querySelectorAll("#cb-active-actors-list .cb-actor-card");
      cards.forEach(card => {
        const name = card.dataset.actorName || "";
        if (name.includes(q)) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  const backupSelectedBtn = containerEl.querySelector("#cb-btn-backup-selected");
  if (backupSelectedBtn) {
    backupSelectedBtn.addEventListener("click", () => {
      backupSelectedActors();
    });
  }

  containerEl.addEventListener("click", (e) => {
    const header = e.target.closest(".cb-world-header");
    if (header && !e.target.closest("#cb-btn-gear-settings")) {
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

function attachRestoreTabEvents() {
  const containerEl = parentContainer.querySelector("#cb-tab-content");
  if (!containerEl) return;

  const searchInput = containerEl.querySelector("#cb-search-restore-actors");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      const folderCards = containerEl.querySelectorAll(".cb-world-card");
      
      folderCards.forEach(folderCard => {
        const actorCards = folderCard.querySelectorAll(".cb-actor-card");
        let folderHasMatch = false;
        
        actorCards.forEach(actorCard => {
          const actorName = actorCard.dataset.actorName || "";
          if (q === "" || actorName.includes(q)) {
            actorCard.style.display = "flex";
            if (q !== "") {
              folderHasMatch = true;
            }
          } else {
            actorCard.style.display = "none";
          }
        });
        
        const folderContent = folderCard.querySelector(".cb-folder-content");
        const icon = folderCard.querySelector(".cb-toggle-icon");
        
        if (q === "") {
          folderCard.style.display = "block";
          if (folderContent) {
            folderContent.style.display = "none";
          }
          if (icon) {
            icon.className = "fa-solid fa-chevron-down cb-toggle-icon";
          }
        } else {
          if (folderHasMatch) {
            folderCard.style.display = "block";
            if (folderContent) {
              folderContent.style.display = "block";
            }
            if (icon) {
              icon.className = "fa-solid fa-chevron-up cb-toggle-icon";
            }
          } else {
            folderCard.style.display = "none";
          }
        }
      });
    });
  }

  containerEl.querySelectorAll(".cb-folder-header").forEach(header => {
    header.addEventListener("click", (e) => {
      const folderId = header.dataset.folderId;
      const content = containerEl.querySelector(`.cb-folder-content[data-folder-id="${folderId}"]`);
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
    });
  });

  containerEl.querySelectorAll(".cb-btn-folder-select-all").forEach(btn => {
    btn.addEventListener("click", () => {
      const folderId = btn.dataset.folderId;
      containerEl.querySelectorAll(`.cb-folder-actor-checkbox[data-folder-id="${folderId}"]`).forEach(cb => cb.checked = true);
    });
  });

  containerEl.querySelectorAll(".cb-btn-folder-deselect-all").forEach(btn => {
    btn.addEventListener("click", () => {
      const folderId = btn.dataset.folderId;
      containerEl.querySelectorAll(`.cb-folder-actor-checkbox[data-folder-id="${folderId}"]`).forEach(cb => cb.checked = false);
    });
  });

  containerEl.querySelectorAll(".cb-btn-folder-restore-selected").forEach(btn => {
    btn.addEventListener("click", () => {
      const folderId = btn.dataset.folderId;
      restoreSelectedActors(folderId, containerEl);
    });
  });

  containerEl.addEventListener("click", (e) => {
    const restoreBtn = e.target.closest(".cb-btn-restore");
    if (restoreBtn) {
      const backupId = restoreBtn.dataset.backupId;
      const actorName = restoreBtn.dataset.actorName;
      const backupDate = restoreBtn.dataset.backupDate;
      restoreCharacter(backupId, actorName, backupDate);
      return;
    }

    const deleteBtn = e.target.closest(".cb-btn-delete");
    if (deleteBtn) {
      const backupId = deleteBtn.dataset.backupId;
      const actorName = deleteBtn.dataset.actorName;
      deleteBackup(backupId, actorName);
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
  ui.notifications?.info(`Backing up ${name} to Cloud...`);

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
      if (storageUpdateCallback) storageUpdateCallback();
      await initCharacterBackupTab(parentContainer);
    } else {
      let errMsg = "Unknown error";
      try {
        const err = await response.json();
        errMsg = err.message || err.error || errMsg;
      } catch (e) {
        errMsg = `Server returned status ${response.status}`;
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

async function backupSelectedActors() {
  const checkboxes = parentContainer.querySelectorAll("#cb-active-actors-list .cb-actor-checkbox:checked");
  if (checkboxes.length === 0) {
    ui.notifications?.warn("Please select at least one character to backup.");
    return;
  }

  const confirm = await Dialog.confirm({
    title: "Backup Selected",
    content: `<p>Are you sure you want to backup the <strong>${checkboxes.length}</strong> selected characters to the cloud?</p>`,
    yes: () => true,
    no: () => false,
    defaultYes: true
  });

  if (!confirm) return;

  const btn = document.getElementById("cb-btn-backup-selected");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 6px;"></i>Backing up...`;

  let successCount = 0;
  let failCount = 0;

  for (const cb of checkboxes) {
    const actorId = cb.dataset.actorId;
    const actor = game.actors.get(actorId);
    if (!actor) continue;

    try {
      const actorData = actor.toObject();
      const token = localStorage.getItem("heraldSilane_token");
      const worldId = game.world.id;
      const worldTitle = game.world.title;

      const response = await fetch(`${API_BASE_URL}/api/silane_assets/character/backup/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: actorId,
          name: actor.name,
          worldId: worldId,
          worldTitle: worldTitle,
          actorData: actorData
        })
      });

      if (response.ok) successCount++;
      else failCount++;
    } catch (e) {
      failCount++;
    }
  }

  ui.notifications?.info(`Backup completed. Success: ${successCount}, Failed: ${failCount}`);
  if (storageUpdateCallback) storageUpdateCallback();
  await initCharacterBackupTab(parentContainer);
}

async function restoreCharacter(backupId, name, backupDate) {
  ui.notifications?.info(`Fetching backup data for ${name}...`);

  try {
    const token = localStorage.getItem("heraldSilane_token");
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/character/backup/${backupId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to fetch backup data from server.");

    const resData = await response.json();
    let actorData = resData.data;
    if (!actorData) throw new Error("Invalid response schema from backend.");

    if (typeof actorData === "string") {
      try {
        actorData = JSON.parse(actorData);
      } catch (e) {
        console.error("Failed to parse string actorData:", e);
      }
    }

    const createdAt = backupDate || resData.created_at || new Date().toISOString();
    const folderName = getRestoreFolderName(createdAt, name);

    let folder = game.folders.find(f => f.name === folderName && f.type === "Actor");
    if (!folder) {
      const created = await Folder.create({
        name: folderName,
        type: "Actor",
        color: "#fbbf24"
      });
      folder = Array.isArray(created) ? created[0] : created;
    }
    const folderId = folder?.id || folder?._id;

    const copyData = JSON.parse(JSON.stringify(actorData));
    delete copyData._id;
    delete copyData.id;
    copyData.folder = folderId;

    const newActor = await Actor.create(copyData);
    if (newActor && folderId) {
      await newActor.update({ folder: folderId });
    }

    ui.notifications?.info(`Character ${name} has been restored in folder "${folderName}".`);
    await initCharacterBackupTab(parentContainer);
  } catch (error) {
    console.error("Restore error:", error);
    ui.notifications?.error(`Failed to restore character: ${error.message}`);
  }
}

async function restoreSelectedActors(folderId, containerEl) {
  const checkboxes = containerEl.querySelectorAll(`.cb-folder-actor-checkbox[data-folder-id="${folderId}"]:checked`);
  if (checkboxes.length === 0) {
    ui.notifications?.warn("Please select at least one character to restore.");
    return;
  }

  const selectedActors = [];
  checkboxes.forEach(cb => {
    selectedActors.push({
      id: cb.dataset.backupId,
      name: cb.dataset.actorName
    });
  });

  ui.notifications?.info(`Restoring ${selectedActors.length} characters...`);

  const folderCard = containerEl.querySelector(`.cb-world-card[data-folder-id="${folderId}"]`);
  const folderCreatedAt = folderCard ? folderCard.dataset.folderCreatedAt : new Date().toISOString();

  let successCount = 0;
  let failCount = 0;
  const restoredFolders = new Set();

  for (const item of selectedActors) {
    try {
      const token = localStorage.getItem("heraldSilane_token");
      const response = await fetch(`${API_BASE_URL}/api/silane_assets/character/backup/${item.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const resData = await response.json();
      let actorData = resData.data;
      if (!actorData) throw new Error("Invalid response schema from backend.");

      if (typeof actorData === "string") {
        try {
          actorData = JSON.parse(actorData);
        } catch (e) {
          console.error("Failed to parse string actorData in loop:", e);
        }
      }

      const createdAt = resData.created_at || folderCreatedAt || new Date().toISOString();
      const folderName = getRestoreFolderName(createdAt, item.name);
      restoredFolders.add(folderName);

      let folder = game.folders.find(f => f.name === folderName && f.type === "Actor");
      if (!folder) {
        const created = await Folder.create({
          name: folderName,
          type: "Actor",
          color: "#fbbf24"
        });
        folder = Array.isArray(created) ? created[0] : created;
      }
      const folderIdVal = folder?.id || folder?._id;

      const copyData = JSON.parse(JSON.stringify(actorData));
      delete copyData._id;
      delete copyData.id;
      copyData.folder = folderIdVal;

      const newActor = await Actor.create(copyData);
      if (newActor && folderIdVal) {
        await newActor.update({ folder: folderIdVal });
      }

      successCount++;
    } catch (err) {
      console.error(`Failed to restore ${item.name}:`, err);
      failCount++;
    }
  }

  const foldersStr = Array.from(restoredFolders).join(", ");
  ui.notifications?.info(`Restore completed. Success: ${successCount}, Failed: ${failCount} (Folders: ${foldersStr})`);
  await initCharacterBackupTab(parentContainer);
}

async function deleteBackup(backupId, name) {
  const confirm = await Dialog.confirm({
    title: "Delete Backup",
    content: `<p>Are you sure you want to delete the backup for <strong>${name}</strong> from the cloud? This action cannot be undone.</p>`,
    yes: () => true,
    no: () => false,
    defaultYes: false
  });

  if (!confirm) return;

  ui.notifications?.info(`Deleting backup for ${name}...`);

  try {
    const token = localStorage.getItem("heraldSilane_token");
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/character/backup/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        backupId: backupId
      })
    });

    if (response.ok) {
      ui.notifications?.info(`Backup for ${name} has been deleted successfully.`);
      if (storageUpdateCallback) storageUpdateCallback();
      await initCharacterBackupTab(parentContainer);
    } else {
      let errMsg = "Unknown error";
      try {
        const err = await response.json();
        errMsg = err.message || err.error || errMsg;
      } catch (e) {}
      ui.notifications?.error(`Failed to delete backup: ${errMsg}`);
    }
  } catch (error) {
    console.error("Delete backup error:", error);
    ui.notifications?.error(`Failed to connect to Silane server: ${error.message}`);
  }
}
