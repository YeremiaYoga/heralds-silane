import { API_BASE_URL, applyDarkThemeToDialog, downloadAndCacheImageToFoundry, sanitizeFoundryItems } from "./helper.js";

let igniteCharacters = [];
let parentContainer = null;
let searchQuery = "";
let currentTypeFilter = "player"; // "player" | "npc"
let currentSilaneUsername = "";
let selectedIgniteCharIds = new Set();

function isNpcChar(char) {
  const t = String(char?.character_type || char?.type || "").toLowerCase().trim();
  if (t === "npc") return true;
  if (t === "player") return false;
  if (char?.npc_format && Object.keys(char.npc_format).length > 0 && (!char?.classes || char.classes.length === 0)) {
    return true;
  }
  return false;
}

const injectIgniteCharacterStyles = () => {
  if (document.getElementById("ignite-character-modern-styles")) return;
  const style = document.createElement("style");
  style.id = "ignite-character-modern-styles";
  style.innerHTML = `
    .ig-container { display: flex; flex-direction: column; height: 100%; width: 100%; color: #f4f4f5; padding-top: 5px; position: relative; }
    .ig-type-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
    .ig-tab-btn { flex: 1; height: 34px; border-radius: 6px; border: 1px solid #3f3f46; background: rgba(0, 0, 0, 0.25); color: #a1a1aa; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; user-select: none; }
    .ig-tab-btn:hover { border-color: #71717a; color: #f4f4f5; background: rgba(255, 255, 255, 0.05); }
    .ig-tab-btn[data-filter="player"].active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.15); color: #60a5fa; box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
    .ig-tab-btn[data-filter="npc"].active { border-color: #ef4444; background: rgba(239, 68, 68, 0.15); color: #f87171; box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
    
    .ig-action-bar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; justify-content: space-between; }
    .ig-search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 0 15px; height: 38px; transition: border-color 0.2s; }
    .ig-search-box:focus-within { border-color: #3b82f6; }
    .ig-search-box input { background: transparent; border: none; color: #f4f4f5; width: 100%; margin-left: 10px; outline: none; font-size: 13px; }
    .ig-import-code-btn { border-color: rgba(139, 92, 246, 0.4); background: rgba(139, 92, 246, 0.15); color: #c084fc; font-weight: 700; }
    .ig-import-code-btn:hover { background: rgba(139, 92, 246, 0.3); border-color: #a855f7; color: #f3e8ff; box-shadow: 0 0 10px rgba(168, 85, 247, 0.3); }
    .ig-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .ig-list-area::-webkit-scrollbar { width: 6px; }
    .ig-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    .ig-row-card { display: flex; align-items: center; padding: 10px 14px; background: rgba(0, 0, 0, 0.3); border: 1px solid #3f3f46; border-radius: 8px; transition: all 0.2s; user-select: none; gap: 14px; cursor: pointer; position: relative; }
    .ig-row-card:hover { background: rgba(0, 0, 0, 0.5); border-color: #52525b; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .ig-row-card.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.12); box-shadow: 0 0 12px rgba(59, 130, 246, 0.25); }
    .ig-card-select-checkbox { width: 22px; height: 22px; border-radius: 6px; border: 1px solid #52525b; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: transparent; font-size: 12px; transition: all 0.2s; flex-shrink: 0; }
    .ig-row-card.selected .ig-card-select-checkbox { border-color: #3b82f6; background: #3b82f6; color: #ffffff; }

    .ig-selection-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: rgba(0,0,0,0.25); border: 1px solid #3f3f46; border-radius: 6px; flex-shrink: 0; margin-bottom: 12px; box-sizing: border-box; }
    .ig-bulk-count-badge { font-size: 11px; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.15); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(59,130,246,0.3); white-space: nowrap; }
    .ig-sub-btn { height: 28px; padding: 0 10px; border-radius: 5px; border: 1px solid #3f3f46; background: rgba(0,0,0,0.4); color: #a1a1aa; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; box-sizing: border-box; }
    .ig-sub-btn:hover { background: rgba(255,255,255,0.08); color: #f4f4f5; border-color: #52525b; }
    .ig-sub-btn.import { border-color: rgba(16,185,129,0.5); background: rgba(16,185,129,0.15); color: #34d399; }
    .ig-sub-btn.import:hover { background: rgba(16,185,129,0.3); color: #6ee7b7; border-color: #10b981; }

    .ig-card-avatar, .ig-card-art { width: 52px; height: 52px; border-radius: 6px; border: 1px solid #52525b; overflow: hidden; background: #18181b; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .ig-card-avatar img, .ig-card-art img { width: 100%; height: 100%; object-fit: cover; }
    .ig-card-info { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ig-card-name { font-size: 15px; font-weight: 700; color: #f4f4f5; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px; }
    .ig-card-fullname { font-size: 12px; color: #a1a1aa; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ig-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; }
    .ig-badge-npc { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .ig-badge-player { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .ig-card-meta { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; min-width: 150px; text-align: right; padding-right: 12px; border-right: 1px solid #3f3f46; }
    .ig-meta-species { font-size: 13px; color: #60a5fa; font-weight: 600; margin-bottom: 2px; }
    .ig-meta-classes { font-size: 12px; color: #fbbf24; font-weight: 500; }
    .ig-meta-date { font-size: 10px; color: #71717a; margin-top: 4px; font-style: italic; }

    .ig-card-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
    .ig-btn-action-box { display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; opacity: 0.85; background: transparent; border: none; padding: 0;}
    .ig-btn-action-box:hover { opacity: 1; transform: scale(1.05); }
    .ig-icon-sq { width: 28px; height: 28px; border: 1px solid; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; background: rgba(0,0,0,0.2);}
    .ig-export .ig-icon-sq { border-color: #10b981; color: #10b981; }

    .ig-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #71717a; text-align: center; }
    .ig-empty-state i { font-size: 40px; margin-bottom: 15px; opacity: 0.5; }
  `;
  document.head.appendChild(style);
};

