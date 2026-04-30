import { API_BASE_URL } from "./helper.js";

// State Management
let visageData = { items: [] };
let currentFolderId = null;
let parentContainer = null;
let searchQuery = "";

const generateSafeUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatVisageUrl = (link) => {
  if (!link) return "";
  if (link.startsWith("http")) return link;
  let path = link.replace(/^\//, "");
  if (path.includes("sih4storage.phanneldeliver.my.id")) {
    return `https://${path}`;
  }
  return `https://sih4storage.phanneldeliver.my.id/${path}`;
};

const injectVisageStyles = () => {
  if (document.getElementById("visage-modern-styles")) return;
  const style = document.createElement("style");
  style.id = "visage-modern-styles";
  style.innerHTML = `
    .vs-container { display: flex; flex-direction: column; height: 100%; width: 100%; color: #f4f4f5; padding-top: 5px; }
    
    .vs-breadcrumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 0 2px; flex-wrap: wrap; user-select: none; }
    .vs-bc-item { display: flex; align-items: center; gap: 6px; color: #a1a1aa; font-size: 13px; font-weight: 500; cursor: pointer; transition: color 0.2s; padding: 4px 6px; border-radius: 4px; }
    .vs-bc-item:hover { color: #f4f4f5; background: rgba(255,255,255,0.05); }
    .vs-bc-item.active { color: #60a5fa; cursor: default; pointer-events: none; background: transparent; }
    .vs-bc-separator { color: #52525b; font-size: 10px; }
    
    /* Action Bar */
    .vs-action-bar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
    .vs-search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; border-radius: 6px; padding: 0 15px; height: 40px; transition: border-color 0.2s; }
    .vs-search-box:focus-within { border-color: #60a5fa; }
    .vs-search-box input { background: transparent; border: none; color: #f4f4f5; width: 100%; margin-left: 10px; outline: none; font-size: 14px; }
    
    .vs-btn-action { background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; color: #d4d4d8; border-radius: 6px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 15px; }
    .vs-btn-action:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: #71717a; transform: translateY(-1px); }
    
    .vs-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .vs-list-area::-webkit-scrollbar { width: 6px; }
    .vs-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    .vs-list-row { display: flex; align-items: center; padding: 10px 15px; background: rgba(0,0,0,0.15); border: 1px solid transparent; border-radius: 8px; transition: all 0.2s; user-select: none; }
    .vs-list-row.clickable:hover { background: rgba(0,0,0,0.3); border-color: #3f3f46; cursor: pointer; }
    
    /* 🔥 Efek Drag Over */
    .vs-list-row.drag-over { background: rgba(96, 165, 250, 0.25) !important; border-color: #60a5fa !important; }
    
    .vs-icon-wrapper { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 8px; margin-right: 15px; font-size: 16px; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); }
    .vs-text-container { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .vs-text-title { font-weight: 500; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.3px; }
    
    .vs-row-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
    .vs-list-row:hover .vs-row-actions { opacity: 1; }
    .vs-action-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; transition: all 0.2s; color: #a1a1aa; }
    .vs-action-icon.edit:hover { background: rgba(234, 179, 8, 0.15); color: #facc15; }
    .vs-action-icon.delete:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    
    .vs-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #71717a; text-align: center; }
    .vs-empty-state i { font-size: 40px; margin-bottom: 15px; opacity: 0.5; }

    .vs-actor-grid-wrapper { background: rgba(0, 0, 0, 0.3); border: 1px solid #3f3f46; border-radius: 4px; padding: 10px; max-height: 250px; overflow-y: auto; overflow-x: hidden; }
    .vs-actor-grid-wrapper::-webkit-scrollbar { width: 6px; }
    .vs-actor-grid-wrapper::-webkit-scrollbar-thumb { background: #52525b; border-radius: 10px; }
    
    .vs-actor-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; width: 100%; }
    
    .vs-actor-item { position: relative; cursor: pointer; border: 2px solid #27272a; border-radius: 4px; background: rgba(0,0,0,0.5); transition: all 0.2s; aspect-ratio: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .vs-actor-item:hover { border-color: #52525b; }
    .vs-actor-item.selected { border-color: #60a5fa; background: rgba(96, 165, 250, 0.15); }
    
    .vs-actor-item img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1; }
    
    .vs-actor-name { position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0, 0, 0, 0.8); color: #f4f4f5; font-size: 10px; padding: 4px 2px; text-align: center; z-index: 2; opacity: 0; transition: opacity 0.2s; white-space: normal; word-wrap: break-word; line-height: 1.1; box-sizing: border-box; }
    .vs-actor-item:hover .vs-actor-name, .vs-actor-item.selected .vs-actor-name { opacity: 1; }
    
    .vs-search-dark { width: 100%; margin-bottom: 10px; background: rgba(0,0,0,0.4) !important; color: #f4f4f5 !important; border: 1px solid #3f3f46 !important; border-radius: 4px; padding: 8px 10px; font-size: 13px; outline: none; }
    .vs-search-dark:focus { border-color: #60a5fa !important; }
  `;
  document.head.appendChild(style);
};

export async function initVisageTab(container) {
  parentContainer = container;
  injectVisageStyles();
  parentContainer.innerHTML = `<div style="display:flex; justify-content:center; padding:40px; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  await fetchVisageData();
  renderVisageUI();
}

async function fetchVisageData() {
  try {
    const token = localStorage.getItem("heraldSilane_token");
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      visageData =
        result.data.visage && result.data.visage.items
          ? result.data.visage
          : { items: [] };
    }
  } catch (error) {
    console.error("Failed to fetch Visage data", error);
  }
}

async function saveVisageData() {
  try {
    const token = localStorage.getItem("heraldSilane_token");
    await fetch(`${API_BASE_URL}/api/silane_assets/visage/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ visage: visageData }),
    });
  } catch (error) {
    ui.notifications?.error("Failed to save Visage data");
  }
}

