import { API_BASE_URL, downloadAndCacheImageToFoundry, sanitizeFoundryItems } from "./helper.js";

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
let currentSortMode = "name_asc";
const LIMIT = 200;

function getNumericCr(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null) {
    return getNumericCr(val.value ?? val.cr ?? 0);
  }
  const s = String(val).trim().toLowerCase();
  if (s === "1/8" || s === "0.125") return 0.125;
  if (s === "1/4" || s === "0.25") return 0.25;
  if (s === "1/2" || s === "0.5") return 0.5;
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

function getNumericAc(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null) {
    return getNumericAc(val.value ?? val.ac ?? val.flat ?? 0);
  }
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

function sortCreatures(items, sortMode) {
  return [...items].sort((a, b) => {
    let diff = 0;
    if (sortMode === "name_asc") {
      diff = (a.name || "").localeCompare(b.name || "");
    } else if (sortMode === "name_desc") {
      diff = (b.name || "").localeCompare(a.name || "");
    } else if (sortMode === "cr_asc") {
      diff = getNumericCr(a.cr) - getNumericCr(b.cr);
    } else if (sortMode === "cr_desc") {
      diff = getNumericCr(b.cr) - getNumericCr(a.cr);
    } else if (sortMode === "ac_asc") {
      diff = getNumericAc(a.ac) - getNumericAc(b.ac);
    } else if (sortMode === "ac_desc") {
      diff = getNumericAc(b.ac) - getNumericAc(a.ac);
    }

    if (diff !== 0) return diff;
    return (a.name || "").localeCompare(b.name || "");
  });
}

const DEFAULT_BESTIARY_FILTERS = {
  creatureTypes: [],
  sizes: [],
  alignments: [],
  languages: [],
  homebrewUserModes: {},
};

let bestiaryFilters = { ...DEFAULT_BESTIARY_FILTERS };

function getActiveFilterCount() {
  let count = 0;
  if (bestiaryFilters.creatureTypes && bestiaryFilters.creatureTypes.length > 0) count += bestiaryFilters.creatureTypes.length;
  if (bestiaryFilters.sizes && bestiaryFilters.sizes.length > 0) count += bestiaryFilters.sizes.length;
  if (bestiaryFilters.alignments && bestiaryFilters.alignments.length > 0) count += bestiaryFilters.alignments.length;
  if (bestiaryFilters.languages && bestiaryFilters.languages.length > 0) count += bestiaryFilters.languages.length;
  const activeModes = Object.values(bestiaryFilters.homebrewUserModes || {}).filter(m => m > 0);
  count += activeModes.length;
  return count;
}

const FILTER_CREATURE_TYPES = [
  "aberration", "beast", "celestial", "construct", "dragon",
  "elemental", "fey", "fiend", "giant", "humanoid",
  "monstrosity", "ooze", "plant", "undead"
];

const FILTER_SIZES = [
  "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"
];

const FILTER_ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
  "Unaligned"
];

const FILTER_LANGUAGES = [
  "Abyssal", "Aquan", "Auran", "Celestial", "Common",
  "Common Sign Language", "Deep Speech", "Draconic", "Dwarvish",
  "Elvish", "Giant", "Gnomish", "Goblin", "Halfling",
  "Infernal", "Orc", "Primordial", "Sylvan", "Telepathy",
  "Thieves Cant", "Undercommon"
];

