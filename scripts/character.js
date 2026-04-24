import { API_BASE_URL } from "./helper.js";

// State Management
let characterData = { items: [] };
let currentFolderId = null;
let parentContainer = null;
let searchQuery = "";

// Helper untuk generate UUID v4 murni (Standar Supabase)
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

// Memperbaiki Format Tanggal
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

// 🔥 URL Cerdas: Deteksi Localhost/Foundry Path vs Eksternal Web
const formatCharacterUrl = (link) => {
  if (!link) return "icons/svg/mystery-man.svg";
  // Jika link adalah eksternal web atau base64 data, langsung pakai
  if (link.startsWith("http") || link.startsWith("data:")) return link;

  // Jika link mengandung domain R2 sebelumnya
  if (link.includes("sih4storage.phanneldeliver.my.id")) {
    return link.startsWith("https://") ? link : `https://${link}`;
  }

  // Jika link adalah file lokal Foundry (cth: "Herald's-Flip/..." atau "icons/..."),
  // tambahkan '/' di depan agar browser otomatis meresolve ke domain/localhost Foundry saat ini.
  return link.startsWith("/") ? link : `/${link}`;
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
    
    .ch-btn-upload-char { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 0 16px; height: 40px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
    .ch-btn-upload-char:hover { background: #10b981; color: #000; }
    
    .ch-btn-folder { background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf24; color: #fbbf24; width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 16px; }
    .ch-btn-folder:hover { background: #fbbf24; color: #000; }

    .ch-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 5px; }
    .ch-list-area::-webkit-scrollbar { width: 6px; }
    .ch-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    
    .ch-row-card { display: flex; align-items: center; padding: 12px 16px; background: rgba(0, 0, 0, 0.3); border: 1px solid #3f3f46; border-radius: 8px; transition: all 0.2s; user-select: none; gap: 15px; }
    .ch-row-card.clickable:hover { background: rgba(0, 0, 0, 0.5); border-color: #52525b; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .ch-row-card.drag-over { border-color: #10b981 !important; background: rgba(16, 185, 129, 0.05) !important; }
    
    .ch-card-avatar { width: 64px; height: 64px; border-radius: 6px; border: 1px solid #52525b; overflow: hidden; background: #18181b; flex-shrink: 0; display: flex; align-items:center; justify-content:center;}
    .ch-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
    
    .ch-card-info { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ch-card-name { font-size: 17px; font-weight: 700; color: #f4f4f5; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px;}
    .ch-card-detail { font-size: 12px; color: #a1a1aa; display: flex; align-items: center; gap: 6px; margin-bottom: 2px; font-family: monospace; }
    
    .ch-card-meta { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; min-width: 120px; text-align: right; border-right: 1px solid #3f3f46; padding-right: 15px;}
    .ch-meta-top { font-size: 14px; margin-bottom: 4px; display:flex; gap: 4px; align-items: center;}
    .ch-meta-sys { color: #fbcfe8; font-weight: 700; } 
    .ch-meta-ver { color: #fde047; font-weight: 700; } 
    .ch-meta-bot { font-size: 12px; color: #fdba74; font-weight: 600;} 
    
    .ch-card-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
    .ch-btn-action-box { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s; opacity: 0.8; background: transparent; border: none; padding: 0;}
    .ch-btn-action-box:hover { opacity: 1; transform: translateY(-2px); }
    .ch-icon-sq { width: 34px; height: 34px; border: 1px solid; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; background: rgba(0,0,0,0.2);}
    .ch-lbl-sq { font-size: 10px; font-weight: 700; }
    
    .ch-dl .ch-icon-sq { border-color: #0ea5e9; color: #0ea5e9; }
    .ch-dl .ch-lbl-sq { color: #0ea5e9; }
    .ch-del .ch-icon-sq { border-color: #ef4444; color: #ef4444; }
    .ch-del .ch-lbl-sq { color: #ef4444; }

    .ch-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #71717a; text-align: center; }
    .ch-empty-state i { font-size: 40px; margin-bottom: 15px; opacity: 0.5; }

    .ch-json-upload-box { flex: 1; border: 2px dashed #52525b; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; background: rgba(0,0,0,0.2); position: relative; overflow: hidden; cursor: pointer; transition: all 0.2s; padding: 25px 10px; text-align: center; }
    .ch-json-upload-box:hover { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
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
          <button id="ch-btn-add-folder" class="ch-btn-folder" title="New Folder"><i class="fa-solid fa-folder-plus"></i></button>
          <button id="ch-btn-add-profile" class="ch-btn-upload-char">
            <i class="fa-solid fa-file-import"></i> Upload Character
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

  // 🔥 Logika Filter Diperbarui untuk Global Search
  const itemsToDisplay = characterData.items.filter((i) => {
    if (query) {
      // Jika sedang mencari, tampilkan semua yang cocok secara menyeluruh
      return i.name.toLowerCase().includes(query);
    } else {
      // Jika tidak mencari, tampilkan hanya item di dalam folder saat ini
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
          html += `
          <div class="ch-row-card clickable ch-item-click" draggable="true" data-target="folder" data-id="${item.id}">
            <div class="ch-card-avatar" style="border-color:#fbbf24;"><i class="fa-solid fa-folder" style="color: #fbbf24; font-size: 28px;"></i></div>
            
            <div class="ch-card-info">
              <div class="ch-card-name">${item.name}</div>
            </div>
            
            <div class="ch-card-meta" style="border:none;"></div>
            
            <div class="ch-card-actions">
              <button class="ch-btn-action-box ch-del ch-action-delete" data-id="${item.id}" title="Delete Folder">
                <div class="ch-icon-sq"><i class="fa-solid fa-trash"></i></div>
                <div class="ch-lbl-sq">Delete</div>
              </button>
            </div>
          </div>
        `;
        } else {
          const fvtt = item.fvtt_data || {};
          const stats = fvtt._stats || {};
          const exportSource = stats.exportSource || {};

          // Image Cerdas (Local Foundry vs Web Absolut)
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

          html += `
          <div class="ch-row-card clickable ch-profile-click" draggable="true" data-id="${item.id}">
            
            <div class="ch-card-avatar">
              <img src="${formatCharacterUrl(tokenImgSrc)}" onerror="this.src='icons/svg/mystery-man.svg'" />
            </div>
            
            <div class="ch-card-info">
               <div class="ch-card-name">${item.name}</div>
               <div class="ch-card-detail"><i class="fa-regular fa-clock"></i> ${exportTime}</div>
               <div class="ch-card-detail"><i class="fa-solid fa-globe"></i> ${worldId}</div>
            </div>
            
            <div class="ch-card-meta">
               <div class="ch-meta-top">
                  <span class="ch-meta-sys">${system}</span> 
                  ${sysVer ? `<span class="ch-meta-ver">(${sysVer})</span>` : ""}
               </div>
               <div class="ch-meta-bot">coreVersion ${coreVer}</div>
            </div>
            
            <div class="ch-card-actions">
              <button class="ch-btn-action-box ch-dl ch-action-download" data-id="${item.id}">
                <div class="ch-icon-sq"><i class="fa-solid fa-download"></i></div>
                <div class="ch-lbl-sq">Download</div>
              </button>
              <button class="ch-btn-action-box ch-del ch-action-delete" data-id="${item.id}">
                <div class="ch-icon-sq"><i class="fa-solid fa-trash"></i></div>
                <div class="ch-lbl-sq">Delete</div>
              </button>
            </div>
            
          </div>
        `;
        }
      });
  }

  listArea.innerHTML = html;
}

// IMPORT KE FOUNDRY
async function importCharacterToFoundry(characterItem) {
  if (!characterItem || !characterItem.fvtt_data) {
    ui.notifications?.warn("No JSON data found for this character.");
    return;
  }

  const actorData = characterItem.fvtt_data;

  if (!Actor) {
    ui.notifications?.error("Foundry VTT Actor class is not available.");
    return;
  }

  try {
    ui.notifications?.info(`Importing ${actorData.name} into Foundry...`);

    const dataToImport = foundry.utils.deepClone(actorData);
    delete dataToImport._id;

    const newActor = await Actor.create(dataToImport);

    if (newActor) {
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

      // Edit Folder
      if (e.target.closest(".ch-action-edit")) {
        const id = e.target.closest(".ch-action-edit").dataset.id;
        const item = characterData.items.find((i) => i.id === id);

        if (item.type === "folder") {
          showFolderForm("Edit Folder", item, async (data) => {
            Object.assign(item, data);
            renderListArea();
            await saveCharacterData();
          });
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

  // === DRAG AND DROP ===
  const listArea = document.getElementById("ch-list-area");
  const breadcrumbs = document.getElementById("ch-breadcrumbs");
  let draggedItemId = null;

  listArea.addEventListener("dragstart", (e) => {
    const row =
      e.target.closest(".ch-list-row") || e.target.closest(".ch-row-card");
    if (!row) return;
    draggedItemId = row.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    row.style.opacity = "0.5";
  });

  listArea.addEventListener("dragend", (e) => {
    const row =
      e.target.closest(".ch-list-row") || e.target.closest(".ch-row-card");
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

// FORM BUILDER FOLDER
function showFolderForm(title, existingData, onConfirm) {
  const data = existingData || { name: "" };
  const content = `
    <div class="silane-form-group" style="padding: 10px 0;">
      <label style="color: #a1a1aa; font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Folder Name</label>
      <input type="text" id="ch-modal-name" value="${data.name}" placeholder="e.g. NPC" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 10px 12px; color: #f4f4f5; outline: none;" />
    </div>
  `;

  new Dialog({
    title: title,
    content: content,
    buttons: {
      ok: {
        label: "Confirm",
        icon: '<i class="fas fa-check"></i>',
        callback: (html) => {
          const name = html.find("#ch-modal-name").val().trim();
          if (!name)
            return ui.notifications?.warn("Folder Name cannot be empty.");
          onConfirm({ name });
        },
      },
      cancel: { label: "Cancel" },
    },
    default: "ok",
  }).render(true);
}

// 🔥 FORM UPLOAD JSON DENGAN MANAJEMEN TOMBOL YANG LOGIS
function showProfileForm(title, existingData, onConfirm) {
  const data = existingData || { name: "", fvtt_data: null };
  let selectedJsonData = data.fvtt_data || null;

  const content = `
    <div class="silane-upload-wrapper">
      <div style="padding: 5px 0 15px 0; display:flex; flex-direction:column; gap:16px;">
        
        <div class="ch-json-upload-box" id="box-upload-json">
          <div class="ch-json-default" id="ui-json-default" style="display: ${selectedJsonData ? "none" : "flex"}; color: #a1a1aa; flex-direction: column; align-items: center;">
            <i class="fa-solid fa-file-code fa-2x" style="margin-bottom:8px;"></i>
            <span style="font-size:13px; font-weight:500;">Click to select JSON File</span>
          </div>
          <div class="ch-json-success" id="ui-json-success" style="display: ${selectedJsonData ? "flex" : "none"}; color: #10b981; flex-direction: column; align-items: center;">
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
          <button id="ch-btn-cancel-profile" class="silane-btn" style="flex:1; border-radius:4px; padding:10px; background: rgba(0,0,0,0.3); color:#f4f4f5; border:1px solid #3f3f46; cursor:pointer;">Cancel</button>
          
          <button id="ch-btn-confirm-profile" class="silane-btn primary" style="flex:1; border-radius:4px; padding:10px; transition:all 0.2s;">
            </button>
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
        const uiDefault = html[0].querySelector(`#ui-json-default`);
        const uiSuccess = html[0].querySelector(`#ui-json-success`);
        const nameInput = html[0].querySelector(`#ch-prof-name`);
        const btnConfirm = html[0].querySelector("#ch-btn-confirm-profile");
        const btnCancel = html[0].querySelector("#ch-btn-cancel-profile");

        // 🔥 FUNGSI KONTROL STATE TOMBOL
        const setButtonState = (state) => {
          if (state === "need_json") {
            btnConfirm.disabled = true;
            btnConfirm.style.opacity = "0.5";
            btnConfirm.style.cursor = "not-allowed";
            btnConfirm.style.background = "#3f3f46";
            btnConfirm.innerHTML =
              '<i class="fa-solid fa-file-import"></i> Upload JSON First';
          } else if (state === "ready") {
            btnConfirm.disabled = false;
            btnConfirm.style.opacity = "1";
            btnConfirm.style.cursor = "pointer";
            btnConfirm.style.background = "#3b82f6"; // Warna biru
            btnConfirm.innerHTML = '<i class="fas fa-save"></i> Save';
          } else if (state === "progress") {
            btnConfirm.disabled = true;
            btnConfirm.style.opacity = "0.5";
            btnConfirm.style.cursor = "not-allowed";
            btnConfirm.style.background = "#3f3f46";
            btnConfirm.innerHTML =
              '<i class="fa-solid fa-person-digging"></i> In Progress...';
          }
        };

        // State Awal
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

                uiDefault.style.display = "none";
                uiSuccess.style.display = "flex";

                if (!nameInput.value && parsed.name) {
                  nameInput.value = parsed.name;
                }

                // Setelah JSON berhasil di-upload, buka kunci tombol
                setButtonState("ready");
                ui.notifications?.info("JSON Loaded. You can save now!");
              } catch (err) {
                ui.notifications?.error("Invalid JSON file.");
                setButtonState("need_json");
              }
            };
            reader.readAsText(file);
          }
        });

        btnCancel.addEventListener("click", () => profileDialog.close());

        btnConfirm.addEventListener("click", async () => {
          const name = nameInput.value.trim();
          if (!name) return ui.notifications?.warn("Name cannot be empty.");
          if (!selectedJsonData)
            return ui.notifications?.warn("Please select a JSON file first.");

          // Kunci tombol menjadi in progress!
          setButtonState("progress");

          // 🔥 TIMPA NAMA JSON DENGAN INPUTAN TERBARU USER
          selectedJsonData.name = name;

          onConfirm({
            name: name,
            fvtt_data: selectedJsonData,
          });

          profileDialog.close();
        });
      },
    },
    { width: 350, classes: ["dialog", "silane-custom-dialog"] },
  );
  profileDialog.render(true);
}