function renderVisageUI() {
  if (!parentContainer) return;

  parentContainer.innerHTML = `
    <div class="vs-container">
      <div id="vs-breadcrumbs" class="vs-breadcrumbs"></div>
      
      <div class="vs-action-bar">
        <div class="vs-search-box">
          <i class="fa-solid fa-search" style="color: #71717a;"></i>
          <input type="text" id="vs-search-input" placeholder="Search..." />
        </div>
      
        <button id="vs-btn-add-folder" class="vs-btn-action" title="New Folder"><i class="fa-solid fa-folder-plus"></i></button>
        <button id="vs-btn-add-profile" class="vs-btn-action" title="New Profile Asset"><i class="fa-solid fa-user-plus"></i></button>
      </div>
      <div id="vs-list-area" class="vs-list-area"></div>
    </div>
  `;

  renderListArea();
  attachVisageEvents();
}

function updateBreadcrumbs() {
  const container = document.getElementById("vs-breadcrumbs");
  if (!container) return;

  let path = [];
  let current = visageData.items.find((i) => i.id === currentFolderId);

  while (current) {
    path.unshift(current);
    current = visageData.items.find((i) => i.id === current.parentId);
  }

  let html = `<div class="vs-bc-item ${!currentFolderId ? "active" : ""}" data-id="root"><i class="fa-solid fa-home"></i> Root</div>`;

  path.forEach((folder) => {
    html += `<i class="fa-solid fa-chevron-right vs-bc-separator"></i>`;
    const isActive = folder.id === currentFolderId ? "active" : "";
    html += `<div class="vs-bc-item ${isActive}" data-id="${folder.id}">${folder.name}</div>`;
  });

  container.innerHTML = html;
}

