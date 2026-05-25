import { API_BASE_URL } from "./helper.js";

let parentContainer = null;
let currentItems = [];
let searchQuery = "";
let currentOffset = 0;
let currentType = "";
let currentAdminView = "foundry"; // "foundry" | "homebrew"
let selectedHomebrewUser = null; // { user_id, user_name } for admin drill-down
let selectedCards = new Set(); // multi-select item ids
const LIMIT = 200;

const ITEM_TYPES = ["weapon", "spell", "consumable", "container", "equipment", "feat", "loot", "tool"];

function getToken() { return localStorage.getItem("heraldSilane_token"); }
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
    .ff-container { display:flex; flex-direction:column; height:100%; gap:10px; padding:0; min-height:0; flex:1; position:relative; }
    .ff-toolbar { display:flex; gap:10px; align-items:center; flex-shrink:0; }
    .ff-search-box { flex:1; display:flex; align-items:center; background:rgba(0,0,0,0.3); border:1px solid #3f3f46; border-radius:6px; padding:0 12px; height:36px; transition:border-color 0.2s; }
    .ff-search-box:focus-within { border-color:#3b82f6; }
    .ff-search-box input { background:transparent; border:none; color:#f4f4f5; width:100%; margin-left:8px; outline:none; font-size:13px; }
    .ff-btn-action { width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.4); color:#60a5fa; border-radius:6px; cursor:pointer; transition:all 0.2s; font-size:14px; }
    .ff-btn-action:hover { background:#3b82f6; color:#fff; }
    .ff-loading { width:100%; height:3px; background:#27272a; border-radius:2px; overflow:hidden; flex-shrink:0; }
    .ff-loading-bar { height:100%; width:0%; background:linear-gradient(90deg,#3b82f6,#60a5fa); border-radius:2px; transition:width 0.3s; animation:ff-load 1.2s ease-in-out infinite; }
    @keyframes ff-load { 0%{width:0%;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }
    .ff-breadcrumb { display:flex; align-items:center; gap:6px; font-size:12px; color:#a1a1aa; flex-shrink:0; }
    .ff-breadcrumb span { color:#71717a; }
    .ff-breadcrumb a { color:#60a5fa; cursor:pointer; text-decoration:none; }
    .ff-breadcrumb a:hover { text-decoration:underline; }
    .ff-list { flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(90px,1fr)); gap:10px; padding:4px; align-content:start; min-height:0; }
    .ff-list::-webkit-scrollbar { width:6px; }
    .ff-list::-webkit-scrollbar-thumb { background:#3f3f46; border-radius:10px; }
    .ff-card { display:flex; flex-direction:column; align-items:center; padding:8px 6px; background:rgba(0,0,0,0.2); border:1px solid #27272a; border-radius:10px; transition:all 0.2s; cursor:pointer; position:relative; gap:6px; }
    .ff-card:hover { background:rgba(0,0,0,0.45); border-color:#3f3f46; }
    .ff-card.selected { border-color:#3b82f6; background:rgba(59,130,246,0.1); }
    .ff-card.selected::after { content:'\\f00c'; font-family:'Font Awesome 6 Free'; font-weight:900; position:absolute; top:4px; left:4px; font-size:9px; color:#3b82f6; background:rgba(59,130,246,0.2); border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; }
    .ff-card-img { width:56px; height:56px; border-radius:8px; overflow:hidden; background:#27272a; border:1px solid #3f3f46; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ff-card-img img { width:100%; height:100%; object-fit:cover; }
    .ff-card-img-fallback { display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:#52525b; font-size:20px; }
    .ff-card-name { font-size:10px; font-weight:600; color:#e4e4e7; text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ff-card-type { font-size:8px; font-weight:600; text-transform:uppercase; letter-spacing:0.03em; padding:1px 4px; border:1px solid; border-radius:3px; }
    .ff-card-actions { position:absolute; top:4px; right:4px; display:none; flex-direction:column; gap:3px; }
    .ff-card:hover .ff-card-actions { display:flex; }
    .ff-btn-icon { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border-radius:5px; border:1px solid #3f3f46; background:rgba(0,0,0,0.6); color:#a1a1aa; cursor:pointer; transition:all 0.2s; font-size:9px; }
    .ff-btn-icon.import:hover { border-color:#10b981; color:#10b981; background:rgba(16,185,129,0.15); }
    .ff-btn-icon.delete:hover { border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.15); }
    .ff-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#71717a; text-align:center; padding:40px; }
    .ff-user-card { display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(0,0,0,0.2); border:1px solid #27272a; border-radius:10px; cursor:pointer; transition:all 0.2s; }
    .ff-user-card:hover { background:rgba(0,0,0,0.4); border-color:#3f3f46; }
    .ff-user-card i { font-size:20px; color:#60a5fa; }
    .ff-user-card .ff-user-card-name { font-size:14px; font-weight:600; color:#f4f4f5; }
    .ff-user-card .ff-user-card-id { font-size:10px; color:#71717a; }
    .ff-bulk-bar { display:none; align-items:center; gap:8px; padding:8px 14px; background:rgba(9,9,11,0.92); border:1px solid rgba(59,130,246,0.4); border-radius:10px; position:absolute; bottom:12px; right:12px; z-index:10; backdrop-filter:blur(8px); box-shadow:0 4px 20px rgba(0,0,0,0.5); }
    .ff-bulk-bar span { font-size:11px; color:#60a5fa; font-weight:600; }
    .ff-bulk-btn { padding:5px 10px; border-radius:5px; border:1px solid #3f3f46; background:rgba(0,0,0,0.4); color:#a1a1aa; font-size:10px; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:4px; }
    .ff-bulk-btn:hover { background:rgba(255,255,255,0.05); color:#f4f4f5; }
    .ff-bulk-btn.import-bulk:hover { border-color:#10b981; color:#10b981; }
    .ff-bulk-btn.delete-bulk:hover { border-color:#ef4444; color:#ef4444; }
    .ff-bulk-btn.deselect-bulk:hover { border-color:#71717a; color:#71717a; }
  `;
  document.head.appendChild(style);
};

// ==========================================
// INIT
// ==========================================
export async function initFireflyTab(container) {
  parentContainer = container;
  injectFireflyStyles();
  parentContainer.style.height = "100%";
  parentContainer.style.overflow = "hidden";
  parentContainer.style.display = "flex";
  parentContainer.style.flexDirection = "column";
  currentAdminView = "foundry";
  selectedHomebrewUser = null;
  showLoading();
  await fetchItems();
  renderUI();
}

function showLoading() {
  if (!parentContainer) return;
  parentContainer.innerHTML = `<div class="ff-container"><div class="ff-loading"><div class="ff-loading-bar"></div></div><div style="flex:1;display:flex;align-items:center;justify-content:center;color:#71717a;"><i class="fa-solid fa-circle-notch fa-spin fa-lg"></i></div></div>`;
}

// ==========================================
// FETCH
// ==========================================
async function fetchItems() {
  try {
    const token = getToken();
    const user = getUser();
    const isAdmin = user?.role === "admin";
    const params = new URLSearchParams({ limit: LIMIT, offset: currentOffset });
    if (currentType) params.append("type", currentType);
    if (searchQuery) params.append("search", searchQuery);

    let url;
    if (isAdmin && currentAdminView === "homebrew" && selectedHomebrewUser) {
      // Admin viewing specific user's homebrew
      params.append("user_id", selectedHomebrewUser.user_id);
      url = `${API_BASE_URL}/api/firefly/admin/homebrew?${params}`;
    } else if (isAdmin && currentAdminView === "homebrew") {
      url = `${API_BASE_URL}/api/firefly/admin/homebrew?${params}`;
    } else {
      url = `${API_BASE_URL}/api/firefly/items?${params}`;
    }

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) {
      const result = await response.json();
      currentItems = result.items || [];
    } else if (response.status === 401) {
      localStorage.removeItem("heraldSilane_token");
      ui.notifications?.warn("Session expired.");
    } else { currentItems = []; }
  } catch (error) {
    console.error("Firefly: fetch error", error);
    currentItems = [];
  }
}

// ==========================================
// RENDER UI
// ==========================================
function renderUI() {
  if (!parentContainer) return;
  const user = getUser();
  const isAdmin = user?.role === "admin";

  // Breadcrumb
  let breadcrumb = `<span><i class="fa-solid fa-fire"></i></span> <span>Firefly</span>`;
  if (isAdmin && currentAdminView === "foundry") {
    breadcrumb += ` <span>/</span> <span style="color:#60a5fa;">Foundry</span>`;
  } else if (isAdmin && currentAdminView === "homebrew" && !selectedHomebrewUser) {
    breadcrumb += ` <span>/</span> <span style="color:#f59e0b;">Homebrew Users</span>`;
  } else if (isAdmin && currentAdminView === "homebrew" && selectedHomebrewUser) {
    breadcrumb += ` <span>/</span> <a id="ff-bc-users">Homebrew</a> <span>/</span> <span style="color:#f59e0b;">${selectedHomebrewUser.user_name}</span>`;
  }

  const showGrid = !(isAdmin && currentAdminView === "homebrew" && !selectedHomebrewUser);

  parentContainer.innerHTML = `
    <div class="ff-container">
      <div class="ff-breadcrumb">${breadcrumb}</div>
      ${isAdmin ? `
      <div class="ff-toolbar" style="gap:6px;">
        <button id="ff-view-foundry" style="flex:1;height:28px;border-radius:6px;border:1px solid ${currentAdminView === 'foundry' ? '#3b82f6' : '#3f3f46'};background:${currentAdminView === 'foundry' ? 'rgba(59,130,246,0.15)' : 'transparent'};color:${currentAdminView === 'foundry' ? '#60a5fa' : '#a1a1aa'};font-size:11px;font-weight:600;cursor:pointer;">Foundry</button>
        <button id="ff-view-homebrew" style="flex:1;height:28px;border-radius:6px;border:1px solid ${currentAdminView === 'homebrew' ? '#f59e0b' : '#3f3f46'};background:${currentAdminView === 'homebrew' ? 'rgba(245,158,11,0.15)' : 'transparent'};color:${currentAdminView === 'homebrew' ? '#f59e0b' : '#a1a1aa'};font-size:11px;font-weight:600;cursor:pointer;">All Homebrew</button>
      </div>` : ""}
      ${showGrid ? `
      <div class="ff-toolbar">
        <div class="ff-search-box">
          <i class="fa-solid fa-search" style="color:#71717a;"></i>
          <input type="text" id="ff-search" placeholder="Search items..." value="${searchQuery}" />
        </div>
        <button id="ff-btn-import" class="ff-btn-action" title="Import from Foundry Items">
          <i class="fa-solid fa-file-import"></i>
        </button>
      </div>
      <div id="ff-list" class="ff-list"></div>
      <div id="ff-bulk-bar" class="ff-bulk-bar">
        <span id="ff-bulk-count">0</span>
        <button id="ff-bulk-import" class="ff-bulk-btn import-bulk"><i class="fa-solid fa-download"></i> Import</button>
        <button id="ff-bulk-delete" class="ff-bulk-btn delete-bulk"><i class="fa-solid fa-trash"></i> Delete</button>
        <button id="ff-bulk-deselect" class="ff-bulk-btn deselect-bulk"><i class="fa-solid fa-xmark"></i></button>
      </div>` : `<div id="ff-user-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px;"></div>`}
    </div>
  `;

  if (showGrid) { renderList(); attachEvents(); }
  else { renderUserList(); }
  attachAdminToggle();
  attachBreadcrumbEvents();
}

// ==========================================
// RENDER USER LIST (admin homebrew drill-down)
// ==========================================
function renderUserList() {
  const listEl = document.getElementById("ff-user-list");
  if (!listEl) return;

  // Group items by user_id to get unique users
  const usersMap = {};
  for (const item of currentItems) {
    const uid = item.user_id || "unknown";
    if (!usersMap[uid]) {
      usersMap[uid] = { user_id: uid, user_name: item.user_name || "Unknown", count: 0 };
    }
    usersMap[uid].count++;
  }
  const users = Object.values(usersMap);

  if (users.length === 0) {
    listEl.innerHTML = `<div class="ff-empty"><i class="fa-solid fa-users fa-2x" style="margin-bottom:12px;opacity:0.5;"></i><div>No homebrew users found.</div></div>`;
    return;
  }

  listEl.innerHTML = users.map((u) => `
    <div class="ff-user-card" data-user-id="${u.user_id}" data-user-name="${u.user_name}">
      <i class="fa-solid fa-user-circle"></i>
      <div>
        <div class="ff-user-card-name">${u.user_name}</div>
        <div class="ff-user-card-id">${u.count} item(s)</div>
      </div>
    </div>
  `).join("");

  listEl.addEventListener("click", async (e) => {
    const card = e.target.closest(".ff-user-card");
    if (!card) return;
    selectedHomebrewUser = { user_id: card.dataset.userId, user_name: card.dataset.userName };
    showLoading();
    await fetchItems();
    renderUI();
  });
}

// ==========================================
// ADMIN TOGGLE & BREADCRUMB
// ==========================================
function attachAdminToggle() {
  const btnFoundry = document.getElementById("ff-view-foundry");
  const btnHomebrew = document.getElementById("ff-view-homebrew");
  if (!btnFoundry || !btnHomebrew) return;

  btnFoundry.addEventListener("click", async () => {
    currentAdminView = "foundry";
    selectedHomebrewUser = null;
    selectedCards.clear();
    currentOffset = 0;
    searchQuery = "";
    showLoading();
    await fetchItems();
    renderUI();
  });

  btnHomebrew.addEventListener("click", async () => {
    currentAdminView = "homebrew";
    selectedHomebrewUser = null;
    selectedCards.clear();
    currentOffset = 0;
    searchQuery = "";
    showLoading();
    await fetchItems();
    renderUI();
  });
}

function attachBreadcrumbEvents() {
  const bcUsers = document.getElementById("ff-bc-users");
  if (bcUsers) {
    bcUsers.addEventListener("click", async () => {
      selectedHomebrewUser = null;
      showLoading();
      await fetchItems();
      renderUI();
    });
  }
}

// ==========================================
// RENDER LIST (icon/card grid)
// ==========================================
function renderList() {
  const listEl = document.getElementById("ff-list");
  if (!listEl) return;
  const user = getUser();
  const isAdmin = user?.role === "admin";
  const showUser = isAdmin && currentAdminView === "homebrew" && selectedHomebrewUser;

  if (currentItems.length === 0) {
    listEl.innerHTML = `<div class="ff-empty" style="grid-column:1/-1;"><i class="fa-solid fa-box-open fa-2x" style="margin-bottom:12px;opacity:0.5;"></i><div>No items found.</div></div>`;
    return;
  }

  // Filter by selected user if admin drill-down
  let items = currentItems;
  if (showUser) {
    items = currentItems.filter((i) => i.user_id === selectedHomebrewUser.user_id);
  }

  listEl.innerHTML = items.map((item) => {
    const itemType = item.__type || item.type || "unknown";
    const typeColors = { weapon:"#ef4444", spell:"#8b5cf6", consumable:"#f59e0b", container:"#6b7280", equipment:"#3b82f6", feat:"#10b981", loot:"#eab308", tool:"#06b6d4", feature:"#ec4899", unknown:"#71717a" };
    const typeColor = typeColors[itemType] || typeColors.unknown;
    return `
      <div class="ff-card" data-id="${item.id}" data-type="${itemType}" title="${item.name}">
        <div class="ff-card-actions">
          <button class="ff-btn-icon import" data-id="${item.id}" data-type="${itemType}" title="Import to Foundry"><i class="fa-solid fa-download"></i></button>
          <button class="ff-btn-icon delete" data-id="${item.id}" data-type="${itemType}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="ff-card-img">
          ${item.image ? `<img src="${item.image}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` : ""}
          <div class="ff-card-img-fallback" ${item.image ? 'style="display:none;"' : ""}><i class="fa-solid fa-cube"></i></div>
        </div>
        <div class="ff-card-name">${item.name}</div>
        <span class="ff-card-type" style="border-color:${typeColor};color:${typeColor};">${itemType}</span>
      </div>`;
  }).join("");
}

// ==========================================
// EVENTS
// ==========================================
function attachEvents() {
  let searchTimeout;
  const searchEl = document.getElementById("ff-search");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        searchQuery = e.target.value.trim();
        currentOffset = 0;
        selectedCards.clear();
        showLoading();
        await fetchItems();
        renderUI();
      }, 500);
    });
  }

  const importBtn = document.getElementById("ff-btn-import");
  if (importBtn) importBtn.addEventListener("click", () => showImportFromFoundryDialog());

  const listEl = document.getElementById("ff-list");
  if (listEl) {
    listEl.addEventListener("click", async (e) => {
      // Single-item action buttons (hover)
      const ib = e.target.closest(".ff-btn-icon.import");
      if (ib) { e.stopPropagation(); await importItemToFoundry(ib.dataset.id, ib.dataset.type); return; }
      const db = e.target.closest(".ff-btn-icon.delete");
      if (db) { e.stopPropagation(); await deleteItem(db.dataset.id, db.dataset.type); return; }

      // Card click = toggle select
      const card = e.target.closest(".ff-card");
      if (card) {
        const id = card.dataset.id;
        if (selectedCards.has(id)) {
          selectedCards.delete(id);
          card.classList.remove("selected");
        } else {
          selectedCards.add(id);
          card.classList.add("selected");
        }
        updateBulkBar();
      }
    });
  }

  // Bulk actions
  const bulkImport = document.getElementById("ff-bulk-import");
  if (bulkImport) bulkImport.addEventListener("click", () => bulkImportToFoundry());
  const bulkDelete = document.getElementById("ff-bulk-delete");
  if (bulkDelete) bulkDelete.addEventListener("click", () => bulkDeleteItems());
  const bulkDeselect = document.getElementById("ff-bulk-deselect");
  if (bulkDeselect) bulkDeselect.addEventListener("click", () => {
    selectedCards.clear();
    document.querySelectorAll(".ff-card.selected").forEach((c) => c.classList.remove("selected"));
    updateBulkBar();
  });
}

function updateBulkBar() {
  const bar = document.getElementById("ff-bulk-bar");
  const count = document.getElementById("ff-bulk-count");
  if (!bar) return;
  if (selectedCards.size > 0) {
    bar.style.display = "flex";
    count.textContent = `${selectedCards.size}`;
  } else {
    bar.style.display = "none";
  }
}

// ==========================================
// BULK IMPORT TO FOUNDRY
// ==========================================
async function bulkImportToFoundry() {
  if (selectedCards.size === 0) return;
  const token = getToken();
  const user = getUser();
  const isAdmin = user?.role === "admin";
  let successCount = 0;

  for (const id of selectedCards) {
    const item = currentItems.find((i) => i.id === id);
    if (!item) continue;
    const type = item.__type || item.type;
    try {
      const url = isAdmin && currentAdminView === "foundry"
        ? `${API_BASE_URL}/api/firefly/items/${type}/${id}`
        : `${API_BASE_URL}/api/firefly/homebrew/items/${type}/${id}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) continue;
      const result = await response.json();
      const rawData = result.item?.raw_data;
      if (!rawData) continue;
      const importData = foundry.utils.deepClone(rawData);
      delete importData._id;
      await Item.create(importData);
      successCount++;
    } catch (err) { console.error("Bulk import error:", err); }
  }

  ui.notifications?.info(`Imported ${successCount} item(s) to Foundry.`);
  selectedCards.clear();
  updateBulkBar();
  document.querySelectorAll(".ff-card.selected").forEach((c) => c.classList.remove("selected"));
}

// ==========================================
// BULK DELETE
// ==========================================
async function bulkDeleteItems() {
  if (selectedCards.size === 0) return;
  const confirm = await Dialog.confirm({ title: "Delete Items", content: `<p>Delete ${selectedCards.size} selected item(s)?</p>`, defaultYes: false });
  if (!confirm) return;

  const token = getToken();
  // Group by type
  const grouped = {};
  for (const id of selectedCards) {
    const item = currentItems.find((i) => i.id === id);
    if (!item) continue;
    const type = item.__type || item.type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(id);
  }

  let totalDeleted = 0;
  for (const [type, ids] of Object.entries(grouped)) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/firefly/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type, ids }),
      });
      if (response.ok) totalDeleted += ids.length;
    } catch (err) { console.error("Bulk delete error:", err); }
  }

  ui.notifications?.info(`Deleted ${totalDeleted} item(s).`);
  selectedCards.clear();
  showLoading();
  await fetchItems();
  renderUI();
}

// ==========================================
// IMPORT ITEM TO FOUNDRY VTT
// ==========================================
async function importItemToFoundry(id, type) {
  try {
    const token = getToken();
    const user = getUser();
    const isAdmin = user?.role === "admin";
    const url = isAdmin && currentAdminView === "foundry"
      ? `${API_BASE_URL}/api/firefly/items/${type}/${id}`
      : `${API_BASE_URL}/api/firefly/homebrew/items/${type}/${id}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { ui.notifications?.error("Failed to fetch item."); return; }
    const result = await response.json();
    const rawData = result.item?.raw_data;
    if (!rawData) { ui.notifications?.error("No raw data."); return; }
    const importData = foundry.utils.deepClone(rawData);
    delete importData._id;
    const item = await Item.create(importData);
    if (item) ui.notifications?.info(`"${item.name}" imported.`);
  } catch (error) {
    console.error("Firefly: Import error", error);
    ui.notifications?.error(`Import failed: ${error.message}`);
  }
}

// ==========================================
// DELETE ITEM
// ==========================================
async function deleteItem(id, type) {
  const confirm = await Dialog.confirm({ title: "Delete Item", content: "<p>Delete this item?</p>", defaultYes: false });
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
      showLoading();
      await fetchItems();
      renderUI();
    } else {
      const err = await response.json();
      ui.notifications?.error(`Delete failed: ${err.message}`);
    }
  } catch (error) { ui.notifications?.error("Delete error."); }
}

// ==========================================
// IMPORT FROM FOUNDRY DIALOG
// ==========================================
function showImportFromFoundryDialog() {
  const worldItems = game.items.contents.filter((i) => ITEM_TYPES.includes(i.type?.toLowerCase()));
  if (worldItems.length === 0) { ui.notifications?.warn("No valid items in world."); return; }
  const user = getUser();
  const isAdmin = user?.role === "admin";

  const content = `
    <div style="padding:10px;color:#f4f4f5;">
      <p style="font-size:13px;color:#a1a1aa;margin-bottom:10px;">Detected <strong>${worldItems.length}</strong> items.</p>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button id="ff-select-all" style="font-size:11px;padding:4px 12px;border-radius:4px;border:1px solid #3f3f46;background:rgba(0,0,0,0.3);color:#a1a1aa;cursor:pointer;">Select All</button>
        <button id="ff-deselect-all" style="font-size:11px;padding:4px 12px;border-radius:4px;border:1px solid #3f3f46;background:rgba(0,0,0,0.3);color:#a1a1aa;cursor:pointer;">Deselect All</button>
      </div>
      <div id="ff-import-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;max-height:420px;overflow-y:auto;padding:4px;">
        ${worldItems.map((item) => `
          <div class="ff-import-tile" data-id="${item.id}" style="display:flex;flex-direction:column;align-items:center;padding:6px;background:rgba(0,0,0,0.2);border:2px solid #3f3f46;border-radius:8px;cursor:pointer;transition:all 0.15s;gap:4px;">
            <div style="width:52px;height:52px;border-radius:6px;overflow:hidden;background:#27272a;display:flex;align-items:center;justify-content:center;">
              ${item.img ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;color:#52525b;font-size:18px;"><i class="fa-solid fa-cube"></i></div>` : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#52525b;font-size:18px;"><i class="fa-solid fa-cube"></i></div>`}
            </div>
            <div style="font-size:9px;color:#e4e4e7;text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">${item.name}</div>
          </div>
        `).join("")}
      </div>
    </div>`;

  new Dialog({
    title: isAdmin ? "Import from Foundry (Admin)" : "Import from Foundry",
    content,
    buttons: {
      import: {
        label: '<i class="fa-solid fa-upload"></i> Import Selected',
        callback: async (html) => {
          const selected = html.find(".ff-import-tile.selected");
          if (selected.length === 0) { ui.notifications?.warn("No items selected."); return; }
          const ids = []; selected.each(function () { ids.push(this.dataset.id); });
          await importSelectedToBackend(ids);
        },
      },
      cancel: { label: "Cancel" },
    },
    default: "import",
    render: (html) => {
      const dialogEl = html.closest(".app")[0];
      const contentEl = dialogEl.querySelector(".window-content");
      if (contentEl) { contentEl.style.backgroundColor = "#18181b"; contentEl.style.color = "white"; contentEl.style.backgroundImage = "none"; }
      html.closest(".dialog").find(".dialog-buttons button").css({ color: "white", border: "1px solid #3f3f46", background: "rgba(0,0,0,0.4)" });
      html.find("#ff-import-grid").on("click", ".ff-import-tile", function () {
        if (this.classList.contains("selected")) { this.classList.remove("selected"); this.style.border = "2px solid #3f3f46"; this.style.background = "rgba(0,0,0,0.2)"; }
        else { this.classList.add("selected"); this.style.border = "2px solid #3b82f6"; this.style.background = "rgba(59,130,246,0.1)"; }
      });
      html.find("#ff-select-all").on("click", () => { html.find(".ff-import-tile").each(function () { this.classList.add("selected"); this.style.border = "2px solid #3b82f6"; this.style.background = "rgba(59,130,246,0.1)"; }); });
      html.find("#ff-deselect-all").on("click", () => { html.find(".ff-import-tile").each(function () { this.classList.remove("selected"); this.style.border = "2px solid #3f3f46"; this.style.background = "rgba(0,0,0,0.2)"; }); });
    },
  }, { width: 550, height: 600, classes: ["dialog", "silane-custom-dialog"] }).render(true);
}

// ==========================================
// SEND SELECTED FOUNDRY ITEMS TO BACKEND
// ==========================================
async function importSelectedToBackend(itemIds) {
  try {
    const token = getToken();
    const rawItems = [];
    for (const id of itemIds) {
      const item = game.items.get(id);
      if (item) rawItems.push(item.toObject());
    }
    if (rawItems.length === 0) { ui.notifications?.warn("No valid items."); return; }
    ui.notifications?.info(`Importing ${rawItems.length} item(s)...`);

    const response = await fetch(`${API_BASE_URL}/api/firefly/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(rawItems),
    });
    const result = await response.json();
    if (response.ok) {
      const target = result.target === "foundry" ? "foundry_*" : "*_homebrew";
      ui.notifications?.info(`Done! ${result.imported} item(s) → ${target}`);
      if (result.rejected > 0) { console.warn("Rejected:", result.rejected_details); ui.notifications?.warn(`${result.rejected} rejected.`); }
      showLoading();
      await fetchItems();
      renderUI();
    } else {
      ui.notifications?.error(`Import failed: ${result.message}`);
    }
  } catch (error) {
    console.error("Firefly: Import error", error);
    ui.notifications?.error("Import failed.");
  }
}
