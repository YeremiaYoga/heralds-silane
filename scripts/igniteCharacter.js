import { API_BASE_URL } from "./helper.js";

let igniteCharacters = [];
let parentContainer = null;
let searchQuery = "";
let currentTypeFilter = "player"; // "player" | "npc"

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
    .ig-container { display: flex; flex-direction: column; height: 100%; width: 100%; color: #f4f4f5; padding-top: 5px; }
    .ig-type-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
    .ig-tab-btn { flex: 1; height: 34px; border-radius: 6px; border: 1px solid #3f3f46; background: rgba(0, 0, 0, 0.25); color: #a1a1aa; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; user-select: none; }
    .ig-tab-btn:hover { border-color: #71717a; color: #f4f4f5; background: rgba(255, 255, 255, 0.05); }
    .ig-tab-btn[data-filter="player"].active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.15); color: #60a5fa; box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
    .ig-tab-btn[data-filter="npc"].active { border-color: #ef4444; background: rgba(239, 68, 68, 0.15); color: #f87171; box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
    
    .ig-action-bar { display: flex; gap: 20px; margin-bottom: 16px; align-items: center; justify-content: space-between; }
    .ig-search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 0 15px; height: 38px; transition: border-color 0.2s; }
    .ig-search-box:focus-within { border-color: #3b82f6; }
    .ig-search-box input { background: transparent; border: none; color: #f4f4f5; width: 100%; margin-left: 10px; outline: none; font-size: 13px; }
    .ig-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .ig-list-area::-webkit-scrollbar { width: 6px; }
    .ig-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    .ig-row-card { display: flex; align-items: center; padding: 10px 14px; background: rgba(0, 0, 0, 0.3); border: 1px solid #3f3f46; border-radius: 8px; transition: all 0.2s; user-select: none; gap: 14px; }
    .ig-row-card:hover { background: rgba(0, 0, 0, 0.5); border-color: #52525b; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
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
      </div>
      <div class="ig-action-bar">
        <div class="ig-search-box">
          <i class="fa-solid fa-search" style="color: #71717a;"></i>
          <input type="text" id="ig-search-input" placeholder="Search Ignite Character..." value="${searchQuery}" />
        </div>
      </div>
      <div id="ig-list-area" class="ig-list-area"></div>
    </div>
  `;

  renderListArea();
  attachEvents();
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
      <div class="ig-row-card">
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

  Dialog.confirm({
    title: `Export ${isNpc ? "NPC" : "Character"}`,
    content: `<p>Are you sure you want to export <strong>${char.name}</strong> (${isNpc ? "NPC" : "Player Character"}) to your Foundry VTT Actors list?</p>`,
    yes: async () => {
      try {
        delete dataToImport._id;

        if (char.art_image) {
          dataToImport.img = char.art_image;
        } else if (!dataToImport.img) {
          dataToImport.img = char.token_image || "icons/svg/mystery-man.svg";
        }

        if (!dataToImport.prototypeToken) dataToImport.prototypeToken = {};
        if (!dataToImport.prototypeToken.texture) dataToImport.prototypeToken.texture = {};
        if (char.token_image) {
          dataToImport.prototypeToken.texture.src = char.token_image;
        } else if (char.art_image && !dataToImport.prototypeToken.texture.src) {
          dataToImport.prototypeToken.texture.src = char.art_image;
        }
        dataToImport.prototypeToken.name = dataToImport.name || char.name;

        if (Array.isArray(dataToImport.items)) {
          const uniqueItems = [];
          const seenKeys = new Set();
          for (const item of dataToImport.items) {
            if (item.type === "spell") {
              if (item.name.endsWith(" (In)") || item.name.endsWith(" (in)")) {
                item.name = item.name.slice(0, -5) + " (IN)";
              } else if (item.name.endsWith("(In)") || item.name.endsWith("(in)")) {
                item.name = item.name.slice(0, -4) + " (IN)";
              }

              if (item.name.endsWith("(In)") || item.name.endsWith("(IN)")) {
                if (!item.system) item.system = {};
                item.system.method = "innate";
                item.system.prepared = 0;
                delete item.system.preparation;
              }
            }

            const key = `${item.type}-${item.name}`;
            if (["spell", "feat", "feature", "race-feat", "race", "class", "subclass"].includes(item.type)) {
              if (seenKeys.has(key)) continue;
              seenKeys.add(key);
            }
            uniqueItems.push(item);
          }
          dataToImport.items = uniqueItems;
        }

        const existingActor = game.actors.find(a => a.name === dataToImport.name);
        if (existingActor) {
          await existingActor.delete();
        }

        const newActor = await Actor.create(dataToImport);
        if (newActor) {
          if (!isNpc && Array.isArray(dataToImport.items) && dataToImport.items.length > 0) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const exportDate = `${day}-${month}-${year}`;

            let rootFolder = game.folders.find(f => f.name === "Silane" && f.type === "Item" && (!f.folder || f.folder === null || f.folder === undefined));
            if (!rootFolder) {
              rootFolder = await Folder.create({
                name: "Silane",
                type: "Item"
              });
            }

            const charFolderName = `${newActor.name} (${exportDate})`;
            let charFolder = game.folders.find(f => f.name === charFolderName && f.type === "Item" && (f.folder === rootFolder.id || f.folder?.id === rootFolder.id));
            if (charFolder) {
              await charFolder.delete({ deleteContents: true });
            }

            charFolder = await Folder.create({
              name: charFolderName,
              type: "Item",
              folder: rootFolder.id
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

            ui.notifications?.info(`Success! Actor [${newActor.name}] and its items under Silane -> ${charFolderName} have been created.`);
          } else {
            ui.notifications?.info(`Success! NPC [${newActor.name}] has been created.`);
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

function attachEvents() {
  const typeTabs = document.querySelectorAll(".ig-tab-btn");
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

  const listArea = document.getElementById("ig-list-area");
  if (listArea) {
    listArea.addEventListener("click", async (e) => {
      const exportBtn = e.target.closest(".ig-action-export");
      if (exportBtn) {
        const id = exportBtn.dataset.id;
        const char = igniteCharacters.find((c) => c.id === id);
        if (char) {
          await exportCharacterToFoundry(char);
        }
      }
    });
  }
}