function renderListArea() {
  const listArea = document.getElementById("vs-list-area");
  let html = "";
  const query = searchQuery.toLowerCase();

  // 🔥 AMBIL KEDUA SETTING WARNA
  const folderColor =
    game.settings.get("herald-silane", "folderColor") || "#fbbf24";
  const borderColor =
    game.settings.get("herald-silane", "borderColor") || "#fbbf24";

  updateBreadcrumbs();

  // 🔥 Logika Filter Diperbarui untuk Global Search
  const itemsToDisplay = visageData.items.filter((i) => {
    if (query) {
      // Jika ada teks di kotak pencarian, cari secara global (mengabaikan folder)
      return i.name.toLowerCase().includes(query);
    } else {
      // Jika kotak pencarian kosong, tampilkan item sesuai folder yang aktif
      return i.parentId === currentFolderId;
    }
  });

  if (visageData.items.length === 0) {
    html = `
      <div class="vs-empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <div style="font-size:16px; font-weight:500; color:#d4d4d8;">Visage is empty</div>
        <div style="font-size:13px; margin-top:5px;">Create a Folder or add a Profile asset to begin.</div>
      </div>`;
  } else if (itemsToDisplay.length === 0) {
    // Teks diubah sedikit agar lebih masuk akal saat global search
    html += `<div class="vs-empty-state"><div style="font-size:15px;">No items found.</div></div>`;
  } else {
    itemsToDisplay
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      })
      .forEach((item) => {
        if (item.type === "folder") {
          // 🔥 Folder ditambahkan draggable="true"
          html += `
          <div class="vs-list-row clickable vs-item-click" draggable="true" data-target="folder" data-id="${item.id}">
            <div class="vs-icon-wrapper" style="background: rgba(${folderColor}, 0.15); box-shadow: inset 0 0 0 1px rgba(${borderColor}, 0.4);"><i class="fa-solid fa-folder" style="color: ${folderColor}; font-size: 18px;"></i></div>
            <div class="vs-text-container"><div class="vs-text-title">${item.name}</div></div>
            <div class="vs-row-actions" >
              <div class="vs-action-icon edit vs-action-edit" data-id="${item.id}" title="Edit Folder"><i class="fa-solid fa-pen" style="pointer-events:none;"></i></div>
              <div class="vs-action-icon delete vs-action-delete" data-id="${item.id}" title="Delete Folder"><i class="fa-solid fa-trash" style="pointer-events:none;"></i></div>
            </div>
          </div>
        `;
        } else {
          let iconContent = `<i class="fa-solid fa-user-astronaut" style="color: #60a5fa;"></i>`;
          let wrapperPadding = "0";

          if (item.tokenUrl) {
            iconContent = `
            <img src="${formatVisageUrl(item.tokenUrl)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <i class="fa-solid fa-user-astronaut" style="color: #60a5fa; display:none;"></i>
          `;
            wrapperPadding = "2px";
          }

          // 🔥 Profile ditambahkan draggable="true"
          html += `
          <div class="vs-list-row clickable vs-profile-click" draggable="true" data-id="${item.id}">
            <div class="vs-icon-wrapper" style="background: rgba(96, 165, 250, 0.1); box-shadow: inset 0 0 0 1px rgba(${borderColor}; padding: ${wrapperPadding};">
              ${iconContent}
            </div>
            <div class="vs-text-container"><div class="vs-text-title">${item.name}</div></div>
            <div class="vs-row-actions" >
              <div class="vs-action-icon edit vs-action-edit" data-id="${item.id}" title="Edit Profile"><i class="fa-solid fa-gear" style="pointer-events:none;" ></i></div>
              <div class="vs-action-icon delete vs-action-delete" data-id="${item.id}" title="Delete Profile"><i class="fa-solid fa-trash" style="pointer-events:none;"></i></div>
            </div>
          </div>
        `;
        }
      });
  }

  listArea.innerHTML = html;
}

