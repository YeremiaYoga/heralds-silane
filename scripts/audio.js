import { API_BASE_URL } from "./helper.js";

let state = {
  albums: [],
  playlists: [],
  currentAlbumId: null,
  currentPlaylistId: null,
  currentUser: { id: null, name: "Unknown" },
  activeAudioElement: null,
};

let containerElement = null;

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatTime = (time) => {
  if (time && !isNaN(time)) {
    const minutes = Math.floor(time / 60);
    const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const seconds = Math.floor(time % 60);
    const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${formatMinutes}:${formatSeconds}`;
  }
  return "00:00";
};

const applyDarkThemeToDialog = (html) => {
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
};

const getToken = () => localStorage.getItem("heraldSilane_token");

async function fetchAudioData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/silane_assets/data`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const result = await response.json();

    if (!response.ok) {
      console.error("Backend Error:", result);
      ui.notifications?.error(result.message || "Server Error fetching Data.");
      return;
    }

    const data = result.data || {};

    state.albums = data.audio?.albums || [];
    state.playlists = data.audio?.playlists || [];
    render();
  } catch (error) {
    console.error("Failed to fetch audio data:", error);
    ui.notifications?.error("Network Error: Failed to fetch audio data.");
  }
}

async function saveAlbumsToBackend(newAlbums) {
  try {
    const myOwnedAlbums = newAlbums.filter(
      (a) => String(a.user_id) === String(state.currentUser.id),
    );

    await fetch(`${API_BASE_URL}/api/silane_assets/audio/album/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ albums: myOwnedAlbums }),
    });
    await fetchAudioData();
  } catch (error) {
    ui.notifications?.error("Failed to save albums.");
  }
}

async function savePlaylistsToBackend(newPlaylists) {
  try {
    const activeAlbumIds = state.albums
      .filter((a) => String(a.user_id) === String(state.currentUser.id))
      .map((a) => a.id);

    const playlistsToUpsert = newPlaylists.filter(
      (p) =>
        activeAlbumIds.includes(p.album_id) ||
        p.uuid === state.currentPlaylistId,
    );

    await fetch(`${API_BASE_URL}/api/silane_assets/audio/playlist/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        playlists: playlistsToUpsert,
        activeAlbumIds: activeAlbumIds,
      }),
    });
    await fetchAudioData();
  } catch (error) {
    ui.notifications?.error("Failed to save playlists.");
  }
}

export async function initAudioTab(container) {
  containerElement = container;

  const userStr = localStorage.getItem("heraldSilane_user");
  if (userStr) {
    const d = JSON.parse(userStr);
    state.currentUser = {
      id: d.id || d._id || d.uuid,
      name: d.username || d.name || "Unknown",
    };
  }

  container.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  await fetchAudioData();
}

async function importPlaylistToFoundry(playlistData, folderId = null) {
  if (!playlistData) return;
  ui.notifications.info(`Importing Playlist: ${playlistData.name}...`);

  try {
    let foundryPlaylist = game.playlists.getName(playlistData.name);

    if (foundryPlaylist) {
      if (folderId && foundryPlaylist.folder?.id !== folderId) {
        await foundryPlaylist.update({ folder: folderId });
      }
      const existingSoundIds = foundryPlaylist.sounds.map((s) => s.id);
      if (existingSoundIds.length > 0) {
        await foundryPlaylist.deleteEmbeddedDocuments(
          "PlaylistSound",
          existingSoundIds,
        );
      }
      ui.notifications.info(
        `Updating existing playlist: ${playlistData.name}...`,
      );
    } else {
      const createData = {
        name: playlistData.name,
        description: "Imported from Silane Assets",
        playing: false,
      };
      if (folderId) createData.folder = folderId;
      foundryPlaylist = await Playlist.create(createData);
    }

    // AMBIL SETTING DARI ALBUM (TAMBAHAN BARU)
    const album = state.albums.find((a) => a.id === playlistData.album_id);
    const trackVolume = album?.setting?.volume ?? 0.1;
    const trackRepeat = album?.setting?.repeat ?? true;

    // MASUKKAN VOLUME & REPEAT KE FOUNDRY (TAMBAHAN BARU)
    const tracksToImport = (playlistData.track || []).map((t) => ({
      name: t.name,
      path: t.url,
      volume: trackVolume,
      repeat: trackRepeat
    }));

    if (tracksToImport.length > 0) {
      await foundryPlaylist.createEmbeddedDocuments(
        "PlaylistSound",
        tracksToImport,
      );
    }

    ui.notifications.info(
      `Playlist "${playlistData.name}" successfully imported/updated!`,
    );
  } catch (error) {
    console.error("Import Playlist Error:", error);
    ui.notifications.error("Failed to import playlist to Foundry.");
  }
}