export async function initIgniteCharacterTab(container) {
  parentContainer = container;
  injectIgniteCharacterStyles();
  parentContainer.innerHTML = `<div style="display:flex; justify-content:center; padding:40px; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  await fetchIgniteCharacters();
  renderIgniteCharacterUI();
}

async function fetchIgniteCharacters() {
  try {
    const token = localStorage.getItem("heraldSilane_token");
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/ignite-characters`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      igniteCharacters = Array.isArray(result.data) ? result.data : [];
      if (result.username) {
        currentSilaneUsername = result.username;
      }
    } else {
      igniteCharacters = [];
    }
  } catch (error) {
    console.error("Failed to fetch Ignite characters:", error);
    igniteCharacters = [];
  }
}

function updateTabCounts() {
  const playerCount = igniteCharacters.filter(c => !isNpcChar(c)).length;
  const npcCount = igniteCharacters.filter(c => isNpcChar(c)).length;

  const countPlayerEl = document.getElementById("ig-count-player");
  const countNpcEl = document.getElementById("ig-count-npc");

  if (countPlayerEl) countPlayerEl.textContent = playerCount;
  if (countNpcEl) countNpcEl.textContent = npcCount;
}

function updateBulkBar() {
  const countEl = document.getElementById("ig-bulk-count");
  if (countEl) {
    countEl.textContent = `${selectedIgniteCharIds.size} Selected`;
  }
}

