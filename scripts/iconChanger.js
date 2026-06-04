// ==========================================
// CHARACTER ICON CHANGER
// ==========================================

const injectIconChangerStyles = () => {
  if (document.getElementById("silane-icon-changer-styles")) return;
  const style = document.createElement("style");
  style.id = "silane-icon-changer-styles";
  style.innerHTML = `
    .sic-dialog .window-content {
      background: #18181b !important;
      color: #f4f4f5 !important;
      padding: 0 !important;
    }
    .sic-container {
      display: flex;
      flex-direction: column;
      height: 560px;
      padding: 15px;
      gap: 15px;
      font-family: inherit;
      box-sizing: border-box;
    }
    .sic-columns {
      display: flex;
      gap: 15px;
      flex: 1;
      min-height: 0;
    }
    .sic-column-left {
      flex: 1.3;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 10px;
      background: rgba(0,0,0,0.2);
      min-width: 0;
    }
    .sic-column-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 10px;
      background: rgba(0,0,0,0.2);
      min-width: 0;
    }
    .sic-asset-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-right: 4px;
    }
    .sic-asset-list::-webkit-scrollbar {
      width: 6px;
    }
    .sic-asset-list::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 10px;
    }
    .sic-asset-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: rgba(24, 24, 27, 0.6);
      border: 1px solid #27272a;
      border-radius: 6px;
      transition: all 0.2s;
      cursor: pointer;
    }
    .sic-asset-row:hover {
      background: rgba(39, 39, 42, 0.8);
      border-color: #3f3f46;
    }
    .sic-asset-row.checked {
      background: rgba(37, 99, 235, 0.1);
      border-color: rgba(37, 99, 235, 0.25);
    }
    .sic-asset-row.highlighted {
      border-color: #3b82f6 !important;
      background: rgba(59, 130, 246, 0.15) !important;
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.3);
    }
    .sic-asset-row.drag-over {
      border-color: #10b981 !important;
      background: rgba(16, 185, 129, 0.1) !important;
      border-style: dashed !important;
    }
    .sic-asset-row.staged {
      border-color: rgba(16, 185, 129, 0.4) !important;
      background: rgba(16, 185, 129, 0.08) !important;
    }
    .sic-asset-row.staged:hover {
      background: rgba(16, 185, 129, 0.12) !important;
    }
    .sic-row-undo {
      background: none !important;
      border: none !important;
      color: #a1a1aa !important;
      cursor: pointer !important;
      padding: 0 !important;
      font-size: 10px !important;
      border-radius: 50% !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s !important;
      outline: none !important;
      width: 18px !important;
      height: 18px !important;
      min-width: 18px !important;
      min-height: 18px !important;
      margin: 0 4px 0 8px !important;
      box-shadow: none !important;
    }
    .sic-dialog .silane-btn {
      width: auto !important;
      flex: 0 0 auto !important;
      margin: 0 !important;
    }
    .sic-row-undo:hover {
      color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.15) !important;
      transform: scale(1.15) !important;
    }
    .sic-multiselect-container {
      position: relative;
      width: 120px;
    }
    .sic-multiselect-btn {
      width: 100%;
      height: 30px;
      padding: 4px 10px;
      font-size: 13px;
      border-radius: 4px;
      background: rgba(0,0,0,0.3);
      border: 1px solid #3f3f46;
      color: white;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      outline: none;
      text-align: left;
    }
    .sic-multiselect-btn:hover {
      border-color: #52525b;
      background: rgba(255,255,255,0.05);
    }
    .sic-multiselect-options {
      display: none;
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      width: 200px;
      max-height: 250px;
      overflow-y: auto;
      background: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 999;
      padding: 6px;
      box-sizing: border-box;
    }
    .sic-multiselect-options::-webkit-scrollbar {
      width: 4px;
    }
    .sic-multiselect-options::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 10px;
    }
    .sic-multiselect-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #27272a;
      padding-bottom: 6px;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .sic-multiselect-link {
      color: #3b82f6;
      cursor: pointer;
      text-decoration: none;
      font-weight: 600;
    }
    .sic-multiselect-link:hover {
      text-decoration: underline;
    }
    .sic-multiselect-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #e4e4e7;
      user-select: none;
    }
    .sic-multiselect-option:hover {
      background: rgba(255,255,255,0.05);
    }
    .sic-multiselect-option input {
      cursor: pointer;
      margin: 0;
      width: 14px;
      height: 14px;
      min-width: 14px;
      min-height: 14px;
    }
    .sic-multiselect-option span {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      flex: 1;
    }
    .sic-image-grid {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
      gap: 8px;
      padding-right: 4px;
      align-content: start;
    }
    .sic-image-grid::-webkit-scrollbar {
      width: 6px;
    }
    .sic-image-grid::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 10px;
    }
    .sic-image-item {
      aspect-ratio: 1;
      border: 2px solid #27272a;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      background: rgba(0,0,0,0.3);
      transition: all 0.2s;
    }
    .sic-image-item:hover {
      border-color: #52525b;
      transform: scale(1.03);
    }
    .sic-image-item.selected {
      border-color: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }
    .sic-image-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;
  document.head.appendChild(style);
};

export function openCharacterIconChanger(galleryImages = []) {
  injectIconChangerStyles();

  // 1. Get owned actors in world
  const ownedActors = game.actors.filter(
    (a) => a.ownership[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
  );

  if (ownedActors.length === 0) {
    ui.notifications?.warn("You must own at least one character in this world to use the Icon Changer.");
    return;
  }

  // 2. State management
  let activeActor = ownedActors[0];
  let selectedImageUrl = null;
  let checkedAssetIds = new Set();
  let stagedChanges = new Map(); // key: assetId, value: newImageUrl
  let highlightedAssetId = null;
  let searchQuery = "";
  let gallerySearchQuery = "";

  const TYPE_LABELS = {
    portrait: "Portrait",
    token: "Token",
    weapon: "Weapon",
    equipment: "Equipment",
    consumable: "Consumable",
    tool: "Tool",
    backpack: "Backpack / Container",
    loot: "Loot",
    spell: "Spell",
    feat: "Feature / Feat",
    class: "Class",
    subclass: "Subclass",
    background: "Background",
    race: "Race"
  };

  const getAvailableTypes = (actor) => {
    const types = new Set(["portrait", "token"]);
    if (actor && actor.items) {
      for (const item of actor.items) {
        if (item.type) {
          types.add(item.type);
        }
      }
    }
    return Array.from(types).sort((a, b) => {
      if (a === "portrait") return -1;
      if (b === "portrait") return 1;
      if (a === "token") return -1;
      if (b === "token") return 1;
      const labelA = TYPE_LABELS[a] || a;
      const labelB = TYPE_LABELS[b] || b;
      return labelA.localeCompare(labelB);
    });
  };

  let availableTypes = getAvailableTypes(activeActor);
  let selectedTypes = new Set(availableTypes);

  // HTML Dialog Content
  const content = `
    <div class="sic-container">
      <!-- Top Bar: Character Select -->
      <div style="display: flex; gap: 15px; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid #27272a;">
        <label style="font-weight: 600; font-size: 14px; min-width: 120px; color: #e4e4e7;"><i class="fa-solid fa-user-shield" style="color:#818cf8; margin-right:6px;"></i> Select Character:</label>
        <select id="sic-character-select" class="silane-input" style="flex: 1; height: 38px !important; padding: 6px 12px !important; line-height: 20px !important; box-sizing: border-box !important; background: #27272a; border: 1px solid #3f3f46; color: white; border-radius: 4px; outline: none; cursor: pointer;">
          ${ownedActors.map(a => `<option value="${a.id}" style="background: #18181b; color: white;">${a.name}</option>`).join("")}
        </select>
      </div>

      <!-- Main Columns -->
      <div class="sic-columns">
        <!-- Left: Asset List -->
        <div class="sic-column-left">
          <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #60a5fa; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-list-check" style="margin-right:6px;"></i> Character Assets</span>
            <span id="sic-checked-count" style="font-size: 11px; background: #2563eb; color: white; padding: 2px 6px; border-radius: 9999px; font-weight: 600;">0 selected</span>
          </h3>

          <!-- Search & Filter -->
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="sic-asset-search" class="silane-input" placeholder="Search assets..." style="flex: 1; padding: 6px 10px; font-size: 13px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; color: white; outline: none;" />
            <div class="sic-multiselect-container">
              <button type="button" id="sic-filter-btn" class="sic-multiselect-btn">
                <span>Filters (All)</span>
                <i class="fa-solid fa-chevron-down" style="font-size: 10px; color: #a1a1aa; margin-left: 6px;"></i>
              </button>
              <div id="sic-filter-options" class="sic-multiselect-options">
                <div class="sic-multiselect-header">
                  <span id="sic-filter-select-all" class="sic-multiselect-link">Select All</span>
                  <span id="sic-filter-clear-all" class="sic-multiselect-link">Clear All</span>
                </div>
                <div id="sic-filter-checkboxes-list">
                  <!-- Dynamically populated -->
                </div>
              </div>
            </div>
          </div>

          <!-- Select All visible checkbox -->
          <div style="display: flex; align-items: center; gap: 8px; padding: 6px; border-bottom: 1px solid #27272a; font-size: 12px; color: #a1a1aa; background: rgba(0,0,0,0.1); border-radius: 4px; justify-content: space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="sic-select-all" style="cursor: pointer; margin: 0; width: 14px; height: 14px;" />
              <label for="sic-select-all" style="cursor: pointer; user-select: none; font-weight: 500;">Select All Visible</label>
            </div>
            <div style="font-size: 11px; color:#60a5fa; font-style:italic;">💡 Select row + Click image</div>
          </div>

          <!-- Assets scrollable list -->
          <div id="sic-asset-list" class="sic-asset-list">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Right: Silane Gallery -->
        <div class="sic-column-right">
          <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #34d399; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-images"></i> Silane Image Gallery
          </h3>
          <input type="text" id="sic-gallery-search" class="silane-input" placeholder="Search gallery..." style="padding: 6px 10px; font-size: 13px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; color: white; outline: none; margin-top: 5px; margin-bottom: 5px;" />
          <div id="sic-image-grid" class="sic-image-grid">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>

      <!-- Bottom actions -->
      <div style="display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid #27272a; padding-top: 12px;">
        
        <div style="display: flex; gap: 10px;">
          <button id="sic-btn-reset-all" class="silane-btn" style="width: auto !important; margin: 0 !important; flex: 0 0 auto !important; height: 32px !important; padding: 0 14px !important; font-size: 12px !important; border-radius: 6px; background: rgba(239, 68, 68, 0.05); color:#ef4444; border: 1px solid rgba(239, 68, 68, 0.15); cursor: not-allowed; font-weight: 600; display: inline-flex !important; align-items: center !important; justify-content: center !important;" disabled>Reset All</button>
          <button id="sic-btn-close" class="silane-btn" style="width: auto !important; margin: 0 !important; flex: 0 0 auto !important; height: 32px !important; padding: 0 14px !important; font-size: 12px !important; border-radius: 6px; background: rgba(0,0,0,0.3); color:#f4f4f5; border: 1px solid #3f3f46; cursor: pointer; font-weight: 600; display: inline-flex !important; align-items: center !important; justify-content: center !important;">Close</button>
          <button id="sic-btn-apply" class="silane-btn" style="width: auto !important; margin: 0 !important; flex: 0 0 auto !important; height: 32px !important; padding: 0 14px !important; font-size: 12px !important; border-radius: 6px; background: #3f3f46; color: #a1a1aa; border: none; cursor: not-allowed; font-weight: 600; display: inline-flex !important; align-items: center !important; justify-content: center !important;" disabled>Use Image Marked</button>
          <button id="sic-btn-save" class="silane-btn primary" style="width: auto !important; margin: 0 !important; flex: 0 0 auto !important; height: 32px !important; padding: 0 14px !important; font-size: 12px !important; border-radius: 6px; background: #3f3f46; color: #a1a1aa; border: none; cursor: not-allowed; font-weight: 600; display: inline-flex !important; align-items: center !important; justify-content: center !important;" disabled>Apply</button>
        </div>
      </div>
    </div>
  `;

  // Filter helper
  const filterItem = (item) => {
    // 1. Filter by search query
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 2. Filter by selected types
    return selectedTypes.has(item.type);
  };

  const changerDialog = new Dialog(
    {
      title: "Character Icon Changer",
      content: content,
      buttons: {},
      render: (html) => {
        const dialogElement = html.closest(".app")[0];
        const contentElement = dialogElement.querySelector(".window-content");
        if (contentElement) {
          contentElement.style.backgroundColor = "#18181b";
          contentElement.style.color = "#f4f4f5";
          contentElement.style.backgroundImage = "none";
        }

        const charSelect = html.find("#sic-character-select");
        const assetSearch = html.find("#sic-asset-search");
        const filterBtn = html.find("#sic-filter-btn");
        const filterOptions = html.find("#sic-filter-options");
        const filterCheckboxesList = html.find("#sic-filter-checkboxes-list");
        const filterSelectAll = html.find("#sic-filter-select-all");
        const filterClearAll = html.find("#sic-filter-clear-all");
        const selectAllCheckbox = html.find("#sic-select-all");
        const assetList = html.find("#sic-asset-list");
        const imageGrid = html.find("#sic-image-grid");
        const gallerySearch = html.find("#sic-gallery-search");
        const applyBtn = html.find("#sic-btn-apply");
        const closeBtn = html.find("#sic-btn-close");
        const saveBtn = html.find("#sic-btn-save");
        const resetBtn = html.find("#sic-btn-reset-all");
        const checkedCountLabel = html.find("#sic-checked-count");

        // Helper to update Button states
        const updateButtonStates = () => {
          const hasImage = !!selectedImageUrl;
          const hasChecked = checkedAssetIds.size > 0;
          const hasStaged = stagedChanges.size > 0;

          // 1. Use Image Marked button
          if (hasImage && hasChecked) {
            applyBtn.prop("disabled", false);
            applyBtn.css({
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
            });
          } else {
            applyBtn.prop("disabled", true);
            applyBtn.css({
              background: "#3f3f46",
              color: "#a1a1aa",
              cursor: "not-allowed",
              boxShadow: "none"
            });
          }

          // 2. Save Changes button
          if (hasStaged) {
            saveBtn.prop("disabled", false);
            saveBtn.css({
              background: "#10b981",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
            });
          } else {
            saveBtn.prop("disabled", true);
            saveBtn.css({
              background: "#3f3f46",
              color: "#a1a1aa",
              cursor: "not-allowed",
              boxShadow: "none"
            });
          }

          // 3. Reset All button
          if (hasStaged) {
            resetBtn.prop("disabled", false);
            resetBtn.css({
              background: "rgba(239, 68, 68, 0.2)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              cursor: "pointer"
            });
          } else {
            resetBtn.prop("disabled", true);
            resetBtn.css({
              background: "rgba(239, 68, 68, 0.05)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              cursor: "not-allowed"
            });
          }

          let countText = `${checkedAssetIds.size} selected`;
          if (hasStaged) {
            countText += ` | ${stagedChanges.size} staged`;
          }
          checkedCountLabel.text(countText);
        };

        // Render assets
        const renderAssets = () => {
          if (!activeActor) {
            assetList.html(`<div style="padding:20px; text-align:center; color:#71717a;">No character active.</div>`);
            return;
          }

          // 1. Get virtual assets (portrait, token)
          const virtualAssets = [];
          const virtualToRender = [];
          if (selectedTypes.has("portrait")) {
            virtualToRender.push({
              id: "char-portrait",
              name: `${activeActor.name} (Portrait)`,
              img: activeActor.img || "icons/svg/mystery-man.svg",
              type: "portrait"
            });
          }
          if (selectedTypes.has("token")) {
            virtualToRender.push({
              id: "char-token",
              name: `${activeActor.name} (Token)`,
              img: activeActor.prototypeToken?.texture?.src || activeActor.img || "icons/svg/mystery-man.svg",
              type: "token"
            });
          }

          const filteredVirtual = virtualToRender.filter(item => {
            if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
            }
            return true;
          });
          virtualAssets.push(...filteredVirtual);

          // 2. Get and sort visible actor items
          const visibleItems = activeActor.items.contents
            .filter(filterItem)
            .sort((a, b) => a.name.localeCompare(b.name));

          const allVisible = [...virtualAssets, ...visibleItems];

          if (allVisible.length === 0) {
            assetList.html(`<div style="padding:20px; text-align:center; color:#71717a;">No assets match current criteria.</div>`);
            selectAllCheckbox.prop("checked", false);
            return;
          }

          // Check if all visible items are currently checked
          const allVisibleChecked = allVisible.every(i => checkedAssetIds.has(i.id));
          selectAllCheckbox.prop("checked", allVisibleChecked);

          let htmlContent = allVisible.map((item) => {
            const isChecked = checkedAssetIds.has(item.id);
            const isHighlighted = highlightedAssetId === item.id;
            const isStaged = stagedChanges.has(item.id);
            
            let originalImg = "icons/svg/item-bag.svg";
            if (item.id === "char-portrait") {
              originalImg = activeActor.img || "icons/svg/mystery-man.svg";
            } else if (item.id === "char-token") {
              originalImg = activeActor.prototypeToken?.texture?.src || activeActor.img || "icons/svg/mystery-man.svg";
            } else {
              originalImg = item.img || "icons/svg/item-bag.svg";
            }

            const displayImg = isStaged ? stagedChanges.get(item.id) : originalImg;

            let rowClass = "sic-asset-row";
            if (isChecked) rowClass += " checked";
            if (isHighlighted) rowClass += " highlighted";
            if (isStaged) rowClass += " staged";

            // Visual badge coloring
            let typeColor = "#a1a1aa";
            if (item.type === "portrait") typeColor = "#c084fc";
            else if (item.type === "token") typeColor = "#fb923c";
            else if (item.type === "spell") typeColor = "#60a5fa";
            else if (item.type === "feat" || item.type === "class" || item.type === "subclass") typeColor = "#34d399";

            const undoBtnHtml = isStaged ? `
              <button class="sic-row-undo" data-id="${item.id}" title="Revert to original icon">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            ` : "";

            return `
              <div class="${rowClass}" data-id="${item.id}">
                <input type="checkbox" class="sic-asset-checkbox" data-id="${item.id}" ${isChecked ? "checked" : ""} style="cursor: pointer; margin: 0; width: 14px; height: 14px;" />
                <img src="${displayImg}" onerror="this.src='icons/svg/item-bag.svg'" style="width: 28px; height: 28px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.05); background: #27272a;" />
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
                  <span style="font-size: 13px; font-weight: 600; color: #f4f4f5; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.name}</span>
                  <span style="font-size: 10px; color: ${typeColor}; text-transform: uppercase; font-family: monospace; font-weight: 600;">${item.type}</span>
                </div>
                ${undoBtnHtml}
              </div>
            `;
          }).join("");

          assetList.html(htmlContent);

          // Handle single row checkbox toggling
          assetList.find(".sic-asset-checkbox").on("change", function(e) {
            e.stopPropagation();
            const id = $(this).data("id");
            if (this.checked) {
              checkedAssetIds.add(id);
              $(this).closest(".sic-asset-row").addClass("checked");
            } else {
              checkedAssetIds.delete(id);
              $(this).closest(".sic-asset-row").removeClass("checked");
            }
            // Recalculate select all checkbox state
            const allChecked = allVisible.every(i => checkedAssetIds.has(i.id));
            selectAllCheckbox.prop("checked", allChecked);
            updateButtonStates();
          });

          // Handle individual row undo revert action
          assetList.find(".sic-row-undo").on("click", function(e) {
            e.stopPropagation();
            const id = $(this).data("id");
            stagedChanges.delete(id);
            renderAssets();
            updateButtonStates();
          });

          // Handle clicking the row to highlight
          assetList.find(".sic-asset-row").on("click", function(e) {
            if ($(e.target).is(".sic-asset-checkbox") || $(e.target).closest(".sic-row-undo").length > 0) return;
            const id = $(this).data("id");
            
            if (highlightedAssetId === id) {
              highlightedAssetId = null;
              $(this).removeClass("highlighted");
            } else {
              assetList.find(".sic-asset-row").removeClass("highlighted");
              highlightedAssetId = id;
              $(this).addClass("highlighted");
            }
          });

          // Drag and Drop drop zone handlers
          assetList.find(".sic-asset-row").on("dragover", function(e) {
            e.preventDefault();
            $(this).addClass("drag-over");
          });

          assetList.find(".sic-asset-row").on("dragleave", function(e) {
            $(this).removeClass("drag-over");
          });

          assetList.find(".sic-asset-row").on("drop", async function(e) {
            e.preventDefault();
            $(this).removeClass("drag-over");
            const id = $(this).data("id");
            const url = e.originalEvent.dataTransfer.getData("text/plain");
            if (url) {
              stagedChanges.set(id, url);
              renderAssets();
              updateButtonStates();
            }
          });
        };

        // Render Silane Image Gallery
        const renderGallery = () => {
          const filteredGallery = galleryImages.filter(img => {
            if (gallerySearchQuery && !img.name.toLowerCase().includes(gallerySearchQuery.toLowerCase())) {
              return false;
            }
            return true;
          });

          if (filteredGallery.length === 0) {
            imageGrid.html(`<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: #71717a;"><i class="fa-solid fa-folder-open fa-2x" style="margin-bottom:8px;"></i><br>${galleryImages.length === 0 ? "No images found in your Silane Gallery." : "No matching images."}</div>`);
            return;
          }

          let gridContent = filteredGallery.map((img) => {
            const isSelected = selectedImageUrl === img.url ? "selected" : "";
            return `
              <div class="sic-image-item ${isSelected}" data-url="${img.url}" title="${img.name}" draggable="true">
                <img src="${img.url}" onerror="this.style.display='none';" />
              </div>
            `;
          }).join("");

          imageGrid.html(gridContent);

          // Handle drag start
          imageGrid.find(".sic-image-item").on("dragstart", function(e) {
            const url = $(this).data("url");
            e.originalEvent.dataTransfer.setData("text/plain", url);
            e.originalEvent.dataTransfer.effectAllowed = "copy";
          });

          // Handle click to select or apply immediately to highlighted row
          imageGrid.find(".sic-image-item").on("click", async function() {
            const url = $(this).data("url");
            
            // If there's a highlighted row, stage immediately
            if (highlightedAssetId) {
              imageGrid.find(".sic-image-item").removeClass("selected");
              $(this).addClass("selected");
              selectedImageUrl = url;

              stagedChanges.set(highlightedAssetId, url);
              renderAssets();
              updateButtonStates();
              return;
            }

            // Normal select/deselect toggling
            imageGrid.find(".sic-image-item").removeClass("selected");
            if (selectedImageUrl === url) {
              selectedImageUrl = null;
            } else {
              selectedImageUrl = url;
              $(this).addClass("selected");
            }
            updateButtonStates();
          });
        };

        // Define multiselect rendering and behaviors
        const renderFilterCheckboxes = () => {
          let listHtml = availableTypes.map(type => {
            const label = TYPE_LABELS[type] || (type.charAt(0).toUpperCase() + type.slice(1));
            const isChecked = selectedTypes.has(type) ? "checked" : "";
            return `
              <label class="sic-multiselect-option">
                <input type="checkbox" class="sic-filter-checkbox" data-type="${type}" ${isChecked} />
                <span title="${label}">${label}</span>
              </label>
            `;
          }).join("");
          filterCheckboxesList.html(listHtml);

          // Bind checkbox click
          filterCheckboxesList.find(".sic-filter-checkbox").off("change").on("change", function() {
            const type = $(this).data("type");
            if (this.checked) {
              selectedTypes.add(type);
            } else {
              selectedTypes.delete(type);
            }
            updateFilterButtonText();
            renderAssets();
          });
        };

        const updateFilterButtonText = () => {
          if (selectedTypes.size === 0) {
            filterBtn.find("span").text("Filters (None)");
          } else if (selectedTypes.size === availableTypes.length) {
            filterBtn.find("span").text("Filters (All)");
          } else if (selectedTypes.size === 1) {
            const singleType = Array.from(selectedTypes)[0];
            const label = TYPE_LABELS[singleType] || singleType;
            filterBtn.find("span").text(`Filter: ${label}`);
          } else {
            filterBtn.find("span").text(`Filters (${selectedTypes.size})`);
          }
        };

        // Toggle filter dropdown
        filterBtn.off("click").on("click", (e) => {
          e.stopPropagation();
          filterOptions.toggle();
        });

        // Prevent closing when clicking inside options
        filterOptions.off("click").on("click", (e) => {
          e.stopPropagation();
        });

        // Close when clicking outside
        $(document).off("click.sicFilterClose").on("click.sicFilterClose", () => {
          filterOptions.hide();
        });

        // Select All / Clear All
        filterSelectAll.off("click").on("click", (e) => {
          e.preventDefault();
          availableTypes.forEach(t => selectedTypes.add(t));
          filterCheckboxesList.find(".sic-filter-checkbox").prop("checked", true);
          updateFilterButtonText();
          renderAssets();
        });

        filterClearAll.off("click").on("click", (e) => {
          e.preventDefault();
          selectedTypes.clear();
          filterCheckboxesList.find(".sic-filter-checkbox").prop("checked", false);
          updateFilterButtonText();
          renderAssets();
        });

        // Initialize Rendering
        renderFilterCheckboxes();
        updateFilterButtonText();
        renderAssets();
        renderGallery();

        // Bind Search
        let searchTimeout;
        assetSearch.on("input", function() {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            searchQuery = $(this).val();
            renderAssets();
          }, 300);
        });

        // Bind Gallery Search
        let gallerySearchTimeout;
        gallerySearch.on("input", function() {
          clearTimeout(gallerySearchTimeout);
          gallerySearchTimeout = setTimeout(() => {
            gallerySearchQuery = $(this).val();
            renderGallery();
          }, 300);
        });

        // Toggle Select All Visible
        selectAllCheckbox.on("change", function() {
          const isChecked = this.checked;
          
          const virtualAssets = [];
          const virtualToRender = [];
          if (selectedTypes.has("portrait")) {
            virtualToRender.push({ id: "char-portrait", name: `${activeActor.name} (Portrait)` });
          }
          if (selectedTypes.has("token")) {
            virtualToRender.push({ id: "char-token", name: `${activeActor.name} (Token)` });
          }
          const filteredVirtual = virtualToRender.filter(item => {
            if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
          });
          virtualAssets.push(...filteredVirtual);

          const visibleItems = activeActor.items.contents.filter(filterItem);
          const allVisible = [...virtualAssets, ...visibleItems];

          allVisible.forEach(i => {
            if (isChecked) {
              checkedAssetIds.add(i.id);
            } else {
              checkedAssetIds.delete(i.id);
            }
          });
          renderAssets();
          updateButtonStates();
        });

        // Handle Character selection dropdown change
        charSelect.on("change", function() {
          const id = $(this).val();
          const selectedActor = ownedActors.find(a => a.id === id);
          if (selectedActor) {
            if (stagedChanges.size > 0) {
              Dialog.confirm({
                title: "Unsaved Changes",
                content: `<p>You have unsaved icon changes for <b>${activeActor.name}</b>. Switching characters will discard these changes. Do you want to continue?</p>`,
                yes: () => {
                  activeActor = selectedActor;
                  availableTypes = getAvailableTypes(activeActor);
                  selectedTypes = new Set(availableTypes);
                  renderFilterCheckboxes();
                  updateFilterButtonText();
                  stagedChanges.clear();
                  checkedAssetIds.clear();
                  highlightedAssetId = null;
                  selectAllCheckbox.prop("checked", false);
                  renderAssets();
                  updateButtonStates();
                },
                no: () => {
                  charSelect.val(activeActor.id);
                },
                defaultYes: false
              });
            } else {
              activeActor = selectedActor;
              availableTypes = getAvailableTypes(activeActor);
              selectedTypes = new Set(availableTypes);
              renderFilterCheckboxes();
              updateFilterButtonText();
              checkedAssetIds.clear();
              highlightedAssetId = null;
              selectAllCheckbox.prop("checked", false);
              renderAssets();
              updateButtonStates();
            }
          }
        });

        // Use Image Marked icons
        applyBtn.on("click", () => {
          if (!selectedImageUrl || checkedAssetIds.size === 0) return;
          
          for (const id of checkedAssetIds) {
            stagedChanges.set(id, selectedImageUrl);
          }

          checkedAssetIds.clear();
          selectAllCheckbox.prop("checked", false);
          
          renderAssets();
          updateButtonStates();
        });

        // Reset All changes
        resetBtn.on("click", () => {
          if (stagedChanges.size === 0) return;
          stagedChanges.clear();
          renderAssets();
          updateButtonStates();
          ui.notifications?.info("All staged changes cleared.");
        });

        // Save Staged updates to Foundry VTT Actor
        saveBtn.on("click", async () => {
          if (stagedChanges.size === 0) return;
          
          const confirmContent = `<p>Are you sure you want to save <b>${stagedChanges.size}</b> changed icon(s) to <b>${activeActor.name}</b>?</p>`;
          
          Dialog.confirm({
            title: "Confirm Icon Replacement",
            content: confirmContent,
            yes: async () => {
              ui.notifications?.info(`Saving icons to ${stagedChanges.size} asset(s) on ${activeActor.name}...`);
              
              const itemUpdates = [];
              let updatePortrait = false;
              let updateToken = false;
              let portraitUrl = null;
              let tokenUrl = null;

              for (const [id, url] of stagedChanges.entries()) {
                if (id === "char-portrait") {
                  updatePortrait = true;
                  portraitUrl = url;
                } else if (id === "char-token") {
                  updateToken = true;
                  tokenUrl = url;
                } else {
                  itemUpdates.push({
                    _id: id,
                    img: url
                  });
                }
              }

              try {
                if (updatePortrait) {
                  await activeActor.update({ img: portraitUrl });
                }
                if (updateToken) {
                  await activeActor.update({ "prototypeToken.texture.src": tokenUrl });
                  for (const token of activeActor.getActiveTokens()) {
                    await token.document.update({ "texture.src": tokenUrl });
                  }
                }
                if (itemUpdates.length > 0) {
                  await activeActor.updateEmbeddedDocuments("Item", itemUpdates);
                }

                ui.notifications?.info(`Successfully updated ${stagedChanges.size} asset(s)!`);
                stagedChanges.clear();
              } catch (err) {
                console.error(err);
                ui.notifications?.error("Failed to save some changes.");
              }

              renderAssets();
              updateButtonStates();
            },
            no: () => {},
            defaultYes: true
          });
        });

        // Close button calls changerDialog.close()
        closeBtn.on("click", () => changerDialog.close());
      }
    },
    {
      width: 760,
      height: 640,
      classes: ["dialog", "sic-dialog"]
    }
  );

  // Override close to check for staged changes
  const originalClose = changerDialog.close.bind(changerDialog);
  changerDialog.close = async function(options) {
    $(document).off("click.sicFilterClose"); // Clean up document click handler
    if (stagedChanges.size > 0) {
      return new Promise((resolve) => {
        Dialog.confirm({
          title: "Unsaved Changes",
          content: `<p>You have unsaved icon changes. Closing will discard these changes. Are you sure you want to close?</p>`,
          yes: () => {
            stagedChanges.clear();
            resolve(originalClose(options));
          },
          no: () => {
            resolve();
          },
          defaultYes: false
        });
      });
    }
    return originalClose(options);
  };

  changerDialog.render(true);
}

