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
            <div class="hs-edit-badge" title="Edit Asset Name/Image" data-id="${file.id}"><i class="fa-solid fa-edit"></i></div>
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

function showImageEditForm(file) {
  let selectedFile = null;
  const hasExistingUrl = !!file.url;

  const content = `
    <div class="silane-upload-wrapper" style="padding: 10px; color: #f4f4f5;">
      <div class="silane-form-group" style="margin-bottom: 12px; display:flex; flex-direction:column; gap:5px;">
        <label style="font-weight: bold; color: white;">Asset Name</label>
        <input type="text" id="hs-edit-image-name" class="silane-input" style="width: 100%; border-radius:4px;" value="${file.name}" />
      </div>
      <div class="silane-form-group" style="margin-bottom: 15px; display:flex; flex-direction:column; gap:5px;">
        <label style="font-weight: bold; color: white;">Replace Image</label>
        <div class="hs-upload-box" id="hs-edit-upload-box" style="margin-top:5px; height:140px;">
          <div id="hs-edit-upload-placeholder" style="text-align:center; color:#a1a1aa; ${hasExistingUrl ? 'display:none;' : ''}">
            <i class="fa-solid fa-image fa-2x" style="margin-bottom:8px;"></i><br>Click to Replace Image
          </div>
          <img id="hs-edit-upload-preview" src="${file.url || ''}" style="${hasExistingUrl ? 'display:block;' : 'display:none;'}; max-height: 100%; width: 100%; object-fit: contain;" />
          <input type="file" id="hs-edit-fileInput" accept="image/*" style="display:none;">
        </div>
      </div>
    </div>
  `;

  new Dialog(
    {
      title: "Edit Image Asset",
      content: content,
      buttons: {
        save: {
          label: '<i class="fa-solid fa-save"></i> Save Changes',
          callback: async (html) => {
            const name = html.find("#hs-edit-image-name").val().trim();

            if (!name) {
              ui.notifications?.warn("Name cannot be empty.");
              return;
            }

            ui.notifications?.info("Updating image asset...");

            const formData = new FormData();
            formData.append("id", file.id);
            formData.append("name", name);
            if (selectedFile) {
              formData.append("file", selectedFile);
            }

            try {
              const token = localStorage.getItem("heraldSilane_token");
              const response = await fetch(`${API_BASE_URL}/api/silane_assets/image/update`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`
                },
                body: formData
              });

              if (response.ok) {
                ui.notifications?.info("Image asset updated successfully!");
                fetchGalleryData();
              } else {
                const errData = await response.json();
                ui.notifications?.error(`Failed to update: ${errData.message}`);
              }
            } catch (err) {
              console.error(err);
              ui.notifications?.error("Failed to update image asset.");
            }
          }
        },
        cancel: { label: "Cancel" }
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

        const uploadBox = html.find("#hs-edit-upload-box")[0];
        const fileInput = html.find("#hs-edit-fileInput")[0];
        const previewImg = html.find("#hs-edit-upload-preview")[0];
        const placeholderDiv = html.find("#hs-edit-upload-placeholder")[0];

        if (uploadBox && fileInput) {
          uploadBox.onclick = () => fileInput.click();

          fileInput.onchange = (e) => {
            const selected = e.target.files[0];
            if (!selected) return;

            if (!selected.type.startsWith("image/")) {
              ui.notifications?.warn("Please select an image file.");
              fileInput.value = "";
              return;
            }

            selectedFile = selected;
            const objectUrl = URL.createObjectURL(selected);
            previewImg.src = objectUrl;
            previewImg.style.display = "block";
            placeholderDiv.style.display = "none";
          };
        }
      }
    },
    { width: 400, classes: ["dialog", "silane-custom-dialog"] }
  ).render(true);
}

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
      const editBtn = e.target.closest(".hs-edit-badge");
      if (editBtn) {
        e.stopPropagation();
        const id = String(editBtn.dataset.id);
        const file = currentFilesArray.find(f => String(f.id) === id);
        if (file) {
          showImageEditForm(file);
        }
        return;
      }

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
