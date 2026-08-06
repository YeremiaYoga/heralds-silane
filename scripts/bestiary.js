import { API_BASE_URL } from "./helper.js";

let parentContainer = null;
let currentItems = [];
let searchQuery = "";
let currentOffset = 0;
let currentType = "";
let currentAdminView = "foundry"; 
let selectedHomebrewUser = null;
let selectedCards = new Set();
let activeFilters = new Set();
let currentImageViewMode = "portrait"; 
const LIMIT = 200;

const CREATURE_TYPES = [
  "humanoid", "beast", "dragon", "undead", "fiend", 
  "monstrosity", "aberration", "elemental", "construct", "fey", "giant"
];

function getToken() {
  return localStorage.getItem("heraldSilane_token");
}

function getUser() {
  const str = localStorage.getItem("heraldSilane_user");
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

export async function initBestiaryTab(container) {
  parentContainer = container;
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
  parentContainer.innerHTML = `<div class="bs-container"><div class="bs-loading"><div class="bs-loading-bar"></div></div><div style="flex:1;display:flex;align-items:center;justify-content:center;color:#71717a;"><i class="fa-solid fa-circle-notch fa-spin fa-lg"></i></div></div>`;
}

async function fetchItems() {
  try {
    const token = getToken();
    const user = getUser();
    const isAdmin = user?.role === "admin";
    const params = new URLSearchParams({ limit: LIMIT, offset: currentOffset, view: currentAdminView });
    if (currentType) params.append("type", currentType);
    if (searchQuery) params.append("search", searchQuery);

    let url = `${API_BASE_URL}/api/bestiary/items?${params}`;
    if (isAdmin && currentAdminView === "homebrew" && selectedHomebrewUser) {
      params.append("user_id", selectedHomebrewUser.user_id);
      url = `${API_BASE_URL}/api/bestiary/items?${params}`;
    }

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) {
      const result = await response.json();
      currentItems = result.items || [];
    } else if (response.status === 401) {
      localStorage.removeItem("heraldSilane_token");
      ui.notifications?.warn("Session expired.");
    } else {
      currentItems = [];
    }
  } catch (error) {
    console.error("Bestiary: fetch error", error);
    currentItems = [];
  }
}