function attachVisageEvents() {
  let searchTimeout;

  // Breadcrumbs click event
  document.getElementById("vs-breadcrumbs").addEventListener("click", (e) => {
    const item = e.target.closest(".vs-bc-item");
    if (!item || item.classList.contains("active")) return;
    const id = item.dataset.id;
    currentFolderId = id === "root" ? null : id;
    renderListArea();
  });

  // Search input event
  document.getElementById("vs-search-input").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderListArea();
    }, 1000);
  });

  // Main List Area click events
  document
    .getElementById("vs-list-area")
    .addEventListener("click", async (e) => {
      // Delete Button
      if (e.target.closest(".vs-action-delete")) {
        const id = e.target.closest(".vs-action-delete").dataset.id;
        Dialog.confirm({
          title: "Confirm Deletion",
          content:
            "<p>Are you sure you want to delete this item? This action cannot be undone.</p>",
          yes: async () => {
            const idsToDelete = getNestedItemIds(visageData.items, id);
            visageData.items = visageData.items.filter(
              (i) => !idsToDelete.includes(i.id),
            );
            renderListArea();
            await saveVisageData();
            ui.notifications?.info("Item deleted.");
          },
          no: () => {},
          defaultYes: false,
        });
        return;
      }

      // Edit Button
      if (e.target.closest(".vs-action-edit")) {
        const id = e.target.closest(".vs-action-edit").dataset.id;
        const item = visageData.items.find((i) => i.id === id);

        if (item.type === "folder") {
          showFolderForm("Edit Folder", item, async (data) => {
            Object.assign(item, data);
            renderListArea();
            await saveVisageData();
          });
        } else {
          showProfileForm("Edit Profile Asset", item, async (data) => {
            Object.assign(item, data);
            renderListArea();
            await saveVisageData();
          });
        }
        return;
      }

      // Folder Click
      const folderRow = e.target.closest(".vs-item-click");
      if (folderRow && folderRow.dataset.target === "folder") {
        currentFolderId = folderRow.dataset.id;
        renderListArea();
        return;
      }

      // Profile Click
      const profileRow = e.target.closest(".vs-profile-click");
      if (profileRow) {
        if (e.target.closest(".vs-action-icon")) return;
        const id = profileRow.dataset.id;
        const profile = visageData.items.find((i) => i.id === id);
        if (profile) {
          showActorSelectionDialog(profile);
        }
      }
    });

  // Add buttons
  document.getElementById("vs-btn-add-folder").addEventListener("click", () => {
    showFolderForm("Create New Folder", null, async (data) => {
      visageData.items.push({
        id: foundry.utils.randomID(), // Fungsi Foundry asli tetap digunakan karena aman
        type: "folder",
        parentId: currentFolderId,
        name: data.name,
      });
      renderListArea();
      await saveVisageData();
    });
  });

  document
    .getElementById("vs-btn-add-profile")
    .addEventListener("click", () => {
      showProfileForm("Create Profile Asset", null, async (data) => {
        visageData.items.push({
          id: generateSafeUUID(), // 🔥 MENGGUNAKAN FALLBACK AGAR BISA DI IP LOKAL
          type: "profile",
          parentId: currentFolderId,
          ...data,
        });
        renderListArea();
        await saveVisageData();
      });
    });

  // === 🔥 DRAG AND DROP LOGIC ===
  const listArea = document.getElementById("vs-list-area");
  const breadcrumbs = document.getElementById("vs-breadcrumbs");
  let draggedItemId = null;

  // 1. Saat item mulai di-drag
  listArea.addEventListener("dragstart", (e) => {
    const row = e.target.closest(".vs-list-row");
    if (!row) return;
    draggedItemId = row.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    row.style.opacity = "0.5";
  });

  // 2. Saat item selesai di-drag
  listArea.addEventListener("dragend", (e) => {
    const row = e.target.closest(".vs-list-row");
    if (row) row.style.opacity = "1";
    draggedItemId = null;
    document
      .querySelectorAll(".vs-list-row")
      .forEach((el) => el.classList.remove("drag-over"));
  });

  // 3. Saat item melayang di atas area list
  listArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    const targetRow = e.target.closest(".vs-list-row[data-target='folder']");

    if (targetRow && targetRow.dataset.id !== draggedItemId) {
      targetRow.classList.add("drag-over");
    }
  });

  // 4. Saat item keluar dari area folder
  listArea.addEventListener("dragleave", (e) => {
    const targetRow = e.target.closest(".vs-list-row[data-target='folder']");
    if (targetRow) {
      targetRow.classList.remove("drag-over");
    }
  });

  // 5. Eksekusi perpindahan data saat di-DROP ke folder
  listArea.addEventListener("drop", async (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".vs-list-row")
      .forEach((el) => el.classList.remove("drag-over"));
    const targetRow = e.target.closest(".vs-list-row[data-target='folder']");

    if (targetRow && draggedItemId && targetRow.dataset.id !== draggedItemId) {
      const targetFolderId = targetRow.dataset.id;
      const itemToMove = visageData.items.find((i) => i.id === draggedItemId);

      if (itemToMove) {
        // Cegah folder dimasukkan ke dalam sub-foldernya sendiri (Infinite Loop)
        if (itemToMove.type === "folder") {
          const nestedIds = getNestedItemIds(visageData.items, draggedItemId);
          if (nestedIds.includes(targetFolderId)) {
            ui.notifications?.warn(
              "Cannot move a folder into its own subfolder.",
            );
            return;
          }
        }

        itemToMove.parentId = targetFolderId;
        renderListArea();
        await saveVisageData();
        ui.notifications?.info(`Item moved successfully.`);
      }
    }
  });

  // 6. Dukungan DROP ke Breadcrumbs
  breadcrumbs.addEventListener("dragover", (e) => {
    e.preventDefault();
    const bcItem = e.target.closest(".vs-bc-item:not(.active)");
    if (bcItem) bcItem.style.background = "rgba(255,255,255,0.1)";
  });

  breadcrumbs.addEventListener("dragleave", (e) => {
    const bcItem = e.target.closest(".vs-bc-item:not(.active)");
    if (bcItem) bcItem.style.background = "";
  });

  breadcrumbs.addEventListener("drop", async (e) => {
    e.preventDefault();
    const bcItem = e.target.closest(".vs-bc-item:not(.active)");
    if (bcItem) bcItem.style.background = "";

    if (bcItem && draggedItemId) {
      const targetFolderId =
        bcItem.dataset.id === "root" ? null : bcItem.dataset.id;
      const itemToMove = visageData.items.find((i) => i.id === draggedItemId);

      if (itemToMove && itemToMove.parentId !== targetFolderId) {
        if (itemToMove.type === "folder") {
          const nestedIds = getNestedItemIds(visageData.items, draggedItemId);
          if (nestedIds.includes(targetFolderId)) return;
        }

        itemToMove.parentId = targetFolderId;
        renderListArea();
        await saveVisageData();
        ui.notifications?.info(`Item moved successfully.`);
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

async function showActorSelectionDialog(profile) {
  let selectedActorId = null;
  const actors = game.actors.filter(
    (a) => a.ownership[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
  );

  const actorGridHtml = actors
    .map(
      (a) => `
    <div class="vs-actor-item" data-id="${a.id}" data-name="${a.name.toLowerCase()}">
      <img src="${a.img}" onerror="this.style.display='none'">
      <div class="vs-actor-name">${a.name}</div>
    </div>`,
    )
    .join("");

  const content = `
    <div style="color:#f4f4f5; padding-bottom: 5px;">
      <div style="font-size: 13px; margin-bottom: 8px; color: #a1a1aa;">
        <b style="color:white;">Profile Name:</b> &nbsp;&nbsp;&nbsp;&nbsp;${profile.name}
      </div>
      <div style="font-size: 13px; margin-bottom: 12px; color: #a1a1aa;">
        <b style="color:white;">Select a Character:</b>
      </div>
      
      <input type="text" id="vs-actor-filter" class="vs-search-dark" placeholder="Search character...">
      
      <div class="vs-actor-grid-wrapper">
        <div class="vs-actor-grid" id="vs-actor-grid">${actorGridHtml}</div>
      </div>
    </div>
  `;

  new Dialog(
    {
      title: `Upload Assets`,
      content: content,
      buttons: {
        apply: {
          label: "Confirm",
          callback: async (html) => {
            if (!selectedActorId) return;
            const actor = game.actors.get(selectedActorId);
            if (!actor) return;

            const newImageUrl =
              profile.portraitUrl || profile.tokenUrl || actor.img;
            const newProxyUrl =
              profile.tokenUrl ||
              (actor.prototypeToken
                ? actor.prototypeToken.texture.src
                : actor.img);

            await actor.update({
              img: newImageUrl,
              prototypeToken: {
                texture: { src: newProxyUrl },
              },
            });

            for (const token of actor.getActiveTokens()) {
              await token.document.update({
                texture: { src: newProxyUrl },
              });
            }

            ui.notifications?.info(`Actor ${actor.name} image updated.`);
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "apply",
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

        const applyBtn = html
          .closest(".dialog")
          .find(".dialog-buttons button.apply");
        applyBtn.prop("disabled", true);
        applyBtn.css({ opacity: "0.5", cursor: "not-allowed" });

        html.closest(".dialog").find(".dialog-buttons button").css({
          color: "white",
          border: "1px solid white",
          background: "transparent",
          borderRadius: "4px",
        });

        html.find(".vs-actor-item").on("click", function () {
          html.find(".vs-actor-item").removeClass("selected");
          $(this).addClass("selected");
          selectedActorId = $(this).data("id");

          applyBtn.prop("disabled", false);
          applyBtn.css({ opacity: "1", cursor: "pointer" });
        });

        let searchTimeout;
        html.find("#vs-actor-filter").on("input", function () {
          const query = $(this).val().toLowerCase();
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            html.find(".vs-actor-item").each(function () {
              $(this).toggle($(this).data("name").includes(query));
            });
          }, 1000);
        });
      },
    },
    { width: 420 },
  ).render(true);
}

// === FORM BUILDERS ===

function showFolderForm(title, existingData, onConfirm) {
  const data = existingData || { name: "" };
  const content = `
    <div class="silane-form-group" style="padding: 10px 0;">
      <label style="color: #a1a1aa; font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Folder Name</label>
      <input type="text" id="vs-modal-name" value="${data.name}" placeholder="e.g. Items" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 10px 12px; color: #f4f4f5; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#60a5fa'" onblur="this.style.borderColor='#3f3f46'" />
    </div>
  `;

  new Dialog(
    {
      title: title,
      content: content,
      buttons: {
        ok: {
          label: "Confirm",
          icon: '<i class="fas fa-check"></i>',
          callback: (html) => {
            const name = html.find("#vs-modal-name").val().trim();
            if (!name)
              return ui.notifications?.warn("Folder Name cannot be empty.");
            onConfirm({ name });
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "ok",
      render: (html) => {
        // 🔥 INI BAGIAN YANG DITAMBAHKAN UNTUK BACKGROUND HITAM DI VISAGE 🔥
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

        // Menyelaraskan style tombol dialog
        html.closest(".dialog").find(".dialog-buttons button").css({
          color: "white",
          border: "1px solid #3f3f46",
          background: "rgba(0,0,0,0.4)",
          borderRadius: "4px",
          transition: "all 0.2s",
        });

        // Efek hover untuk tombol (warna biru khas Visage)
        html
          .closest(".dialog")
          .find(".dialog-buttons button")
          .hover(
            function () {
              $(this).css("background", "rgba(96, 165, 250, 0.2)");
            },
            function () {
              $(this).css("background", "rgba(0,0,0,0.4)");
            },
          );
      },
    },
    {
      width: 350,
      classes: ["dialog", "silane-custom-dialog"],
    },
  ).render(true);
}

function showProfileForm(title, existingData, onConfirm) {
  const data = existingData || {
    name: "",
    tokenUrl: "",
    portraitUrl: "",
    size: "",
    hide: false,
    height: "",
    width: "",
  };

  let selectedTokenFile = null;
  let selectedPortraitFile = null;

  const content = `
    <div class="silane-upload-wrapper">
      <style>
        .vs-prof-input { width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 10px 12px; color: #f4f4f5; font-family: inherit; transition: border-color 0.2s; outline: none; }
        .vs-prof-input:focus { border-color: #60a5fa; }
        .vs-prof-img-box { flex: 1; aspect-ratio: 1; border: 2px dashed #52525b; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; background: rgba(0,0,0,0.2); position: relative; overflow: hidden; cursor: pointer; transition: all 0.2s; }
        .vs-prof-img-box:hover { border-color: #71717a; background: rgba(0,0,0,0.4); }
        .vs-prof-img-box img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1; }
        .vs-prof-img-box span { font-weight: 600; font-size: 14px; z-index: 2; pointer-events: none; text-shadow: 0px 1px 4px rgba(0,0,0,0.9); }
        .vs-prof-upload-btn { background: #27272a; border: 1px solid #3f3f46; color: #d4d4d8; padding: 6px; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; width: 100%; margin-top: 8px; }
        .vs-prof-upload-btn:hover { background: #3f3f46; color: #fff; border-color: #52525b; }
        .vs-prof-label { color: #a1a1aa; font-size: 12px; font-weight: 500; margin-bottom: 6px; display: block; }
      </style>

      <div style="padding: 5px 0 15px 0; display:flex; flex-direction:column; gap:16px;">
        <div>
          <label class="vs-prof-label">Name</label>
          <input type="text" id="vs-prof-name" value="${data.name}" class="vs-prof-input" placeholder="Name..." />
        </div>

        <div style="display:flex; gap:15px;">
          <div style="flex:1; display:flex; flex-direction:column;">
            <div class="vs-prof-img-box" id="box-token">
              <span style="color: #fb923c;">Token</span>
              <img id="prev-token" src="${formatVisageUrl(data.tokenUrl)}" style="display: ${data.tokenUrl ? "block" : "none"};" />
              <input type="file" id="file-token" accept="image/*" style="display:none;" />
            </div>
            <button id="btn-upload-token" class="vs-prof-upload-btn">Select Image</button>
          </div>
          
          <div style="flex:1; display:flex; flex-direction:column;">
            <div class="vs-prof-img-box" id="box-portrait">
              <span style="color: #4ade80;">Portrait</span>
              <img id="prev-portrait" src="${formatVisageUrl(data.portraitUrl)}" style="display: ${data.portraitUrl ? "block" : "none"};" />
              <input type="file" id="file-portrait" accept="image/*" style="display:none;" />
            </div>
            <button id="btn-upload-portrait" class="vs-prof-upload-btn">Select Image</button>
          </div>
        </div>

        <details style="border-top: 1px solid #3f3f46; padding-top: 12px;">
          <summary style=" cursor:pointer; font-size:13px; font-weight:600; outline:none; display:flex; align-items:center; gap:5px;">
            Advanced settings <i class="fa-solid fa-triangle-exclamation" style="font-size:11px;"></i>
          </summary>
          <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px; background: rgba(0,0,0,0.15); padding: 12px; border-radius: 6px; border: 1px solid #27272a;">
            
            <div style="display:flex; gap:20px; align-items:center;">
              <div style="display:flex; gap:8px; align-items:center;">
                <label style="color: #a1a1aa; font-size: 13px; font-weight:500; margin:0;">Size</label>
                <input type="text" id="vs-prof-size" value="${data.size}" style="width: 70px; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 4px; padding: 6px; color: #f4f4f5; outline:none;" />
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <label style="color: #a1a1aa; font-size: 13px; font-weight:500; margin:0;">Hide</label>
                <div style="background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 4px; padding: 4px; display:flex; align-items:center;">
                   <input type="checkbox" id="vs-prof-hide" ${data.hide ? "checked" : ""} style="margin:0; width:16px; height:16px; cursor:pointer;" />
                </div>
              </div>
            </div>

            <div>
              <label style="color: #a1a1aa; font-size: 13px; font-weight:500; margin-bottom: 6px; display: block;">Dimensions</label>
              <div style="display:flex; gap:15px; align-items:center;">
                <div style="display:flex; gap:8px; align-items:center;">
                  <i class="fa-solid fa-text-height" style="color:#52525b; font-size:12px;"></i>
                  <input type="number" id="vs-prof-height" value="${data.height}" placeholder="Height" style="width: 75px; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 4px; padding: 6px; color: #f4f4f5; outline:none;" />
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                  <i class="fa-solid fa-text-width" style="color:#52525b; font-size:12px;"></i>
                  <input type="number" id="vs-prof-width" value="${data.width}" placeholder="Width" style="width: 75px; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 4px; padding: 6px; color: #f4f4f5; outline:none;" />
                </div>
              </div>
            </div>

          </div>
        </details>
        
        <div style="display:flex; gap: 10px; margin-top: 10px;">
          <button id="vs-btn-cancel-profile" class="silane-btn" style="flex:1; border-radius:4px; padding:10px; background: rgba(0,0,0,0.3); color:#f4f4f5; border:1px solid #3f3f46; cursor:pointer;">Cancel</button>
          <button id="vs-btn-confirm-profile" class="silane-btn primary" style="flex:1; border-radius:4px; padding:10px; cursor:pointer;"><i class="fas fa-save"></i> Confirm & Save</button>
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
        const attachImageUpload = (boxId, inputId, imgId, btnId, isToken) => {
          const box = html[0].querySelector(`#${boxId}`);
          const input = html[0].querySelector(`#${inputId}`);
          const img = html[0].querySelector(`#${imgId}`);
          const btn = html[0].querySelector(`#${btnId}`);

          const triggerClick = () => input.click();
          box.addEventListener("click", triggerClick);
          btn.addEventListener("click", triggerClick);

          input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
              if (isToken) selectedTokenFile = file;
              else selectedPortraitFile = file;

              const objectUrl = URL.createObjectURL(file);
              img.src = objectUrl;
              img.style.display = "block";
            }
          });
        };

        attachImageUpload(
          "box-token",
          "file-token",
          "prev-token",
          "btn-upload-token",
          true,
        );
        attachImageUpload(
          "box-portrait",
          "file-portrait",
          "prev-portrait",
          "btn-upload-portrait",
          false,
        );

        const btnConfirm = html[0].querySelector("#vs-btn-confirm-profile");
        const btnCancel = html[0].querySelector("#vs-btn-cancel-profile");

        btnCancel.addEventListener("click", () => {
          profileDialog.close();
        });

        btnConfirm.addEventListener("click", async () => {
          const nameInput = html[0].querySelector("#vs-prof-name");
          const name = nameInput.value.trim();

          if (!name) {
            ui.notifications?.warn("Profile Name cannot be empty.");
            return;
          }

          ui.notifications?.info("Saving profile and processing media...");
          btnConfirm.disabled = true;
          btnConfirm.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Saving...';

          let finalTokenUrl = data.tokenUrl;
          let finalPortraitUrl = data.portraitUrl;

          const uploadMediaToBackend = async (fileObj) => {
            const formData = new FormData();
            formData.append("file", fileObj);

            const token = localStorage.getItem("heraldSilane_token");
            const res = await fetch(
              `${API_BASE_URL}/api/silane_assets/upload_visage`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
              },
            );

            if (!res.ok) throw new Error("Upload Failed");
            const result = await res.json();
            return formatVisageUrl(result.url);
          };

          try {
            if (selectedTokenFile) {
              finalTokenUrl = await uploadMediaToBackend(selectedTokenFile);
            }
            if (selectedPortraitFile) {
              finalPortraitUrl =
                await uploadMediaToBackend(selectedPortraitFile);
            }

            onConfirm({
              name: name,
              tokenUrl: finalTokenUrl,
              portraitUrl: finalPortraitUrl,
              size: html[0].querySelector("#vs-prof-size").value.trim(),
              hide: html[0].querySelector("#vs-prof-hide").checked,
              height: html[0].querySelector("#vs-prof-height").value,
              width: html[0].querySelector("#vs-prof-width").value,
            });

            profileDialog.close();
          } catch (err) {
            ui.notifications?.error(
              "Failed to upload image. Please try again.",
            );
            console.error(err);
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = '<i class="fas fa-save"></i> Confirm & Save';
          }
        });
      },
    },
    {
      width: 420,
      classes: ["dialog", "silane-custom-dialog"],
    },
  );

  profileDialog.render(true);
}
