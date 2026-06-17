import { API_BASE_URL } from "./helper.js";

let igniteCharacters = [];
let parentContainer = null;
let searchQuery = "";

const injectIgniteCharacterStyles = () => {
  if (document.getElementById("ignite-character-modern-styles")) return;
  const style = document.createElement("style");
  style.id = "ignite-character-modern-styles";
  style.innerHTML = `
    .ig-container { display: flex; flex-direction: column; height: 100%; width: 100%; color: #f4f4f5; padding-top: 5px; }
    
    .ig-action-bar { display: flex; gap: 20px; margin-bottom: 20px; align-items: center; justify-content: space-between; }
    .ig-search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 0 15px; height: 40px; transition: border-color 0.2s; }
    .ig-search-box:focus-within { border-color: #3b82f6; }
    .ig-search-box input { background: transparent; border: none; color: #f4f4f5; width: 100%; margin-left: 10px; outline: none; font-size: 14px; }
    
    .ig-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .ig-list-area::-webkit-scrollbar { width: 6px; }
    .ig-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    
    .ig-row-card { display: flex; align-items: center; padding: 10px 14px; background: rgba(0, 0, 0, 0.3); border: 1px solid #3f3f46; border-radius: 8px; transition: all 0.2s; user-select: none; gap: 14px; }
    .ig-row-card:hover { background: rgba(0, 0, 0, 0.5); border-color: #52525b; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    
    .ig-card-avatar { width: 52px; height: 52px; border-radius: 6px; border: 1px solid #52525b; overflow: hidden; background: #18181b; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .ig-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
    
    .ig-card-info { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ig-card-name { font-size: 16px; font-weight: 700; color: #f4f4f5; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px; }
    .ig-card-fullname { font-size: 12px; color: #a1a1aa; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .ig-card-meta { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; min-width: 150px; text-align: right; padding-right: 4px; }
    .ig-meta-species { font-size: 13px; color: #60a5fa; font-weight: 600; margin-bottom: 2px; }
    .ig-meta-classes { font-size: 12px; color: #fbbf24; font-weight: 500; }
    .ig-meta-date { font-size: 10px; color: #71717a; margin-top: 4px; font-style: italic; }

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

function renderIgniteCharacterUI() {
  if (!parentContainer) return;

  parentContainer.innerHTML = `
    <div class="ig-container">
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
    if (!query) return true;
    return (char.name || "").toLowerCase().includes(query) || (char.full_name || "").toLowerCase().includes(query);
  });

  if (igniteCharacters.length === 0) {
    listArea.innerHTML = `
      <div class="ig-empty-state">
        <i class="fa-solid fa-address-book"></i>
        <div style="font-size:16px; font-weight:500; color:#d4d4d8;">No Ignite Characters found</div>
        <div style="font-size:13px; margin-top:5px;">Create a character in Project Ignite to see it here.</div>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    listArea.innerHTML = `
      <div class="ig-empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <div style="font-size:15px; color:#d4d4d8;">No characters match your search.</div>
      </div>`;
    return;
  }

  let html = "";
  filtered.forEach(char => {
    const avatar = char.token_image || "icons/svg/mystery-man.svg";
    const displayName = char.name || "Hero Without A Name";
    const displayFullName = char.full_name || "";
    
    // Species
    let speciesName = "";
    if (char.species) {
      speciesName = char.species.name || "";
    }
    
    // Classes details
    let classesStr = "";
    if (Array.isArray(char.classes) && char.classes.length > 0) {
      classesStr = char.classes.map(c => `${c.name || c.class_name || ""} ${c.level || ""}`).join(", ");
    }

    // Created date
    let formattedDate = "";
    if (char.created_at) {
      try {
        const date = new Date(char.created_at);
        formattedDate = date.toLocaleDateString();
      } catch (e) {}
    }

    html += `
      <div class="ig-row-card">
        <div class="ig-card-avatar">
          <img src="${avatar}" onerror="this.src='icons/svg/mystery-man.svg'" />
        </div>
        <div class="ig-card-info">
          <div class="ig-card-name">${displayName}</div>
          ${displayFullName ? `<div class="ig-card-fullname">${displayFullName}</div>` : ""}
        </div>
        <div class="ig-card-meta">
          ${speciesName ? `<div class="ig-meta-species">${speciesName}</div>` : ""}
          ${classesStr ? `<div class="ig-meta-classes">${classesStr}</div>` : ""}
          ${formattedDate ? `<div class="ig-meta-date">Created on ${formattedDate}</div>` : ""}
        </div>
      </div>
    `;
  });

  listArea.innerHTML = html;
}

function attachEvents() {
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
}