function renderUI() {
  if (!parentContainer) return;
  const user = getUser();
  const isAdmin = user?.role === "admin";

  const showGrid = !(isAdmin && currentAdminView === "homebrew" && !selectedHomebrewUser);

  parentContainer.innerHTML = `
    <div class="bs-container">
      <div class="bs-toolbar" style="gap:6px; flex-shrink:0;">
        <button id="bs-view-foundry" style="flex:1;height:32px;border-radius:6px;border:1px solid ${currentAdminView === 'foundry' ? '#6366f1' : '#3f3f46'};background:${currentAdminView === 'foundry' ? 'rgba(99,102,241,0.15)' : 'transparent'};color:${currentAdminView === 'foundry' ? '#a5b4fc' : '#a1a1aa'};font-size:12px;font-weight:600;cursor:pointer;">Ignite</button>
        <button id="bs-view-homebrew" style="flex:1;height:32px;border-radius:6px;border:1px solid ${currentAdminView === 'homebrew' ? '#f59e0b' : '#3f3f46'};background:${currentAdminView === 'homebrew' ? 'rgba(245,158,11,0.15)' : 'transparent'};color:${currentAdminView === 'homebrew' ? '#f59e0b' : '#a1a1aa'};font-size:12px;font-weight:600;cursor:pointer;">Homebrew</button>
      </div>
      ${showGrid ? `
      <div class="bs-toolbar" style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;align-items:center;">
        <div class="bs-search-box" style="width:100%;height:32px;box-sizing:border-radius:6px;">
          <i class="fa-solid fa-search" style="color:#71717a;"></i>
          <input type="text" id="bs-search" placeholder="Search creatures..." value="${searchQuery}" style="width:100%;" />
        </div>
        <div style="display:flex;background:#18181b;border:1px solid #3f3f46;border-radius:6px;padding:2px;gap:2px;width:100%;height:32px;box-sizing:border-box;">
          <button id="bs-toggle-img-portrait" style="flex:1;font-size:10px;font-weight:600;border:none;border-radius:4px;cursor:pointer;background:${currentImageViewMode === 'portrait' ? '#3f3f46' : 'transparent'};color:${currentImageViewMode === 'portrait' ? '#ffffff' : '#a1a1aa'};display:flex;align-items:center;justify-content:center;gap:4px;">
            <i class="fa-solid fa-user"></i> Portrait
          </button>
          <button id="bs-toggle-img-token" style="flex:1;font-size:10px;font-weight:600;border:none;border-radius:4px;cursor:pointer;background:${currentImageViewMode === 'token' ? '#3f3f46' : 'transparent'};color:${currentImageViewMode === 'token' ? '#ffffff' : '#a1a1aa'};display:flex;align-items:center;justify-content:center;gap:4px;">
            <i class="fa-solid fa-circle-user"></i> Token
          </button>
        </div>
        <button id="bs-btn-select-actor" class="bs-btn-action" title="Select Character / Monster from Foundry" style="width:100%;height:32px;padding:0 6px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;justify-content:center;gap:4px;">
          <i class="fa-solid fa-user-plus"></i> Select Character
        </button>
      </div>
      <div id="bs-list" class="bs-list"></div>
      <div id="bs-bulk-bar" class="bs-bulk-bar">
        <span id="bs-bulk-count">0</span>
        <button id="bs-bulk-import" class="bs-bulk-btn import-bulk" style="color:#10b981; display:none;"><i class="fa-solid fa-download"></i> Import to Foundry</button>
        <button id="bs-bulk-delete" class="bs-bulk-btn delete-bulk" style="color:#ef4444;"><i class="fa-solid fa-trash"></i> Delete</button>
        <button id="bs-bulk-deselect" class="bs-bulk-btn deselect-bulk"><i class="fa-solid fa-xmark"></i></button>
      </div>` : `<div id="bs-user-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px;"></div>`}
    </div>
  `;

  if (showGrid) { renderList(); attachEvents(); }
  else { renderUserList(); }
  attachViewToggle();
  attachBreadcrumbEvents();
}

function renderUserList() {
  const listEl = document.getElementById("bs-user-list");
  if (!listEl) return;

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
    listEl.innerHTML = `<div class="bs-empty"><i class="fa-solid fa-users fa-2x" style="margin-bottom:12px;opacity:0.5;"></i><div>No homebrew bestiary users found.</div></div>`;
    return;
  }

  listEl.innerHTML = users.map((u) => `
    <div class="bs-user-card" data-user-id="${u.user_id}" data-user-name="${u.user_name}">
      <i class="fa-solid fa-user-circle"></i>
      <div>
        <div style="font-size:14px;font-weight:600;color:#f4f4f5;">${u.user_name}</div>
        <div style="font-size:10px;color:#71717a;">${u.count} creature(s)</div>
      </div>
    </div>
  `).join("");

  listEl.addEventListener("click", async (e) => {
    const card = e.target.closest(".bs-user-card");
    if (!card) return;
    selectedHomebrewUser = { user_id: card.dataset.userId, user_name: card.dataset.userName };
    showLoading();
    await fetchItems();
    renderUI();
  });
}

function attachViewToggle() {
  const btnFoundry = document.getElementById("bs-view-foundry");
  const btnHomebrew = document.getElementById("bs-view-homebrew");
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
  const bcUsers = document.getElementById("bs-bc-users");
  if (bcUsers) {
    bcUsers.addEventListener("click", async () => {
      selectedHomebrewUser = null;
      showLoading();
      await fetchItems();
      renderUI();
    });
  }
}

