import { API_BASE_URL } from "./helper.js";

// State Management
let characterData = { items: [] };
let currentFolderId = null;
let parentContainer = null;
let searchQuery = "";

// 🔥 Helper untuk generate UUID v4 murni (Standar Supabase)
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

// Helper untuk memaksa URL menjadi absolute HTTPS (Digunakan saat backend mengembalikan ekstrak gambar dari JSON)
const formatCharacterUrl = (link) => {
  if (!link) return "";
  if (link.startsWith("http")) return link;
  let path = link.replace(/^\//, "");
  if (path.includes("sih4storage.phanneldeliver.my.id")) {
    return `https://${path}`;
  }
  return `https://sih4storage.phanneldeliver.my.id/${path}`;
};

// Inject CSS
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
    
    .ch-action-bar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
    .ch-search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; border-radius: 6px; padding: 0 15px; height: 40px; transition: border-color 0.2s; }
    .ch-search-box:focus-within { border-color: #10b981; }
    .ch-search-box input { background: transparent; border: none; color: #f4f4f5; width: 100%; margin-left: 10px; outline: none; font-size: 14px; }
    
    .ch-btn-action { background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; color: #d4d4d8; border-radius: 6px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 15px; }
    .ch-btn-action:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: #71717a; transform: translateY(-1px); }
    
    .ch-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .ch-list-area::-webkit-scrollbar { width: 6px; }
    .ch-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    .ch-list-row { display: flex; align-items: center; padding: 10px 15px; background: rgba(0,0,0,0.15); border: 1px solid transparent; border-radius: 8px; transition: all 0.2s; user-select: none; }
    .ch-list-row.clickable:hover { background: rgba(0,0,0,0.3); border-color: #3f3f46; cursor: pointer; }
    .ch-list-row.drag-over { background: rgba(16, 185, 129, 0.25) !important; border-color: #10b981 !important; }
    
    .ch-icon-wrapper { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 8px; margin-right: 15px; font-size: 16px; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); overflow:hidden;}
    .ch-text-container { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ch-text-title { font-weight: 500; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.3px; }
    
    .ch-row-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
    .ch-list-row:hover .ch-row-actions { opacity: 1; }
    .ch-action-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; transition: all 0.2s; color: #a1a1aa; }
    .ch-action-icon.edit:hover { background: rgba(234, 179, 8, 0.15); color: #facc15; }
    .ch-action-icon.delete:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    
    .ch-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #71717a; text-align: center; }
    .ch-empty-state i { font-size: 40px; margin-bottom: 15px; opacity: 0.5; }

    /* JSON Box Form Styles */
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
      // 🔥 Mengirim seluruh tree (termasuk fvtt_data JSON) langsung ke backend
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
          <input type="text" id="ch-search-input" placeholder="Search..." />
        </div>
      
        <button id="ch-btn-add-folder" class="ch-btn-action" title="New Folder"><i class="fa-solid fa-folder-plus"></i></button>
        <button id="ch-btn-add-profile" class="ch-btn-action" title="Import JSON Asset"><i class="fa-solid fa-file-import"></i></button>
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

  const itemsToDisplay = characterData.items.filter(
    (i) =>
      i.parentId === currentFolderId && i.name.toLowerCase().includes(query),
  );

  if (characterData.items.length === 0) {
    html = `
      <div class="ch-empty-state">
        <i class="fa-solid fa-address-book"></i>
        <div style="font-size:16px; font-weight:500; color:#d4d4d8;">Character Roster is empty</div>
        <div style="font-size:13px; margin-top:5px;">Create a Folder or Import a JSON to begin.</div>
      </div>`;
  } else if (itemsToDisplay.length === 0) {
    html += `<div class="ch-empty-state"><div style="font-size:15px;">No items found here.</div></div>`;
  } else {
    itemsToDisplay
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      })
      .forEach((item) => {
        if (item.type === "folder") {
          html += `
          <div class="ch-list-row clickable ch-item-click" draggable="true" data-target="folder" data-id="${item.id}">
            <div class="ch-icon-wrapper" style="background: rgba(16, 185, 129, 0.15); box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.4);"><i class="fa-solid fa-folder" style="color: #10b981; font-size: 18px;"></i></div>
            <div class="ch-text-container"><div class="ch-text-title">${item.name}</div></div>
            <div class="ch-row-actions" >
              <div class="ch-action-icon edit ch-action-edit" data-id="${item.id}" title="Edit Folder"><i class="fa-solid fa-pen" style="pointer-events:none;"></i></div>
              <div class="ch-action-icon delete ch-action-delete" data-id="${item.id}" title="Delete Folder"><i class="fa-solid fa-trash" style="pointer-events:none;"></i></div>
            </div>
          </div>
        `;
        } else {
          // Backend sekarang mengekstrak 'img' dari FVTT data dan memasukkannya ke tokenUrl.
          let iconContent = `<i class="fa-solid fa-user-ninja" style="color: #3b82f6;"></i>`;
          if (item.tokenUrl) {
            iconContent = `<img src="${formatCharacterUrl(item.tokenUrl)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><i class="fa-solid fa-user-ninja" style="color: #3b82f6; display:none;"></i>`;
          }

          html += `
          <div class="ch-list-row clickable ch-profile-click" draggable="true" data-id="${item.id}">
            <div class="ch-icon-wrapper" style="background: rgba(59, 130, 246, 0.1); box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3); padding: ${item.tokenUrl ? "2px" : "0"};">
              ${iconContent}
            </div>
            <div class="ch-text-container">
               <div class="ch-text-title">${item.name}</div>
               <div style="font-size:11px; color:#71717a;"><i class="fa-solid fa-file-code"></i> JSON Loaded</div>
            </div>
            <div class="ch-row-actions" >
              <div class="ch-action-icon edit ch-action-edit" data-id="${item.id}" title="Update JSON"><i class="fa-solid fa-gear" style="pointer-events:none;" ></i></div>
              <div class="ch-action-icon delete ch-action-delete" data-id="${item.id}" title="Delete Character"><i class="fa-solid fa-trash" style="pointer-events:none;"></i></div>
            </div>
          </div>
        `;
        }
      });
  }

  listArea.innerHTML = html;
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
            ui.notifications?.info("Character Item deleted.");
          },
          no: () => {},
          defaultYes: false,
        });
        return;
      }

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
          showProfileForm("Update Character", item, async (data) => {
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
        id: generateUUID(), // 🔥 Pakai generator standar Supabase
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
          id: generateUUID(), // 🔥 Pakai generator standar Supabase
          type: "profile",
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
    const row = e.target.closest(".ch-list-row");
    if (!row) return;
    draggedItemId = row.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    row.style.opacity = "0.5";
  });

  listArea.addEventListener("dragend", (e) => {
    const row = e.target.closest(".ch-list-row");
    if (row) row.style.opacity = "1";
    draggedItemId = null;
    document
      .querySelectorAll(".ch-list-row")
      .forEach((el) => el.classList.remove("drag-over"));
  });

  listArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    const targetRow = e.target.closest(".ch-list-row[data-target='folder']");
    if (targetRow && targetRow.dataset.id !== draggedItemId) {
      targetRow.classList.add("drag-over");
    }
  });

  listArea.addEventListener("dragleave", (e) => {
    const targetRow = e.target.closest(".ch-list-row[data-target='folder']");
    if (targetRow) targetRow.classList.remove("drag-over");
  });

  listArea.addEventListener("drop", async (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".ch-list-row")
      .forEach((el) => el.classList.remove("drag-over"));
    const targetRow = e.target.closest(".ch-list-row[data-target='folder']");

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

// FORM BUILDERS
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

// 🔥 MURNI JSON UPLOAD, TIDAK ADA GAMBAR
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
          <button id="ch-btn-confirm-profile" class="silane-btn primary" style="flex:1; border-radius:4px; padding:10px; cursor:pointer;"><i class="fas fa-save"></i> Save</button>
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

                // Auto-fill nama karakter dari JSON Foundry jika kosong
                if (!nameInput.value && parsed.name) {
                  nameInput.value = parsed.name;
                }

                ui.notifications?.info("Character data loaded!");
              } catch (err) {
                ui.notifications?.error("Invalid JSON file.");
              }
            };
            reader.readAsText(file);
          }
        });

        const btnConfirm = html[0].querySelector("#ch-btn-confirm-profile");
        const btnCancel = html[0].querySelector("#ch-btn-cancel-profile");

        btnCancel.addEventListener("click", () => profileDialog.close());

        btnConfirm.addEventListener("click", async () => {
          const name = nameInput.value.trim();
          if (!name) return ui.notifications?.warn("Name cannot be empty.");
          if (!selectedJsonData)
            return ui.notifications?.warn("Please select a JSON file first.");

          btnConfirm.disabled = true;
          btnConfirm.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Saving...';

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
