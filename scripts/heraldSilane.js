import { API_BASE_URL } from "./helper.js";

let heraldSilane_currentDialog = null;

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
    exporter.classList.add("heraldSilane-accessButtonWrapper");

    const accessButton = document.createElement("button");
    accessButton.id = "heraldSilane-accessButton";
    accessButton.classList.add("heraldSilane-accessButton");
    accessButton.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i>';
    accessButton.title = "Open Silane";

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
  const dialogContent = `
    <div id="heraldSilane-dialogContainer" style="font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; color: #ececec; min-height: 500px; padding: 10px;">
      <div id="heraldSilane-dialogTopContainer"></div>
      <div id="heraldSilane-dialogMiddleContainer"></div>
      <div id="heraldSilane-dialogBottomContainer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;"></div>
    </div>
  `;

  const dialogOptions = {
    width: 850,
    height: "auto",
    resizable: true,
  };

  const dialog = new Dialog(
    { title: "Silane", content: dialogContent, buttons: {} },
    dialogOptions,
  );
  heraldSilane_currentDialog = dialog;
  dialog.render(true);

  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === "Silane") {
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
  const top = document.getElementById("heraldSilane-dialogTopContainer");
  const middle = document.getElementById("heraldSilane-dialogMiddleContainer");
  const bottom = document.getElementById("heraldSilane-dialogBottomContainer");

  if (!top || !middle || !bottom) return;

  top.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="margin: 0 0 8px; font-weight: 600; font-size: 1.5em; border: none;">Silane Authentication</h2>
      <p style="color: #aaa; margin: 0; font-size: 0.95em;">Please connect to your node to continue.</p>
    </div>
  `;

  middle.innerHTML = `
    <div style="background: rgba(0,0,0,0.2); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
      <label for="heraldSilane-secretId" style="display: block; margin-bottom: 8px; font-weight: 500; color: #ccc;">Secret ID</label>
      <input type="password" id="heraldSilane-secretId" placeholder="Enter Secret ID" style="width: 100%; padding: 12px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: #fff; font-family: monospace; letter-spacing: 2px; box-sizing: border-box; outline: none;" />
      <div id="heraldSilane-loginMsg" style="display: none; color: #ff6b6b; margin-top: 10px; font-size: 0.9em; text-align: center;"></div>
    </div>
  `;

  bottom.innerHTML = `
    <button id="heraldSilane-btnCancel" style="padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #ccc; cursor: pointer; transition: all 0.2s;">Cancel</button>
    <button id="heraldSilane-btnLogin" style="padding: 10px 24px; border-radius: 8px; border: none; background: #4a90e2; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);">Connect</button>
  `;

  document
    .getElementById("heraldSilane-btnCancel")
    .addEventListener("click", () => {
      if (heraldSilane_currentDialog) {
        heraldSilane_currentDialog.close();
        heraldSilane_currentDialog = null;
      }
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
      btn.textContent = "Connecting...";
      btn.style.opacity = "0.7";
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
          if (data.user)
            localStorage.setItem(
              "heraldSilane_user",
              JSON.stringify(data.user),
            );
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
        btn.style.opacity = "1";
      }
    });
}

async function heraldSilane_renderMainView() {
  const top = document.getElementById("heraldSilane-dialogTopContainer");
  const middle = document.getElementById("heraldSilane-dialogMiddleContainer");
  const bottom = document.getElementById("heraldSilane-dialogBottomContainer");

  if (!top || !middle || !bottom) return;

  let activeTab = "image";
  let userName = "Unknown User";
  let userImage = "icons/svg/mystery-man.svg";

  const userDataStr = localStorage.getItem("heraldSilane_user");
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      userName = userData.username || userName;
      userImage = userData.profile_picture || userImage;
    } catch (e) {
      console.error(e);
    }
  }

  top.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <img src="${userImage}" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);" />
        <div>
          <div style="font-weight: 600; font-size: 1.2em; color: #fff;">${userName}</div>
          <div style="font-size: 0.85em; color: #4ae290; display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <i class="fa-solid fa-circle-dot" style="font-size: 0.6em;"></i> Online
          </div>
        </div>
      </div>
      <button id="heraldSilane-btnLogout" style="background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.2); color: #ff6b6b; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Disconnect
      </button>
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
      <button id="tabBtn-image" style="flex: 1; padding: 10px; border: none; border-radius: 6px; background: #4a90e2; color: white; cursor: pointer; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i class="fa-solid fa-image"></i> Images
      </button>
      <button id="tabBtn-music" style="flex: 1; padding: 10px; border: none; border-radius: 6px; background: transparent; color: #888; cursor: pointer; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i class="fa-solid fa-music"></i> Audio
      </button>
    </div>
  `;

  middle.innerHTML = `
    <div id="tabContent-image" style="display: block;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 1.1em; font-weight: 500; border: none;">Media Gallery</h3>
        <button id="silane-btnTriggerImage" style="padding: 8px 16px; background: rgba(74, 144, 226, 0.15); color: #4a90e2; border: 1px solid rgba(74, 144, 226, 0.3); border-radius: 8px; cursor: pointer; font-size: 0.9em; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
          <i class="fa-solid fa-cloud-arrow-up"></i> Upload
        </button>
      </div>
      <input type="file" id="silane-imageInput" accept="image/*" style="display: none;">
      <div id="silane-list-image" style="min-height: 200px; max-height: 350px; overflow-y: auto; background: rgba(0,0,0,0.15); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
      </div>
    </div>

    <div id="tabContent-music" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 1.1em; font-weight: 500; border: none;">Audio Tracks</h3>
        <button id="silane-btnTriggerMusic" style="padding: 8px 16px; background: rgba(74, 144, 226, 0.15); color: #4a90e2; border: 1px solid rgba(74, 144, 226, 0.3); border-radius: 8px; cursor: pointer; font-size: 0.9em; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
          <i class="fa-solid fa-cloud-arrow-up"></i> Upload
        </button>
      </div>
      <input type="file" id="silane-musicInput" accept="audio/*" style="display: none;">
      <div id="silane-list-music" style="min-height: 200px; max-height: 350px; overflow-y: auto; background: rgba(0,0,0,0.15); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
      </div>
    </div>
  `;

  bottom.innerHTML = `
    <button id="heraldSilane-btnClose" style="padding: 10px 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: #fff; cursor: pointer; font-weight: 500; transition: all 0.2s;">Close</button>
  `;

  const btnImage = document.getElementById("tabBtn-image");
  const btnMusic = document.getElementById("tabBtn-music");
  const contentImage = document.getElementById("tabContent-image");
  const contentMusic = document.getElementById("tabContent-music");

  const fetchFileList = async (type) => {
    const listDiv = document.getElementById(`silane-list-${type}`);
    if (!listDiv) return;
    listDiv.innerHTML = `<div style="text-align: center; padding: 30px; color: #888; font-style: italic;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>`;

    try {
      const token = localStorage.getItem("heraldSilane_token");
      const response = await fetch(`${API_BASE_URL}/api/herald_silane/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const filesArray = result.data ? result.data[type] || [] : [];

        if (filesArray.length > 0) {
          const icon = type === "image" ? "fa-image" : "fa-music";
          listDiv.innerHTML = filesArray
            .map(
              (file) => `
            <div style="padding: 12px 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;">
              <div style="display: flex; align-items: center; overflow: hidden; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #4a90e2;">
                  <i class="fa-solid ${icon}"></i>
                </div>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 450px; font-weight: 500; color: #ddd;" title="${file.name}">${file.name}</span>
              </div>
              <button class="silane-btn-copy" title="Copy Path" onclick="navigator.clipboard.writeText('${file.path}'); ui.notifications.info('Path copied!');" style="padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>`,
            )
            .join("");
        } else {
          listDiv.innerHTML = `<div style="text-align: center; padding: 40px; color: #666;"><i class="fa-solid fa-folder-open" style="font-size: 2em; margin-bottom: 10px; display: block;"></i> No ${type} uploaded yet.</div>`;
        }
      } else {
        listDiv.innerHTML = `<div style="text-align: center; padding: 30px; color: #ff6b6b;">Failed to load data.</div>`;
      }
    } catch (error) {
      listDiv.innerHTML = `<div style="text-align: center; padding: 30px; color: #ff6b6b;">Error connecting to server.</div>`;
    }
  };

  const setActiveTab = (tabName) => {
    activeTab = tabName;

    if (tabName === "image") {
      btnImage.style.background = "#4a90e2";
      btnImage.style.color = "white";
      btnMusic.style.background = "transparent";
      btnMusic.style.color = "#888";
      contentImage.style.display = "block";
      contentMusic.style.display = "none";
    } else {
      btnMusic.style.background = "#4a90e2";
      btnMusic.style.color = "white";
      btnImage.style.background = "transparent";
      btnImage.style.color = "#888";
      contentMusic.style.display = "block";
      contentImage.style.display = "none";
    }

    fetchFileList(tabName);
  };

  btnImage.addEventListener("click", () => setActiveTab("image"));
  btnMusic.addEventListener("click", () => setActiveTab("music"));

  document
    .getElementById("heraldSilane-btnClose")
    .addEventListener("click", () => {
      if (heraldSilane_currentDialog) {
        heraldSilane_currentDialog.close();
        heraldSilane_currentDialog = null;
      }
    });

  document
    .getElementById("heraldSilane-btnLogout")
    .addEventListener("click", async () => {
      localStorage.removeItem("heraldSilane_token");
      localStorage.removeItem("heraldSilane_user");
      ui.notifications?.info("Disconnected from Silane.");
      await heraldSilane_renderRouting();
    });

  const handleUploadFile = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    ui.notifications?.info(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const token = localStorage.getItem("heraldSilane_token");
      const response = await fetch(`${API_BASE_URL}/api/herald_silane/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        ui.notifications?.info(`Upload successful!`);
        fetchFileList(type);
      } else {
        ui.notifications?.error(
          `Upload failed: ${data.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      ui.notifications?.error("Failed to connect to the server for upload.");
    } finally {
      event.target.value = "";
    }
  };

  document
    .getElementById("silane-btnTriggerImage")
    .addEventListener("click", () =>
      document.getElementById("silane-imageInput").click(),
    );
  document
    .getElementById("silane-imageInput")
    .addEventListener("change", (e) => handleUploadFile(e, "image"));

  document
    .getElementById("silane-btnTriggerMusic")
    .addEventListener("click", () =>
      document.getElementById("silane-musicInput").click(),
    );
  document
    .getElementById("silane-musicInput")
    .addEventListener("change", (e) => handleUploadFile(e, "music"));

  fetchFileList("image");
}

export { heraldSilane_renderAccessButton };