function renderList() {
  const listEl = document.getElementById("bs-list");
  if (!listEl) return;

  if (currentItems.length === 0) {
    listEl.innerHTML = `<div class="bs-empty" style="grid-column:1/-1;"><i class="fa-solid fa-dragon fa-2x" style="margin-bottom:12px;opacity:0.5;"></i><div>No creatures found in Bestiary.</div></div>`;
    return;
  }

  let items = currentItems;
  if (activeFilters.size > 0) {
    items = items.filter((i) => {
      const t = (i.creature_type || i.type || "").toLowerCase();
      return Array.from(activeFilters).some(f => t.includes(f));
    });
  }

  if (items.length === 0) {
    listEl.innerHTML = `<div class="bs-empty" style="grid-column:1/-1;"><i class="fa-solid fa-filter fa-2x" style="margin-bottom:12px;opacity:0.5;"></i><div>No creatures match active filters.</div></div>`;
    return;
  }

  listEl.innerHTML = items.map((item) => {
    let rawImg = "";
    if (currentImageViewMode === "token") {
      rawImg = formatHttpsUrl(item.img_token || item.raw_data?.prototypeToken?.texture?.src || item.img_portrait || item.image || "");
    } else {
      rawImg = formatHttpsUrl(item.img_portrait || item.image || item.raw_data?.img || item.img_token || "");
    }
    const hasImg = rawImg && rawImg !== "null" && rawImg !== "undefined";
    const crDisplay = item.cr !== undefined && item.cr !== null ? `CR ${item.cr}` : "CR -";
    const typeDisplay = item.creature_type || item.type || "npc";

    return `
      <div class="bs-card" data-id="${item.id}" title="${item.name}">
        <div class="bs-card-img">
          ${hasImg ? `<img src="${rawImg}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` : ""}
          <div class="bs-card-img-fallback" ${hasImg ? 'style="display:none;"' : ""}><i class="fa-solid fa-dragon"></i></div>
        </div>
        <div class="bs-card-name">${item.name}</div>
        <div class="bs-card-meta">
          <span class="bs-badge-cr">${crDisplay}</span>
          <span class="bs-badge-type">${typeDisplay}</span>
        </div>
        <div class="bs-card-actions">
          <button class="bs-btn-icon import" data-id="${item.id}" title="Import to Foundry" style="display:none;"><i class="fa-solid fa-download"></i></button>
          <button class="bs-btn-icon delete" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
  }).join("");
}

