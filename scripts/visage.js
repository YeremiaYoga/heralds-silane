import { API_BASE_URL } from "./helper.js";

// State Management
let visageData = { items: [] };
let currentFolderId = null;
let parentContainer = null;
let searchQuery = "";

// Inject CSS Global Visage
const injectVisageStyles = () => {
  if (document.getElementById("visage-modern-styles")) return;
  const style = document.createElement("style");
  style.id = "visage-modern-styles";
  style.innerHTML = `
    .vs-container { display: flex; flex-direction: column; height: 100%; width: 100%; color: #f4f4f5; padding-top: 5px; }
    
    /* Action Bar */
    .vs-action-bar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
    .vs-search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; border-radius: 6px; padding: 0 15px; height: 40px; transition: border-color 0.2s; }
    .vs-search-box:focus-within { border-color: #60a5fa; }
    .vs-search-box input { background: transparent; border: none; color: #f4f4f5; width: 100%; margin-left: 10px; outline: none; font-size: 14px; }
    
    /* Buttons */
    .vs-btn-action { background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; color: #d4d4d8; border-radius: 6px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 15px; }
    .vs-btn-action:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: #71717a; transform: translateY(-1px); }
    
    /* List Area */
    .vs-list-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .vs-list-area::-webkit-scrollbar { width: 6px; }
    .vs-list-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    
    /* List Row */
    .vs-list-row { display: flex; align-items: center; padding: 10px 15px; background: rgba(0,0,0,0.15); border: 1px solid transparent; border-radius: 8px; transition: all 0.2s; user-select: none; }
    .vs-list-row.clickable:hover { background: rgba(0,0,0,0.3); border-color: #3f3f46; cursor: pointer; }
    .vs-list-row.back-btn { background: transparent; border: 1px dashed #3f3f46; color: #a1a1aa; margin-bottom: 10px; }
    .vs-list-row.back-btn:hover { background: rgba(255,255,255,0.05); color: #f4f4f5; }
    
    /* Icons & Typography */
    .vs-icon-wrapper { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 8px; margin-right: 15px; font-size: 16px; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); }
    .vs-text-container { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .vs-text-title { font-weight: 500; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.3px; }
    
    /* Action Icons (Edit/Delete) */
    .vs-row-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
    .vs-list-row:hover .vs-row-actions { opacity: 1; }
    .vs-action-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; transition: all 0.2s; color: #a1a1aa; }
    .vs-action-icon.edit:hover { background: rgba(234, 179, 8, 0.15); color: #facc15; }
    .vs-action-icon.delete:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    
    /* Empty State */
    .vs-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #71717a; text-align: center; }
    .vs-empty-state i { font-size: 40px; margin-bottom: 15px; opacity: 0.5; }
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
      <div class="vs-action-bar">
        <div class="vs-search-box">
          <i class="fa-solid fa-search" style="color: #71717a;"></i>
          <input type="text" id="vs-search-input" placeholder="Search disabled temporarily..." />
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

function renderListArea() {
  const listArea = document.getElementById("vs-list-area");
  let html = "";
  const query = searchQuery.toLowerCase();

  // Breadcrumb Back Button
  if (currentFolderId) {
    let curr = visageData.items.find((i) => i.id === currentFolderId);
    html += `
      <div class="vs-list-row clickable back-btn vs-item-click" data-target="back-folder" data-parent="${curr?.parentId || "root"}">
        <div class="vs-icon-wrapper" style="background:transparent; box-shadow:none;"><i class="fa-solid fa-level-up-alt fa-flip-horizontal" style="font-size:20px;"></i></div>
        <div class="vs-text-title" style="font-style:italic;">... Back to parent</div>
      </div>
    `;
  }

  const itemsToDisplay = visageData.items.filter(
    (i) =>
      i.parentId === currentFolderId && i.name.toLowerCase().includes(query),
  );

  if (visageData.items.length === 0) {
    html = `
      <div class="vs-empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <div style="font-size:16px; font-weight:500; color:#d4d4d8;">Visage is empty</div>
        <div style="font-size:13px; margin-top:5px;">Create a Folder or add a Profile asset to begin.</div>
      </div>`;
  } else if (itemsToDisplay.length === 0) {
    html += `<div class="vs-empty-state"><div style="font-size:15px;">No items found here.</div></div>`;
  } else {
    itemsToDisplay
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      })
      .forEach((item) => {
        if (item.type === "folder") {
          html += `
          <div class="vs-list-row clickable vs-item-click" data-target="folder" data-id="${item.id}">
            <div class="vs-icon-wrapper" style="background: rgba(251, 191, 36, 0.15); box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.4);"><i class="fa-solid fa-folder" style="color: #fbbf24; font-size: 18px;"></i></div>
            <div class="vs-text-container"><div class="vs-text-title">${item.name}</div></div>
            <div class="vs-row-actions" style="display: none;">
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
            <img src="${item.tokenUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <i class="fa-solid fa-user-astronaut" style="color: #60a5fa; display:none;"></i>
          `;
            wrapperPadding = "2px";
          }

          html += `
          <div class="vs-list-row">
            <div class="vs-icon-wrapper" style="background: rgba(96, 165, 250, 0.1); box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.3); padding: ${wrapperPadding};">
              ${iconContent}
            </div>
            <div class="vs-text-container"><div class="vs-text-title">${item.name}</div></div>
            <div class="vs-row-actions" style="display: none;">
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
  // Fungsi search didisable untuk saat ini
  document.getElementById("vs-search-input").addEventListener("input", (e) => {
    // searchQuery = e.target.value;
    // renderListArea();
  });

  document
    .getElementById("vs-list-area")
    .addEventListener("click", async (e) => {
      // Delete dengan Modal Konfirmasi
      if (e.target.closest(".vs-action-delete")) {
        const id = e.target.closest(".vs-action-delete").dataset.id;
        
        Dialog.confirm({
          title: "Confirm Deletion",
          content: "<p>Are you sure you want to delete this item? This action cannot be undone.</p>",
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
          defaultYes: false
        });
        return;
      }

      // Edit
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

      // Navigation
      const row = e.target.closest(".vs-item-click");
      if (!row) return;
      const target = row.dataset.target;

      if (target === "folder") {
        currentFolderId = row.dataset.id;
        renderListArea();
      } else if (target === "back-folder") {
        currentFolderId =
          row.dataset.parent === "root" ? null : row.dataset.parent;
        renderListArea();
      }
    });

  document.getElementById("vs-btn-add-folder").addEventListener("click", () => {
    showFolderForm("Create New Folder", null, async (data) => {
      visageData.items.push({
        id: foundry.utils.randomID(),
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
          id: foundry.utils.randomID(),
          type: "profile",
          parentId: currentFolderId,
          ...data,
        });
        renderListArea();
        await saveVisageData();
      });
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

// === FORM BUILDERS ===

function showFolderForm(title, existingData, onConfirm) {
  const data = existingData || { name: "" };
  const content = `
    <div class="silane-form-group" style="padding: 10px 0;">
      <label style="color: #a1a1aa; font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Folder Name</label>
      <input type="text" id="vs-modal-name" value="${data.name}" placeholder="e.g. Items" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; border-radius: 6px; padding: 10px 12px; color: #f4f4f5; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#60a5fa'" onblur="this.style.borderColor='#3f3f46'" />
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
          const name = html.find("#vs-modal-name").val().trim();
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

  // Variabel penampung file fisik (bukan URL preview)
  let selectedTokenFile = null;
  let selectedPortraitFile = null;

  const content = `
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
            <img id="prev-token" src="${data.tokenUrl}" style="display: ${data.tokenUrl ? "block" : "none"};" />
            <input type="file" id="file-token" accept="image/*" style="display:none;" />
          </div>
          <button id="btn-upload-token" class="vs-prof-upload-btn">Select Image</button>
        </div>
        
        <div style="flex:1; display:flex; flex-direction:column;">
          <div class="vs-prof-img-box" id="box-portrait">
            <span style="color: #4ade80;">Portrait</span>
            <img id="prev-portrait" src="${data.portraitUrl}" style="display: ${data.portraitUrl ? "block" : "none"};" />
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
    </div>
  `;

  new Dialog(
    {
      title: title,
      content: content,
      buttons: {
        ok: {
          label: "Confirm & Save",
          icon: '<i class="fas fa-save"></i>',
          callback: async (html) => {
            const name = html.find("#vs-prof-name").val().trim();
            if (!name)
              return ui.notifications?.warn("Profile Name cannot be empty.");

            ui.notifications?.info("Saving profile and processing media...");
            const saveBtn = html
              .closest(".dialog")
              .find(".dialog-buttons button");
            saveBtn.prop("disabled", true); // Mencegah double click saat sedang upload

            let finalTokenUrl = data.tokenUrl;
            let finalPortraitUrl = data.portraitUrl;

            // Fungsi Helper untuk nembak API Upload
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
              return result.url; // url minio yang asli
            };

            try {
              // Upload Jika ada file baru yang dipilih oleh user
              if (selectedTokenFile) {
                finalTokenUrl = await uploadMediaToBackend(selectedTokenFile);
              }
              if (selectedPortraitFile) {
                finalPortraitUrl =
                  await uploadMediaToBackend(selectedPortraitFile);
              }

              // Kembalikan Data Final (Sudah terhubung ke URL asli, bukan blob)
              onConfirm({
                name: name,
                tokenUrl: finalTokenUrl,
                portraitUrl: finalPortraitUrl,
                size: html.find("#vs-prof-size").val().trim(),
                hide: html.find("#vs-prof-hide").is(":checked"),
                height: html.find("#vs-prof-height").val(),
                width: html.find("#vs-prof-width").val(),
              });
            } catch (err) {
              ui.notifications?.error(
                "Failed to upload image. Please try again.",
              );
              console.error(err);
              saveBtn.prop("disabled", false);
            }
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "ok",
      render: (html) => {
        // Logic Preview Gambar
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
              // Simpan ke variabel penampung untuk diupload saat tombol Confirm ditekan
              if (isToken) selectedTokenFile = file;
              else selectedPortraitFile = file;

              // Tampilkan preview sementara menggunakan blob
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
      },
    },
    { width: 420 },
  ).render(true);
}