async function bulkImportIgniteCharacters() {
  if (selectedIgniteCharIds.size === 0) return;

  const targets = igniteCharacters.filter(c => selectedIgniteCharIds.has(c.id));
  if (targets.length === 0) return;

  const importBtn = document.getElementById("ig-bulk-import");
  if (importBtn) {
    importBtn.disabled = true;
    importBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Importing ${targets.length}...`;
  }

  ui.notifications?.info(`Starting mass import of ${targets.length} Ignite character(s)...`);

  let successCount = 0;
  let failCount = 0;

  for (const char of targets) {
    try {
      await exportCharacterToFoundry(char);
      successCount++;
    } catch (err) {
      console.error(`Failed to export ${char.name}:`, err);
      failCount++;
    }
  }

  ui.notifications?.info(`Mass import complete! Successfully imported: ${successCount}${failCount > 0 ? `, Failed: ${failCount}` : ''}.`);

  selectedIgniteCharIds.clear();
  renderListArea();
  updateBulkBar();
}

function renderIgniteCharacterUI() {
  if (!parentContainer) return;

  const playerCount = igniteCharacters.filter(c => !isNpcChar(c)).length;
  const npcCount = igniteCharacters.filter(c => isNpcChar(c)).length;

  parentContainer.innerHTML = `
    <div class="ig-container">
      <div class="ig-type-tabs">
        <button id="ig-tab-player" class="ig-tab-btn ${currentTypeFilter === 'player' ? 'active' : ''}" data-filter="player">
          <i class="fa-solid fa-user-shield"></i> Player (<span id="ig-count-player">${playerCount}</span>)
        </button>
        <button id="ig-tab-npc" class="ig-tab-btn ${currentTypeFilter === 'npc' ? 'active' : ''}" data-filter="npc">
          <i class="fa-solid fa-skull"></i> NPC (<span id="ig-count-npc">${npcCount}</span>)
        </button>
        <button id="ig-import-code-btn" class="ig-tab-btn ig-import-code-btn" title="Import Character by Private ID, Aria ID, or Link">
          <i class="fa-solid fa-file-import"></i> Import by Code
        </button>
      </div>
      <div class="ig-action-bar">
        <div class="ig-search-box">
          <i class="fa-solid fa-search" style="color: #71717a;"></i>
          <input type="text" id="ig-search-input" placeholder="Search Ignite Character..." value="${searchQuery}" />
        </div>
      </div>
      <div class="ig-selection-bar">
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="ig-bulk-select-all" class="ig-sub-btn" title="Select All Visible Characters">
            <i class="fa-solid fa-check-double"></i> Select All
          </button>
          <button id="ig-bulk-deselect" class="ig-sub-btn" title="Unselect All Characters">
            <i class="fa-solid fa-xmark"></i> Unselect All
          </button>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span id="ig-bulk-count" class="ig-bulk-count-badge">
            ${selectedIgniteCharIds.size} Selected
          </span>
          <button id="ig-bulk-import" class="ig-sub-btn import" title="Import Selected Characters to Foundry">
            <i class="fa-solid fa-file-import"></i> Import
          </button>
        </div>
      </div>
      <div id="ig-list-area" class="ig-list-area"></div>
    </div>
  `;

  renderListArea();
  attachEvents();
  updateBulkBar();
}

function renderListArea() {
  const listArea = document.getElementById("ig-list-area");
  if (!listArea) return;

  const query = searchQuery.toLowerCase().trim();
  const filtered = igniteCharacters.filter(char => {
    const isNpc = isNpcChar(char);
    if (currentTypeFilter === "player" && isNpc) return false;
    if (currentTypeFilter === "npc" && !isNpc) return false;

    if (!query) return true;
    return (
      (char.name || "").toLowerCase().includes(query) ||
      (char.full_name || "").toLowerCase().includes(query)
    );
  });

  const typeLabel = currentTypeFilter === "npc" ? "NPC" : "Player";

  if (filtered.length === 0) {
    listArea.innerHTML = `
      <div class="ig-empty-state">
        <i class="fa-solid ${currentTypeFilter === 'npc' ? 'fa-skull' : 'fa-user-shield'}"></i>
        <div style="font-size:16px; font-weight:500; color:#d4d4d8;">No ${typeLabel} Characters found</div>
        <div style="font-size:13px; margin-top:5px;">Create a ${typeLabel.toLowerCase()} in Project Ignite to see it here.</div>
      </div>`;
    return;
  }

  let html = "";
  filtered.forEach(char => {
    const isNpc = isNpcChar(char);
    const isSelected = selectedIgniteCharIds.has(char.id);
    const avatar = char.token_image || "icons/svg/mystery-man.svg";
    const displayName = char.name || "Hero Without A Name";
    const displayFullName = char.full_name || "";
    let speciesName = "";
    if (char.species) {
      speciesName = char.species.name || "";
    }
    let classesStr = "";
    if (Array.isArray(char.classes) && char.classes.length > 0) {
      classesStr = char.classes.map(c => `${c.name || c.class_name || ""} ${c.level || ""}`).join(", ");
    } else if (isNpc && char.npc_format) {
      const cr = char.npc_format?.cr !== undefined
        ? `CR ${char.npc_format.cr}`
        : char.npc_format?.system?.details?.cr !== undefined
        ? `CR ${char.npc_format.system.details.cr}`
        : "";
      const type = char.npc_format?.creature_type || char.npc_format?.type || char.npc_format?.system?.details?.type?.value || "";
      classesStr = [cr, type].filter(Boolean).join(" • ");
    }

    let formattedDate = "";
    if (char.created_at) {
      try {
        const date = new Date(char.created_at);
        formattedDate = date.toLocaleDateString();
      } catch (e) {}
    }

    html += `
      <div class="ig-row-card ${isSelected ? 'selected' : ''}" data-id="${char.id}">
        <div class="ig-card-select-checkbox" title="Select Character">
          <i class="fa-solid fa-check"></i>
        </div>
        <div class="ig-card-avatar" title="Token Image">
          <img src="${avatar}" onerror="this.src='icons/svg/mystery-man.svg'" />
        </div>
        <div class="ig-card-info">
          <div style="display:flex; align-items:center; gap:6px;">
            <div class="ig-card-name">${displayName}</div>
            <span class="ig-badge ${isNpc ? 'ig-badge-npc' : 'ig-badge-player'}">
              ${isNpc ? '<i class="fa-solid fa-skull"></i> NPC' : '<i class="fa-solid fa-user-shield"></i> Player'}
            </span>
          </div>
          ${displayFullName ? `<div class="ig-card-fullname">${displayFullName}</div>` : ""}
        </div>
        <div class="ig-card-meta">
          ${speciesName ? `<div class="ig-meta-species">${speciesName}</div>` : ""}
          ${classesStr ? `<div class="ig-meta-classes">${classesStr}</div>` : ""}
          ${formattedDate ? `<div class="ig-meta-date">Created on ${formattedDate}</div>` : ""}
        </div>
        <div class="ig-card-actions">
          <button class="ig-btn-action-box ig-export ig-action-export" data-id="${char.id}" title="Export ${isNpc ? 'NPC' : 'Character'} to Foundry">
            <div class="ig-icon-sq"><i class="fa-solid fa-file-import"></i></div>
          </button>
        </div>
      </div>
    `;
  });

  listArea.innerHTML = html;
}

function getIgniteUsername(char) {
  // 1. From character-maker API response if captured
  if (currentSilaneUsername && typeof currentSilaneUsername === "string" && currentSilaneUsername.trim()) {
    return currentSilaneUsername.trim();
  }

  // 2. From character payload if attached
  if (char?.user?.username && typeof char.user.username === "string" && char.user.username.trim()) {
    return char.user.username.trim();
  }
  if (char?.username && typeof char.username === "string" && char.username.trim()) {
    return char.username.trim();
  }
  if (char?.user_name && typeof char.user_name === "string" && char.user_name.trim()) {
    return char.user_name.trim();
  }

  // 3. From heraldSilane_user stored in localStorage upon Silane login
  try {
    const userStr = localStorage.getItem("heraldSilane_user");
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.username && typeof u.username === "string" && u.username.trim()) {
        return u.username.trim();
      }
      if (u.user_name && typeof u.user_name === "string" && u.user_name.trim()) {
        return u.user_name.trim();
      }
      if (u.name && typeof u.name === "string" && u.name.trim()) {
        return u.name.trim();
      }
    }
  } catch (e) {}

  // 4. From JWT token payload stored in localStorage
  try {
    const token = localStorage.getItem("heraldSilane_token");
    if (token && token.includes(".")) {
      const payloadBase64 = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
      if (decodedPayload?.username && typeof decodedPayload.username === "string" && decodedPayload.username.trim()) {
        return decodedPayload.username.trim();
      }
      if (decodedPayload?.user_name && typeof decodedPayload.user_name === "string" && decodedPayload.user_name.trim()) {
        return decodedPayload.user_name.trim();
      }
      if (decodedPayload?.name && typeof decodedPayload.name === "string" && decodedPayload.name.trim()) {
        return decodedPayload.name.trim();
      }
    }
  } catch (e) {}

  // Strictly Silane user fallback, never Foundry game.user.name
  return "Silane User";
}

async function getOrCreateSilaneUserFolder(username, type = "Actor") {
  let rootFolder = game.folders.find(
    (f) =>
      f.name === "Silane Import" &&
      f.type === type &&
      (!f.folder || f.folder === null || f.folder === undefined || (typeof f.folder === "object" && !f.folder?.id))
  );

  if (!rootFolder) {
    rootFolder = await Folder.create({
      name: "Silane Import",
      type: type,
      color: "#3b82f6",
    });
  }

  const rootFolderId = rootFolder?.id || rootFolder?._id;

  let userFolder = game.folders.find(
    (f) =>
      f.name === username &&
      f.type === type &&
      (f.folder === rootFolderId || f.folder?.id === rootFolderId)
  );

  if (!userFolder) {
    userFolder = await Folder.create({
      name: username,
      type: type,
      folder: rootFolderId,
      color: "#60a5fa",
    });
  }

  return userFolder;
}

async function exportCharacterToFoundry(char) {
  const isNpc = isNpcChar(char);
  let dataToImport = null;

  if (isNpc) {
    const npcData = (char.npc_format && Object.keys(char.npc_format).length > 0)
      ? char.npc_format
      : (char.fvtt_format || {});

    if (npcData.raw_data && Object.keys(npcData.raw_data).length > 0) {
      dataToImport = foundry.utils.deepClone(npcData.raw_data);
    } else if (npcData.system && typeof npcData.system === "object") {
      dataToImport = foundry.utils.deepClone(npcData);
    } else {
      dataToImport = {
        name: char.name || npcData.name || "Unnamed NPC",
        type: "npc",
        img: npcData.img_portrait || npcData.img_potrait || npcData.image || char.art_image || "icons/svg/mystery-man.svg",
        prototypeToken: {
          name: char.name || npcData.name || "Unnamed NPC",
          texture: { src: npcData.img_token || char.token_image || "icons/svg/mystery-man.svg" }
        },
        system: npcData.format_data || {}
      };
    }

    dataToImport.type = "npc";
    if (char.name) dataToImport.name = char.name;

    // Apply custom NPC stats & attributes edited in Character Maker
    if (!dataToImport.system) dataToImport.system = {};
    if (!dataToImport.system.attributes) dataToImport.system.attributes = {};
    if (!dataToImport.system.traits) dataToImport.system.traits = {};

    // 1. Custom HP
    if (npcData.hp) {
      if (!dataToImport.system.attributes.hp) dataToImport.system.attributes.hp = {};
      const maxHp = typeof npcData.hp === "object" ? (npcData.hp.max ?? npcData.hp.value) : Number(npcData.hp);
      const valHp = typeof npcData.hp === "object" ? (npcData.hp.value ?? npcData.hp.max) : Number(npcData.hp);
      if (maxHp !== undefined && maxHp !== null) dataToImport.system.attributes.hp.max = Number(maxHp);
      if (valHp !== undefined && valHp !== null) dataToImport.system.attributes.hp.value = Number(valHp);
      if (typeof npcData.hp === "object" && npcData.hp.formula) {
        dataToImport.system.attributes.hp.formula = npcData.hp.formula;
      }
    }

    // 2. Custom Speed / Movement
    if (npcData.speed && typeof npcData.speed === "object") {
      if (!dataToImport.system.attributes.movement) dataToImport.system.attributes.movement = {};
      const m = dataToImport.system.attributes.movement;
      if (npcData.speed.walk !== undefined) m.walk = Number(npcData.speed.walk) || npcData.speed.walk;
      if (npcData.speed.fly !== undefined) m.fly = Number(npcData.speed.fly) || npcData.speed.fly;
      if (npcData.speed.climb !== undefined) m.climb = Number(npcData.speed.climb) || npcData.speed.climb;
      if (npcData.speed.swim !== undefined) m.swim = Number(npcData.speed.swim) || npcData.speed.swim;
      if (npcData.speed.burrow !== undefined) m.burrow = Number(npcData.speed.burrow) || npcData.speed.burrow;
      if (npcData.speed.hover !== undefined) m.hover = Boolean(npcData.speed.hover);
      if (npcData.speed.units) m.units = npcData.speed.units === "Feet" ? "ft" : npcData.speed.units.toLowerCase();
    }

    // 3. Custom Senses
    if (npcData.senses && typeof npcData.senses === "object") {
      if (!dataToImport.system.attributes.senses) dataToImport.system.attributes.senses = {};
      const s = dataToImport.system.attributes.senses;
      if (npcData.senses.blindsight !== undefined) s.blindsight = Number(npcData.senses.blindsight) || 0;
      if (npcData.senses.darkvision !== undefined) s.darkvision = Number(npcData.senses.darkvision) || 0;
      if (npcData.senses.tremorsense !== undefined) s.tremorsense = Number(npcData.senses.tremorsense) || 0;
      if (npcData.senses.truesight !== undefined) s.truesight = Number(npcData.senses.truesight) || 0;
      if (npcData.senses.units) s.units = npcData.senses.units === "Feet" ? "ft" : npcData.senses.units.toLowerCase();
      if (npcData.senses.special !== undefined) s.special = npcData.senses.special;
    }

    // 4. Custom Damage Vulnerabilities
    const dvVal = npcData.damage_vulnerabilities?.value || (Array.isArray(npcData.damage_vulnerabilities) ? npcData.damage_vulnerabilities : (npcData.vulnerabilities?.value || npcData.vulnerabilities));
    if (Array.isArray(dvVal)) {
      if (!dataToImport.system.traits.dv) dataToImport.system.traits.dv = {};
      dataToImport.system.traits.dv.value = dvVal.map(v => String(v).toLowerCase());
    }

    // 5. Custom Damage Resistances
    const drVal = npcData.damage_resistances?.value || (Array.isArray(npcData.damage_resistances) ? npcData.damage_resistances : (npcData.resistances?.value || npcData.resistances));
    if (Array.isArray(drVal)) {
      if (!dataToImport.system.traits.dr) dataToImport.system.traits.dr = {};
      dataToImport.system.traits.dr.value = drVal.map(v => String(v).toLowerCase());
    }

    // 6. Custom Damage Immunities
    const diVal = npcData.damage_immunities?.value || (Array.isArray(npcData.damage_immunities) ? npcData.damage_immunities : (npcData.immunities?.value || npcData.immunities));
    if (Array.isArray(diVal)) {
      if (!dataToImport.system.traits.di) dataToImport.system.traits.di = {};
      dataToImport.system.traits.di.value = diVal.map(v => String(v).toLowerCase());
    }

    // 7. Custom Condition Immunities
    const ciVal = npcData.condition_immunities?.value || (Array.isArray(npcData.condition_immunities) ? npcData.condition_immunities : []);
    if (Array.isArray(ciVal)) {
      if (!dataToImport.system.traits.ci) dataToImport.system.traits.ci = {};
      dataToImport.system.traits.ci.value = ciVal.map(v => String(v).toLowerCase());
    }

    // 8. Custom Languages
    const langVal = npcData.languages?.value || (Array.isArray(npcData.languages) ? npcData.languages : []);
    if (Array.isArray(langVal)) {
      if (!dataToImport.system.traits.languages) dataToImport.system.traits.languages = {};
      dataToImport.system.traits.languages.value = langVal.map(v => String(v).toLowerCase());
    }

    // 9. Custom AC
    if (npcData.ac !== undefined) {
      if (!dataToImport.system.attributes.ac) dataToImport.system.attributes.ac = {};
      const acVal = typeof npcData.ac === "object" ? (npcData.ac.value ?? npcData.ac.flat) : Number(npcData.ac);
      if (acVal !== undefined && !isNaN(acVal)) {
        dataToImport.system.attributes.ac.flat = Number(acVal);
        dataToImport.system.attributes.ac.calc = "flat";
      }
    }

    // 10. Custom Alignment, CR, Size, Type
    if (npcData.alignment) {
      if (!dataToImport.system.details) dataToImport.system.details = {};
      dataToImport.system.details.alignment = npcData.alignment;
    }
    if (npcData.cr !== undefined) {
      if (!dataToImport.system.details) dataToImport.system.details = {};
      dataToImport.system.details.cr = Number(npcData.cr);
    }
    if (npcData.creature_type) {
      if (!dataToImport.system.details) dataToImport.system.details = {};
      if (!dataToImport.system.details.type) dataToImport.system.details.type = {};
      dataToImport.system.details.type.value = npcData.creature_type;
    }
    if (npcData.size) {
      const vttSize = typeof npcData.size === "object" ? (npcData.size.vtt_size || npcData.size.general) : npcData.size;
      if (vttSize) {
        dataToImport.system.traits.size = vttSize;
      }
    }

    let existingItems = Array.isArray(dataToImport.items) && dataToImport.items.length > 0
      ? dataToImport.items
      : [
          ...(npcData.features || []),
          ...(npcData.actions || []),
          ...(npcData.reactions || []),
          ...(npcData.legendary_actions || []),
        ];

    const nonSpellItems = existingItems.filter((it) => (it?.type || "").toLowerCase() !== "spell");
    const spellsFromCol = Array.isArray(npcData.spells) ? npcData.spells : [];
    const combined = [...nonSpellItems, ...spellsFromCol];

    const uniqueItems = [];
    const seen = new Set();
    for (const item of combined) {
      if (!item || !item.name) continue;
      const key = `${(item.type || "item").toLowerCase()}:${item.name.trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueItems.push(item);
    }
    dataToImport.items = uniqueItems;
  } else {
    // Player Character
    if (!char.fvtt_format || typeof char.fvtt_format !== "object" || Object.keys(char.fvtt_format).length === 0) {
      ui.notifications?.warn(`Character "${char.name}" does not have a valid FVTT format. Please save/update the character in Ignite Character Maker first.`);
      return;
    }
    dataToImport = foundry.utils.deepClone(char.fvtt_format);
  }

  if (!dataToImport || typeof dataToImport !== "object") {
    ui.notifications?.error(`Failed to construct data for "${char.name}".`);
    return;
  }

function formatHabitatForFoundry(habitatInput) {
  if (!habitatInput) return { value: [], custom: "" };
  let arr = [];
  if (Array.isArray(habitatInput)) {
    arr = habitatInput;
  } else if (typeof habitatInput === "string") {
    const trimmed = habitatInput.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatHabitatForFoundry(parsed);
      } catch (e) {
        arr = trimmed.split(/[,;]/).map((s) => s.trim());
      }
    } else {
      arr = trimmed.split(/[,;]/).map((s) => s.trim());
    }
  } else if (typeof habitatInput === "object" && habitatInput !== null) {
    if (habitatInput.value && Array.isArray(habitatInput.value)) {
      return {
        value: habitatInput.value,
        custom: habitatInput.custom || ""
      };
    }
    if (habitatInput.selected || habitatInput.customText) {
      arr = [...(habitatInput.selected || []), ...(habitatInput.customText ? habitatInput.customText.split(";") : [])];
    }
  }

  const standardHabitats = [
    "any", "arctic", "coastal", "desert", "forest",
    "grassland", "hill", "mountain", "planar", "swamp",
    "underdark", "underwater", "urban"
  ];

  const value = [];
  const customParts = [];

  arr.forEach((item) => {
    if (typeof item === "string") {
      const clean = item.trim();
      const lower = clean.toLowerCase();
      if (standardHabitats.includes(lower)) {
        if (!value.some((h) => h.type === lower)) {
          value.push({ type: lower });
        }
      } else if (clean) {
        customParts.push(clean);
      }
    } else if (typeof item === "object" && item !== null) {
      if (item.type) {
        const lower = String(item.type).toLowerCase().trim();
        if (!value.some((h) => h.type === lower)) {
          value.push({ type: lower });
        }
      }
    }
  });

  return {
    value: value,
    custom: customParts.join("; ")
  };
}

