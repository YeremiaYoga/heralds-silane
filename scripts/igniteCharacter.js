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
    
    .ig-card-avatar, .ig-card-art { width: 52px; height: 52px; border-radius: 6px; border: 1px solid #52525b; overflow: hidden; background: #18181b; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .ig-card-avatar img, .ig-card-art img { width: 100%; height: 100%; object-fit: cover; }
    
    .ig-card-info { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ig-card-name { font-size: 16px; font-weight: 700; color: #f4f4f5; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px; }
    .ig-card-fullname { font-size: 12px; color: #a1a1aa; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
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
    const art = char.art_image || "";
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
        <div class="ig-card-avatar" title="Token Image">
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
        <div class="ig-card-actions">
          <button class="ig-btn-action-box ig-export ig-action-export" data-id="${char.id}" title="Export to Foundry">
            <div class="ig-icon-sq"><i class="fa-solid fa-file-import"></i></div>
          </button>
        </div>
      </div>
    `;
  });

  listArea.innerHTML = html;
}

async function exportCharacterToFoundry(char) {
  if (!char || !char.fvtt_format || typeof char.fvtt_format !== "object" || Object.keys(char.fvtt_format).length === 0) {
    ui.notifications?.warn(`Character "${char.name}" does not have a valid FVTT format. Please save/update the character in Ignite Character Maker first.`);
    return;
  }

  const actorData = char.fvtt_format;

  Dialog.confirm({
    title: `Export Character`,
    content: `<p>Are you sure you want to export <strong>${char.name}</strong> to your Foundry VTT Actors list?</p>`,
    yes: async () => {
      try {
        const dataToImport = foundry.utils.deepClone(actorData);
        delete dataToImport._id;

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

        if (char.art_image) {
          dataToImport.img = char.art_image;
        } else if (char.token_image) {
          dataToImport.img = char.token_image;
        }
        if (char.token_image) {
          if (!dataToImport.prototypeToken) dataToImport.prototypeToken = {};
          if (!dataToImport.prototypeToken.texture) dataToImport.prototypeToken.texture = {};
          dataToImport.prototypeToken.texture.src = char.token_image;
        } else if (char.art_image) {
          if (!dataToImport.prototypeToken) dataToImport.prototypeToken = {};
          if (!dataToImport.prototypeToken.texture) dataToImport.prototypeToken.texture = {};
          dataToImport.prototypeToken.texture.src = char.art_image;
        }

        // Clean up existing actor with the same name to avoid duplicates
        const existingActor = game.actors.find(a => a.name === dataToImport.name);
        if (existingActor) {
          await existingActor.delete();
        }

        const newActor = await Actor.create(dataToImport);
        if (newActor) {
          if (Array.isArray(dataToImport.items) && dataToImport.items.length > 0) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const exportDate = `${day}-${month}-${year}`;

            // Find or create "Silane" root folder (no parent folder)
            let rootFolder = game.folders.find(f => f.name === "Silane" && f.type === "Item" && (!f.folder || f.folder === null || f.folder === undefined));
            if (!rootFolder) {
              rootFolder = await Folder.create({
                name: "Silane",
                type: "Item"
              });
            }

            // Under "Silane" root folder, find or create Character folder "Nama Character (Tanggal Export)"
            const charFolderName = `${newActor.name} (${exportDate})`;
            let charFolder = game.folders.find(f => f.name === charFolderName && f.type === "Item" && (f.folder === rootFolder.id || f.folder?.id === rootFolder.id));
            if (charFolder) {
              // Delete existing character folder and its items to avoid duplicates
              await charFolder.delete({ deleteContents: true });
            }

            charFolder = await Folder.create({
              name: charFolderName,
              type: "Item",
              folder: rootFolder.id
            });

            // Create subfolders under Character folder dynamically on demand
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
            ui.notifications?.info(`Success! Actor [${newActor.name}] has been created.`);
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
