import { API_BASE_URL, heraldSilane_getWindowDimensions } from "./helper.js";
import { initVisageTab } from "./visage.js";
import { initCharacterTab } from "./character.js";
import { initAudioTab } from "./audio.js";
// ==========================================
// STATE VARIABLES
// ==========================================
let heraldSilane_currentDialog = null;
let heraldSilane_uploadDialog = null;

// ==========================================
// FUNGSI UTAMA
// ==========================================
async function heraldSilane_renderAccessButton() {
  const existingButton = document.getElementById(
    "heraldSilane-accessButtonContainer",
  );
  if (existingButton) existingButton.remove();

  try {
    const html = await fetch(
      "/modules/heralds-silane/templates/accessButton.html",
    ).then((res) => res.text());
    const div = document.createElement("div");
    div.innerHTML = html;
    const exporter = div.firstChild;
    exporter.id = "heraldSilane-accessButtonContainer";
    exporter.classList.add("heraldSilane-accessButtonContainer");

    const accessButton = document.createElement("button");
    accessButton.id = "heraldSilane-accessButton";
    accessButton.classList.add("heraldSilane-accessButton");
    accessButton.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i>';
    accessButton.title = "Open Silane Asset";

    accessButton.addEventListener(
      "click",
      async () => await heraldSilane_showDialog(),
    );

    exporter.appendChild(accessButton);
    document.body.appendChild(exporter);
  } catch (err) {
    console.error(err);
  }
}

async function heraldSilane_showDialog() {
  const dims = heraldSilane_getWindowDimensions(); // Diambil dari helper.js
  const dialogContent = `<div id="heraldSilane-dialogContainer" ></div>`;
  const dialogOptions = {
    width: dims.width,
    height: dims.height,
    resizable: true,
    classes: ["dialog", "silane-custom-dialog"],
  };
  const dialog = new Dialog(
    { title: "Silane Assets", content: dialogContent, buttons: {} },
    dialogOptions,
  );
  heraldSilane_currentDialog = dialog;
  dialog.render(true);

  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === "Silane Assets") {
      // 🔥 INJEKSI STYLE LANGSUNG KE WINDOW CONTENT FOUNDRY AGAR HEIGHT SELALU PAS 🔥
      const contentEl = app.element[0].querySelector(".window-content");
      if (contentEl) {
        contentEl.style.padding = "0";
        contentEl.style.background = "#18181b";
        contentEl.style.overflow = "hidden";
        contentEl.style.display = "flex";
        contentEl.style.flexDirection = "column";
        contentEl.style.height = "100%";
      }
      await heraldSilane_renderRouting();
    }
  });
}

async function heraldSilane_renderRouting() {
  const token = localStorage.getItem("heraldSilane_token");
  if (token) await heraldSilane_renderMainView();
  else await heraldSilane_renderLoginView();
}

