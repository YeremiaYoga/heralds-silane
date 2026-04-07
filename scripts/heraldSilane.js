import { API_BASE_URL } from "./helper.js";

let heraldSilane_currentDialog = null;

async function heraldSilane_renderAccessButton() {
  const existingButton = document.getElementById("heraldSilane-accessButtonContainer");
  if (existingButton) existingButton.remove();

  try {
    const html = await fetch("/modules/heralds-silane/templates/accessButton.html").then(res => res.text());
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

    accessButton.addEventListener("click", async () => await heraldSilane_showDialog());

    exporter.appendChild(accessButton);
    document.body.appendChild(exporter);
  } catch (err) {
    console.error("Silane: failed to render access button", err);
  }
}

async function heraldSilane_showDialog() {
  const dialogContent = `
    <div id="heraldSilane-dialogContainer" class="silane-dialog-wrapper">
      <div id="heraldSilane-dialogTopContainer"></div>
      <div id="heraldSilane-dialogMiddleContainer" class="silane-dialog-middle"></div>
      <div id="heraldSilane-dialogBottomContainer" class="silane-dialog-bottom"></div>
    </div>
  `;

  const dialog = new Dialog({ title: "Silane", content: dialogContent, buttons: {} });
  heraldSilane_currentDialog = dialog;
  dialog.render(true);

  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === "Silane") {
      app.setPosition({ width: 550, height: "auto", scale: 1.0 });
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
    <h2 class="silane-title">Authentication Required</h2>
    <p class="silane-subtitle">Please connect to your Silane node to continue.</p>
  `;

  middle.innerHTML = `
    <div class="silane-form-group">
      <label for="heraldSilane-secretId">Secret ID</label>
      <input type="password" id="heraldSilane-secretId" class="silane-input mono" placeholder="Enter Secret ID" />
      <div id="heraldSilane-loginMsg" class="silane-error-msg"></div>
    </div>
  `;

  bottom.innerHTML = `
    <button id="heraldSilane-btnCancel" class="silane-btn">Cancel</button>
    <button id="heraldSilane-btnLogin" class="silane-btn primary">Connect</button>
  `;

  document.getElementById("heraldSilane-btnCancel").addEventListener("click", () => {
    if (heraldSilane_currentDialog) {
      heraldSilane_currentDialog.close();
      heraldSilane_currentDialog = null;
    }
  });

  document.getElementById("heraldSilane-btnLogin").addEventListener("click", async (e) => {
    const btn = e.target;
    const secretId = document.getElementById("heraldSilane-secretId").value.trim();
    const msgDiv = document.getElementById("heraldSilane-loginMsg");

    if (!secretId) {
      msgDiv.textContent = "Secret ID cannot be empty.";
      msgDiv.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Connecting...";
    msgDiv.style.display = "none";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretId: secretId }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("heraldSilane_token", data.token || "authenticated");
        if (data.user) localStorage.setItem("heraldSilane_user", JSON.stringify(data.user));
        ui.notifications?.info("Connected to Silane.");
        await heraldSilane_renderRouting();
      } else {
        msgDiv.textContent = data.message || "Authentication failed.";
        msgDiv.style.display = "block";
      }
    } catch (error) {
      console.error("Silane Auth Error:", error);
      msgDiv.textContent = "Server connection failed.";
      msgDiv.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Connect";
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
      console.error("Failed to parse user data", e);
    }
  }

  top.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h2 class="silane-title" style="margin: 0; font-size: 1.4em;">Silane Dashboard</h2>
      <a id="heraldSilane-btnLogout" class="silane-link-danger">Disconnect</a>
    </div>

    <div class="silane-profile-group" style="margin-bottom: 15px;">
      <img src="${userImage}" alt="Profile" class="silane-profile-img">
      <div>
        <div class="silane-username" style="color: var(--color-text-dark-primary); font-size: 15px;">${userName}</div>
        <div class="silane-status-text">
          <span class="silane-status-badge"><i class="fa-solid fa-signal"></i> Connected</span>
        </div>
      </div>
    </div>

    <div class="silane-tabs-nav">
      <button id="tabBtn-image" class="silane-tab-btn active" style="cursor: default;">Image</button>
      
      <button id="tabBtn-music" class="silane-tab-btn" style="display: none;">Audio</button>
    </div>
  `;

  middle.innerHTML = `
    <div id="tabContent-image" class="silane-tab-content active">
      <h3 class="silane-title">Upload Image</h3>
      <p class="silane-subtitle" style="margin-bottom: 20px;">Supported formats: JPG, PNG, WEBP</p>
      <input type="file" id="silane-imageInput" accept="image/*" class="silane-input">
    </div>

    <div id="tabContent-music" class="silane-tab-content" style="display: none;">
      <h3 class="silane-title">Upload Audio</h3>
      <p class="silane-subtitle" style="margin-bottom: 20px;">Supported formats: MP3, WAV, OGG</p>
      <input type="file" id="silane-musicInput" accept="audio/*" class="silane-input">
    </div>
  `;

  bottom.innerHTML = `
    <button id="heraldSilane-btnClose" class="silane-btn">Close</button>
    <button id="heraldSilane-btnUpload" class="silane-btn primary">Upload</button>
  `;

  const btnImage = document.getElementById("tabBtn-image");
  const btnMusic = document.getElementById("tabBtn-music");
  const contentImage = document.getElementById("tabContent-image");
  const contentMusic = document.getElementById("tabContent-music");

  const setActiveTab = (tabName) => {
    activeTab = tabName;
    
    btnImage.classList.toggle("active", tabName === "image");
    btnMusic.classList.toggle("active", tabName === "music");
    
    contentImage.classList.toggle("active", tabName === "image");
    contentMusic.classList.toggle("active", tabName === "music");
  };

  btnImage.addEventListener("click", () => setActiveTab("image"));
  btnMusic.addEventListener("click", () => setActiveTab("music"));

  document.getElementById("heraldSilane-btnClose").addEventListener("click", () => {
    if (heraldSilane_currentDialog) {
      heraldSilane_currentDialog.close();
      heraldSilane_currentDialog = null;
    }
  });

  document.getElementById("heraldSilane-btnLogout").addEventListener("click", async () => {
    localStorage.removeItem("heraldSilane_token");
    localStorage.removeItem("heraldSilane_user");
    ui.notifications?.info("Disconnected from Silane.");
    await heraldSilane_renderRouting();
  });

  document.getElementById("heraldSilane-btnUpload").addEventListener("click", async (e) => {
    const btnUpload = e.target;
    const fileInput = activeTab === "image" 
      ? document.getElementById("silane-imageInput") 
      : document.getElementById("silane-musicInput");

    if (!fileInput.files || fileInput.files.length === 0) {
      ui.notifications?.warn("Please select a file to upload.");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const originalText = btnUpload.textContent;
    btnUpload.disabled = true;
    btnUpload.textContent = "Uploading...";

    try {
      const token = localStorage.getItem("heraldSilane_token");
      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        ui.notifications?.info(`Upload successful! File saved as: ${data.fileName}`);
        fileInput.value = ""; 
      } else {
        ui.notifications?.error(`Upload failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Silane Upload Error:", error);
      ui.notifications?.error("Failed to connect to the server for upload.");
    } finally {
      btnUpload.disabled = false;
      btnUpload.textContent = originalText;
    }
  });
}

export { heraldSilane_renderAccessButton };