function formatTreasureForFoundry(treasureInput) {
  if (!treasureInput) return { value: [] };
  let arr = [];
  if (Array.isArray(treasureInput)) {
    arr = treasureInput;
  } else if (typeof treasureInput === "string") {
    const trimmed = treasureInput.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatTreasureForFoundry(parsed);
      } catch (e) {
        arr = trimmed.split(/[,;]/).map((s) => s.trim());
      }
    } else {
      arr = trimmed.split(/[,;]/).map((s) => s.trim());
    }
  } else if (typeof treasureInput === "object" && treasureInput !== null) {
    if (treasureInput.value && Array.isArray(treasureInput.value)) {
      return { value: treasureInput.value };
    }
  }

  const standardTreasures = [
    "arcana", "armaments", "implements", "individual",
    "nature", "relics", "valuables"
  ];

  const value = [];
  arr.forEach((item) => {
    if (typeof item === "string") {
      const lower = item.toLowerCase().trim();
      if (standardTreasures.includes(lower)) {
        if (!value.includes(lower)) {
          value.push(lower);
        }
      }
    }
  });

  return { value: value };
}

  Dialog.confirm({
    title: `Export ${isNpc ? "NPC" : "Character"}`,
    content: `<p>Are you sure you want to export <strong>${char.name}</strong> (${isNpc ? "NPC" : "Player Character"}) to your Foundry VTT Actors list?</p>`,
    yes: async () => {
      try {
        delete dataToImport._id;

        if (isNpc) {
          if (!dataToImport.system) dataToImport.system = {};
          if (!dataToImport.system.details) dataToImport.system.details = {};
          const habitatVal = char.habitat || char.npc_format?.habitat || char.bestiary?.habitat;
          if (habitatVal) {
            dataToImport.system.details.habitat = formatHabitatForFoundry(habitatVal);
          }
          const treasureVal = char.treasure || char.npc_format?.treasure || char.bestiary?.treasure;
          if (treasureVal) {
            dataToImport.system.details.treasure = formatTreasureForFoundry(treasureVal);
          }
        }

        const getStringUrl = (val) => {
          if (!val) return null;
          if (typeof val === "string") return val.trim();
          if (typeof val === "object") {
            return val.src || val.url || val.path || null;
          }
          return null;
        };

        const rawPortrait = getStringUrl(char.art_image) ||
                           getStringUrl(char.npc_format?.img_portrait) ||
                           getStringUrl(char.npc_format?.img_potrait) ||
                           getStringUrl(dataToImport.img) ||
                           "icons/svg/mystery-man.svg";

        const rawToken = getStringUrl(char.token_image) ||
                        getStringUrl(char.npc_format?.img_token) ||
                        getStringUrl(char.bestiary?.img_token) ||
                        getStringUrl(dataToImport.prototypeToken?.texture?.src) ||
                        getStringUrl(dataToImport.prototypeToken?.texture) ||
                        rawPortrait;

        const cleanActorName = (dataToImport.name || char.name || "actor").replace(/[^a-zA-Z0-9_.-]/g, "_");
        const portraitUrl = await downloadAndCacheImageToFoundry(rawPortrait, `${cleanActorName}_portrait`);
        const tokenUrl = await downloadAndCacheImageToFoundry(rawToken, `${cleanActorName}_token`);

        dataToImport.img = portraitUrl;
        if (!dataToImport.prototypeToken || typeof dataToImport.prototypeToken !== "object") {
          dataToImport.prototypeToken = {};
        }
        dataToImport.prototypeToken.name = dataToImport.name || char.name;
        dataToImport.prototypeToken.texture = { src: tokenUrl };

        if (Array.isArray(dataToImport.items)) {
          const sanitized = sanitizeFoundryItems(dataToImport.items);
          const uniqueItems = [];
          const seenKeys = new Set();
          for (const item of sanitized) {
            const key = `${item.type}-${item.name}`;
            if (["spell", "feat", "feature", "race-feat", "race", "class", "subclass"].includes(item.type)) {
              if (seenKeys.has(key)) continue;
              seenKeys.add(key);
            }
            uniqueItems.push(item);
          }
          dataToImport.items = uniqueItems;
        }

        const username = getIgniteUsername(char);
        const userActorFolder = await getOrCreateSilaneUserFolder(username, "Actor");
        const userActorFolderId = userActorFolder?.id || userActorFolder?._id;

        dataToImport.folder = userActorFolderId;

        const newActor = await Actor.create(dataToImport);
        if (newActor) {
          const updateObj = {
            img: portraitUrl,
            prototypeToken: {
              name: newActor.name,
              texture: { src: tokenUrl }
            },
            "prototypeToken.texture.src": tokenUrl
          };
          if (userActorFolderId) updateObj.folder = userActorFolderId;

          // Replace token & portrait on newly created actor
          await newActor.update(updateObj);

          // Replace token & portrait on any existing actor in the world with the same name
          const targetName = newActor.name;
          const matchingActors = game.actors.filter((a) => a.name === targetName);
          for (const actor of matchingActors) {
            try {
              await actor.update({
                img: portraitUrl,
                prototypeToken: {
                  name: actor.name,
                  texture: { src: tokenUrl }
                },
                "prototypeToken.texture.src": tokenUrl
              });
            } catch (e) {}
          }
        }

        if (newActor) {
          if (!isNpc && Array.isArray(dataToImport.items) && dataToImport.items.length > 0) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const exportDate = `${day}-${month}-${year}`;

            const userItemFolder = await getOrCreateSilaneUserFolder(username, "Item");
            const userItemFolderId = userItemFolder?.id || userItemFolder?._id;

            let baseFolderName = `${newActor.name} (${exportDate})`;
            let charFolderName = baseFolderName;
            let counter = 1;
            while (
              game.folders.find(
                (f) =>
                  f.name === charFolderName &&
                  f.type === "Item" &&
                  (f.folder === userItemFolderId || f.folder?.id === userItemFolderId)
              )
            ) {
              charFolderName = `${baseFolderName} (${counter})`;
              counter++;
            }

            const charFolder = await Folder.create({
              name: charFolderName,
              type: "Item",
              folder: userItemFolderId
            });

            const subfolders = {};
            const getOrCreateSubfolder = async (categoryName) => {
              if (subfolders[categoryName]) return subfolders[categoryName];

              const sf = await Folder.create({
                name: categoryName,
                type: "Item",
                folder: charFolder.id
              });
              subfolders[categoryName] = sf;
              return sf;
            };

            for (const itemData of dataToImport.items) {
              const standaloneItemData = foundry.utils.deepClone(itemData);
              delete standaloneItemData._id;

              let category = "Items";
              if (["feat", "feature", "race-feat", "race", "class", "subclass", "background"].includes(itemData.type)) {
                category = "Features";
              } else if (itemData.type === "spell") {
                category = "Spells";
              }

              const sf = await getOrCreateSubfolder(category);
              standaloneItemData.folder = sf.id;
              await Item.create(standaloneItemData);
            }

            ui.notifications?.info(`Success! Actor [${newActor.name}] imported into "Silane Import -> ${username}". Items created under Silane Import -> ${username} -> ${charFolderName}.`);
          } else {
            ui.notifications?.info(`Success! NPC [${newActor.name}] imported into "Silane Import -> ${username}".`);
          }
          newActor.sheet.render(true);
        }
      } catch (error) {
        console.error("Ignite Character VTT Export Error:", error);
        ui.notifications?.error(`Failed to export character: ${error.message}`);
      }
    },
    no: () => {},
    defaultYes: true
  });
}