async function heraldSilane_renderLoginView() {
  const container = document.getElementById("heraldSilane-dialogContainer");
  if (!container) return;

  const dims = heraldSilane_getWindowDimensions();

  container.innerHTML = `
    <div class="hs-layout-override" style="height: ${dims.overrideHeight}px; flex: 1; display: flex; flex-direction: column; min-height: 0;">
      <div class="silane-dialog-wrapper">
        <div class="silane-dialog-middle">
          <h2 class="silane-title">Silane Authentication</h2>
          <p class="silane-subtitle">Please connect to your node to continue.</p>
          <div class="silane-form-group">
            <label for="heraldSilane-secretId">Secret ID</label>
            <input type="password" id="heraldSilane-secretId" class="silane-input mono" placeholder="Enter Secret ID" />
            <div id="heraldSilane-loginMsg" class="silane-error-msg"></div>
          </div>
        </div>
        <div class="silane-dialog-bottom">
          <button id="heraldSilane-btnCancel" class="silane-btn">Cancel</button>
          <button id="heraldSilane-btnLogin" class="silane-btn primary">Connect</button>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("heraldSilane-btnCancel")
    .addEventListener("click", () => {
      if (heraldSilane_currentDialog) heraldSilane_currentDialog.close();
    });

  document
    .getElementById("heraldSilane-btnLogin")
    .addEventListener("click", async (e) => {
      const btn = e.target;
      const secretId = document
        .getElementById("heraldSilane-secretId")
        .value.trim();
      const msgDiv = document.getElementById("heraldSilane-loginMsg");

      if (!secretId) {
        msgDiv.textContent = "Secret ID cannot be empty.";
        msgDiv.style.display = "block";
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      msgDiv.style.display = "none";

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secretId: secretId }),
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem(
            "heraldSilane_token",
            data.token || "authenticated",
          );
          if (data.user) {
            localStorage.setItem(
              "heraldSilane_user",
              JSON.stringify(data.user),
            );
          }
          ui.notifications?.info("Connected to Silane.");
          await heraldSilane_renderRouting();
        } else {
          msgDiv.textContent = data.message || "Authentication failed.";
          msgDiv.style.display = "block";
        }
      } catch (error) {
        msgDiv.textContent = "Server connection failed.";
        msgDiv.style.display = "block";
      } finally {
        btn.disabled = false;
        btn.textContent = "Connect";
      }
    });
}

async function heraldSilane_renderMainView() {
  const container = document.getElementById("heraldSilane-dialogContainer");
  if (!container) return;

  const dims = heraldSilane_getWindowDimensions(); // 🔥 Ambil dimensi untuk Main View

  let activeTab = "visage";
  let userName = "Unknown User";
  let userImage = "icons/svg/mystery-man.svg";
  let selectedItems = new Set();
  let currentFilesArray = [];
  let maxStorageMb = 0;
  let isStorageUnlimited = false;

  const userDataStr = localStorage.getItem("heraldSilane_user");
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      userName = userData.username || userName;
      userImage = userData.profile_picture || userImage;

      if (userData.limits === null) {
        isStorageUnlimited = true;
      } else if (userData.limits && userData.limits.silane) {
        maxStorageMb = userData.limits.silane.count || 0;
      }
    } catch (e) {}
  }

  container.innerHTML = `
    <div class="hs-layout-override" style="height: ${dims.overrideHeight}px; flex: 1; display: flex; flex-direction: column; min-height: 0;">
      <div class="hs-main">
     <div class="hs-sidebar">
          <button id="hs-tab-visage" class="hs-circle-btn active" title="Visage"><i class="fa-solid fa-masks-theater"></i></button>
          <button id="hs-tab-audio" class="hs-circle-btn" title="Audio"><i class="fa-solid fa-music"></i></button>
          <button id="hs-tab-images" class="hs-circle-btn" title="Images"><i class="fa-solid fa-image"></i></button>
          <button id="hs-tab-character" class="hs-circle-btn" title="Character"><i class="fa-solid fa-users"></i></button>
        </div>
        <div class="hs-content">
          <div class="hs-header">
            <h2 id="hs-content-title" class="hs-title">Image Gallery</h2>
            
            <input type="text" id="hs-search-input" class="silane-input" placeholder="Search by name..." style="margin-left: 15px; width: 200px; padding: 5px 10px; border-radius: 4px; border: 1px solid #52525b; background: rgba(0,0,0,0.2); color: #f4f4f5;" />
            
            <div class="hs-actions" id="hs-actions-container" style="margin-left: auto;">
              <button id="hs-btn-share-chat" class="hs-btn" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.5);" disabled title="Show in Chat">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
              
              <button id="hs-btn-delete" class="hs-btn hs-btn-danger" disabled title="Delete Selected">
                <i class="fa-solid fa-trash"></i>
              </button>
              <button id="hs-btn-open-upload" class="hs-btn hs-btn-primary">
                <i class="fa-solid fa-upload"></i> Upload
              </button>
            </div>
          </div>
          <div id="hs-gallery-container" class="hs-gallery"></div>
        </div>
      </div>
      
      <div class="hs-footer">
        <div class="hs-user-info" style="display: flex; align-items: center; gap: 10px;">
          <img src="${userImage}" class="hs-user-avatar" style="margin: 0;" />
          <div style="display: flex; flex-direction: column; justify-content: center; width: 150px;">
            <div id="hs-storage-usage" style="color: #a1a1aa; margin-bottom: 4px;">
              <div style="font-size: 11px; display: flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Calculating...
              </div>
            </div>
            <div class="hs-user-name" style="line-height: 1.2;">Welcome, ${userName}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="display: flex; gap: 14px; justify-content: flex-end; align-items: center;">
            <button id="hs-btn-settings" style="background: transparent; border: none; color: #a1a1aa; cursor: pointer; font-size: 18px; padding: 0; outline: none; transition: color 0.2s;" title="Settings" onmouseover="this.style.color='#f4f4f5'" onmouseout="this.style.color='#a1a1aa'">
              <i class="fa-solid fa-gear"></i>
            </button>
            <button id="hs-btn-logout" style="background: transparent; border: none; color: #a1a1aa; cursor: pointer; font-size: 18px; padding: 0; outline: none; transition: color 0.2s;" title="Disconnect" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#a1a1aa'">
              <i class="fa-solid fa-door-open"></i>
            </button>
          </div>
          <div style="font-size: 0.7em; margin-top: 6px;">
            <a href="https://projectignite.web.id" target="_blank" rel="noopener noreferrer" style="color: #52525b; text-decoration: none; transition: color 0.2s ease;" onmouseover="this.style.color='#60a5fa'" onmouseout="this.style.color='#52525b'">
              powered by projectignite.web.id
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const tabs = {
    images: document.getElementById("hs-tab-images"),
    audio: document.getElementById("hs-tab-audio"),
    visage: document.getElementById("hs-tab-visage"),
    character: document.getElementById("hs-tab-character"),
  };

  const galleryContainer = document.getElementById("hs-gallery-container");
  const actionsContainer = document.getElementById("hs-actions-container");
  const deleteBtn = document.getElementById("hs-btn-delete");
  const shareChatBtn = document.getElementById("hs-btn-share-chat");
  const titleText = document.getElementById("hs-content-title");
  const btnOpenUpload = document.getElementById("hs-btn-open-upload");
  const searchInput = document.getElementById("hs-search-input");
  const storageUsageDiv = document.getElementById("hs-storage-usage");

  const fetchStorageUsage = async () => {
    if (!storageUsageDiv) return;
    try {
      const token = localStorage.getItem("heraldSilane_token");
      const response = await fetch(`${API_BASE_URL}/api/silane_assets/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const usedMb = parseFloat(result.data.total_mb) || 0;

        if (isStorageUnlimited) {
          storageUsageDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:3px; font-weight: 500;">
              <span>Storage</span>
              <span>${usedMb.toFixed(1)} MB / &infin;</span>
            </div>
            <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: 100%; height: 100%; background: #3b82f6;"></div>
            </div>
          `;
        } else {
          const maxMb = maxStorageMb;
          let percent = maxMb > 0 ? (usedMb / maxMb) * 100 : 100;
          if (percent > 100) percent = 100;

          let barColor = "#10b981";
          if (percent >= 75) barColor = "#f59e0b";
          if (percent >= 90) barColor = "#ef4444";

          storageUsageDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:3px; font-weight: 500;">
              <span>Storage</span>
              <span>${usedMb.toFixed(1)} MB / ${maxMb} MB</span>
            </div>
            <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: ${percent}%; height: 100%; background: ${barColor}; transition: width 0.4s ease, background-color 0.4s ease;"></div>
            </div>
          `;
        }
      } else {
        storageUsageDiv.innerHTML = `<div style="font-size:11px;"><i class="fa-solid fa-triangle-exclamation"></i> Storage info unavailable</div>`;
      }
    } catch (error) {
      storageUsageDiv.innerHTML = `<div style="font-size:11px;"><i class="fa-solid fa-triangle-exclamation"></i> Storage info error</div>`;
    }
  };

  fetchStorageUsage();

  const updateDeleteBtnState = () => {
    const hasSelection = selectedItems.size > 0;
    deleteBtn.disabled = !hasSelection;
    if (shareChatBtn) shareChatBtn.disabled = !hasSelection;
  };

  const renderGallery = (filesArray) => {
    if (filesArray.length > 0) {
      galleryContainer.innerHTML = filesArray
        .map((file) => {
          let mediaContent = `<i class="fa-solid fa-image hs-media-icon"></i>`;
          if (file.url) {
            mediaContent = `<img src="${file.url}" class="hs-media-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /> <i class="fa-solid fa-image hs-media-icon" style="display:none;"></i>`;
          }

          const isSelected = selectedItems.has(String(file.id))
            ? "selected"
            : "";

          return `
          <div class="hs-gallery-item ${isSelected}" data-id="${file.id}">
            <div class="hs-check-badge"><i class="fa-solid fa-check"></i></div>
            <div class="hs-media-wrapper">${mediaContent}</div>
            <div class="hs-gallery-name" title="${file.name}">${file.name}</div>
          </div>
        `;
        })
        .join("");
    } else {
      galleryContainer.innerHTML = `<div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color: #52525b; padding-top:40px;"><i class="fa-solid fa-folder-open fa-2x" style="margin-bottom: 12px;"></i> No image assets found.</div>`;
    }
  };

  const fetchGalleryData = async () => {
    galleryContainer.innerHTML = `<div style="grid-column: 1 / -1; display:flex; align-items:center; justify-content:center; height:100%; color: #a1a1aa; padding-top:40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
    selectedItems.clear();
    updateDeleteBtnState();
    searchInput.value = "";

    try {
      const token = localStorage.getItem("heraldSilane_token");
      const response = await fetch(`${API_BASE_URL}/api/silane_assets/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        currentFilesArray = result.data ? result.data.images || [] : [];
        renderGallery(currentFilesArray);
        fetchStorageUsage();
      } else {
        galleryContainer.innerHTML = `<div style="grid-column: 1 / -1; color: #ef4444; text-align: center; padding: 20px;">Failed to load data.</div>`;
      }
    } catch (error) {
      galleryContainer.innerHTML = `<div style="grid-column: 1 / -1; color: #ef4444; text-align: center; padding: 20px;">Connection error.</div>`;
    }
  };

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filteredFiles = currentFilesArray.filter((file) =>
      file.name.toLowerCase().includes(query),
    );
    renderGallery(filteredFiles);
  });

  galleryContainer.addEventListener("click", (e) => {
    if (activeTab !== "images") return;
    const item = e.target.closest(".hs-gallery-item");
    if (!item) return;

    const id = String(item.dataset.id);
    if (selectedItems.has(id)) {
      selectedItems.delete(id);
      item.classList.remove("selected");
    } else {
      selectedItems.add(id);
      item.classList.add("selected");
    }
    updateDeleteBtnState();
  });

