import { API_BASE_URL } from "./helper.js";

let parentContainer = null;
let currentItems = [];
let searchQuery = "";
let currentOffset = 0;
let currentType = "";
const LIMIT = 200;

const ITEM_TYPES = ["weapon", "spell", "consumable", "container", "equipment", "feat", "loot", "tool"];

function getToken() {
  return localStorage.getItem("heraldSilane_token");
}

function getUser() {
  const str = localStorage.getItem("heraldSilane_user");
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

// ==========================================
// INJECT STYLES
// ==========================================
const injectFireflyStyles = () => {
  if (document.getElementById("firefly-tab-styles")) return;
  const style = document.createElement("style");
  style.id = "firefly-tab-styles";
  style.innerHTML = `
    .ff-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
      padding: 0;
      min-height: 0;
      flex: 1;
    }
    .ff-toolbar {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-shrink: 0;
    }
    .ff-search-box {
      flex: 1;
      display: flex;
      align-items: center;
      background: rgba(0,0,0,0.3);
      border: 1px solid #3f3f46;
      border-radius: 6px;
      padding: 0 12px;
      height: 36px;
      transition: border-color 0.2s;
    }
    .ff-search-box:focus-within { border-color: #3b82f6; }
    .ff-search-box input {
      background: transparent;
      border: none;
      color: #f4f4f5;
      width: 100%;
      margin-left: 8px;
      outline: none;
      font-size: 13px;
    }
    .ff-select {
      height: 36px;
      padding: 0 10px;
      font-size: 12px;
      width: 140px;
      border: 1px solid #3f3f46;
      background: #27272a;
      color: white;
      border-radius: 6px;
      outline: none;
    }
    .ff-btn-action {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }
    .ff-btn-action:hover { background: #3b82f6; color: #fff; }
    .ff-list {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 10px;
      padding: 4px;
      align-content: start;
      min-height: 0;
    }
    .ff-list::-webkit-scrollbar { width: 6px; }
    .ff-list::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    .ff-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 6px;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid #27272a;
      border-radius: 10px;
      transition: all 0.2s;
      cursor: pointer;
      position: relative;
      gap: 6px;
    }
    .ff-card:hover { background: rgba(0, 0, 0, 0.45); border-color: #3f3f46; }
    .ff-card-img {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      overflow: hidden;
      background: #27272a;
      border: 1px solid #3f3f46;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ff-card-img img { width: 100%; height: 100%; object-fit: cover; }
    .ff-card-img-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #52525b;
      font-size: 20px;
    }
    .ff-card-name {
      font-size: 10px;
      font-weight: 600;
      color: #e4e4e7;
      text-align: center;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ff-card-type {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 1px 4px;
      border: 1px solid;
      border-radius: 3px;
    }
    .ff-card-actions {
      position: absolute;
      top: 4px;
      right: 4px;
      display: none;
      flex-direction: column;
      gap: 3px;
    }
    .ff-card:hover .ff-card-actions { display: flex; }
    .ff-btn-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      border: 1px solid #3f3f46;
      background: rgba(0,0,0,0.6);
      color: #a1a1aa;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 9px;
    }
    .ff-btn-icon.import:hover { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.15); }
    .ff-btn-icon.delete:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.15); }
    .ff-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #71717a;
      text-align: center;
      padding: 40px;
    }
  `;
  document.head.appendChild(style);
};

// ==========================================
// INIT
// ==========================================
export async function initFireflyTab(container) {
  parentContainer = container;
  injectFireflyStyles();

  // Pastikan container punya height dan overflow yang benar
  parentContainer.style.height = "100%";
  parentContainer.style.overflow = "hidden";
  parentContainer.style.display = "flex";
  parentContainer.style.flexDirection = "column";

  parentContainer.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  await fetchItems();
  renderUI();
}

// ==========================================
// FETCH — backend routes by role automatically
// Admin → foundry_* | User → *_homebrew
// ==========================================
async function fetchItems() {
  try {
    const token = getToken();
    const params = new URLSearchParams({ limit: LIMIT, offset: currentOffset });
    if (currentType) params.append("type", currentType);
    if (searchQuery) params.append("search", searchQuery);

    const response = await fetch(`${API_BASE_URL}/api/firefly/items?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      currentItems = result.items || [];
    } else if (response.status === 401) {
      localStorage.removeItem("heraldSilane_token");
      ui.notifications?.warn("Session expired. Please login again.");
    } else {
      currentItems = [];
    }
  } catch (error) {
    console.error("Firefly: Failed to fetch items", error);
    currentItems = [];
  }
}

// ==========================================
// RENDER UI
// ==========================================
function renderUI() {
  if (!parentContainer) return;

  const typeOptions = ITEM_TYPES.map((t) => {
    const selected = t === currentType ? "selected" : "";
    return `<option value="${t}" ${selected}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`;
  }).join("");

  parentContainer.innerHTML = `
    <div class="ff-container">
      <div class="ff-toolbar">
        <select id="ff-type-filter" class="ff-select" style="display:none;">
          <option value="" ${!currentType ? "selected" : ""}>All Types</option>
          ${typeOptions}
        </select>
        <div class="ff-search-box">
          <i class="fa-solid fa-search" style="color: #71717a;"></i>
          <input type="text" id="ff-search" placeholder="Search items..." value="${searchQuery}" />
        </div>
        <button id="ff-btn-import" class="ff-btn-action" title="Import from Foundry Items">
          <i class="fa-solid fa-file-import"></i>
        </button>
      </div>
      <div id="ff-list" class="ff-list" style="display:none;"></div>
    </div>
  `;

  renderList();
  attachEvents();
}

// ==========================================
// RENDER LIST (icon/card grid)
// ==========================================
function renderList() {
  const listEl = document.getElementById("ff-list");
  if (!listEl) return;

  if (currentItems.length === 0) {
    listEl.innerHTML = `
      <div class="ff-empty" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-box-open fa-2x" style="margin-bottom: 12px; opacity: 0.5;"></i>
        <div>No items found.</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = currentItems.map((item) => {
    const itemType = item.__type || item.type || "unknown";
    const typeColors = {
      weapon: "#ef4444", spell: "#8b5cf6", consumable: "#f59e0b",
      container: "#6b7280", equipment: "#3b82f6", feat: "#10b981",
      loot: "#eab308", tool: "#06b6d4", feature: "#ec4899", unknown: "#71717a",
    };
    const typeColor = typeColors[itemType] || typeColors.unknown;

    return `
      <div class="ff-card" data-id="${item.id}" data-type="${itemType}" title="${item.name}">
        <div class="ff-card-actions">
          <button class="ff-btn-icon import" data-id="${item.id}" data-type="${itemType}" title="Import to Foundry">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="ff-btn-icon delete" data-id="${item.id}" data-type="${itemType}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <div class="ff-card-img">
          ${item.image ? `<img src="${item.image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : ""}
          <div class="ff-card-img-fallback" ${item.image ? 'style="display:none;"' : ""}><i class="fa-solid fa-cube"></i></div>
        </div>
        <div class="ff-card-name">${item.name}</div>
        <span class="ff-card-type" style="border-color: ${typeColor}; color: ${typeColor};">${itemType}</span>
      </div>
    `;
  }).join("");
}

// ==========================================
// EVENTS
// ==========================================
function attachEvents() {
  let searchTimeout;

  document.getElementById("ff-type-filter").addEventListener("change", async (e) => {
    currentType = e.target.value;
    currentOffset = 0;
    await fetchItems();
    renderList();
  });

  document.getElementById("ff-search").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      searchQuery = e.target.value.trim();
      currentOffset = 0;
      await fetchItems();
      renderList();
    }, 500);
  });

  document.getElementById("ff-btn-import").addEventListener("click", () => {
    showImportFromFoundryDialog();
  });

  document.getElementById("ff-list").addEventListener("click", async (e) => {
    const importBtn = e.target.closest(".ff-btn-icon.import");
    if (importBtn) {
      e.stopPropagation();
      await importItemToFoundry(importBtn.dataset.id, importBtn.dataset.type);
      return;
    }
    const deleteBtn = e.target.closest(".ff-btn-icon.delete");
    if (deleteBtn) {
      e.stopPropagation();
      await deleteItem(deleteBtn.dataset.id, deleteBtn.dataset.type);
      return;
    }
  });
}

// ==========================================
// IMPORT ITEM TO FOUNDRY VTT (from database → Foundry world)
// ==========================================
async function importItemToFoundry(id, type) {
  try {
    const token = getToken();
    const user = getUser();
    const isAdmin = user?.role === "admin";

    const url = isAdmin
      ? `${API_BASE_URL}/api/firefly/items/${type}/${id}`
      : `${API_BASE_URL}/api/firefly/homebrew/items/${type}/${id}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      ui.notifications?.error("Failed to fetch item data.");
      return;
    }

    const result = await response.json();
    const rawData = result.item?.raw_data;

    if (!rawData) {
      ui.notifications?.error("No raw data available for this item.");
      return;
    }

    const importData = foundry.utils.deepClone(rawData);
    delete importData._id;

    const item = await Item.create(importData);
    if (item) {
      ui.notifications?.info(`"${item.name}" imported to Items.`);
    }
  } catch (error) {
    console.error("Firefly: Import error", error);
    ui.notifications?.error(`Import failed: ${error.message}`);
  }
}

// ==========================================
// DELETE ITEM FROM DATABASE
// ==========================================
async function deleteItem(id, type) {
  const confirm = await Dialog.confirm({
    title: "Delete Item",
    content: "<p>Are you sure you want to delete this item?</p>",
    defaultYes: false,
  });
  if (!confirm) return;

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/firefly/delete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type, ids: [id] }),
    });

    if (response.ok) {
      ui.notifications?.info("Item deleted.");
      await fetchItems();
      renderList();
    } else {
      const err = await response.json();
      ui.notifications?.error(`Delete failed: ${err.message || err.error}`);
    }
  } catch (error) {
    ui.notifications?.error("Delete error.");
  }
}