export function parseImportCodeOrUrl(input) {
  if (!input || typeof input !== "string") return null;
  let str = input.trim();
  if (!str) return null;

  // Handle URL format (e.g. https://projectignite.web.id/characters/private/K4SErZRPaxP1voY9J8QxIv, /aria/..., /characters/...)
  if (str.includes("http://") || str.includes("https://") || str.includes("projectignite") || str.includes("/")) {
    str = str.split("?")[0].split("#")[0].replace(/\/+$/, "");
    const parts = str.split("/");
    str = parts[parts.length - 1] || "";
  }

  return str.trim() || null;
}

export async function importCharacterById(input) {
  let cleanCode = null;
  let searchName = null;
  let inputType = null;

  if (typeof input === "object" && input !== null) {
    cleanCode = parseImportCodeOrUrl(input.id || input.resource_id || input.code);
    searchName = input.name ? String(input.name).trim() : null;
    inputType = input.type || input.typeKey || null;
  } else {
    cleanCode = parseImportCodeOrUrl(input);
  }

  if (!cleanCode && !searchName) {
    ui.notifications?.warn("Please enter or select a valid Private ID, Aria ID, Name, or Link.");
    return;
  }

  const norm = (str) => String(str || "").toLowerCase().trim();

  // 1. Check if actor is already in Foundry VTT game.actors sidebar
  let existingActor = null;
  if (cleanCode) {
    existingActor = game.actors.get(cleanCode);
  }

  if (existingActor) {
    ui.notifications?.info(`Character "${existingActor.name}" is already in your Foundry VTT Actors directory.`);
    existingActor.sheet.render(true);
    return existingActor;
  }

  ui.notifications?.info(`Searching character to import (${searchName || cleanCode})...`);

  // Ensure igniteCharacters array is fetched if empty
  if (!igniteCharacters || igniteCharacters.length === 0) {
    try {
      await fetchIgniteCharacters();
    } catch (e) {}
  }

  // 2. Check local loaded characters first (by ID, Private ID, Public ID, Aria ID, Name, or Full Name)
  let targetChar = igniteCharacters.find((c) => {
    if (cleanCode) {
      const matches = [
        c.id,
        c.private_id,
        c.privateId,
        c.public_id,
        c.publicId,
        c.aria_id,
        c.ariaId
      ].filter(Boolean).map(String);
      if (matches.includes(cleanCode)) return true;
    }
    if (searchName) {
      const targetNorm = norm(searchName);
      if (norm(c.name) === targetNorm || norm(c.full_name) === targetNorm) {
        return true;
      }
    }
    return false;
  });

  // 3. If not found locally, fetch via backend API by code
  if (!targetChar && cleanCode) {
    try {
      const token = localStorage.getItem("heraldSilane_token");
      const res = await fetch(`${API_BASE_URL}/api/silane_assets/ignite-characters/by-code/${encodeURIComponent(cleanCode)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          targetChar = result.data;
        }
      }
    } catch (err) {}
  }

  // 4. Fallback: try public character API route by code
  if (!targetChar && cleanCode) {
    try {
      const directRes = await fetch(`${API_BASE_URL}/characters/private/${encodeURIComponent(cleanCode)}`);
      if (directRes.ok) {
        const result = await directRes.json();
        targetChar = result.character || result.data || result;
      }
    } catch (err) {}
  }

  // 5. Fallback: If searching by name and still not found, fetch all ignite characters list
  if (!targetChar && searchName) {
    try {
      const token = localStorage.getItem("heraldSilane_token");
      const res = await fetch(`${API_BASE_URL}/api/silane_assets/ignite-characters`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const result = await res.json();
        const list = Array.isArray(result.data) ? result.data : [];
        targetChar = list.find(c => norm(c.name) === norm(searchName) || norm(c.full_name) === norm(searchName));
      }
    } catch (err) {}
  }

  // 6. If targetChar found in Ignite, export to Foundry VTT
  if (targetChar) {
    return await exportCharacterToFoundry(targetChar);
  }

  // 7. Fallback for shared Group resources: if searchName is available, create fallback actor directly in Foundry VTT
  if (searchName) {
    try {
      const username = getIgniteUsername();
      const folder = await getOrCreateSilaneUserFolder(username);
      const isNpc = inputType === "npc";
      const createdActor = await Actor.create({
        name: searchName,
        type: isNpc ? "npc" : "character",
        folder: folder?.id || folder?._id,
        img: "icons/svg/mystery-man.svg",
      });
      ui.notifications?.info(`Imported "${searchName}" into Foundry VTT Actors.`);
      createdActor.sheet.render(true);
      return createdActor;
    } catch (err) {
      console.error("Failed to create fallback actor:", err);
    }
  }

  ui.notifications?.error(`Character not found for "${searchName || cleanCode}". Make sure the character exists in Ignite or Foundry.`);
}

export function openImportByCodeDialog() {
  const contentHtml = `
    <div style="display:flex; flex-direction:column; gap:12px; padding: 10px 0;">
      <p style="font-size:13px; color:#f4f4f5; margin:0; line-height:1.4;">
        Paste a <strong style="color:#60a5fa;">Private ID</strong>, <strong style="color:#60a5fa;">Aria ID</strong>, or full <strong style="color:#60a5fa;">Project Ignite URL</strong> below:
      </p>
      <input type="text" id="ig-import-code-input" placeholder="e.g. K4SErZRPaxP1voY9J8QxIv or https://projectignite.web.id/characters/private/K4SErZRPaxP1voY9J8QxIv" style="width:100%; height:38px; padding:0 12px; border-radius:6px; border:1px solid #52525b; background:rgba(0,0,0,0.6); color:#fff; font-size:13px; outline:none;" />
      <p style="font-size:11px; color:#a1a1aa; margin:0; font-style:italic;">
        Supports full URLs (e.g. /characters/private/..., /aria/...) or standalone ID codes.
      </p>
    </div>
  `;

  new Dialog({
    title: "Import Ignite Character by Code or Link",
    content: contentHtml,
    buttons: {
      import: {
        icon: '<i class="fa-solid fa-file-import"></i>',
        label: "Import Character",
        callback: async (html) => {
          const rawInput = html.find("#ig-import-code-input").val();
          await importCharacterById(rawInput);
        }
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: "Cancel"
      }
    },
    default: "import",
    render: (html) => {
      applyDarkThemeToDialog(html);
    }
  }).render(true);
}

function attachEvents() {
  const typeTabs = document.querySelectorAll(".ig-tab-btn[data-filter]");
  typeTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      currentTypeFilter = btn.dataset.filter || "player";
      typeTabs.forEach(b => b.classList.toggle("active", b === btn));
      renderListArea();
    });
  });

  let searchTimeout;
  const searchInput = document.getElementById("ig-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        renderListArea();
      }, 500);
    });
  }

  const importCodeBtn = document.getElementById("ig-import-code-btn");
  if (importCodeBtn) {
    importCodeBtn.addEventListener("click", () => {
      openImportByCodeDialog();
    });
  }

  const listArea = document.getElementById("ig-list-area");
  if (listArea) {
    listArea.addEventListener("click", async (e) => {
      const exportBtn = e.target.closest(".ig-action-export");
      if (exportBtn) {
        e.stopPropagation();
        const id = exportBtn.dataset.id;
        const char = igniteCharacters.find((c) => c.id === id);
        if (char) {
          await exportCharacterToFoundry(char);
        }
        return;
      }

      const card = e.target.closest(".ig-row-card");
      if (card) {
        const id = card.dataset.id;
        if (!id) return;

        if (selectedIgniteCharIds.has(id)) {
          selectedIgniteCharIds.delete(id);
          card.classList.remove("selected");
        } else {
          selectedIgniteCharIds.add(id);
          card.classList.add("selected");
        }
        updateBulkBar();
      }
    });
  }

  const bulkImportBtn = document.getElementById("ig-bulk-import");
  if (bulkImportBtn) {
    bulkImportBtn.addEventListener("click", () => {
      bulkImportIgniteCharacters();
    });
  }

  const bulkSelectAllBtn = document.getElementById("ig-bulk-select-all");
  if (bulkSelectAllBtn) {
    bulkSelectAllBtn.addEventListener("click", () => {
      const query = searchQuery.toLowerCase().trim();
      const filtered = igniteCharacters.filter(char => {
        const isNpc = isNpcChar(char);
        if (currentTypeFilter === "player" && isNpc) return false;
        if (currentTypeFilter === "npc" && !isNpc) return false;

        if (!query) return true;
        return (
          (char.name || "").toLowerCase().includes(query) ||
          (char.full_name || "").toLowerCase().includes(query)
        );
      });

      filtered.forEach(c => selectedIgniteCharIds.add(c.id));
      renderListArea();
      updateBulkBar();
    });
  }

  const bulkDeselectBtn = document.getElementById("ig-bulk-deselect");
  if (bulkDeselectBtn) {
    bulkDeselectBtn.addEventListener("click", () => {
      selectedIgniteCharIds.clear();
      renderListArea();
      updateBulkBar();
    });
  }
}
