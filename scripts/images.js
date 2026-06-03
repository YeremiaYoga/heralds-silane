import { API_BASE_URL } from "./helper.js";

let currentFilesArray = [];
let selectedItems = new Set();
let onDataLoaded = null;

const updateDeleteBtnState = () => {
  const deleteBtn = document.getElementById("hs-btn-delete");
  const shareChatBtn = document.getElementById("hs-btn-share-chat");
  const hasSelection = selectedItems.size > 0;
  if (deleteBtn) deleteBtn.disabled = !hasSelection;
  if (shareChatBtn) shareChatBtn.disabled = !hasSelection;
};

const renderGallery = (filesArray) => {
  const galleryContainer = document.getElementById("hs-gallery-container");
  if (!galleryContainer) return;

  if (filesArray.length > 0) {
    galleryContainer.innerHTML = filesArray
      .map((file) => {
        let mediaContent = `<i class="fa-solid fa-image hs-media-icon"></i>`;
        if (file.url) {
          mediaContent = `<img src="${file.url}" class="hs-media-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /> <i class="fa-solid fa-image hs-media-icon" style="display:none;"></i>`;
        }

        const isSelected = selectedItems.has(String(file.id)) ? "selected" : "";

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
  const galleryContainer = document.getElementById("hs-gallery-container");
  if (!galleryContainer) return;

  galleryContainer.innerHTML = `<div style="grid-column: 1 / -1; display:flex; align-items:center; justify-content:center; height:100%; color: #a1a1aa; padding-top:40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  selectedItems.clear();
  updateDeleteBtnState();

  const searchInput = document.getElementById("hs-search-input");
  if (searchInput) searchInput.value = "";

  try {
    const token = localStorage.getItem("heraldSilane_token");
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      currentFilesArray = result.data ? result.data.images || [] : [];
      renderGallery(currentFilesArray);
      if (onDataLoaded) onDataLoaded();
    } else {
      galleryContainer.innerHTML = `<div style="grid-column: 1 / -1; color: #ef4444; text-align: center; padding: 20px;">Failed to load data.</div>`;
    }
  } catch (error) {
    galleryContainer.innerHTML = `<div style="grid-column: 1 / -1; color: #ef4444; text-align: center; padding: 20px;">Connection error.</div>`;
  }
};

export const refreshImagesGallery = (onLoaded) => {
  if (onLoaded) onDataLoaded = onLoaded;
  fetchGalleryData();
};

export const getImagesList = () => {
  return currentFilesArray;
};

export async function initImagesTab(container, onLoaded) {
  onDataLoaded = onLoaded;

  // Bind search input listener
  const searchInput = document.getElementById("hs-search-input");
  if (searchInput) {
    searchInput.oninput = (e) => {
      const query = e.target.value.toLowerCase();
      const filteredFiles = currentFilesArray.filter((file) =>
        file.name.toLowerCase().includes(query),
      );
      renderGallery(filteredFiles);
    };
  }

  // Bind gallery container selection click
  const galleryContainer = document.getElementById("hs-gallery-container");
  if (galleryContainer) {
    galleryContainer.onclick = (e) => {
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
    };
  }

  // Bind share and delete buttons
  const deleteBtn = document.getElementById("hs-btn-delete");
  const shareChatBtn = document.getElementById("hs-btn-share-chat");

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
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
    };
  }

  if (shareChatBtn) {
    shareChatBtn.onclick = () => {
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
    };
  }

  // Load initial gallery data
  await fetchGalleryData();
}