// ==========================================
// IMPORT FROM FOUNDRY — auto-detect items dari game.items
// ==========================================
function showImportFromFoundryDialog() {
  const worldItems = game.items.contents.filter((i) =>
    ITEM_TYPES.includes(i.type?.toLowerCase())
  );

  if (worldItems.length === 0) {
    ui.notifications?.warn("No valid items found in this Foundry world.");
    return;
  }

  const user = getUser();
  const isAdmin = user?.role === "admin";

  const content = `
    <div style="padding: 10px; color: #f4f4f5;">
      <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 10px;">
        Detected <strong>${worldItems.length}</strong> items.
      </p>
      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <button id="ff-select-all" style="font-size: 11px; padding: 4px 12px; border-radius: 4px; border: 1px solid #3f3f46; background: rgba(0,0,0,0.3); color: #a1a1aa; cursor: pointer;">Select All</button>
        <button id="ff-deselect-all" style="font-size: 11px; padding: 4px 12px; border-radius: 4px; border: 1px solid #3f3f46; background: rgba(0,0,0,0.3); color: #a1a1aa; cursor: pointer;">Deselect All</button>
      </div>
      <div id="ff-import-grid" style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
        max-height: 420px;
        overflow-y: auto;
        padding: 4px;
      ">
        ${worldItems.map((item) => `
          <div class="ff-import-tile" data-id="${item.id}" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 6px;
            background: rgba(0,0,0,0.2);
            border: 2px solid #3f3f46;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s;
            gap: 4px;
          ">
            <div style="width: 52px; height: 52px; border-radius: 6px; overflow: hidden; background: #27272a; display: flex; align-items: center; justify-content: center;">
              ${item.img
                ? `<img src="${item.img}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div style="display:none; align-items:center; justify-content:center; width:100%; height:100%; color:#52525b; font-size:18px;"><i class="fa-solid fa-cube"></i></div>`
                : `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:#52525b; font-size:18px;"><i class="fa-solid fa-cube"></i></div>`
              }
            </div>
            <div style="font-size: 9px; color: #e4e4e7; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${item.name}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  new Dialog({
    title: isAdmin ? "Import from Foundry (Admin)" : "Import from Foundry (Homebrew)",
    content,
    buttons: {
      import: {
        label: '<i class="fa-solid fa-upload"></i> Import Selected',
        callback: async (html) => {
          const selected = html.find(".ff-import-tile.selected");
          if (selected.length === 0) {
            ui.notifications?.warn("No items selected.");
            return;
          }
          const selectedIds = [];
          selected.each(function () { selectedIds.push(this.dataset.id); });
          await importSelectedToBackend(selectedIds);
        },
      },
      cancel: { label: "Cancel" },
    },
    default: "import",
    render: (html) => {
      const dialogEl = html.closest(".app")[0];
      const contentEl = dialogEl.querySelector(".window-content");
      if (contentEl) {
        contentEl.style.backgroundColor = "#18181b";
        contentEl.style.color = "white";
        contentEl.style.backgroundImage = "none";
      }
      html.closest(".dialog").find(".dialog-buttons button").css({
        color: "white",
        border: "1px solid #3f3f46",
        background: "rgba(0,0,0,0.4)",
      });

      // Toggle select on tile click
      html.find("#ff-import-grid").on("click", ".ff-import-tile", function () {
        if (this.classList.contains("selected")) {
          this.classList.remove("selected");
          this.style.border = "2px solid #3f3f46";
          this.style.background = "rgba(0,0,0,0.2)";
        } else {
          this.classList.add("selected");
          this.style.border = "2px solid #3b82f6";
          this.style.background = "rgba(59, 130, 246, 0.1)";
        }
      });

      // Select/Deselect all
      html.find("#ff-select-all").on("click", () => {
        html.find(".ff-import-tile").each(function () {
          this.classList.add("selected");
          this.style.border = "2px solid #3b82f6";
          this.style.background = "rgba(59, 130, 246, 0.1)";
        });
      });
      html.find("#ff-deselect-all").on("click", () => {
        html.find(".ff-import-tile").each(function () {
          this.classList.remove("selected");
          this.style.border = "2px solid #3f3f46";
          this.style.background = "rgba(0,0,0,0.2)";
        });
      });
    },
  }, { width: 550, height: 600, classes: ["dialog", "silane-custom-dialog"] }).render(true);
}

