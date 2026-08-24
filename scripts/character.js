import { API_BASE_URL, downloadAndCacheImageToFoundry, sanitizeFoundryItems } from "./helper.js";
let characterData = { items: [] };
let currentFolderId = null;
let parentContainer = null;
let searchQuery = "";
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const formatExportDate = (val) => {
  if (!val) return "Unknown Time";
  const date = new Date(
    typeof val === "string" && !isNaN(Number(val)) ? Number(val) : val,
  );
  if (isNaN(date.getTime())) return "Unknown Time";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};
const formatCharacterUrl = (link) => {
  if (
    !link ||
    link === "null" ||
    link === "undefined" ||
    String(link).trim() === ""
  ) {
    return "icons/svg/mystery-man.svg";
  }
  if (link.startsWith("http") || link.startsWith("data:")) {
    return link;
  }
  if (link.includes("sih4storage.phanneldeliver.my.id")) {
    return link.startsWith("https://") ? link : `https://${link}`;
  }
  let cleanLink = link.startsWith("/") ? link.slice(1) : link;
  cleanLink = encodeURI(cleanLink).replace(/'/g, "%27");
  return `${window.location.origin}/${cleanLink}`;
};
const injectCharacterStyles = () => {
  if (document.getElementById("character-modern-styles")) return;
  const style = document.createElement("style");
  style.id = "character-modern-styles";
  style.innerHTML = `
    .ch-container { display: flex; flex-direction: column; height: 100%; width: 100%; color: #f4f4f5; padding-top: 5px; }
    .ch-breadcrumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 0 2px; flex-wrap: wrap; user-select: none; }
    .ch-bc-item { display: flex; align-items: center; gap: 6px; color: #a1a1aa; font-size: 13px; font-weight: 500; cursor: pointer; transition: color 0.2s; padding: 4px 6px; border-radius: 4px; }
    .ch-bc-item:hover { color: #f4f4f5; background: rgba(255,255,255,0.05); }
    .ch-bc-item.active { color: #10b981; cursor: default; pointer-events: none; background: transparent; }
    .ch-bc-separator { color: #52525b; font-size: 10px; }
    .ch-action-bar { display: flex; gap: 20px; margin-bottom: 20px; align-items: center; justify-content: space-between; }
    .ch-search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 0 15px; height: 40px; transition: border-color 0.2s; }
    .ch-search-box:focus-within { border-color: #10b981; }
    .ch-search-box input { background: transparent; border: none; color: #f4f4f5; width: 100%; margin-left: 10px; outline: none; font-size: 14px; }
    .ch-btn-upload-char { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
    .ch-btn-upload-char:hover { background: #10b981; color: #000; }
    .ch-btn-select-actor { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
    .ch-btn-select-actor:hover { background: #3b82f6; color: #fff; }
    .ch-btn-folder { background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf24; color: #fbbf24; width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 14px; }
    .ch-btn-folder:hover { background: #fbbf24; color: #000; }
    .ch-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .ch-list-area::-webkit-scrollbar { width: 6px; }
    .ch-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    .ch-row-card { display: flex; align-items: center; padding: 8px 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid #3f3f46; border-radius: 8px; transition: all 0.2s; user-select: none; gap: 12px; }
    .ch-row-card.clickable:hover { background: rgba(0, 0, 0, 0.5); border-color: #52525b; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .ch-row-card.drag-over { border-color: #10b981 !important; background: rgba(16, 185, 129, 0.05) !important; }
    .ch-card-avatar { width: 48px; height: 48px; border-radius: 4px; border: 1px solid #52525b; overflow: hidden; background: #18181b; flex-shrink: 0; display: flex; align-items:center; justify-content:center;}
    .ch-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .ch-card-info { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ch-card-name { font-size: 15px; font-weight: 700; color: #f4f4f5; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px;}
    .ch-card-detail { font-size: 11px; color: #a1a1aa; display: flex; align-items: center; gap: 6px; margin-bottom: 2px; font-family: monospace; }
    .ch-card-meta { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; min-width: 100px; text-align: right; border-right: 1px solid #3f3f46; padding-right: 12px;}
    .ch-meta-top { font-size: 12px; margin-bottom: 2px; display:flex; gap: 4px; align-items: center;}
    .ch-meta-sys { color: #fbcfe8; font-weight: 700; }
    .ch-meta-ver { color: #fde047; font-weight: 700; }
    .ch-meta-bot { font-size: 11px; color: #fdba74; font-weight: 600;}
    .ch-meta-size { font-size: 10px; color: #a1a1aa; margin-top: 2px; font-style: italic; }
    .ch-card-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
    .ch-btn-action-box { display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; opacity: 0.85; background: transparent; border: none; padding: 0;}
    .ch-btn-action-box:hover { opacity: 1; transform: scale(1.05); }
    .ch-icon-sq { width: 28px; height: 28px; border: 1px solid; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; background: rgba(0,0,0,0.2);}
    .ch-edit .ch-icon-sq { border-color: #fbbf24; color: #fbbf24; }
    .ch-dl .ch-icon-sq { border-color: #0ea5e9; color: #0ea5e9; }
    .ch-del .ch-icon-sq { border-color: #ef4444; color: #ef4444; }
    .ch-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #71717a; text-align: center; }
    .ch-empty-state i { font-size: 40px; margin-bottom: 15px; opacity: 0.5; }
    .ch-json-upload-box { flex: 1; border: 2px dashed #52525b; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; background: rgba(0,0,0,0.2); position: relative; overflow: hidden; cursor: pointer; transition: all 0.2s; padding: 25px 10px; text-align: center; }
    .ch-json-upload-box:hover { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
    .vs-actor-grid-wrapper { background: rgba(0, 0, 0, 0.3); border: 1px solid #3f3f46; border-radius: 4px; padding: 10px; max-height: 250px; overflow-y: auto; }
    .vs-actor-grid-wrapper::-webkit-scrollbar { width: 6px; }
    .vs-actor-grid-wrapper::-webkit-scrollbar-thumb { background: #52525b; border-radius: 10px; }
    .vs-actor-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; width: 100%; }
    .vs-actor-item { position: relative; cursor: pointer; border: 2px solid #27272a; border-radius: 4px; aspect-ratio: 1; overflow: hidden; background: rgba(0,0,0,0.5); transition: all 0.2s;}
    .vs-actor-item:hover { border-color: #52525b; }
    .vs-actor-item.selected { border-color: #60a5fa; background: rgba(96, 165, 250, 0.15); }
    .vs-actor-item img { width: 100%; height: 100%; object-fit: cover; }
    .vs-actor-name { position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0,0,0,0.8); color: #f4f4f5; font-size: 10px; padding: 4px 2px; text-align: center; box-sizing: border-box; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
    .vs-actor-item:hover .vs-actor-name, .vs-actor-item.selected .vs-actor-name { opacity: 1; }
    .hs-character-name-only-mode .ch-row-card { padding: 4px 8px; gap: 10px; min-height: 36px; border-radius: 4px; }
    .hs-character-name-only-mode .ch-card-avatar { width: 28px; height: 28px; border-radius: 3px; }
    .hs-character-name-only-mode .ch-row-card[data-target="folder"] .ch-card-avatar i { font-size: 14px !important; }
    .hs-character-name-only-mode .ch-card-detail { display: none !important; }
    .hs-character-name-only-mode .ch-meta-size { display: none !important; }
    .hs-character-name-only-mode .ch-card-name { font-size: 14px; font-weight: 500; margin: 0; line-height: 1.2; }
    .hs-character-name-only-mode .ch-card-meta { flex-direction: row; gap: 8px; align-items: center; border-right: 1px solid #3f3f46; padding-right: 10px; min-width: auto; justify-content: flex-end;}
    .hs-character-name-only-mode .ch-meta-top { margin: 0; font-size: 11px; }
    .hs-character-name-only-mode .ch-meta-bot { font-size: 10px; margin: 0; }
    .hs-character-name-only-mode .ch-btn-action-box { transform: scale(0.85); padding: 0; }
    .hs-character-name-only-mode .ch-icon-sq { width: 26px; height: 26px; font-size: 11px; border-radius: 4px;}
  `;
  document.head.appendChild(style);
};
export async function initCharacterTab(container) {
  parentContainer = container;
  injectCharacterStyles();
  parentContainer.innerHTML = `<div style="display:flex; justify-content:center; padding:40px; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  await fetchCharacterData();
  renderCharacterUI();
}
async function fetchCharacterData() {
  try {
    const token = localStorage.getItem("heraldSilane_token");
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const result = await response.json();
      characterData =
        result.data.character && result.data.character.items
          ? result.data.character
          : { items: [] };
    }
  } catch (error) {
    console.error("Failed to fetch Character data", error);
  }
}
async function saveCharacterData() {
  try {
    const token = localStorage.getItem("heraldSilane_token");
    await fetch(`${API_BASE_URL}/api/silane_assets/character/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ character: characterData }),
    });
  } catch (error) {
    ui.notifications?.error("Failed to save Character data");
  }
}
function renderCharacterUI() {
  if (!parentContainer) return;
  parentContainer.innerHTML = `
    <div class="ch-container">
      <div id="ch-breadcrumbs" class="ch-breadcrumbs"></div>
      <div class="ch-action-bar">
        <div class="ch-search-box">
          <i class="fa-solid fa-search" style="color: #71717a;"></i>
          <input type="text" id="ch-search-input" placeholder="Search Character..." />
        </div>
        <div style="display:flex; gap:12px;">
          <button id="ch-btn-add-folder" class="ch-btn-folder" title="New Folder">
            <i class="fa-solid fa-folder-plus"></i>
          </button>
          <button id="ch-btn-add-profile" class="ch-btn-upload-char" style="font-size: 12px; padding: 0 12px; height: 36px; white-space: nowrap;">
            <i class="fa-solid fa-file-import" style="font-size: 14px;"></i> Upload JSON
          </button>
          <button id="ch-btn-select-actor" class="ch-btn-select-actor" title="Select from World" style="font-size: 12px; padding: 0 12px; height: 36px; white-space: nowrap;">
            <i class="fa-solid fa-user-check" style="font-size: 14px;"></i> Select Character
          </button>
        </div>
      </div>
      <div id="ch-list-area" class="ch-list-area"></div>
    </div>
  `;
  renderListArea();
  attachCharacterEvents();
}
function updateBreadcrumbs() {
  const container = document.getElementById("ch-breadcrumbs");
  if (!container) return;
  let path = [];
  let current = characterData.items.find((i) => i.id === currentFolderId);
  while (current) {
    path.unshift(current);
    current = characterData.items.find((i) => i.id === current.parentId);
  }
  let html = `<div class="ch-bc-item ${!currentFolderId ? "active" : ""}" data-id="root"><i class="fa-solid fa-home"></i> Root</div>`;
  path.forEach((folder) => {
    html += `<i class="fa-solid fa-chevron-right ch-bc-separator"></i>`;
    const isActive = folder.id === currentFolderId ? "active" : "";
    html += `<div class="ch-bc-item ${isActive}" data-id="${folder.id}">${folder.name}</div>`;
  });
  container.innerHTML = html;
}
function renderListArea() {
  const listArea = document.getElementById("ch-list-area");
  let html = "";
  const query = searchQuery.toLowerCase();
  updateBreadcrumbs();
  const detailMode =
    game.settings.get("heralds-silane", "characterDetailMode") || "all";
  if (detailMode === "nameOnly") {
    listArea.classList.add("hs-character-name-only-mode");
  } else {
    listArea.classList.remove("hs-character-name-only-mode");
  }
  const itemsToDisplay = characterData.items.filter((i) => {
    if (query) {
      return i.name.toLowerCase().includes(query);
    } else {
      return i.parentId === currentFolderId;
    }
  });
  if (characterData.items.length === 0) {
    html = `
      <div class="ch-empty-state">
        <i class="fa-solid fa-address-book"></i>
        <div style="font-size:16px; font-weight:500; color:#d4d4d8;">Character Roster is empty</div>
        <div style="font-size:13px; margin-top:5px;">Create a Folder or Import a JSON to begin.</div>
      </div>`;
  } else if (itemsToDisplay.length === 0) {
    html += `<div class="ch-empty-state"><div style="font-size:15px;">No items found.</div></div>`;
  } else {
    itemsToDisplay
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      })
      .forEach((item) => {
        if (item.type === "folder") {
          const fColor = item.folderColor || "#fbbf24";
          const bColor = item.borderColor || "#fbbf24";
          html += `
          <div class="ch-row-card clickable ch-item-click" draggable="true" data-target="folder" data-id="${item.id}">
            <div class="ch-card-avatar" style="border-color:${bColor};"><i class="fa-solid fa-folder" style="color: ${fColor}; font-size: 24px;"></i></div>
            <div class="ch-card-info"><div class="ch-card-name">${item.name}</div></div>
            <div class="ch-card-meta" style="border:none;"></div>
            <div class="ch-card-actions">
              <button class="ch-btn-action-box ch-edit ch-action-edit" data-id="${item.id}" title="Folder Settings">
                <div class="ch-icon-sq"><i class="fa-solid fa-gear"></i></div>
              </button>
              <button class="ch-btn-action-box ch-del ch-action-delete" data-id="${item.id}" title="Delete Folder">
                <div class="ch-icon-sq"><i class="fa-solid fa-trash"></i></div>
              </button>
            </div>
          </div>
        `;
        } else {
          const fvtt = item.fvtt_data || {};
          const stats = fvtt._stats || {};
          const exportSource = stats.exportSource || {};
          const tokenImgSrc =
            item.tokenUrl ||
            fvtt.img ||
            fvtt.prototypeToken?.texture?.src ||
            "";
          const exportTimeRaw =
            item.export_time || stats.createdTime || stats.modifiedTime;
          const exportTime = formatExportDate(exportTimeRaw);
          const worldId =
            item.world_id || exportSource.worldId || "Unknown World";
          const system =
            item.metadata?.system ||
            stats.systemId ||
            exportSource.systemId ||
            "Unknown";
          const sysVer =
            item.metadata?.systemVersion ||
            stats.systemVersion ||
            exportSource.systemVersion ||
            "";
          const coreVer =
            item.metadata?.core_version ||
            stats.coreVersion ||
            exportSource.coreVersion ||
            "";
          let jsonSizeStr = "Unknown Size";
          try {
            const sizeBytes = new Blob([JSON.stringify(fvtt)]).size;
            if (sizeBytes > 1024 * 1024)
              jsonSizeStr = (sizeBytes / (1024 * 1024)).toFixed(2) + " MB";
            else jsonSizeStr = (sizeBytes / 1024).toFixed(2) + " KB";
          } catch (e) {}
          html += `
          <div class="ch-row-card clickable ch-profile-click" draggable="true" data-id="${item.id}">
            <div class="ch-card-avatar"><img src="${formatCharacterUrl(tokenImgSrc)}" onerror="this.src='icons/svg/mystery-man.svg'" /></div>
            <div class="ch-card-info">
               <div class="ch-card-name">${item.name}</div>
               <div class="ch-card-detail"><i class="fa-regular fa-clock"></i> ${exportTime}</div>
               <div class="ch-card-detail"><i class="fa-solid fa-globe"></i> ${worldId}</div>
            </div>
            <div class="ch-card-meta">
               <div class="ch-meta-top"><span class="ch-meta-sys">${system}</span> ${sysVer ? `<span class="ch-meta-ver">(${sysVer})</span>` : ""}</div>
               <div class="ch-meta-bot">coreVersion ${coreVer}</div>
               <div class="ch-meta-size">${jsonSizeStr}</div>
            </div>
            <div class="ch-card-actions">
              <button class="ch-btn-action-box ch-edit ch-action-edit" data-id="${item.id}" title="Edit Profile">
                <div class="ch-icon-sq"><i class="fa-solid fa-pen"></i></div>
              </button>
              <button class="ch-btn-action-box ch-dl ch-action-download" data-id="${item.id}" title="Import Character to World">
                <div class="ch-icon-sq"><i class="fa-solid fa-download"></i></div>
              </button>
              <button class="ch-btn-action-box ch-del ch-action-delete" data-id="${item.id}" title="Delete Character">
                <div class="ch-icon-sq"><i class="fa-solid fa-trash"></i></div>
              </button>
            </div>
          </div>
        `;
        }
      });
  }
  listArea.innerHTML = html;
}
async function importCharacterToFoundry(characterItem) {
  if (!characterItem || !characterItem.fvtt_data) {
    ui.notifications?.warn("No JSON data found for this character.");
    return;
  }
  const actorData = characterItem.fvtt_data;
  try {
    ui.notifications?.info(`Importing ${actorData.name} into Foundry...`);
    const dataToImport = foundry.utils.deepClone(actorData);
    delete dataToImport._id;

    const cleanCharName = (dataToImport.name || "character").replace(/[^a-zA-Z0-9_.-]/g, "_");
    const rawPortrait = dataToImport.img || "icons/svg/mystery-man.svg";
    const rawToken = dataToImport.prototypeToken?.texture?.src || rawPortrait;

    const portraitUrl = await downloadAndCacheImageToFoundry(rawPortrait, `${cleanCharName}_portrait`);
    const tokenUrl = await downloadAndCacheImageToFoundry(rawToken, `${cleanCharName}_token`);

    dataToImport.img = portraitUrl;
    if (!dataToImport.prototypeToken) dataToImport.prototypeToken = {};
    if (!dataToImport.prototypeToken.texture) dataToImport.prototypeToken.texture = {};
    dataToImport.prototypeToken.texture.src = tokenUrl;

    if (Array.isArray(dataToImport.items)) {
      dataToImport.items = sanitizeFoundryItems(dataToImport.items);
    }

    const newActor = await Actor.create(dataToImport);
    if (newActor) {
      await newActor.update({
        img: portraitUrl,
        "prototypeToken.texture.src": tokenUrl
      });
      ui.notifications?.info(
        `Success! Actor [${newActor.name}] has been created.`,
      );
      newActor.sheet.render(true);
    }
  } catch (error) {
    console.error("Herald Silane Import Error:", error);
    ui.notifications?.error(`Failed to import character: ${error.message}`);
  }
}
function attachCharacterEvents() {
  let searchTimeout;
  document.getElementById("ch-breadcrumbs").addEventListener("click", (e) => {
    const item = e.target.closest(".ch-bc-item");
    if (!item || item.classList.contains("active")) return;
    const id = item.dataset.id;
    currentFolderId = id === "root" ? null : id;
    renderListArea();
  });
  document.getElementById("ch-search-input").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderListArea();
    }, 1000);
  });
  document
    .getElementById("ch-list-area")
    .addEventListener("click", async (e) => {
      if (e.target.closest(".ch-action-edit")) {
        const id = e.target.closest(".ch-action-edit").dataset.id;
        const item = characterData.items.find((i) => i.id === id);
        if (item.type === "folder") {
          showFolderForm("Edit Folder", item, async (data) => {
            Object.assign(item, data);
            renderListArea();
            await saveCharacterData();
          });
        } else {
          showProfileForm("Edit Character Asset", item, async (data) => {
            Object.assign(item, data);
            renderListArea();
            await saveCharacterData();
          });
        }
        return;
      }
      if (e.target.closest(".ch-action-delete")) {
        const id = e.target.closest(".ch-action-delete").dataset.id;
        Dialog.confirm({
          title: "Confirm Deletion",
          content:
            "<p>Are you sure you want to delete this character/folder?</p>",
          yes: async () => {
            const idsToDelete = getNestedItemIds(characterData.items, id);
            characterData.items = characterData.items.filter(
              (i) => !idsToDelete.includes(i.id),
            );
            renderListArea();
            await saveCharacterData();
            ui.notifications?.info("Item deleted.");
          },
          defaultYes: false,
        });
        return;
      }
      if (e.target.closest(".ch-action-download")) {
        const id = e.target.closest(".ch-action-download").dataset.id;
        const item = characterData.items.find((i) => i.id === id);
        if (item && item.type === "character") {
          await importCharacterToFoundry(item);
        }
        return;
      }
      const folderRow = e.target.closest(".ch-item-click");
      if (folderRow && folderRow.dataset.target === "folder") {
        currentFolderId = folderRow.dataset.id;
        renderListArea();
        return;
      }
    });
  document.getElementById("ch-btn-add-folder").addEventListener("click", () => {
    showFolderForm("Create New Folder", null, async (data) => {
      characterData.items.push({
        id: generateUUID(),
        type: "folder",
        parentId: currentFolderId,
        name: data.name,
        folderColor: data.folderColor,
        borderColor: data.borderColor,
        syncColors: data.syncColors,
      });
      renderListArea();
      await saveCharacterData();
    });
  });
  document
    .getElementById("ch-btn-add-profile")
    .addEventListener("click", () => {
      showProfileForm("Import Character JSON", null, async (data) => {
        characterData.items.push({
          id: generateUUID(),
          type: "character",
          parentId: currentFolderId,
          ...data,
        });
        renderListArea();
        await saveCharacterData();
      });
    });
  document
    .getElementById("ch-btn-select-actor")
    .addEventListener("click", () => {
      showActorSelectorDialog(async (actor) => {
        const actorDataSnapshot = foundry.utils.deepClone(actor.toObject());
        delete actorDataSnapshot._id;
        characterData.items.push({
          id: generateUUID(),
          type: "character",
          parentId: currentFolderId,
          name: actor.name,
          fvtt_data: actorDataSnapshot,
          export_time: Date.now(),
          world_id: game.world.id,
          metadata: {
            system: game.system.id,
            systemVersion: game.system.version,
            core_version: game.version,
          },
        });
        renderListArea();
        await saveCharacterData();
        ui.notifications?.info(`Character ${actor.name} saved to Silane.`);
      });
    });
  const listArea = document.getElementById("ch-list-area");
  const breadcrumbs = document.getElementById("ch-breadcrumbs");
  let draggedItemId = null;
  listArea.addEventListener("dragstart", (e) => {
    const row = e.target.closest(".ch-row-card");
    if (!row) return;
    draggedItemId = row.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    row.style.opacity = "0.5";
  });
  listArea.addEventListener("dragend", (e) => {
    const row = e.target.closest(".ch-row-card");
    if (row) row.style.opacity = "1";
    draggedItemId = null;
    document
      .querySelectorAll(".ch-row-card")
      .forEach((el) => el.classList.remove("drag-over"));
  });
  listArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    const targetRow = e.target.closest(".ch-row-card[data-target='folder']");
    if (targetRow && targetRow.dataset.id !== draggedItemId) {
      targetRow.classList.add("drag-over");
    }
  });
  listArea.addEventListener("dragleave", (e) => {
    const targetRow = e.target.closest(".ch-row-card[data-target='folder']");
    if (targetRow) targetRow.classList.remove("drag-over");
  });
  listArea.addEventListener("drop", async (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".ch-row-card")
      .forEach((el) => el.classList.remove("drag-over"));
    const targetRow = e.target.closest(".ch-row-card[data-target='folder']");
    if (targetRow && draggedItemId && targetRow.dataset.id !== draggedItemId) {
      const targetFolderId = targetRow.dataset.id;
      const itemToMove = characterData.items.find(
        (i) => i.id === draggedItemId,
      );
      if (itemToMove) {
        if (itemToMove.type === "folder") {
          const nestedIds = getNestedItemIds(
            characterData.items,
            draggedItemId,
          );
          if (nestedIds.includes(targetFolderId)) return;
        }
        itemToMove.parentId = targetFolderId;
        renderListArea();
        await saveCharacterData();
      }
    }
  });
  breadcrumbs.addEventListener("dragover", (e) => {
    e.preventDefault();
    const bcItem = e.target.closest(".ch-bc-item:not(.active)");
    if (bcItem) bcItem.style.background = "rgba(255,255,255,0.1)";
  });
  breadcrumbs.addEventListener("dragleave", (e) => {
    const bcItem = e.target.closest(".ch-bc-item:not(.active)");
    if (bcItem) bcItem.style.background = "";
  });
  breadcrumbs.addEventListener("drop", async (e) => {
    e.preventDefault();
    const bcItem = e.target.closest(".ch-bc-item:not(.active)");
    if (bcItem) bcItem.style.background = "";
    if (bcItem && draggedItemId) {
      const targetFolderId =
        bcItem.dataset.id === "root" ? null : bcItem.dataset.id;
      const itemToMove = characterData.items.find(
        (i) => i.id === draggedItemId,
      );
      if (itemToMove && itemToMove.parentId !== targetFolderId) {
        if (itemToMove.type === "folder") {
          const nestedIds = getNestedItemIds(
            characterData.items,
            draggedItemId,
          );
          if (nestedIds.includes(targetFolderId)) return;
        }
        itemToMove.parentId = targetFolderId;
        renderListArea();
        await saveCharacterData();
      }
    }
  });
}
function getNestedItemIds(items, targetId) {
  let ids = [targetId];
  let children = items.filter((i) => i.parentId === targetId);
  children.forEach((child) => {
    ids = ids.concat(getNestedItemIds(items, child.id));
  });
  return ids;
}
function showActorSelectorDialog(onConfirm) {
  const actors = game.actors.filter(
    (a) => a.ownership[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
  );
  if (actors.length === 0) return ui.notifications?.warn("You do not own any characters in this world.");
  const actorGridHtml = actors
    .map(
      (a) => `
    <div class="vs-actor-item" data-id="${a.id}" data-name="${a.name.toLowerCase()}">
      <img src="${a.img}" onerror="this.src='icons/svg/mystery-man.svg'">
      <div class="vs-actor-name">${a.name}</div>
    </div>`,
    )
    .join("");
  const content = `
    <div style="color:#f4f4f5; padding-bottom: 5px;">
      <div style="font-size: 13px; margin-bottom: 12px; color: #a1a1aa;">Select Actor to Snapshot:</div>
      <input type="text" id="vs-actor-filter" style="width:100%; margin-bottom:10px; background:rgba(0,0,0,0.4); border:1px solid #3f3f46; color:white; padding:8px; border-radius:4px; outline:none;" placeholder="Search character...">
      <div class="vs-actor-grid-wrapper">
        <div class="vs-actor-grid" id="vs-actor-grid">${actorGridHtml}</div>
      </div>
    </div>
  `;
  let selectedId = null;
  new Dialog(
    {
      title: "Select World Character",
      content: content,
      buttons: {
        confirm: {
          label: "Confirm",
          callback: (html) => {
            if (!selectedId) return;
            const actor = game.actors.get(selectedId);
            if (actor) onConfirm(actor);
          },
        },
        cancel: { label: "Cancel" },
      },
      render: (html) => {
        const dialogElement = html.closest(".app")[0];
        const contentElement = dialogElement.querySelector(".window-content");
        if (contentElement) {
          contentElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          contentElement.style.color = "white";
          contentElement.style.backgroundImage = "none";
          contentElement.style.backgroundSize = "cover";
          contentElement.style.backgroundRepeat = "no-repeat";
          contentElement.style.backgroundPosition = "center";
        }
        html.closest(".dialog").find(".dialog-buttons button").css({
          color: "white",
          border: "1px solid white",
          background: "transparent",
          borderRadius: "4px",
        });
        html.find(".vs-actor-item").on("click", function () {
          html.find(".vs-actor-item").removeClass("selected");
          $(this).addClass("selected");
          selectedId = $(this).data("id");
        });
        html.find("#vs-actor-filter").on("input", function () {
          const query = $(this).val().toLowerCase();
          html.find(".vs-actor-item").each(function () {
            $(this).toggle($(this).data("name").includes(query));
          });
        });
      },
    },
    { width: 420 },
  ).render(true);
}
function showFolderForm(title, existingData, onConfirm) {
  const data = existingData || {
    name: "",
    folderColor: "#fbbf24",
    borderColor: "#fbbf24",
    syncColors: true,
  };
  const isSyncChecked = data.syncColors !== false;
  const fColor = data.folderColor || "#fbbf24";
  const bColor = data.borderColor || "#fbbf24";
  const content = `
    <div class="silane-form-group" style="padding: 10px 0;">
      <label style="color: #a1a1aa; font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Folder Name</label>
      <input type="text" id="ch-modal-name" value="${data.name}" placeholder="e.g. NPC" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 10px 12px; color: #f4f4f5; outline: none;" />
    </div>
    <div class="silane-form-group" style="margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 10px; border: 1px solid #3f3f46; border-radius: 6px;">
      <label style="display: block; margin-bottom: 8px; font-weight: bold; color: white;">Color Settings</label>
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
        <span style="width: 85px; font-size: 13px; color: #d4d4d8;">Folder Color</span>
        <input type="color" id="ch-modal-folderColor" value="${fColor}" style="width: 40px; height: 32px; padding: 0; border: 1px solid #52525b; background: rgba(0,0,0,0.5); cursor: pointer;" />
        <input type="text" id="ch-modal-folderColorText" value="${fColor}" class="silane-input" style="flex: 1; padding: 5px; background: rgba(0,0,0,0.5); color: white !important; border: 1px solid #52525b;" />
      </div>
      <div style="display: flex; gap: 8px; align-items: center; font-size: 13px; margin-bottom: 5px;">
        <input type="checkbox" id="ch-modal-syncColors" ${isSyncChecked ? "checked" : ""} style="cursor: pointer; margin: 0; width: 14px; height: 14px;" />
        <label for="ch-modal-syncColors" style="cursor: pointer; color: #a1a1aa; user-select: none;">Use same color for Folder & Border</label>
      </div>
      <div id="ch-modal-border-container" style="display: flex; gap: 10px; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #52525b; opacity: ${isSyncChecked ? "0.4" : "1"}; transition: opacity 0.2s;">
        <span style="width: 85px; font-size: 13px; color: #d4d4d8;">Border Color</span>
        <input type="color" id="ch-modal-borderColor" value="${bColor}" ${isSyncChecked ? "disabled" : ""} style="width: 40px; height: 32px; padding: 0; border: 1px solid #52525b; background: rgba(0,0,0,0.5); cursor: ${isSyncChecked ? "not-allowed" : "pointer"};" />
        <input type="text" id="ch-modal-borderColorText" value="${bColor}" ${isSyncChecked ? "disabled" : ""} class="silane-input" style="flex: 1; padding: 5px; background: rgba(0,0,0,0.5); color: ${isSyncChecked ? "#a1a1aa" : "white"} !important; border: 1px solid #52525b; cursor: ${isSyncChecked ? "not-allowed" : "text"};" />
      </div>
    </div>
  `;
  new Dialog(
    {
      title: title,
      content: content,
      buttons: {
        ok: {
          label: "Confirm",
          callback: (html) => {
            const name = html.find("#ch-modal-name").val().trim();
            if (!name) return ui.notifications?.warn("Name empty.");
            const isSync = html.find("#ch-modal-syncColors").is(":checked");
            const newFColor = html.find("#ch-modal-folderColor").val();
            const newBColor = isSync
              ? newFColor
              : html.find("#ch-modal-borderColor").val();
            onConfirm({
              name,
              folderColor: newFColor,
              borderColor: newBColor,
              syncColors: isSync,
            });
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "ok",
      render: (html) => {
        const dialogElement = html.closest(".app")[0];
        const contentElement = dialogElement.querySelector(".window-content");
        if (contentElement) {
          contentElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          contentElement.style.color = "white";
          contentElement.style.backgroundImage = "none";
          contentElement.style.backgroundSize = "cover";
          contentElement.style.backgroundRepeat = "no-repeat";
          contentElement.style.backgroundPosition = "center";
        }
        html.closest(".dialog").find(".dialog-buttons button").css({
          color: "white",
          border: "1px solid #3f3f46",
          background: "rgba(0,0,0,0.4)",
          borderRadius: "4px",
          transition: "all 0.2s",
        });
        html
          .closest(".dialog")
          .find(".dialog-buttons button")
          .hover(
            function () {
              $(this).css("background", "rgba(16, 185, 129, 0.2)");
            },
            function () {
              $(this).css("background", "rgba(0,0,0,0.4)");
            },
          );
        html.find("#ch-modal-syncColors").on("change", function () {
          const isChecked = $(this).is(":checked");
          const borderContainer = html.find("#ch-modal-border-container");
          const inputColor = html.find("#ch-modal-borderColor");
          const inputText = html.find("#ch-modal-borderColorText");
          if (isChecked) {
            borderContainer.css("opacity", "0.4");
            inputColor.prop("disabled", true).css("cursor", "not-allowed");
            inputText
              .prop("disabled", true)
              .css("cursor", "not-allowed")
              .css("color", "#a1a1aa");
            const folderVal = html.find("#ch-modal-folderColor").val();
            inputColor.val(folderVal);
            inputText.val(folderVal);
          } else {
            borderContainer.css("opacity", "1");
            inputColor.prop("disabled", false).css("cursor", "pointer");
            inputText
              .prop("disabled", false)
              .css("cursor", "text")
              .css("color", "white");
          }
        });
        html
          .find("#ch-modal-folderColor, #ch-modal-folderColorText")
          .on("input", function () {
            const val = $(this).val();
            html.find("#ch-modal-folderColor").val(val);
            html.find("#ch-modal-folderColorText").val(val);
            if (html.find("#ch-modal-syncColors").is(":checked")) {
              html.find("#ch-modal-borderColor").val(val);
              html.find("#ch-modal-borderColorText").val(val);
            }
          });
        html
          .find("#ch-modal-borderColor, #ch-modal-borderColorText")
          .on("input", function () {
            const val = $(this).val();
            html.find("#ch-modal-borderColor").val(val);
            html.find("#ch-modal-borderColorText").val(val);
          });
      },
    },
    {
      width: 400,
      classes: ["dialog", "silane-custom-dialog"],
    },
  ).render(true);
}
function showProfileForm(title, existingData, onConfirm) {
  const data = existingData || { name: "", fvtt_data: null };
  let selectedJsonData = data.fvtt_data || null;
  const content = `
    <div class="silane-upload-wrapper">
      <div style="padding: 5px 0 15px 0; display:flex; flex-direction:column; gap:16px;">
        <div class="ch-json-upload-box" id="box-upload-json">
          <div id="ui-json-default" style="display: ${selectedJsonData ? "none" : "flex"}; color: #a1a1aa; flex-direction: column; align-items: center;">
            <i class="fa-solid fa-file-code fa-2x" style="margin-bottom:8px;"></i>
            <span style="font-size:13px; font-weight:500;">Click to select JSON File</span>
          </div>
          <div id="ui-json-success" style="display: ${selectedJsonData ? "flex" : "none"}; color: #10b981; flex-direction: column; align-items: center;">
            <i class="fa-solid fa-circle-check fa-2x" style="margin-bottom:8px;"></i>
            <span style="font-size:13px; font-weight:500;">JSON Loaded Successfully</span>
          </div>
          <input type="file" id="file-character-json" accept=".json, application/json" style="display:none;" />
        </div>
        <div>
          <label style="color: #a1a1aa; font-size: 12px; font-weight: 500; margin-bottom: 6px; display: block;">Character Name</label>
          <input type="text" id="ch-prof-name" value="${data.name}" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 10px 12px; color: #f4f4f5; outline: none;" placeholder="Name..." />
        </div>
        <div style="display:flex; gap: 10px; margin-top: 10px;">
          <button id="ch-btn-cancel-profile" class="silane-btn" style="flex:1; border-radius:4px; padding:10px; background:rgba(0,0,0,0.3); color:#f4f4f5; border:1px solid #3f3f46; cursor:pointer;">Cancel</button>
          <button id="ch-btn-confirm-profile" class="silane-btn primary" style="flex:1; border-radius:4px; padding:10px; transition:all 0.2s;"></button>
        </div>
      </div>
    </div>
  `;
  let profileDialog = new Dialog(
    {
      title: title,
      content: content,
      buttons: {},
      render: (html) => {
        const box = html[0].querySelector(`#box-upload-json`);
        const input = html[0].querySelector(`#file-character-json`);
        const nameInput = html[0].querySelector(`#ch-prof-name`);
        const btnConfirm = html[0].querySelector("#ch-btn-confirm-profile");
        const setButtonState = (state) => {
          if (state === "need_json") {
            btnConfirm.disabled = true;
            btnConfirm.style.background = "#3f3f46";
            btnConfirm.innerHTML = "Upload JSON First";
          } else if (state === "ready") {
            btnConfirm.disabled = false;
            btnConfirm.style.background = "#3b82f6";
            btnConfirm.innerHTML = "Save";
          }
        };
        setButtonState(selectedJsonData ? "ready" : "need_json");
        box.addEventListener("click", () => input.click());
        input.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              try {
                const parsed = JSON.parse(ev.target.result);
                selectedJsonData = parsed;
                html[0].querySelector("#ui-json-default").style.display =
                  "none";
                html[0].querySelector("#ui-json-success").style.display =
                  "flex";
                if (!nameInput.value && parsed.name)
                  nameInput.value = parsed.name;
                setButtonState("ready");
              } catch (err) {
                ui.notifications?.error("Invalid JSON.");
              }
            };
            reader.readAsText(file);
          }
        });
        html[0]
          .querySelector("#ch-btn-cancel-profile")
          .addEventListener("click", () => profileDialog.close());
        btnConfirm.addEventListener("click", async () => {
          const name = nameInput.value.trim();
          if (!name || !selectedJsonData) return;
          selectedJsonData.name = name;
          onConfirm({ name, fvtt_data: selectedJsonData });
          profileDialog.close();
        });
      },
    },
    { width: 350, classes: ["dialog", "silane-custom-dialog"] },
  );
  profileDialog.render(true);
}