const switchTab = (type) => {
    activeTab = type;
    Object.values(tabs).forEach((btn) => btn.classList.remove("active"));
    tabs[type].classList.add("active");

    if (type === "images") {
      titleText.innerText = "Image Gallery";
      actionsContainer.style.display = "flex";
      searchInput.style.display = "block";
      galleryContainer.classList.add("hs-gallery");
      fetchGalleryData();
    } else if (type === "visage") {
      titleText.innerText = "Visage Profiles";
      actionsContainer.style.display = "none";
      searchInput.style.display = "none";
      galleryContainer.classList.remove("hs-gallery");
      initVisageTab(galleryContainer);
    } else if (type === "character") {
      titleText.innerText = "Character Roster";
      actionsContainer.style.display = "none";
      searchInput.style.display = "none";
      galleryContainer.classList.remove("hs-gallery");
      initCharacterTab(galleryContainer);
    } else if (type === "audio") {
      // 🔥 PANGGIL INIT AUDIO DI SINI
      titleText.innerText = "Audio Studio";
      actionsContainer.style.display = "none";
      searchInput.style.display = "none";
      galleryContainer.classList.remove("hs-gallery");
      initAudioTab(galleryContainer);
    }
  };

  Object.entries(tabs).forEach(([type, btn]) => {
    btn.addEventListener("click", () => switchTab(type));
  });

  btnOpenUpload.addEventListener("click", () => {
    heraldSilane_openUploadModal(activeTab, fetchGalleryData);
  });

  document.getElementById("hs-btn-settings").addEventListener("click", () => {
    heraldSilane_openSettingsModal();
  });

  if (shareChatBtn) {
    shareChatBtn.addEventListener("click", () => {
      if (selectedItems.size === 0) return;

      const selectedFiles = currentFilesArray.filter((file) =>
        selectedItems.has(String(file.id)),
      );

      let chatContent = `<div class="silane-chat-images" style="display:flex; flex-direction:column; gap:8px;">`;
      selectedFiles.forEach((file) => {
        if (file.url) {
          chatContent += `
            <div style="background: rgba(0,0,0,0.2); padding: 5px; border-radius: 4px; border: 1px solid #3f3f46;">
              <img src="${file.url}" alt="Shared Image" style="border-radius: 4px; max-width: 100%; height: auto; display: block;" />
            </div>
          `;
        }
      });
      chatContent += `</div>`;

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content: chatContent,
      });

      ui.notifications?.info(
        `Shared ${selectedFiles.length} image(s) to chat.`,
      );
    });
  }

  deleteBtn.addEventListener("click", async () => {
    if (selectedItems.size === 0) return;

    const idsToDelete = Array.from(selectedItems);
    ui.notifications?.info(`Deleting ${idsToDelete.length} item(s)...`);

    try {
      const token = localStorage.getItem("heraldSilane_token");
      const response = await fetch(`${API_BASE_URL}/api/silane_assets/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: idsToDelete, type: "images" }),
      });

      if (response.ok) {
        ui.notifications?.info(`Delete successful!`);
        fetchGalleryData();
      } else {
        const errData = await response.json();
        ui.notifications?.error(`Delete failed: ${errData.message}`);
      }
    } catch (error) {
      ui.notifications?.error("Delete error.");
    }
  });

  document
    .getElementById("hs-btn-logout")
    .addEventListener("click", async () => {
      localStorage.removeItem("heraldSilane_token");
      localStorage.removeItem("heraldSilane_user");
      ui.notifications?.info("Disconnected from Silane.");
      await heraldSilane_renderRouting();
    });

  switchTab("visage");
}

function heraldSilane_openSettingsModal() {
  const currentSize = game.settings.get("heralds-silane", "windowSize");
  const currentDetail = game.settings.get("heralds-silane", "characterDetailMode");
  
  const content = `
    <div class="silane-settings-wrapper" style="padding: 10px; color: #f4f4f5;">
      <div class="silane-form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: white;">Window Size</label>
        <select id="hs-setting-windowSize" class="silane-input" style="width: 100%; padding: 5px; background: rgba(0,0,0,0.5); color: white !important; border: 1px solid #52525b;">
          <option value="small" style="background: #18181b; color: white;" ${currentSize === "small" ? "selected" : ""}>Small</option>
          <option value="medium" style="background: #18181b; color: white;" ${currentSize === "medium" ? "selected" : ""}>Medium</option>
          <option value="large" style="background: #18181b; color: white;" ${currentSize === "large" ? "selected" : ""}>Large (Default)</option>
          <option value="xlarge" style="background: #18181b; color: white;" ${currentSize === "xlarge" ? "selected" : ""}>Extra Large</option>
          <option value="xxlarge" style="background: #18181b; color: white;" ${currentSize === "xxlarge" ? "selected" : ""}>XL</option>
        </select>
      </div>

      <div class="silane-form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: white;">Character Detail Information</label>
        <select id="hs-setting-characterDetail" class="silane-input" style="width: 100%; padding: 5px; background: rgba(0,0,0,0.5); color: white !important; border: 1px solid #52525b;">
          <option value="all" style="background: #18181b; color: white;" ${currentDetail === "all" ? "selected" : ""}>All (Show Everything)</option>
          <option value="nameOnly" style="background: #18181b; color: white;" ${currentDetail === "nameOnly" ? "selected" : ""}>Name Only (Minimalist)</option>
        </select>
      </div>
    </div>
  `;

  new Dialog(
    {
      title: "Herald Silane Settings",
      content: content,
      buttons: {
        save: {
          label: '<i class="fa-solid fa-save"></i> Save Changes',
          callback: async (html) => {
            const newSize = html.find("#hs-setting-windowSize").val();
            const newDetail = html.find("#hs-setting-characterDetail").val();

            await game.settings.set("heralds-silane", "windowSize", newSize);
            await game.settings.set("heralds-silane", "characterDetailMode", newDetail);

            if (heraldSilane_currentDialog) {
              const dims = heraldSilane_getWindowDimensions();
              heraldSilane_currentDialog.setPosition({ width: dims.width, height: dims.height });
            }
            await heraldSilane_renderRouting();
            ui.notifications?.info("Silane Settings Saved.");
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "save",
      render: (html) => {
        const dialogElement = html.closest(".app")[0];
        const contentElement = dialogElement.querySelector(".window-content");
        if (contentElement) {
          contentElement.style.backgroundColor = "#18181b";
          contentElement.style.color = "white";
          contentElement.style.backgroundImage = "none";
        }

        html.closest(".dialog").find(".dialog-buttons button").css({
          color: "white",
          border: "1px solid #3f3f46",
          background: "rgba(0,0,0,0.4)",
        });
      },
    },
    { width: 450, height: "auto", classes: ["dialog", "silane-custom-dialog"] },
  ).render(true);
}

// ==========================================
// FUNGSI MODAL UPLOAD
// ==========================================
function heraldSilane_openUploadModal(activeTab, onSuccessCallback) {
  if (heraldSilane_uploadDialog) {
    heraldSilane_uploadDialog.close();
  }

  let selectedUploadFile = null;
  let activeTags = [];

  const content = `
    <div class="silane-upload-wrapper">
      <div class="silane-form-group" style="gap:5px; margin-top:0;">
        <label>Name</label>
        <input type="text" id="hs-upload-name" class="silane-input" style="border-radius:4px;" />
      </div>

      <div class="silane-form-group" style="gap:5px; margin-top:10px; margin-bottom:15px;">
        <label>Tags</label>
        <div style="display:flex; gap:5px;">
          <input type="text" id="hs-upload-tags-input" class="silane-input" placeholder="Type a tag..." style="border-radius:4px; flex-grow: 1;" />
          <button id="hs-btn-add-tag" class="silane-btn" style="padding: 5px 12px; border-radius: 4px; border: 1px solid #52525b; background: rgba(0,0,0,0.2); color: #f4f4f5; cursor:pointer;" title="Add Tag">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <div id="hs-tags-container" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;"></div>
      </div>

      <div class="hs-upload-box" id="hs-upload-box">
        <div id="hs-upload-placeholder" style="text-align:center; color:#a1a1aa;">
          <i class="fa-solid fa-image fa-2x" style="margin-bottom:8px;"></i><br>Click to Upload Image
        </div>
        <img id="hs-upload-preview" style="display:none;" />
        <input type="file" id="hs-fileInput" accept="image/*" style="display:none;">
      </div>

      <button id="hs-btn-confirm-upload" class="silane-btn primary" style="width:100%; border-radius:4px; padding:10px; margin-top:15px;">Confirm Upload</button>

      <details class="hs-advanced-settings" id="hs-advanced-details">
        <summary>Advanced settings ⚠️</summary>
        <div class="hs-advanced-content">
          <div style="display:flex; gap:15px; align-items:center; margin-bottom:10px;">
            <div style="display:flex; gap:5px; align-items:center;">
              <label style="margin:0;">Size</label> 
              <input type="text" id="hs-upload-size" class="silane-input" style="width:70px; padding:4px;" />
            </div>
            <div style="display:flex; gap:5px; align-items:center;">
              <label style="margin:0;">Hide</label> 
              <input type="checkbox" id="hs-upload-hide" style="margin:0;" />
            </div>
          </div>
          <label style="display:block; margin-bottom:5px;">Dimensions</label>
          <div style="display:flex; gap:15px; align-items:center;">
            <div style="display:flex; gap:5px; align-items:center;">
              <span>| height</span> 
              <input type="number" id="hs-upload-height" class="silane-input" style="width:70px; padding:4px;" />
            </div>
            <div style="display:flex; gap:5px; align-items:center;">
              <span>_ width</span> 
              <input type="number" id="hs-upload-width" class="silane-input" style="width:70px; padding:4px;" />
            </div>
          </div>
        </div>
      </details>
    </div>
  `;

  heraldSilane_uploadDialog = new Dialog(
    {
      title: "Upload Image Asset",
      content: content,
      buttons: {},
      render: (html) => {
        const parent = html[0];
        const fileInput = parent.querySelector("#hs-fileInput");
        const uploadBox = parent.querySelector("#hs-upload-box");
        const uploadPlaceholder = parent.querySelector(
          "#hs-upload-placeholder",
        );
        const uploadPreview = parent.querySelector("#hs-upload-preview");
        const nameInput = parent.querySelector("#hs-upload-name");
        const tagInputElem = parent.querySelector("#hs-upload-tags-input");
        const btnAddTag = parent.querySelector("#hs-btn-add-tag");
        const tagsContainer = parent.querySelector("#hs-tags-container");
        const btnConfirm = parent.querySelector("#hs-btn-confirm-upload");
        const detailsElem = parent.querySelector("#hs-advanced-details");

        if (detailsElem) {
          detailsElem.addEventListener("toggle", () => {
            if (heraldSilane_uploadDialog) {
              heraldSilane_uploadDialog.setPosition({ height: "auto" });
            }
          });
        }

        const renderTags = () => {
          tagsContainer.innerHTML = activeTags
            .map(
              (tag, index) => `
            <span style="background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.5); padding: 3px 8px; border-radius: 12px; font-size: 0.8em; display: inline-flex; align-items: center; gap: 6px;">
              ${tag}
              <i class="fa-solid fa-xmark hs-remove-tag" data-index="${index}" style="cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'"></i>
            </span>
          `,
            )
            .join("");

          if (heraldSilane_uploadDialog) {
            heraldSilane_uploadDialog.setPosition({ height: "auto" });
          }
        };

        const addNewTag = () => {
          const val = tagInputElem.value.trim();
          if (val && !activeTags.includes(val)) {
            activeTags.push(val);
            tagInputElem.value = "";
            renderTags();
          }
        };

        btnAddTag.addEventListener("click", (e) => {
          e.preventDefault();
          addNewTag();
        });

        tagInputElem.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addNewTag();
          }
        });

        tagsContainer.addEventListener("click", (e) => {
          if (e.target.classList.contains("hs-remove-tag")) {
            const index = e.target.getAttribute("data-index");
            activeTags.splice(index, 1);
            renderTags();
          }
        });

        uploadBox.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;

          if (!file.type.startsWith("image/")) {
            ui.notifications?.warn("Please select an image file.");
            fileInput.value = "";
            return;
          }

          selectedUploadFile = file;
          nameInput.value = file.name.split(".")[0];
          const objectUrl = URL.createObjectURL(file);
          uploadPreview.src = objectUrl;
          uploadPreview.style.display = "block";
          uploadPlaceholder.style.display = "none";
        });

        btnConfirm.addEventListener("click", async () => {
          if (!selectedUploadFile) {
            ui.notifications?.warn("Please select an image file to upload.");
            return;
          }

          const customName = nameInput.value.trim();

          ui.notifications?.info(
            `Uploading ${customName || selectedUploadFile.name}...`,
          );
          btnConfirm.disabled = true;
          btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

          const formData = new FormData();
          formData.append("file", selectedUploadFile);
          formData.append("type", activeTab);
          if (customName) formData.append("customName", customName);

          if (activeTags.length > 0) {
            formData.append("tags", JSON.stringify(activeTags));
          }

          try {
            const token = localStorage.getItem("heraldSilane_token");
            const response = await fetch(
              `${API_BASE_URL}/api/silane_assets/upload`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
              },
            );

            if (response.ok) {
              ui.notifications?.info(`Upload successful!`);
              heraldSilane_uploadDialog.close();
              if (onSuccessCallback) onSuccessCallback();
            } else {
              const errData = await response.json();

              if (errData.message && errData.message.includes("over 3mb")) {
                ui.notifications?.warn(`⚠️ Warning: ${errData.message}`);
              } else {
                ui.notifications?.error(`Upload failed: ${errData.message}`);
              }

              btnConfirm.disabled = false;
              btnConfirm.textContent = "Confirm Upload";
            }
          } catch (error) {
            ui.notifications?.error("Upload error.");
            btnConfirm.disabled = false;
            btnConfirm.textContent = "Confirm Upload";
          }
        });
      },
    },
    {
      width: 400,
      height: "auto",
      classes: ["dialog", "silane-custom-dialog"],
    },
  );

  heraldSilane_uploadDialog.render(true);
}

export { heraldSilane_renderAccessButton };