// ==========================================
// SEND SELECTED FOUNDRY ITEMS TO BACKEND
// ==========================================
async function importSelectedToBackend(itemIds) {
  try {
    const token = getToken();

    // Ambil raw data dari Foundry items
    const rawItems = [];
    for (const id of itemIds) {
      const item = game.items.get(id);
      if (item) {
        rawItems.push(item.toObject());
      }
    }

    if (rawItems.length === 0) {
      ui.notifications?.warn("No valid items to import.");
      return;
    }

    ui.notifications?.info(`Importing ${rawItems.length} item(s) to database...`);

    const response = await fetch(`${API_BASE_URL}/api/firefly/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(rawItems),
    });

    const result = await response.json();

    if (response.ok) {
      const target = result.target === "foundry" ? "foundry_*" : "*_homebrew";
      ui.notifications?.info(`Done! ${result.imported} item(s) → ${target}`);
      if (result.rejected > 0) {
        console.warn("Firefly rejected:", result.rejected_details);
        ui.notifications?.warn(`${result.rejected} item(s) rejected. Check console.`);
      }
      await fetchItems();
      renderUI();
    } else {
      ui.notifications?.error(`Import failed: ${result.message || result.error}`);
    }
  } catch (error) {
    console.error("Firefly: Import to backend error", error);
    ui.notifications?.error("Import failed. Check console.");
  }
}