const FILTER_CR_OPTIONS = [
  { val: 0, label: "0" },
  { val: 0.125, label: "1/8" },
  { val: 0.25, label: "1/4" },
  { val: 0.5, label: "1/2" },
  { val: 1, label: "1" },
  { val: 2, label: "2" },
  { val: 3, label: "3" },
  { val: 4, label: "4" },
  { val: 5, label: "5" },
  { val: 6, label: "6" },
  { val: 7, label: "7" },
  { val: 8, label: "8" },
  { val: 9, label: "9" },
  { val: 10, label: "10" },
  { val: 11, label: "11" },
  { val: 12, label: "12" },
  { val: 13, label: "13" },
  { val: 14, label: "14" },
  { val: 15, label: "15" },
  { val: 16, label: "16" },
  { val: 17, label: "17" },
  { val: 18, label: "18" },
  { val: 19, label: "19" },
  { val: 20, label: "20" },
  { val: 21, label: "21" },
  { val: 22, label: "22" },
  { val: 23, label: "23" },
  { val: 24, label: "24" },
  { val: 25, label: "25" },
  { val: 26, label: "26" },
  { val: 27, label: "27" },
  { val: 28, label: "28" },
  { val: 29, label: "29" },
  { val: 30, label: "30" }
];

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
        <div class="bs-search-box" style="width:100%;height:32px;box-sizing:border-box;">
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
      <div class="bs-selection-bar">
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="bs-bulk-select-all" class="bs-sub-btn" title="Select All Visible Creatures">
            <i class="fa-solid fa-check-double"></i> Select All
          </button>
          <button id="bs-bulk-deselect" class="bs-sub-btn" title="Unselect All Creatures">
            <i class="fa-solid fa-xmark"></i> Unselect All
          </button>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <select id="bs-sort-select" class="bs-sort-select" title="Sort Bestiary" style="height:28px;background:#18181b;border:1px solid #3f3f46;border-radius:5px;color:#f4f4f5;font-size:11px;font-weight:600;padding:0 6px;cursor:pointer;outline:none;">
            <option value="name_asc" ${currentSortMode === 'name_asc' ? 'selected' : ''}>Name (A-Z)</option>
            <option value="name_desc" ${currentSortMode === 'name_desc' ? 'selected' : ''}>Name (Z-A)</option>
            <option value="cr_asc" ${currentSortMode === 'cr_asc' ? 'selected' : ''}>CR (Low)</option>
            <option value="cr_desc" ${currentSortMode === 'cr_desc' ? 'selected' : ''}>CR (High)</option>
            <option value="ac_asc" ${currentSortMode === 'ac_asc' ? 'selected' : ''}>AC (Low)</option>
            <option value="ac_desc" ${currentSortMode === 'ac_desc' ? 'selected' : ''}>AC (High)</option>
          </select>
          <button id="bs-btn-filter" class="bs-sub-btn ${getActiveFilterCount() > 0 ? 'active' : ''}" title="Filter Bestiary" style="${getActiveFilterCount() > 0 ? 'border-color:rgba(99,102,241,0.6);background:rgba(99,102,241,0.2);color:#a5b4fc;' : ''}">
            <i class="fa-solid fa-sliders"></i> Filter ${getActiveFilterCount() > 0 ? `<span class="bs-bulk-count-badge" style="background:#6366f1;color:#fff;padding:1px 6px;margin-left:4px;border-radius:10px;font-size:10px;">${getActiveFilterCount()}</span>` : ''}
          </button>
          <span id="bs-bulk-count" class="bs-bulk-count-badge">
            ${selectedCards.size}
          </span>
          <button id="bs-bulk-import" class="bs-sub-btn import" title="Import Selected Creatures to Foundry">
            <i class="fa-solid fa-file-import"></i> Import
          </button>
          <button id="bs-bulk-delete" class="bs-sub-btn delete" title="Delete Selected Creatures">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
      <div id="bs-list" class="bs-list"></div>` : `<div id="bs-user-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px;"></div>`}
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

  if (bestiaryFilters.creatureTypes && bestiaryFilters.creatureTypes.length > 0) {
    items = items.filter((i) => {
      const t = (i.creature_type || i.type || "").toLowerCase();
      return bestiaryFilters.creatureTypes.some((ct) => t.includes(ct.toLowerCase()));
    });
  }

  if (bestiaryFilters.sizes && bestiaryFilters.sizes.length > 0) {
    items = items.filter((i) => {
      const sz = (i.size || "").toLowerCase();
      return bestiaryFilters.sizes.some((s) => sz.includes(s.toLowerCase()) || s.toLowerCase().includes(sz));
    });
  }

  if (bestiaryFilters.alignments && bestiaryFilters.alignments.length > 0) {
    items = items.filter((i) => {
      const align = (i.alignment || "").toLowerCase();
      return bestiaryFilters.alignments.some((a) => align.includes(a.toLowerCase()));
    });
  }

  if (bestiaryFilters.languages && bestiaryFilters.languages.length > 0) {
    items = items.filter((i) => {
      const langs = Array.isArray(i.languages)
        ? i.languages.join(" ").toLowerCase()
        : (typeof i.languages === "string" ? i.languages.toLowerCase() : "");
      return bestiaryFilters.languages.some((l) => langs.includes(l.toLowerCase()));
    });
  }

  const userModes = bestiaryFilters.homebrewUserModes || {};
  const onlyUserIds = Object.keys(userModes).filter(uid => userModes[uid] === 2);
  const incUserIds = Object.keys(userModes).filter(uid => userModes[uid] === 1);

  if (onlyUserIds.length > 0) {
    items = items.filter(item => onlyUserIds.includes(String(item.user_id)));
  } else if (incUserIds.length > 0) {
    items = items.filter(item => incUserIds.includes(String(item.user_id)));
  }

  items = sortCreatures(items, currentSortMode);

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
    const isSelected = selectedCards.has(item.id);

    return `
      <div class="bs-card ${isSelected ? 'selected' : ''}" data-id="${item.id}" title="${item.name}">
        <div class="bs-card-select-checkbox" title="Select Creature">
          <i class="fa-solid fa-check"></i>
        </div>
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
          <button class="bs-btn-icon import" data-id="${item.id}" title="Import to Foundry (World Management)"><i class="fa-solid fa-file-import"></i></button>
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

  const sortSelect = document.getElementById("bs-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSortMode = e.target.value;
      renderList();
    });
  }

  const filterBtn = document.getElementById("bs-btn-filter");
  if (filterBtn) {
    filterBtn.addEventListener("click", () => showFilterModal());
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

  const bulkSelectAll = document.getElementById("bs-bulk-select-all");
  if (bulkSelectAll) {
    bulkSelectAll.addEventListener("click", () => {
      let items = currentItems;
      if (activeFilters.size > 0) {
        items = items.filter((i) => {
          const t = (i.creature_type || i.type || "").toLowerCase();
          return Array.from(activeFilters).some(f => t.includes(f));
        });
      }
      items.forEach(item => selectedCards.add(item.id));
      renderList();
      updateBulkBar();
    });
  }

  const bulkImport = document.getElementById("bs-bulk-import");
  if (bulkImport) bulkImport.addEventListener("click", () => bulkImportToFoundry());
  const bulkDelete = document.getElementById("bs-bulk-delete");
  if (bulkDelete) bulkDelete.addEventListener("click", () => bulkDeleteBestiary());
  const bulkDeselect = document.getElementById("bs-bulk-deselect");
  if (bulkDeselect) bulkDeselect.addEventListener("click", () => {
    selectedCards.clear();
    renderList();
    updateBulkBar();
  });
}