// Tambahkan parameter albumSetting
async function importTrackToFoundry(trackData, playlistName, albumSetting = {}) {
  if (!trackData) return;
  ui.notifications.info(`Importing Track: ${trackData.name}...`);

  const trackVolume = albumSetting.volume ?? 0.1;
  const trackRepeat = albumSetting.repeat ?? true;

  try {
    let foundryPlaylist = game.playlists.getName(playlistName);

    if (!foundryPlaylist) {
      foundryPlaylist = await Playlist.create({
        name: playlistName,
        description: "Auto-generated from Silane Track Import",
      });
    }

    const existingSound = foundryPlaylist.sounds.find(
      (s) => s.name === trackData.name,
    );

    if (existingSound) {
      await foundryPlaylist.updateEmbeddedDocuments("PlaylistSound", [
        {
          _id: existingSound.id,
          path: trackData.url,
          volume: trackVolume, // Update volume
          repeat: trackRepeat  // Update repeat
        },
      ]);
      ui.notifications.info(`Track "${trackData.name}" successfully updated!`);
    } else {
      await foundryPlaylist.createEmbeddedDocuments("PlaylistSound", [
        {
          name: trackData.name,
          path: trackData.url,
          volume: trackVolume, // Set volume
          repeat: trackRepeat  // Set repeat
        },
      ]);
      ui.notifications.info(`Track "${trackData.name}" successfully imported!`);
    }
  } catch (error) {
    console.error("Import Track Error:", error);
    ui.notifications.error("Failed to import track to Foundry.");
  }
}

async function importAlbumToFoundry(albumData) {
  if (!albumData) return;

  const albumPlaylists = state.playlists.filter(
    (p) => p.album_id === albumData.id,
  );

  if (albumPlaylists.length === 0) {
    ui.notifications.warn(
      `Album "${albumData.name}" does not have any playlists to import.`,
    );
    return;
  }

  ui.notifications.info(
    `Starting batch import for Album: ${albumData.name} (${albumPlaylists.length} Playlists)...`,
  );

  try {
    let albumFolder = game.folders.find(
      (f) => f.name === albumData.name && f.type === "Playlist",
    );
    if (!albumFolder) {
      albumFolder = await Folder.create({
        name: albumData.name,
        type: "Playlist",
      });
    }

    for (const playlist of albumPlaylists) {
      await importPlaylistToFoundry(playlist, albumFolder.id);
    }

    ui.notifications.info(
      `🎉 Album "${albumData.name}" successfully imported!`,
    );
  } catch (error) {
    console.error("Import Album Error:", error);
    ui.notifications.error("Failed to import full album to Foundry.");
  }
}

function render() {
  if (!containerElement) return;

  if (!state.currentAlbumId) {
    renderStudioView();
  } else if (!state.currentPlaylistId) {
    renderAlbumView();
  } else {
    renderPlaylistView();
  }
}