function attachEvents() {
  let searchTimeout;
  const searchEl = document.getElementById("bs-search");
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
      }, 1000);
    });
  }

  const btnPort = document.getElementById("bs-toggle-img-portrait");
  const btnTok = document.getElementById("bs-toggle-img-token");
  if (btnPort) {
    btnPort.addEventListener("click", () => {
      currentImageViewMode = "portrait";
      renderUI();
    });
  }
  if (btnTok) {
    btnTok.addEventListener("click", () => {
      currentImageViewMode = "token";
      renderUI();
    });
  }

  const selectActorBtn = document.getElementById("bs-btn-select-actor");
  if (selectActorBtn) {
    selectActorBtn.addEventListener("click", () => showSelectCharacterModal());
  }

  const filtersEl = document.getElementById("bs-filters");
  if (filtersEl) {
    filtersEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".bs-filter-chip");
      if (!chip) return;
      const type = chip.dataset.type;
      if (activeFilters.has(type)) {
        activeFilters.delete(type);
        chip.classList.remove("active");
      } else {
        activeFilters.add(type);
        chip.classList.add("active");
      }
      selectedCards.clear();
      renderList();
      updateBulkBar();
    });
  }

  const listEl = document.getElementById("bs-list");
  if (listEl) {
    listEl.addEventListener("click", async (e) => {
      const ib = e.target.closest(".bs-btn-icon.import");
      if (ib) { e.stopPropagation(); await importBestiaryToFoundry(ib.dataset.id); return; }
      const db = e.target.closest(".bs-btn-icon.delete");
      if (db) { e.stopPropagation(); await deleteBestiaryItem(db.dataset.id); return; }

      const card = e.target.closest(".bs-card");
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

  const bulkImport = document.getElementById("bs-bulk-import");
  if (bulkImport) bulkImport.addEventListener("click", () => bulkImportToFoundry());
  const bulkDelete = document.getElementById("bs-bulk-delete");
  if (bulkDelete) bulkDelete.addEventListener("click", () => bulkDeleteBestiary());
  const bulkDeselect = document.getElementById("bs-bulk-deselect");
  if (bulkDeselect) bulkDeselect.addEventListener("click", () => {
    selectedCards.clear();
    document.querySelectorAll(".bs-card.selected").forEach((c) => c.classList.remove("selected"));
    updateBulkBar();
  });
}

function updateBulkBar() {
  const bar = document.getElementById("bs-bulk-bar");
  const count = document.getElementById("bs-bulk-count");
  if (!bar) return;
  if (selectedCards.size > 0) {
    bar.style.display = "flex";
    count.textContent = `${selectedCards.size} selected`;
  } else {
    bar.style.display = "none";
  }
}

async function importBestiaryToFoundry(id) {
  try {
    const token = getToken();
    const url = `${API_BASE_URL}/api/bestiary/items/${id}?view=${currentAdminView}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { ui.notifications?.error("Failed to fetch bestiary item."); return; }
    const result = await response.json();
    const itemData = result.item;
    if (!itemData) { ui.notifications?.error("No data found."); return; }

    let rawData;
    if (itemData.raw_data && Object.keys(itemData.raw_data).length > 0) {
      rawData = foundry.utils.deepClone(itemData.raw_data);
    } else {
      rawData = {
        name: itemData.name,
        type: itemData.type || "npc",
        img: itemData.img_portrait || itemData.image || "icons/svg/mystery-man.svg",
        prototypeToken: {
          name: itemData.name,
          texture: { src: itemData.img_token || itemData.image || "icons/svg/mystery-man.svg" }
        },
        system: itemData.format_data || {}
      };
    }

    let existingItems = Array.isArray(rawData.items) && rawData.items.length > 0
      ? rawData.items
      : [
          ...(itemData.features || []),
          ...(itemData.actions || []),
          ...(itemData.reactions || []),
          ...(itemData.legendary_actions || []),
        ];

    const nonSpellItems = existingItems.filter((it) => (it?.type || "").toLowerCase() !== "spell");
    const spellsFromCol = Array.isArray(itemData.spells) ? itemData.spells : [];

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
    rawData.items = uniqueItems;

    delete rawData._id;
    const createdActor = await Actor.create(rawData);
    if (createdActor) {
      ui.notifications?.info(`Imported "${createdActor.name}" to Foundry Actors!`);
    }
  } catch (err) {
    console.error("Bestiary import error:", err);
    ui.notifications?.error(`Import failed: ${err.message}`);
  }
}

async function bulkImportToFoundry() {
  if (selectedCards.size === 0) return;
  ui.notifications?.info(`Importing ${selectedCards.size} creature(s) to Foundry...`);
  for (const id of selectedCards) {
    await importBestiaryToFoundry(id);
  }
  selectedCards.clear();
  updateBulkBar();
}

async function deleteBestiaryItem(id) {
  const confirm = await Dialog.confirm({ title: "Delete Creature", content: "<p>Delete this creature from Bestiary?</p>", defaultYes: false });
  if (!confirm) return;

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/bestiary/delete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id], view: currentAdminView }),
    });
    if (response.ok) {
      ui.notifications?.info("Creature deleted from Bestiary.");
      showLoading();
      await fetchItems();
      renderUI();
    } else {
      ui.notifications?.error("Delete failed.");
    }
  } catch (err) {
    ui.notifications?.error("Delete error.");
  }
}

async function bulkDeleteBestiary() {
  if (selectedCards.size === 0) return;
  const confirm = await Dialog.confirm({ title: "Delete Selected", content: `<p>Delete ${selectedCards.size} selected creature(s)?</p>`, defaultYes: false });
  if (!confirm) return;

  try {
    const token = getToken();
    const ids = Array.from(selectedCards);
    const response = await fetch(`${API_BASE_URL}/api/bestiary/delete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ids, view: currentAdminView }),
    });
    if (response.ok) {
      ui.notifications?.info(`Deleted ${ids.length} creature(s).`);
      selectedCards.clear();
      showLoading();
      await fetchItems();
      renderUI();
    }
  } catch (err) {
    ui.notifications?.error("Bulk delete error.");
  }
}