function updateBulkBar() {
  const count = document.getElementById("bs-bulk-count");
  if (count) {
    count.textContent = `${selectedCards.size}`;
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

    const getStringUrl = (val) => {
      if (!val) return null;
      if (typeof val === "string") return val.trim();
      if (typeof val === "object") return val.src || val.url || val.path || null;
      return null;
    };

    const rawPortrait = getStringUrl(itemData.img_portrait) || getStringUrl(itemData.image) || getStringUrl(rawData.img) || "icons/svg/mystery-man.svg";
    const rawToken = getStringUrl(itemData.img_token) || getStringUrl(itemData.image) || getStringUrl(rawData.prototypeToken?.texture?.src) || rawPortrait;

    const cleanCreatureName = (itemData.name || "creature").replace(/[^a-zA-Z0-9_.-]/g, "_");
    const portraitUrl = await downloadAndCacheImageToFoundry(rawPortrait, `${cleanCreatureName}_portrait`);
    const tokenUrl = await downloadAndCacheImageToFoundry(rawToken, `${cleanCreatureName}_token`);

    rawData.img = portraitUrl;
    if (!rawData.prototypeToken) rawData.prototypeToken = {};
    if (!rawData.prototypeToken.texture) rawData.prototypeToken.texture = {};
    rawData.prototypeToken.texture.src = tokenUrl;
    rawData.prototypeToken.name = itemData.name;

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

    const combined = sanitizeFoundryItems([...nonSpellItems, ...spellsFromCol]);

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

    let rootFolder = game.folders.find(
      (f) => f.name === "Silane Bestiary Import" && f.type === "Actor" && (!f.folder || f.folder === null)
    );
    if (!rootFolder) {
      rootFolder = await Folder.create({
        name: "Silane Bestiary Import",
        type: "Actor",
        color: "#6366f1",
      });
    }
    if (rootFolder?.id || rootFolder?._id) {
      rawData.folder = rootFolder.id || rootFolder._id;
    }

    const createdActor = await Actor.create(rawData);
    if (createdActor) {
      await createdActor.update({
        img: portraitUrl,
        "prototypeToken.texture.src": tokenUrl
      });
      ui.notifications?.info(`Imported "${createdActor.name}" to Foundry (via World Management System)!`);
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
  result = result.replace(/<a\s+[^>]*href=["'][^"']*(?:5e\.tools?|5etools)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, "$1");
  result = result.replace(/\[([^\]]+)\]\((?:https?:\/\/)?(?:[^\s\)]*)(?:5e\.tools?|5etools)[^\s\)]*\)/gi, "$1");
  result = result.replace(/\{@(?:link|5etools)\s+[^}]*(?:5e\.tools?|5etools)[^}]*\|([^}]+)\}/gi, "$1");
  result = result.replace(/\{@(?:link|5etools)\s+([^|}]+)\|[^}]*(?:5e\.tools?|5etools)[^}]*\}/gi, "$1");
  result = result.replace(/\{@(?:link|5etools)\s+(?:https?:\/\/)?(?:[^\s}]*)(?:5e\.tools?|5etools)[^\s}]*\s+([^}]+)\}/gi, "$1");
  result = result.replace(/\{@(?:link|5etools)\s+(?:https?:\/\/)?(?:[^\s}]*)(?:5e\.tools?|5etools)[^\s}]*\}/gi, "");
  result = result.replace(/https?:\/\/[^\s<"'>]*(?:5e\.tools?|5etools)[^\s<"'>]*/gi, "");
  return result;
}

function clean5eToolsBiography(raw) {
  if (!raw || typeof raw !== "object") return;
  if (raw.system?.details?.biography?.value) {
    raw.system.details.biography.value = clean5eToolsText(raw.system.details.biography.value);
  }
  if (raw.system?.details?.biography?.public) {
    raw.system.details.biography.public = clean5eToolsText(raw.system.details.biography.public);
  }
  if (typeof raw.system?.details?.biography === "string") {
    raw.system.details.biography = clean5eToolsText(raw.system.details.biography);
  }
  if (raw.biography) {
    if (typeof raw.biography === "string") {
      raw.biography = clean5eToolsText(raw.biography);
    } else if (typeof raw.biography === "object") {
      if (raw.biography.value) raw.biography.value = clean5eToolsText(raw.biography.value);
      if (raw.biography.public) raw.biography.public = clean5eToolsText(raw.biography.public);
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
      } else if (/(?:5e\.tools?|5etools)/i.test(val)) {
        obj[key] = clean5eToolsText(val);
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

function showFilterModal() {
  const existingModal = document.getElementById("bs-filter-modal");
  if (existingModal) existingModal.remove();

  let draft = JSON.parse(JSON.stringify(bestiaryFilters));
  if (!draft.creatureTypes) draft.creatureTypes = [];
  if (!draft.sizes) draft.sizes = [];
  if (!draft.alignments) draft.alignments = [];
  if (!draft.languages) draft.languages = [];
  if (!draft.homebrewUserModes) draft.homebrewUserModes = {};

  let userSearchQuery = "";
  let homebrewUsers = [];
  let isLoadingFriends = true;

  const curUser = getUser() || {};
  const currentUserId = String(curUser.id || curUser.user_id || curUser._id || "");
  const currentUsername = (curUser.username || curUser.name || curUser.user_name || "").toLowerCase().trim();

  // Initial users from currentItems (excluding current user)
  const usersMap = {};
  currentItems.forEach(item => {
    const uid = String(item.user_id || "unknown");
    const uname = (item.user_name || "Homebrew Creator").toLowerCase().trim();
    if (currentUserId && uid === currentUserId) return;
    if (currentUsername && uname === currentUsername) return;
    if (uid !== "unknown" && !usersMap[uid]) {
      usersMap[uid] = {
        user_id: uid,
        user_name: item.user_name || "Homebrew Creator",
        username: uname.replace(/[^a-z0-9]/g, "") || "creator",
        profile_picture: item.user_avatar || item.profile_picture || item.img_portrait || ""
      };
    }
  });
  homebrewUsers = Object.values(usersMap);

  const renderUserRows = (modalEl) => {
    const listContainer = modalEl.querySelector("#bs-user-filter-list");
    if (!listContainer) return;

    if (isLoadingFriends && homebrewUsers.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center;padding:14px;color:#a1a1aa;font-size:11px;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:#818cf8;"></i> Loading homebrew creators...</div>`;
      return;
    }

    const filteredUsers = homebrewUsers.filter(u => 
      u.user_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    if (filteredUsers.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center;padding:14px;color:#71717a;font-size:11px;">No homebrew creators found.</div>`;
      return;
    }

    listContainer.innerHTML = filteredUsers.map(u => {
      const mode = draft.homebrewUserModes[u.user_id] ?? 0;
      const avatarSrc = formatHttpsUrl(u.profile_picture);
      return `
        <div class="bs-user-filter-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:8px;border:1px solid ${mode === 2 ? 'rgba(217,70,239,0.5)' : mode === 1 ? 'rgba(245,158,11,0.5)' : '#27272a'};background:${mode === 2 ? 'rgba(217,70,239,0.12)' : mode === 1 ? 'rgba(245,158,11,0.12)' : '#09090b'};margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;">
            ${avatarSrc ? `
              <img src="${avatarSrc}" alt="${u.user_name}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;border:1px solid #3f3f46;flex-shrink:0;" />
            ` : `
              <div style="width:26px;height:26px;border-radius:50%;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;color:#a5b4fc;font-weight:700;font-size:11px;flex-shrink:0;">
                ${(u.user_name || "U")[0].toUpperCase()}
              </div>
            `}
            <div style="min-width:0;">
              <div style="font-size:11px;font-weight:600;color:#f4f4f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.user_name}</div>
              <div style="font-size:9px;color:#71717a;">@${u.username}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
            <button class="bs-btn-mode-off" data-uid="${u.user_id}" style="padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;border:${mode === 0 ? '1px solid #52525b' : '1px solid transparent'};background:${mode === 0 ? '#27272a' : 'transparent'};color:${mode === 0 ? '#f4f4f5' : '#71717a'};">Off</button>
            <button class="bs-btn-mode-inc" data-uid="${u.user_id}" style="padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;border:${mode === 1 ? '1px solid #f59e0b' : '1px solid transparent'};background:${mode === 1 ? 'rgba(245,158,11,0.25)' : 'transparent'};color:${mode === 1 ? '#fbbf24' : '#71717a'};" title="Include creatures from this creator">+INC</button>
            <button class="bs-btn-mode-only" data-uid="${u.user_id}" style="padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;border:${mode === 2 ? '1px solid #d946ef' : '1px solid transparent'};background:${mode === 2 ? 'rgba(217,70,239,0.25)' : 'transparent'};color:${mode === 2 ? '#f0abfc' : '#71717a'};" title="Show ONLY creatures from this creator">ONLY</button>
          </div>
        </div>
      `;
    }).join("");
  };

  const activeHomebrewCount = Object.values(draft.homebrewUserModes).filter(m => m > 0).length;

  const modalHtml = `
    <div id="bs-filter-modal" class="bs-modal-overlay" style="display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(9,9,11,0.8);backdrop-filter:blur(8px);z-index:10000;align-items:center;justify-content:center;animation:bs-fade-in 0.2s ease;">
      <div class="bs-modal-content" style="width:560px;max-width:92vw;max-height:88vh;background:#121215;border:1px solid #27272a;border-radius:14px;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);overflow:hidden;color:#f4f4f5;font-family:sans-serif;">
        
        <!-- Header -->
        <div style="padding:16px 22px;border-bottom:1px solid #27272a;display:flex;align-items:center;justify-content:space-between;background:rgba(24,24,27,0.8);">
          <div style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;color:#f4f4f5;">
            <div style="width:32px;height:32px;border-radius:8px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;color:#818cf8;">
              <i class="fa-solid fa-sliders" style="font-size:14px;"></i>
            </div>
            <span>Filter Bestiary & Creatures</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <button id="bs-modal-reset-btn" style="background:rgba(255,255,255,0.05);border:1px solid #3f3f46;color:#a1a1aa;font-size:11px;font-weight:600;padding:5px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;" title="Reset all filters">
              <i class="fa-solid fa-rotate-left"></i> Reset All
            </button>
            <button id="bs-modal-close-btn" style="background:transparent;border:none;color:#71717a;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:color 0.2s;" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:20px 22px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:16px;font-size:12px;">
          
          <!-- FRIENDS HOMEBREW BESTIARY SECTION -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid #27272a;border-radius:10px;padding:14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div style="font-weight:700;color:#a5b4fc;text-transform:uppercase;font-size:10px;letter-spacing:0.6px;display:flex;align-items:center;gap:6px;">
                <i class="fa-solid fa-users"></i> FRIENDS HOMEBREW BESTIARY
                ${activeHomebrewCount > 0 ? `<span style="background:rgba(99,102,241,0.25);color:#a5b4fc;border:1px solid rgba(99,102,241,0.4);font-size:9px;padding:1px 6px;border-radius:10px;">Active</span>` : ''}
              </div>
              ${activeHomebrewCount > 0 ? `<button id="bs-reset-homebrew-btn" style="background:transparent;border:none;color:#f87171;font-size:10px;cursor:pointer;font-weight:600;">Reset homebrew filter</button>` : ''}
            </div>

            <div style="font-size:11px;color:#a1a1aa;margin-bottom:8px;">Filter by Friends Homebrew:</div>

            <div style="position:relative;margin-bottom:10px;">
              <i class="fa-solid fa-search" style="position:absolute;left:10px;top:9px;color:#71717a;font-size:11px;"></i>
              <input type="text" id="bs-user-filter-search" placeholder="Search friends by name, username, or code..." style="width:100%;height:30px;background:#09090b;border:1px solid #3f3f46;border-radius:6px;color:#f4f4f5;padding:0 10px 0 28px;font-size:11px;outline:none;box-sizing:border-box;" />
            </div>

            <div id="bs-user-filter-list" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
            </div>
          </div>

          <!-- Creature Types -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid #27272a;border-radius:10px;padding:14px;">
            <div style="font-weight:700;color:#a5b4fc;margin-bottom:10px;text-transform:uppercase;font-size:10px;letter-spacing:0.6px;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-dragon"></i> CREATURE TYPES
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${FILTER_CREATURE_TYPES.map(type => `
                <button class="bs-modal-chip ${draft.creatureTypes.includes(type) ? 'active' : ''}" data-type="${type}" style="padding:5px 12px;border-radius:18px;border:1px solid ${draft.creatureTypes.includes(type) ? '#6366f1' : '#3f3f46'};background:${draft.creatureTypes.includes(type) ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b'};color:${draft.creatureTypes.includes(type) ? '#e0e7ff' : '#a1a1aa'};font-size:11px;font-weight:${draft.creatureTypes.includes(type) ? '600' : '400'};cursor:pointer;text-transform:capitalize;transition:all 0.15s;box-shadow:${draft.creatureTypes.includes(type) ? '0 0 10px rgba(99,102,241,0.25)' : 'none'};">
                  ${type}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Size -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid #27272a;border-radius:10px;padding:14px;">
            <div style="font-weight:700;color:#a5b4fc;margin-bottom:10px;text-transform:uppercase;font-size:10px;letter-spacing:0.6px;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-up-right-and-down-left-from-center"></i> SIZE
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${FILTER_SIZES.map(size => `
                <button class="bs-modal-chip-size ${draft.sizes.includes(size) ? 'active' : ''}" data-size="${size}" style="padding:5px 12px;border-radius:18px;border:1px solid ${draft.sizes.includes(size) ? '#6366f1' : '#3f3f46'};background:${draft.sizes.includes(size) ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b'};color:${draft.sizes.includes(size) ? '#e0e7ff' : '#a1a1aa'};font-size:11px;font-weight:${draft.sizes.includes(size) ? '600' : '400'};cursor:pointer;transition:all 0.15s;box-shadow:${draft.sizes.includes(size) ? '0 0 10px rgba(99,102,241,0.25)' : 'none'};">
                  ${size}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Alignment -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid #27272a;border-radius:10px;padding:14px;">
            <div style="font-weight:700;color:#a5b4fc;margin-bottom:10px;text-transform:uppercase;font-size:10px;letter-spacing:0.6px;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-scale-balanced"></i> ALIGNMENT
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${FILTER_ALIGNMENTS.map(align => `
                <button class="bs-modal-chip-align ${draft.alignments.includes(align) ? 'active' : ''}" data-align="${align}" style="padding:5px 12px;border-radius:18px;border:1px solid ${draft.alignments.includes(align) ? '#6366f1' : '#3f3f46'};background:${draft.alignments.includes(align) ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b'};color:${draft.alignments.includes(align) ? '#e0e7ff' : '#a1a1aa'};font-size:11px;font-weight:${draft.alignments.includes(align) ? '600' : '400'};cursor:pointer;transition:all 0.15s;box-shadow:${draft.alignments.includes(align) ? '0 0 10px rgba(99,102,241,0.25)' : 'none'};">
                  ${align}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Languages -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid #27272a;border-radius:10px;padding:14px;">
            <div style="font-weight:700;color:#a5b4fc;margin-bottom:10px;text-transform:uppercase;font-size:10px;letter-spacing:0.6px;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-language"></i> LANGUAGES
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${FILTER_LANGUAGES.map(lang => `
                <button class="bs-modal-chip-lang ${draft.languages.includes(lang) ? 'active' : ''}" data-lang="${lang}" style="padding:5px 12px;border-radius:18px;border:1px solid ${draft.languages.includes(lang) ? '#6366f1' : '#3f3f46'};background:${draft.languages.includes(lang) ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b'};color:${draft.languages.includes(lang) ? '#e0e7ff' : '#a1a1aa'};font-size:11px;font-weight:${draft.languages.includes(lang) ? '600' : '400'};cursor:pointer;transition:all 0.15s;box-shadow:${draft.languages.includes(lang) ? '0 0 10px rgba(99,102,241,0.25)' : 'none'};">
                  ${lang}
                </button>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="padding:14px 22px;border-top:1px solid #27272a;display:flex;align-items:center;justify-content:flex-end;gap:12px;background:rgba(24,24,27,0.9);">
          <button id="bs-modal-cancel-btn" style="height:34px;padding:0 16px;border-radius:8px;border:1px solid #3f3f46;background:transparent;color:#a1a1aa;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;">Cancel</button>
          <button id="bs-modal-apply-btn" style="height:34px;padding:0 22px;border-radius:8px;border:1px solid #818cf8;background:linear-gradient(135deg, #6366f1, #4f46e5);color:#ffffff;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.4);transition:all 0.2s;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-check"></i> Apply Filters
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modalEl = document.getElementById("bs-filter-modal");
  renderUserRows(modalEl);

  const searchInput = modalEl.querySelector("#bs-user-filter-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      userSearchQuery = e.target.value;
      renderUserRows(modalEl);
    });
  }

  const updateChips = () => {
    modalEl.querySelectorAll(".bs-modal-chip").forEach(btn => {
      const type = btn.dataset.type;
      const isActive = draft.creatureTypes.includes(type);
      btn.style.borderColor = isActive ? '#6366f1' : '#3f3f46';
      btn.style.background = isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b';
      btn.style.color = isActive ? '#e0e7ff' : '#a1a1aa';
      btn.style.boxShadow = isActive ? '0 0 10px rgba(99,102,241,0.25)' : 'none';
    });
    modalEl.querySelectorAll(".bs-modal-chip-size").forEach(btn => {
      const size = btn.dataset.size;
      const isActive = draft.sizes.includes(size);
      btn.style.borderColor = isActive ? '#6366f1' : '#3f3f46';
      btn.style.background = isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b';
      btn.style.color = isActive ? '#e0e7ff' : '#a1a1aa';
      btn.style.boxShadow = isActive ? '0 0 10px rgba(99,102,241,0.25)' : 'none';
    });
    modalEl.querySelectorAll(".bs-modal-chip-align").forEach(btn => {
      const align = btn.dataset.align;
      const isActive = draft.alignments.includes(align);
      btn.style.borderColor = isActive ? '#6366f1' : '#3f3f46';
      btn.style.background = isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b';
      btn.style.color = isActive ? '#e0e7ff' : '#a1a1aa';
      btn.style.boxShadow = isActive ? '0 0 10px rgba(99,102,241,0.25)' : 'none';
    });
    modalEl.querySelectorAll(".bs-modal-chip-lang").forEach(btn => {
      const lang = btn.dataset.lang;
      const isActive = draft.languages.includes(lang);
      btn.style.borderColor = isActive ? '#6366f1' : '#3f3f46';
      btn.style.background = isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))' : '#09090b';
      btn.style.color = isActive ? '#e0e7ff' : '#a1a1aa';
      btn.style.boxShadow = isActive ? '0 0 10px rgba(99,102,241,0.25)' : 'none';
    });
  };

  // Fetch friends list and homebrew creators from Silane Backend
  (async () => {
    try {
      const token = localStorage.getItem("heraldSilane_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const friendList = [];
      try {
        const friendsRes = await fetch(`${API_BASE_URL}/api/friends`, { headers });
        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          const friendsArr = Array.isArray(friendsData.friends)
            ? friendsData.friends.map(f => f.friend || f).filter(Boolean)
            : (Array.isArray(friendsData) ? friendsData : []);
          
          friendsArr.forEach(f => {
            if (f) {
              const uId = String(f.id || f.user_id || f._id || "");
              const uName = (f.username || f.name || f.display_name || "").toLowerCase().trim();
              if (currentUserId && uId === currentUserId) return;
              if (currentUsername && uName === currentUsername) return;

              friendList.push({
                user_id: uId,
                user_name: f.name || f.display_name || f.username || "Friend",
                username: f.username || (f.name || "friend").toLowerCase().replace(/\s+/g, ""),
                profile_picture: f.profile_picture || f.avatar || f.avatar_url || f.image || ""
              });
            }
          });
        }
      } catch (e) {
        console.warn("Failed to fetch friends from Silane Backend:", e);
      }

      let items = [];
      try {
        let url = `${API_BASE_URL}/api/bestiary/items?view=homebrew&all=true&limit=1000`;
        let res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          items = data.items || [];
        }
      } catch (_) {}

      const usersMap = {};
      friendList.forEach(u => {
        if (u.user_id) usersMap[u.user_id] = u;
      });

      items.forEach(item => {
        const uid = String(item.user_id || "unknown");
        const uname = (item.user_name || "Homebrew Creator").toLowerCase().trim();
        if (currentUserId && uid === currentUserId) return;
        if (currentUsername && uname === currentUsername) return;

        if (uid !== "unknown" && !usersMap[uid]) {
          usersMap[uid] = {
            user_id: uid,
            user_name: item.user_name || "Homebrew Creator",
            username: uname.replace(/[^a-z0-9]/g, "") || "creator",
            profile_picture: item.user_avatar || item.profile_picture || item.img_portrait || ""
          };
        }
      });

      const list = Object.values(usersMap);
      if (list.length > 0) {
        homebrewUsers = list;
      }
    } catch (e) {
      console.warn("Failed to load homebrew users:", e);
    } finally {
      isLoadingFriends = false;
      renderUserRows(modalEl);
    }
  })();

  modalEl.addEventListener("click", (e) => {
    const btnOff = e.target.closest(".bs-btn-mode-off");
    if (btnOff) {
      const uid = btnOff.dataset.uid;
      draft.homebrewUserModes[uid] = 0;
      renderUserRows(modalEl);
      return;
    }

    const btnInc = e.target.closest(".bs-btn-mode-inc");
    if (btnInc) {
      const uid = btnInc.dataset.uid;
      draft.homebrewUserModes[uid] = 1;
      renderUserRows(modalEl);
      return;
    }

    const btnOnly = e.target.closest(".bs-btn-mode-only");
    if (btnOnly) {
      const uid = btnOnly.dataset.uid;
      draft.homebrewUserModes[uid] = 2;
      renderUserRows(modalEl);
      return;
    }

    const resetHb = e.target.closest("#bs-reset-homebrew-btn");
    if (resetHb) {
      draft.homebrewUserModes = {};
      renderUserRows(modalEl);
      return;
    }

    const chipType = e.target.closest(".bs-modal-chip");
    if (chipType) {
      const t = chipType.dataset.type;
      const idx = draft.creatureTypes.indexOf(t);
      if (idx >= 0) draft.creatureTypes.splice(idx, 1);
      else draft.creatureTypes.push(t);
      updateChips();
      return;
    }

    const chipSize = e.target.closest(".bs-modal-chip-size");
    if (chipSize) {
      const s = chipSize.dataset.size;
      const idx = draft.sizes.indexOf(s);
      if (idx >= 0) draft.sizes.splice(idx, 1);
      else draft.sizes.push(s);
      updateChips();
      return;
    }

    const chipAlign = e.target.closest(".bs-modal-chip-align");
    if (chipAlign) {
      const a = chipAlign.dataset.align;
      const idx = draft.alignments.indexOf(a);
      if (idx >= 0) draft.alignments.splice(idx, 1);
      else draft.alignments.push(a);
      updateChips();
      return;
    }

    const chipLang = e.target.closest(".bs-modal-chip-lang");
    if (chipLang) {
      const l = chipLang.dataset.lang;
      const idx = draft.languages.indexOf(l);
      if (idx >= 0) draft.languages.splice(idx, 1);
      else draft.languages.push(l);
      updateChips();
      return;
    }

    if (e.target.closest("#bs-modal-close-btn") || e.target.closest("#bs-modal-cancel-btn") || e.target === modalEl) {
      modalEl.remove();
      return;
    }

    if (e.target.closest("#bs-modal-reset-btn")) {
      draft = JSON.parse(JSON.stringify(DEFAULT_BESTIARY_FILTERS));
      updateChips();
      renderUserRows(modalEl);
      return;
    }

    if (e.target.closest("#bs-modal-apply-btn")) {
      bestiaryFilters = draft;
      modalEl.remove();
      renderUI();
      return;
    }
  });
}