function renderStudioView() {
  const isOwner = (album) =>
    String(album.user_id) === String(state.currentUser.id);

  let html = `
    <div style="padding: 10px; display:flex; flex-direction:column; height: 100%; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h2 style="font-size: 24px; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; margin: 0;">
            <i class="fa-solid fa-house" style="color: #6366f1;"></i> Studio
          </h2>
          <p style="font-size: 14px; color: #a1a1aa; margin: 4px 0 0 0;">Manage your audio albums</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button id="hs-btn-join-album" style="height: 40px; padding: 0 16px; display: flex; align-items: center; gap: 8px; background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">
            <i class="fa-solid fa-users"></i> Join Album
          </button>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding-bottom: 40px;">
  `;

  if (state.albums.length === 0) {
    html += `
      <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; border: 2px dashed #3f3f46; border-radius: 12px; color: #71717a;">
        <i class="fa-solid fa-compact-disc fa-3x" style="margin-bottom: 16px; opacity: 0.5;"></i>
        <div style="font-size: 16px; font-weight: 500; color: #d4d4d8;">Studio is empty</div>
        <div style="font-size: 14px; margin-top: 4px;">Join an Album to start.</div>
      </div>
    `;
  } else {
    state.albums.forEach((album) => {
      const playlistCount = state.playlists.filter(
        (p) => p.album_id === album.id,
      ).length;

      html += `
        <div class="hs-album-card" style="background: rgba(24, 24, 27, 0.5); border: 1px solid #3f3f46; border-radius: 12px; padding: 16px; cursor: pointer; display: flex; align-items: center; transition: all 0.2s;" data-id="${album.id}">
          <div style="width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 12px; margin-right: 16px; background: linear-gradient(to bottom right, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2)); border: 1px solid rgba(99, 102, 241, 0.3);">
            <i class="fa-solid fa-compact-disc" style="font-size: 28px; color: #818cf8;"></i>
          </div>
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: bold; font-size: 16px; color: #f4f4f5; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${album.name}</div>
            <div style="font-size: 12px; color: #a1a1aa; font-family: monospace; display: flex; align-items: center; gap: 8px;">
              <span>${playlistCount} Playlists</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-left: 8px;">
            <button class="hs-import-album" data-id="${album.id}" title="Import Full Album" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; cursor: pointer;">
              <i class="fa-solid fa-download"></i>
            </button>
            ${isOwner(album) ? `<button class="hs-delete-album" data-id="${album.id}" title="Delete Album" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>` : ""}
          </div>
        </div>
      `;
    });
  }

  html += `</div></div>`;
  containerElement.innerHTML = html;

  const btnJoinAlbum = containerElement.querySelector("#hs-btn-join-album");
  if (btnJoinAlbum) btnJoinAlbum.onclick = showJoinModal;

  containerElement.querySelectorAll(".hs-album-card").forEach((card) => {
    card.onclick = (e) => {
      if (
        e.target.closest(".hs-delete-album") ||
        e.target.closest(".hs-import-album")
      )
        return;
      state.currentAlbumId = card.dataset.id;
      render();
    };
  });

  containerElement.querySelectorAll(".hs-import-album").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const albumToImport = state.albums.find((a) => a.id === id);
      await importAlbumToFoundry(albumToImport);
    };
  });

  containerElement.querySelectorAll(".hs-delete-album").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!window.confirm("Delete this entire album?")) return;
      const id = btn.dataset.id;
      const newAlbums = state.albums.filter((a) => a.id !== id);
      const newPlaylists = state.playlists.filter((p) => p.album_id !== id);
      state.albums = newAlbums;
      state.playlists = newPlaylists;
      render();
      await saveAlbumsToBackend(newAlbums);
      await savePlaylistsToBackend(newPlaylists);
    };
  });
}