function showSelectCharacterModal() {
  const worldActors = game.actors.contents.map((a) => {
    const rawData = a.toObject();
    const tokenSrc = a.prototypeToken?.texture?.src || a.img || "icons/svg/mystery-man.svg";
    const cr = a.system?.details?.cr ?? a.system?.cr ?? 0;
    const creatureType = a.system?.details?.type?.value || a.system?.details?.type || a.type || "npc";
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      creatureType: creatureType,
      cr: cr,
      img: a.img || "icons/svg/mystery-man.svg",
      tokenImg: tokenSrc,
      actorRef: a,
      rawData: rawData,
    };
  });

  if (worldActors.length === 0) {
    ui.notifications?.warn("No characters or monsters detected in Foundry world.");
    return;
  }

  const user = getUser();
  const isAdmin = user?.role === "admin";

  const content = `
    <div style="padding:10px;color:#f4f4f5;display:flex;flex-direction:column;gap:10px;">

      <div style="display:flex;gap:8px;">
        <div style="flex:1;display:flex;align-items:center;background:#27272a;border:1px solid #3f3f46;border-radius:6px;padding:0 10px;height:34px;">
          <i class="fa-solid fa-search" style="color:#71717a;font-size:12px;"></i>
          <input type="text" id="bs-modal-search-input" placeholder="Search character/monster name..." style="background:transparent;border:none;color:#f4f4f5;width:100%;margin-left:8px;outline:none;font-size:12px;" />
        </div>
      </div>

      <div style="display:flex;gap:8px;">
        <button id="bs-modal-select-all" style="font-size:11px;padding:4px 12px;border-radius:4px;border:1px solid #3f3f46;background:rgba(0,0,0,0.3);color:#a1a1aa;cursor:pointer;">Select All</button>
        <button id="bs-modal-deselect-all" style="font-size:11px;padding:4px 12px;border-radius:4px;border:1px solid #3f3f46;background:rgba(0,0,0,0.3);color:#a1a1aa;cursor:pointer;">Deselect All</button>
      </div>

      <div id="bs-modal-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;max-height:360px;overflow-y:auto;padding:4px;">
      </div>
    </div>`;

  new Dialog(
    {
      title: "Upload Bestiary to Silane",
      content,
      buttons: {
        upload: {
          label: '<i class="fa-solid fa-upload"></i> Upload Selected',
          callback: async (html) => {
            const selectedTiles = html.find(".bs-modal-tile.selected");
            if (selectedTiles.length === 0) {
              ui.notifications?.warn("No character selected.");
              return;
            }
            const selectedIds = [];
            selectedTiles.each(function () { selectedIds.push(this.dataset.id); });

            await processUploadActorsToSilane(selectedIds, worldActors);
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "upload",
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

        const gridEl = html.find("#bs-modal-grid")[0];
        const searchInput = html.find("#bs-modal-search-input")[0];
        const countSpan = html.find("#bs-modal-selected-count")[0];

        let selectedSet = new Set();

        function updateCountDisplay() {
          if (!countSpan) return;
          const visibleTiles = html.find(".bs-modal-tile");
          countSpan.textContent = `${selectedSet.size} / ${visibleTiles.length}`;
        }

        function renderGrid() {
          const query = searchInput.value.trim().toLowerCase();
          let filtered = worldActors;
          if (query) {
            filtered = filtered.filter((a) => a.name.toLowerCase().includes(query));
          }

          gridEl.innerHTML = filtered.map((actor) => {
            const isSel = selectedSet.has(actor.id);
            return `
              <div class="bs-modal-tile ${isSel ? 'selected' : ''}" data-id="${actor.id}" style="display:flex;flex-direction:column;align-items:center;padding:6px;background:${isSel ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.2)'};border:2px solid ${isSel ? '#6366f1' : '#3f3f46'};border-radius:8px;cursor:pointer;transition:all 0.15s;gap:4px;position:relative;">
                <div style="width:52px;height:52px;border-radius:6px;overflow:hidden;background:#27272a;display:flex;align-items:center;justify-content:center;">
                  <img src="${actor.img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='icons/svg/mystery-man.svg';" />
                </div>
                <div style="font-size:9px;color:#e4e4e7;text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;">${actor.name}</div>
              </div>`;
          }).join("");

          updateCountDisplay();
        }

        renderGrid();

        let searchTimeout;
        searchInput.addEventListener("input", () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => renderGrid(), 300);
        });

        html.find("#bs-modal-grid").on("click", ".bs-modal-tile", function () {
          const id = this.dataset.id;
          if (selectedSet.has(id)) {
            selectedSet.delete(id);
            this.classList.remove("selected");
            this.style.border = "2px solid #3f3f46";
            this.style.background = "rgba(0,0,0,0.2)";
          } else {
            selectedSet.add(id);
            this.classList.add("selected");
            this.style.border = "2px solid #6366f1";
            this.style.background = "rgba(99,102,241,0.15)";
          }
          updateCountDisplay();
        });

        html.find("#bs-modal-select-all").on("click", () => {
          html.find(".bs-modal-tile").each(function () {
            const id = this.dataset.id;
            selectedSet.add(id);
            this.classList.add("selected");
            this.style.border = "2px solid #6366f1";
            this.style.background = "rgba(99,102,241,0.15)";
          });
          updateCountDisplay();
        });

        html.find("#bs-modal-deselect-all").on("click", () => {
          selectedSet.clear();
          html.find(".bs-modal-tile").each(function () {
            this.classList.remove("selected");
            this.style.border = "2px solid #3f3f46";
            this.style.background = "rgba(0,0,0,0.2)";
          });
          updateCountDisplay();
        });
      },
    },
    { width: 560, height: 600, classes: ["dialog", "silane-custom-dialog"] }
  ).render(true);
}

function clean5eToolsText(str) {
  if (!str || typeof str !== "string") return str;
  let result = str;
  result = result.replace(/<a\s+[^>]*href=["'][^"']*5e\.tools[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, "$1");
  result = result.replace(/\[([^\]]+)\]\(https?:\/\/[^\s\)]*5e\.tools[^\s\)]*\)/gi, "$1");
  result = result.replace(/\{@link\s+[^}]*5e\.tools[^}]*\|([^}]+)\}/gi, "$1");
  result = result.replace(/\{@link\s+([^|}]+)\|[^}]*5e\.tools[^}]*\}/gi, "$1");
  result = result.replace(/\{@link\s+https?:\/\/[^\s}]*5e\.tools[^\s}]*\s+([^}]+)\}/gi, "$1");
  result = result.replace(/https?:\/\/[^\s<"'>]*5e\.tools[^\s<"'>]*/gi, "");
  return result;
}

function clean5eToolsBiography(raw) {
  if (!raw || typeof raw !== "object") return;
  if (raw.system?.details?.biography?.value) {
    raw.system.details.biography.value = clean5eToolsText(raw.system.details.biography.value);
  }
  if (typeof raw.system?.details?.biography === "string") {
    raw.system.details.biography = clean5eToolsText(raw.system.details.biography);
  }
  if (raw.biography) {
    if (typeof raw.biography === "string") {
      raw.biography = clean5eToolsText(raw.biography);
    } else if (raw.biography.value) {
      raw.biography.value = clean5eToolsText(raw.biography.value);
    }
  }
}

const GENERIC_FEATURE_SVG = "systems/dnd5e/icons/svg/items/feature.svg";

function cleanPlutoniumData(obj) {
  if (!obj || typeof obj !== "object") return obj;

  clean5eToolsBiography(obj);

  if (Array.isArray(obj)) {
    obj.forEach((it) => cleanPlutoniumData(it));
    return obj;
  }

  if (obj.flags && typeof obj.flags === "object") {
    delete obj.flags.plutonium;
    Object.keys(obj.flags).forEach((k) => {
      if (k.toLowerCase().includes("plutonium")) {
        delete obj.flags[k];
      }
    });
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      if (/plutonium/i.test(val)) {
        obj[key] = GENERIC_FEATURE_SVG;
      }
    } else if (val && typeof val === "object") {
      cleanPlutoniumData(val);
    }
  }

  return obj;
}