function renderAlbumView() {
  const album = state.albums.find((a) => a.id === state.currentAlbumId);
  if (!album) {
    state.currentAlbumId = null;
    render();
    return;
  }

  const isOwner = String(album.user_id) === String(state.currentUser.id);
  const albumPlaylists = state.playlists.filter((p) => p.album_id === album.id);

  let html = `
    <div style="padding: 10px; display:flex; flex-direction:column; height: 100%; overflow-y: auto;">
      <div style="background: linear-gradient(to right, rgba(49, 46, 129, 0.4), #18181b); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; right: 0; padding: 32px; opacity: 0.1; pointer-events: none;">
          <i class="fa-solid fa-compact-disc" style="font-size: 120px;"></i>
        </div>
        <div style="z-index: 10; position: relative;">
          <button id="hs-btn-back-studio" style="display: flex; align-items: center; gap: 8px; background: none; border: none; color: #818cf8; font-size: 14px; font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 16px; width: fit-content;">
            <i class="fa-solid fa-arrow-left"></i> Back to Studio
          </button>
          <h2 style="font-size: 30px; font-weight: 900; color: white; margin: 0 0 12px 0; display: flex; align-items: center; gap: 12px;">
            ${album.name}
            ${!isOwner ? '<span style="font-size: 10px; background: #27272a; color: #a1a1aa; padding: 2px 8px; border-radius: 9999px; border: 1px solid #3f3f46; font-weight: 600; letter-spacing: 0.05em; align-middle;">JOINED</span>' : ""}
          </h2>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; font-family: monospace; color: #a1a1aa; flex-wrap: wrap;">
            ${isOwner ? `<span id="hs-btn-copy-invite" style="background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid #3f3f46; cursor: pointer; display: flex; align-items: center; gap: 6px;" title="Copy Invite Code">Invite: ${album.invite_code} <i class="fa-solid fa-copy"></i></span>` : ""}
            <span style="color: #d4d4d8; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid #3f3f46;">${albumPlaylists.length} Playlists</span>
          </div>
        </div>
        <div style="position: absolute; top: 24px; right: 24px; z-index: 10; display: flex; gap: 8px;">
          <button id="hs-btn-import-full-album" style="display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #10b981; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s;" onmouseover="this.style.background='rgba(16, 185, 129, 0.25)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.15)'">
            <i class="fa-solid fa-download"></i> Import Album
          </button>
          ${isOwner ? `<button id="hs-btn-album-settings" style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(63, 63, 70, 0.5); color: #d4d4d8; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;"><i class="fa-solid fa-gear"></i> Album Settings</button>` : ""}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 4px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #e4e4e7; margin: 0;">Playlists</h3>
        ${isOwner ? `<button id="hs-btn-new-playlist" style="height: 36px; padding: 0 16px; display: flex; align-items: center; gap: 8px; background: rgba(192, 38, 211, 0.2); border: 1px solid rgba(192, 38, 211, 0.3); color: #e879f9; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;"><i class="fa-solid fa-list-music"></i> New Playlist</button>` : ""}
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; padding-bottom: 40px;">
  `;

  if (albumPlaylists.length === 0) {
    html += `
      <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 0; border: 2px dashed #3f3f46; border-radius: 12px; color: #71717a;">
        <i class="fa-solid fa-list-music fa-2x" style="margin-bottom: 12px; opacity: 0.5;"></i>
        <div style="font-size: 14px; font-weight: 500; color: #a1a1aa;">No playlists yet</div>
      </div>
    `;
  } else {
    albumPlaylists.forEach((pl) => {
      html += `
        <div class="hs-playlist-card" style="background: rgba(24, 24, 27, 0.4); border: 1px solid rgba(63, 63, 70, 0.8); border-radius: 12px; padding: 12px; cursor: pointer; display: flex; align-items: center; transition: all 0.2s;" data-id="${pl.uuid}">
          <div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-right: 16px; background: rgba(192, 38, 211, 0.1); border: 1px solid rgba(192, 38, 211, 0.2);">
            <i class="fa-regular fa-circle-play" style="font-size: 22px; color: #e879f9;"></i>
          </div>
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: bold; font-size: 15px; color: #e4e4e7; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pl.name}</div>
            <div style="font-size: 12px; color: #71717a;">${pl.track?.length || 0} Tracks</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="hs-import-playlist" data-id="${pl.uuid}" title="Import to Foundry" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; cursor: pointer;">
              <i class="fa-solid fa-download"></i>
            </button>
            ${isOwner ? `<button class="hs-delete-playlist" data-id="${pl.uuid}" title="Delete" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>` : ""}
          </div>
        </div>
      `;
    });
  }

  html += `</div></div>`;
  containerElement.innerHTML = html;

  containerElement.querySelector("#hs-btn-back-studio").onclick = () => {
    state.currentAlbumId = null;
    render();
  };

  const btnImportFullAlbum = containerElement.querySelector(
    "#hs-btn-import-full-album",
  );
  if (btnImportFullAlbum) {
    btnImportFullAlbum.onclick = async () => {
      await importAlbumToFoundry(album);
    };
  }

  if (isOwner) {
    const settingsBtn = containerElement.querySelector(
      "#hs-btn-album-settings",
    );
    if (settingsBtn) settingsBtn.onclick = () => showSettingsModal(album);

    const copyBtn = containerElement.querySelector("#hs-btn-copy-invite");
    if (copyBtn)
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(album.invite_code);
        ui.notifications?.info("Invite code copied!");
      };

    const newPlBtn = containerElement.querySelector("#hs-btn-new-playlist");
    if (newPlBtn) newPlBtn.onclick = showNewPlaylistModal;
  }

  containerElement.querySelectorAll(".hs-playlist-card").forEach((card) => {
    card.onclick = (e) => {
      if (
        e.target.closest(".hs-delete-playlist") ||
        e.target.closest(".hs-import-playlist")
      )
        return;
      state.currentPlaylistId = card.dataset.id;
      render();
    };
  });

  containerElement.querySelectorAll(".hs-import-playlist").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const playlistToImport = state.playlists.find((p) => p.uuid === id);
      await importPlaylistToFoundry(playlistToImport);
    };
  });

  containerElement.querySelectorAll(".hs-delete-playlist").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!window.confirm("Delete this playlist?")) return;
      const id = btn.dataset.id;
      const newPlaylists = state.playlists.filter((p) => p.uuid !== id);
      state.playlists = newPlaylists;
      render();
      await savePlaylistsToBackend(newPlaylists);
    };
  });
}

function renderPlaylistView() {
  const album = state.albums.find((a) => a.id === state.currentAlbumId);
  const playlist = state.playlists.find(
    (p) => p.uuid === state.currentPlaylistId,
  );
  if (!album || !playlist) {
    state.currentPlaylistId = null;
    render();
    return;
  }

  const isAlbumOwner = String(album.user_id) === String(state.currentUser.id);

  let html = `
    <div style="padding: 10px; display:flex; flex-direction:column; height: 100%; overflow-y: auto;">
      <div style="background: linear-gradient(to right, rgba(134, 25, 143, 0.3), #18181b); border: 1px solid rgba(192, 38, 211, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; right: 0; padding: 32px; opacity: 0.1; pointer-events: none;">
          <i class="fa-solid fa-list-music" style="font-size: 120px;"></i>
        </div>
        <div style="z-index: 10; position: relative;">
          <button id="hs-btn-back-album" style="display: flex; align-items: center; gap: 8px; background: none; border: none; color: #e879f9; font-size: 14px; font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 16px; width: fit-content;">
            <i class="fa-solid fa-arrow-left"></i> Back to ${album.name}
          </button>
          <h2 style="font-size: 30px; font-weight: 900; color: white; margin: 0 0 8px 0;">${playlist.name}</h2>
          <div style="font-size: 12px; font-weight: 500; color: #a1a1aa;">${playlist.track?.length || 0} Tracks Available</div>
        </div>
        <div style="position: absolute; top: 24px; right: 24px; z-index: 10;">
          <button id="hs-btn-import-full-playlist" style="display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #10b981; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s;" onmouseover="this.style.background='rgba(16, 185, 129, 0.25)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.15)'">
            <i class="fa-solid fa-download"></i> Import Playlist
          </button>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 4px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #e4e4e7; margin: 0;">Audio Tracks</h3>
        <button id="hs-btn-upload-track" style="height: 36px; padding: 0 16px; display: flex; align-items: center; gap: 8px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.2);">
          <i class="fa-solid fa-upload"></i> Upload Track
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 40px;">
  `;

  if (!playlist.track || playlist.track.length === 0) {
    html += `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 0; border: 2px dashed #3f3f46; border-radius: 12px; color: #71717a;">
        <i class="fa-solid fa-music fa-2x" style="margin-bottom: 12px; opacity: 0.5;"></i>
        <div style="font-size: 14px; font-weight: 500; color: #a1a1aa;">Playlist is empty</div>
      </div>
    `;
  } else {
    playlist.track.forEach((track) => {
      const isTrackUploader =
        String(track.user_id) === String(state.currentUser.id);
      const canDelete = isAlbumOwner || isTrackUploader;

      html += `
        <div class="hs-track-row" style="background: rgba(24, 24, 27, 0.5); border: 1px solid rgba(63, 63, 70, 0.8); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 16px; transition: all 0.2s;">
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); flex-shrink: 0;">
            <i class="fa-solid fa-music" style="font-size: 18px; color: #60a5fa;"></i>
          </div>
          <div style="flex: 1; min-width:0; padding-right: 16px;">
            <div style="font-weight: bold; font-size: 14px; color: #f4f4f5; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.name}</div>
            <div style="font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">By ${track.user_name}</div>
          </div>
          <div class="hs-custom-player" style="display:flex; align-items:center; gap:12px; background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 8px; border: 1px solid #27272a; flex: 2; max-width: 400px;">
            <audio id="audio-${track.id}" src="${track.url}" preload="metadata" data-track-id="${track.id}"></audio>
            <button class="hs-play-btn" data-track-id="${track.id}" style="width: 32px; height: 32px; border-radius: 50%; background: #27272a; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
              <i class="fa-solid fa-play" style="margin-left: 2px;"></i>
            </button>
            <span class="hs-time-current" style="font-size:11px; color:#a1a1aa; font-family:monospace; min-width:35px; text-align:right;">00:00</span>
            <input type="range" class="hs-progress-bar" min="0" max="100" value="0" style="flex:1; height:6px; cursor:pointer; accent-color:#3b82f6; background: #3f3f46; border-radius: 9999px; appearance: none; outline: none;" />
            <span class="hs-time-duration" style="font-size:11px; color:#71717a; font-family:monospace; min-width:35px;">00:00</span>
            <div style="display:flex; align-items:center; gap: 6px; margin-left: 8px; padding-left: 8px; border-left: 1px solid #3f3f46;">
                <i class="fa-solid fa-volume-low" style="color:#a1a1aa; font-size:11px;"></i>
                <input type="range" class="hs-volume-bar" min="0" max="1" step="0.01" value="${album.setting?.volume ?? 0.1}" style="width: 50px; height:6px; cursor:pointer; accent-color:#10b981; background: #3f3f46; border-radius: 9999px; appearance: none; outline: none;" title="Volume" />
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="hs-import-track" data-track-id="${track.id}" title="Import to Foundry" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; cursor: pointer; flex-shrink: 0;">
              <i class="fa-solid fa-download"></i>
            </button>
            ${canDelete ? `<button class="hs-delete-track" data-track-id="${track.id}" title="Remove Track" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; cursor: pointer; flex-shrink: 0;"><i class="fa-solid fa-trash"></i></button>` : ""}
          </div>
        </div>
      `;
    });
  }

  html += `</div></div>`;
  containerElement.innerHTML = html;

  containerElement.querySelector("#hs-btn-back-album").onclick = () => {
    state.currentPlaylistId = null;
    render();
  };
  containerElement.querySelector("#hs-btn-upload-track").onclick =
    showUploadModal;

  const btnImportFull = containerElement.querySelector(
    "#hs-btn-import-full-playlist",
  );
  if (btnImportFull) {
    btnImportFull.onclick = async () => {
      await importPlaylistToFoundry(playlist);
    };
  }

 containerElement.querySelectorAll(".hs-import-track").forEach((btn) => {
    btn.onclick = async () => {
      const trackId = btn.dataset.trackId;
      const trackToImport = playlist.track.find((t) => t.id === trackId);
      await importTrackToFoundry(trackToImport, playlist.name, album.setting);
    };
  });

  containerElement.querySelectorAll(".hs-delete-track").forEach((btn) => {
    btn.onclick = async () => {
      if (!window.confirm("Remove track from playlist?")) return;
      const trackId = btn.dataset.trackId;
      const updatedPlaylists = state.playlists.map((pl) => {
        if (pl.uuid === state.currentPlaylistId) {
          return { ...pl, track: pl.track.filter((t) => t.id !== trackId) };
        }
        return pl;
      });
      state.playlists = updatedPlaylists;
      render();
      await savePlaylistsToBackend(updatedPlaylists);
    };
  });

  initVanillaAudioPlayers(
    album.setting?.volume ?? 0.1,
    album.setting?.repeat ?? true,
  );
}

function initVanillaAudioPlayers(albumVolume, albumRepeat) {
  const players = containerElement.querySelectorAll(".hs-custom-player");

  players.forEach((player) => {
    const audio = player.querySelector("audio");
    const playBtn = player.querySelector(".hs-play-btn");
    const progressBar = player.querySelector(".hs-progress-bar");
    const timeCurrent = player.querySelector(".hs-time-current");
    const timeDuration = player.querySelector(".hs-time-duration");
    const volumeBar = player.querySelector(".hs-volume-bar");

    audio.volume = volumeBar ? parseFloat(volumeBar.value) : albumVolume;
    audio.loop = albumRepeat;

    audio.addEventListener("loadedmetadata", () => {
      timeDuration.textContent = formatTime(audio.duration);
      progressBar.max = audio.duration;
    });

    audio.addEventListener("timeupdate", () => {
      timeCurrent.textContent = formatTime(audio.currentTime);
      progressBar.value = audio.currentTime;
    });

    audio.addEventListener("ended", () => {
      if (!audio.loop) {
        playBtn.innerHTML =
          '<i class="fa-solid fa-play" style="margin-left: 2px;"></i>';
      }
    });

    playBtn.onclick = () => {
      if (audio.paused) {
        if (state.activeAudioElement && state.activeAudioElement !== audio) {
          state.activeAudioElement.pause();
          const prevBtn =
            state.activeAudioElement.parentElement.querySelector(
              ".hs-play-btn",
            );
          if (prevBtn)
            prevBtn.innerHTML =
              '<i class="fa-solid fa-play" style="margin-left: 2px;"></i>';
        }
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        state.activeAudioElement = audio;
      } else {
        audio.pause();
        playBtn.innerHTML =
          '<i class="fa-solid fa-play" style="margin-left: 2px;"></i>';
      }
    };

    progressBar.oninput = (e) => {
      audio.currentTime = e.target.value;
    };

    if (volumeBar) {
      volumeBar.oninput = (e) => {
        audio.volume = parseFloat(e.target.value);
      };
    }
  });
}

function showJoinModal() {
  const content = `
    <div style="padding: 10px; color: white;">
      <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Invite Code</label>
      <input type="text" id="hs-join-album-code" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" autofocus placeholder="Enter 12-character code..." />
    </div>
  `;
  new Dialog(
    {
      title: "Join Album",
      content: content,
      buttons: {
        join: {
          label: "Join Album",
          callback: async (html) => {
            const code = html.find("#hs-join-album-code").val().trim();
            if (!code) return ui.notifications?.warn("Code cannot be empty.");

            try {
              const res = await fetch(
                `${API_BASE_URL}/api/silane_assets/audio/join`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                  },
                  body: JSON.stringify({ invite_code: code }),
                },
              );
              const data = await res.json();
              if (res.ok) {
                ui.notifications?.info("Successfully joined album!");
                await fetchAudioData();
              } else {
                ui.notifications?.error(
                  data.message || "Failed to join album.",
                );
              }
            } catch (e) {
              ui.notifications?.error("Server error.");
            }
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "join",
      render: applyDarkThemeToDialog,
    },
    { width: 350, classes: ["dialog", "silane-custom-dialog"] },
  ).render(true);
}

function showSettingsModal(album) {
  const content = `
    <div style="padding: 10px; color: white;">
      <h4 style="margin-bottom: 5px; color:#a1a1aa; text-transform:uppercase; font-size:12px; font-weight: bold; letter-spacing: 0.05em;">Audio Playback</h4>
      <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border: 1px solid #3f3f46; margin-bottom: 20px;">
        <label style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; color:#e4e4e7; font-weight: 500;">Default Volume <span id="hs-vol-val">${Math.round((album.setting?.volume ?? 0.1) * 100)}%</span></label>
        <input type="range" id="hs-set-volume" min="0" max="1" step="0.01" value="${album.setting?.volume ?? 0.1}" style="width:100%; margin-bottom: 12px; accent-color: #6366f1; cursor: pointer;" />
        
        <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; color:#e4e4e7; font-weight: 500;">
          <input type="checkbox" id="hs-set-repeat" ${album.setting?.repeat !== false ? "checked" : ""} style="accent-color: #6366f1; width: 16px; height: 16px;" />
          Auto Repeat
        </label>
      </div>
    </div>
  `;

  const d = new Dialog(
    {
      title: "Album Settings",
      content: content,
      buttons: {
        save: {
          label: "Save Settings",
          callback: async (html) => {
            const vol = parseFloat(html.find("#hs-set-volume").val());
            const rep = html.find("#hs-set-repeat").is(":checked");

            const updatedAlbums = state.albums.map((a) => {
              if (a.id === album.id)
                return { ...a, setting: { volume: vol, repeat: rep } };
              return a;
            });
            state.albums = updatedAlbums;
            render();
            await saveAlbumsToBackend(updatedAlbums);
          },
        },
        cancel: { label: "Cancel" },
      },
      render: (html) => {
        applyDarkThemeToDialog(html);

        const volSlider = html.find("#hs-set-volume")[0];
        const volVal = html.find("#hs-vol-val")[0];
        volSlider.oninput = (e) =>
          (volVal.innerText = `${Math.round(e.target.value * 100)}%`);
      },
    },
    { width: 400, classes: ["dialog", "silane-custom-dialog"] },
  );
  d.render(true);
}

function showNewPlaylistModal() {
  const content = `
    <div style="padding: 10px; color: white;">
      <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Playlist Name</label>
      <input type="text" id="hs-new-playlist-name" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" autofocus placeholder="e.g. Boss Fights" />
    </div>
  `;
  new Dialog(
    {
      title: "Create New Playlist",
      content: content,
      buttons: {
        create: {
          label: "Create",
          callback: async (html) => {
            const name = html.find("#hs-new-playlist-name").val().trim();
            if (!name) return ui.notifications?.warn("Name cannot be empty.");

            const newPlaylist = {
              uuid: generateUUID(),
              user_id: state.currentUser.id,
              user_name: state.currentUser.name,
              album_id: state.currentAlbumId,
              name: name,
              track: [],
            };

            const newPlaylists = [...state.playlists, newPlaylist];
            state.playlists = newPlaylists;
            render();
            await savePlaylistsToBackend(newPlaylists);
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "create",
      render: applyDarkThemeToDialog,
    },
    { width: 350, classes: ["dialog", "silane-custom-dialog"] },
  ).render(true);
}

function showUploadModal() {
  let selectedFile = null;
  const content = `
    <div style="padding: 10px; color: white;">
      <div style="margin-bottom: 15px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Track Name</label>
        <input type="text" id="hs-upload-track-name" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" />
      </div>
      <div id="hs-audio-upload-box" style="border: 2px dashed #52525b; padding: 24px; text-align: center; border-radius: 8px; cursor: pointer; background: rgba(0,0,0,0.2); transition: all 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.4)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
        <i class="fa-solid fa-file-audio fa-3x" style="color:#a1a1aa; margin-bottom:12px;"></i>
        <div id="hs-audio-upload-text" style="color:#a1a1aa; font-size: 14px;">Click to select audio file<br><span style="font-size: 12px;">(.mp3, .wav, .ogg - Max 10MB)</span></div>
        <input type="file" id="hs-audio-fileInput" accept="audio/*" style="display:none;" />
      </div>
    </div>
  `;

  new Dialog(
    {
      title: "Upload Audio Track",
      content: content,
      buttons: {
        upload: {
          label: "Upload Track",
          callback: async (html) => {
            if (!selectedFile)
              return ui.notifications?.warn("Please select an audio file.");
            const nameInput =
              html.find("#hs-upload-track-name").val().trim() ||
              selectedFile.name.split(".")[0];

            ui.notifications?.info("Uploading audio...");

            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
              const response = await fetch(
                `${API_BASE_URL}/api/silane_assets/audio/upload`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${getToken()}` },
                  body: formData,
                },
              );
              const data = await response.json();

              if (response.ok) {
                const newTrack = {
                  id: generateUUID(),
                  name: nameInput,
                  url: data.url,
                  user_id: state.currentUser.id,
                  user_name: state.currentUser.name,
                };

                const newPlaylists = state.playlists.map((pl) => {
                  if (pl.uuid === state.currentPlaylistId) {
                    return { ...pl, track: [...(pl.track || []), newTrack] };
                  }
                  return pl;
                });

                state.playlists = newPlaylists;
                render();
                await savePlaylistsToBackend(newPlaylists);
                ui.notifications?.info("Track uploaded successfully!");
              } else {
                ui.notifications?.error(data.message || "Failed to upload.");
              }
            } catch (e) {
              ui.notifications?.error("Server error during upload.");
            }
          },
        },
        cancel: { label: "Cancel" },
      },
      render: (html) => {
        applyDarkThemeToDialog(html);

        const box = html.find("#hs-audio-upload-box")[0];
        const input = html.find("#hs-audio-fileInput")[0];
        const text = html.find("#hs-audio-upload-text")[0];
        const nameInp = html.find("#hs-upload-track-name")[0];

        box.onclick = () => input.click();
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith("audio/")) {
            ui.notifications?.warn("Must be an audio file.");
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            ui.notifications?.warn("File size exceeds the 10MB limit.");
            return;
          }
          selectedFile = file;
          text.innerHTML = `<span style="color:#4ade80; font-weight: bold; font-size: 14px;">${file.name}</span>`;
          if (!nameInp.value) nameInp.value = file.name.split(".")[0];
        };
      },
    },
    { width: 400, classes: ["dialog", "silane-custom-dialog"] },
  ).render(true);
}