async function processUploadActorsToSilane(actorIds, worldActors) {
  try {
    const token = getToken();
    const user = getUser();
    const isAdmin = user?.role === "admin";
    const username = user?.username || user?.user_name || "User";

    ui.notifications?.info(`Preparing upload for ${actorIds.length} creature(s)...`);

    const itemsToUpload = [];

    for (const id of actorIds) {
      const actorData = worldActors.find((a) => a.id === id);
      if (!actorData) continue;

      let portraitUrl = actorData.img;
      let tokenUrl = actorData.tokenImg;

      const resolveLocalUrl = (urlStr) => {
        if (!urlStr || urlStr.startsWith("http://") || urlStr.startsWith("https://") || urlStr.startsWith("data:")) return urlStr;
        let clean = urlStr.startsWith("/") ? urlStr.slice(1) : urlStr;
        return `${window.location.origin}/${clean}`;
      };

      const isOurR2Url = (urlStr) => {
        if (!urlStr) return false;
        return (
          urlStr.includes("r2.cloudflarestorage.com") ||
          urlStr.includes("channeldeliver.my.id") ||
          urlStr.includes("projectignite") ||
          urlStr.includes("pub-")
        );
      };

      if (portraitUrl && !isOurR2Url(portraitUrl) && !portraitUrl.startsWith("data:")) {
        try {
          const fetchUrl = resolveLocalUrl(portraitUrl);
          const blob = await fetch(fetchUrl).then((r) => r.blob());
          const formData = new FormData();
          formData.append("file", blob, `${id}-port.webp`);
          formData.append("fvtt_id", id);
          formData.append("image_type", "portrait");

          const res = await fetch(`${API_BASE_URL}/api/bestiary/upload_image`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) portraitUrl = data.url;
          }
        } catch (e) {
          console.warn("Portrait upload failed for", actorData.name, e);
        }
      }

      if (tokenUrl && !isOurR2Url(tokenUrl) && !tokenUrl.startsWith("data:")) {
        try {
          const fetchUrl = resolveLocalUrl(tokenUrl);
          const blob = await fetch(fetchUrl).then((r) => r.blob());
          const formData = new FormData();
          formData.append("file", blob, `${id}-token.webp`);
          formData.append("fvtt_id", id);
          formData.append("image_type", "token");

          const res = await fetch(`${API_BASE_URL}/api/bestiary/upload_image`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) tokenUrl = data.url;
          }
        } catch (e) {
          console.warn("Token upload failed for", actorData.name, e);
        }
      }

      const raw = foundry.utils.deepClone(actorData.rawData);
      raw.img = portraitUrl;
      if (!raw.prototypeToken) raw.prototypeToken = {};
      if (!raw.prototypeToken.texture) raw.prototypeToken.texture = {};
      raw.prototypeToken.texture.src = tokenUrl;

      if (!raw.prototypeToken.ring) {
        raw.prototypeToken.ring = { enabled: false };
      } else if (typeof raw.prototypeToken.ring === "object") {
        raw.prototypeToken.ring.enabled = false;
      } else {
        raw.prototypeToken.ring = false;
      }

      cleanPlutoniumData(raw);

      itemsToUpload.push({
        name: actorData.name,
        type: actorData.type,
        fvtt_id: id,
        img_portrait: portraitUrl,
        img_token: tokenUrl,
        image: portraitUrl,
        cr: actorData.cr,
        creature_type: actorData.creatureType,
        ac: actorData.actorRef.system?.attributes?.ac?.value ?? 10,
        hp: actorData.actorRef.system?.attributes?.hp || { value: 10, max: 10 },
        raw_data: raw,
        format_data: foundry.utils.deepClone(raw),
      });
    }

    if (itemsToUpload.length === 0) {
      ui.notifications?.warn("No valid creatures to upload.");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/bestiary/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemsToUpload),
    });

    const result = await response.json();
    if (response.ok) {
      const targetLabel = isAdmin ? "Ignite" : "Homebrew";
      ui.notifications?.info(`Successfully uploaded ${result.imported} creature(s) → ${targetLabel}!`);
      showLoading();
      await fetchItems();
      renderUI();
    } else {
      ui.notifications?.error(`Upload failed: ${result.message}`);
    }
  } catch (err) {
    console.error("processUploadActorsToSilane error:", err);
    ui.notifications?.error("Upload error encountered.");
  }
}

const formatHttpsUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== "string") return urlStr;
  let str = urlStr.trim();
  if (str.startsWith("data:") || str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }
  if (str.includes(".") && !str.startsWith("/")) {
    return `https://${str}`;
  }
  return str;
};
