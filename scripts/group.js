import { API_BASE_URL, hexToRgb, applyDarkThemeToDialog } from "./helper.js";

let parentContainer = null;

let state = {
  owned: [],
  member: [],
  currentGroupId: null,
  currentSubTab: "members",
  currentUser: { id: null, name: "Unknown" },
};

const getToken = () => localStorage.getItem("heraldSilane_token");

function getMissionTypeLabel(group, typeId) {
  const types = Array.isArray(group?.mission_types) ? group.mission_types : [];
  const found = types.find(t => t.id === typeId || t.name === typeId);
  if (found) return found.name;
  if (typeId === "main") return "Main Quest";
  if (typeId === "side") return "Side Quest";
  return typeId || "Unknown";
}

async function fetchGroupsData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const result = await response.json();

    if (!response.ok) {
      console.error("Backend Error:", result);
      ui.notifications?.error(result.message || "Server Error fetching Groups.");
      return;
    }

    state.owned = result.owned || [];
    state.member = result.member || [];
    render();
  } catch (error) {
    console.error("Failed to fetch groups data:", error);
    ui.notifications?.error("Network Error: Failed to fetch groups data.");
  }
}

export async function initGroupTab(container) {
  parentContainer = container;
  parentContainer.style.height = "100%";
  parentContainer.style.overflow = "hidden";
  parentContainer.style.display = "flex";
  parentContainer.style.flexDirection = "column";

  const userStr = localStorage.getItem("heraldSilane_user");
  if (userStr) {
    const d = JSON.parse(userStr);
    state.currentUser = {
      id: d.id || d._id || d.uuid,
      name: d.username || d.name || "Unknown",
    };
  }

  container.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#a1a1aa;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  await fetchGroupsData();
}

function render() {
  if (!parentContainer) return;

  if (state.currentGroupId) {
    renderGroupDetails();
  } else {
    renderDashboard();
  }
}

function renderDashboard() {
  let html = `
    <div style="padding: 10px; display:flex; flex-direction:column; height: 100%; overflow-y: auto;">
      
      <!-- Header Banner -->
      <div style="background: linear-gradient(to right, rgba(99, 102, 241, 0.3), #18181b); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden; flex-shrink: 0;">
        <div style="position: absolute; top: -10px; right: -10px; opacity: 0.08; pointer-events: none; z-index: 1;">
          <i class="fa-solid fa-people-group" style="font-size: 100px;"></i>
        </div>
        <div style="z-index: 10; position: relative; flex: 1; min-width: 0; padding-right: 16px;">
          <h2 style="font-size: 24px; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; margin: 0;">
             Group Hub
          </h2>
          <p style="font-size: 14px; color: #a1a1aa; margin: 4px 0 0 0;">Manage your campaign groups and coordinate group sheets.</p>
        </div>
        <div style="z-index: 10; display: flex; gap: 8px; flex-shrink: 0;">
          <button id="hs-btn-join-group" style="display: flex; align-items: center; gap: 8px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: auto; white-space: nowrap;">
            <i class="fa-solid fa-user-plus"></i> Join Group
          </button>
        </div>
      </div>

      <!-- Created Groups Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 4px; flex-shrink: 0;">
        <h3 style="font-size: 18px; font-weight: bold; color: #e4e4e7; margin: 0;">My Created Groups</h3>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px; flex-shrink: 0;">
  `;

  if (state.owned.length === 0) {
    html += `
      <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; border: 2px dashed #3f3f46; border-radius: 12px; color: #71717a;">
        <i class="fa-solid fa-folder-open fa-2x" style="margin-bottom: 12px; opacity: 0.5;"></i>
        <div style="font-size: 14px; font-weight: 500; color: #a1a1aa;">No created groups yet.</div>
      </div>
    `;
  } else {
    state.owned.forEach((group) => {
      const rgbColor = hexToRgb(group.color || "#6366f1");
      const membersCount = Array.isArray(group.members) ? group.members.length : 0;
      const missionsCount = Array.isArray(group.missions) ? group.missions.length : 0;
      html += `
        <div class="hs-group-card" style="background: rgba(24, 24, 27, 0.5); border: 1px solid #3f3f46; border-radius: 12px; padding: 16px; cursor: pointer; display: flex; align-items: center; transition: all 0.2s;" data-id="${group.id}">
          <div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 10px; margin-right: 16px; background: rgba(${rgbColor}, 0.1); border: 1px solid rgba(${rgbColor}, 0.3); overflow: hidden; flex-shrink: 0;">
            ${group.icon ? `<img src="${group.icon}" style="width:100%; height:100%; object-fit:cover;" />` : `<i class="fa-solid fa-shield-halved" style="font-size: 22px; color: rgb(${rgbColor});"></i>`}
          </div>
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: bold; font-size: 15px; color: #f4f4f5; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${group.name}</div>
            <div style="font-size: 12px; color: #a1a1aa; font-family: monospace;">
              <span>${membersCount} Members</span> &bull; <span>${missionsCount} Missions</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-left: 8px;">
            <button class="hs-delete-group" data-id="${group.id}" title="Delete Group" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; cursor: pointer;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>

      <!-- Joined Groups Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 4px; flex-shrink: 0;">
        <h3 style="font-size: 18px; font-weight: bold; color: #e4e4e7; margin: 0;">Joined Groups</h3>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding-bottom: 40px; flex-shrink: 0;">
  `;

  if (state.member.length === 0) {
    html += `
      <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; border: 2px dashed #3f3f46; border-radius: 12px; color: #71717a;">
        <i class="fa-solid fa-circle-question fa-2x" style="margin-bottom: 12px; opacity: 0.5;"></i>
        <div style="font-size: 14px; font-weight: 500; color: #a1a1aa;">No joined groups yet.</div>
      </div>
    `;
  } else {
    state.member.forEach((group) => {
      const rgbColor = hexToRgb(group.color || "#10b981");
      const membersCount = Array.isArray(group.members) ? group.members.length : 0;
      const missionsCount = Array.isArray(group.missions) ? group.missions.length : 0;
      html += `
        <div class="hs-group-card" style="background: rgba(24, 24, 27, 0.5); border: 1px solid #3f3f46; border-radius: 12px; padding: 16px; cursor: pointer; display: flex; align-items: center; transition: all 0.2s;" data-id="${group.id}">
          <div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 10px; margin-right: 16px; background: rgba(${rgbColor}, 0.1); border: 1px solid rgba(${rgbColor}, 0.3); overflow: hidden; flex-shrink: 0;">
            ${group.icon ? `<img src="${group.icon}" style="width:100%; height:100%; object-fit:cover;" />` : `<i class="fa-solid fa-users" style="font-size: 20px; color: rgb(${rgbColor});"></i>`}
          </div>
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: bold; font-size: 15px; color: #f4f4f5; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${group.name}</div>
            <div style="font-size: 12px; color: #a1a1aa;">
              <span>GM: ${group.creator_name}</span> &bull; <span>${membersCount} Members</span> &bull; <span>${missionsCount} Missions</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-left: 8px;">
            <button class="hs-leave-group" data-id="${group.id}" title="Leave Group" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; cursor: pointer;">
              <i class="fa-solid fa-door-open"></i>
            </button>
          </div>
        </div>
      `;
    });
  }

  html += `</div></div>`;
  parentContainer.innerHTML = html;

  const btnCreate = parentContainer.querySelector("#hs-btn-create-group");
  const btnJoin = parentContainer.querySelector("#hs-btn-join-group");

  if (btnCreate) btnCreate.onclick = showCreateGroupModal;
  if (btnJoin) btnJoin.onclick = showJoinGroupModal;

  parentContainer.querySelectorAll(".hs-group-card").forEach((card) => {
    card.onclick = (e) => {
      if (
        e.target.closest(".hs-delete-group") ||
        e.target.closest(".hs-leave-group")
      ) return;
      state.currentGroupId = card.dataset.id;
      state.currentSubTab = "members";
      render();
    };
  });

  parentContainer.querySelectorAll(".hs-delete-group").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!window.confirm("Delete this group? This action is permanent and will remove all members.")) return;
      const id = btn.dataset.id;
      ui.notifications?.info("Deleting group...");
      try {
        const response = await fetch(`${API_BASE_URL}/api/groups/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (response.ok) {
          ui.notifications?.info("Group deleted successfully.");
          await fetchGroupsData();
        } else {
          const err = await response.json();
          ui.notifications?.error(err.message || "Failed to delete group.");
        }
      } catch (e) {
        ui.notifications?.error("Failed to delete group.");
      }
    };
  });

  parentContainer.querySelectorAll(".hs-leave-group").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to leave this group?")) return;
      const id = btn.dataset.id;
      ui.notifications?.info("Leaving group...");
      try {
        const response = await fetch(`${API_BASE_URL}/api/groups/${id}/leave`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (response.ok) {
          ui.notifications?.info("Left group successfully.");
          await fetchGroupsData();
        } else {
          const err = await response.json();
          ui.notifications?.error(err.message || "Failed to leave group.");
        }
      } catch (e) {
        ui.notifications?.error("Failed to leave group.");
      }
    };
  });
}

function renderGroupDetails() {
  const all = [...state.owned, ...state.member];
  const group = all.find(g => String(g.id) === String(state.currentGroupId));

  if (!group) {
    state.currentGroupId = null;
    render();
    return;
  }

  const isOwner = String(group.creator_id) === String(state.currentUser.id);
  const rgbColor = hexToRgb(group.color || "#6366f1");
  const members = Array.isArray(group.members) ? group.members : [];
  const resources = Array.isArray(group.resources) ? group.resources : [];
  const missions = Array.isArray(group.missions) ? group.missions : [];

  let html = `
    <div style="padding: 10px; display:flex; flex-direction:column; height: 100%; overflow-y: auto;">
      
      <!-- Header Banner -->
      <div style="background: linear-gradient(to right, rgba(${rgbColor}, 0.3), #18181b); border: 1px solid rgba(${rgbColor}, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; position: relative; overflow: hidden; flex-shrink: 0;">
        <div style="position: absolute; top: -10px; right: -10px; opacity: 0.08; pointer-events: none; z-index: 1;">
          <i class="fa-solid fa-shield-halved" style="font-size: 100px; color: rgb(${rgbColor});"></i>
        </div>
        
        <div style="z-index: 10; position: relative; flex: 1; min-width: 0; padding-right: 16px;">
          <button id="hs-btn-back-dashboard" style="display: flex; align-items: center; gap: 8px; background: none; border: none; color: rgb(${rgbColor}); font-size: 14px; font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 16px; width: fit-content;">
            <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
          </button>
          <h2 style="font-size: 26px; font-weight: 900; color: white; margin: 0 0 12px 0; display: flex; align-items: center; gap: 12px;">
            ${group.icon ? `<img src="${group.icon}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(${rgbColor}, 0.4);" />` : ""}
            ${group.name}
            ${!isOwner ? '<span style="font-size: 10px; background: #27272a; color: #a1a1aa; padding: 2px 8px; border-radius: 9999px; border: 1px solid #3f3f46; font-weight: 600; letter-spacing: 0.05em;">JOINED</span>' : ""}
          </h2>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; font-family: monospace; color: #a1a1aa; flex-wrap: wrap;">
            <span id="hs-btn-copy-group-invite" style="background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid #3f3f46; cursor: pointer; display: flex; align-items: center; gap: 6px;" title="Copy Invite Code">Invite: ${group.share_code} <i class="fa-solid fa-copy"></i></span>
            <span style="color: #d4d4d8; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid #3f3f46;">${members.length} Members</span>
          </div>
          ${group.description ? `<p style="margin: 12px 0 0 0; color: #a1a1aa; font-size:13px; line-height:1.5; max-width:600px;">${group.description}</p>` : ""}
        </div>

        ${isOwner ? `
          <div style="z-index: 10; display: flex; gap: 8px; flex-shrink: 0;">
            <button id="hs-btn-group-settings" style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.5); border: 1px solid #3f3f46; color: white; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              <i class="fa-solid fa-gear"></i> Settings
            </button>
          </div>
        ` : ""}
      </div>

      <!-- Inner Navigation Tabs -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid #3f3f46; padding-bottom: 8px; margin-bottom: 16px; flex-shrink: 0; overflow-x: auto; max-width: 100%;">
        <button class="hs-group-tab-btn" data-tab="members" style="padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; border: none; transition: all 0.2s; background: ${state.currentSubTab === 'members' ? `rgba(${rgbColor}, 0.2)` : 'transparent'}; color: ${state.currentSubTab === 'members' ? 'white' : '#a1a1aa'}; border: 1px solid ${state.currentSubTab === 'members' ? `rgba(${rgbColor}, 0.4)` : 'transparent'}; white-space: nowrap;">
          Members
        </button>
        <button class="hs-group-tab-btn" data-tab="player" style="padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; border: none; transition: all 0.2s; background: ${state.currentSubTab === 'player' ? `rgba(${rgbColor}, 0.2)` : 'transparent'}; color: ${state.currentSubTab === 'player' ? 'white' : '#a1a1aa'}; border: 1px solid ${state.currentSubTab === 'player' ? `rgba(${rgbColor}, 0.4)` : 'transparent'}; white-space: nowrap;">
          Player Characters
        </button>
        <button class="hs-group-tab-btn" data-tab="npc" style="padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; border: none; transition: all 0.2s; background: ${state.currentSubTab === 'npc' ? `rgba(${rgbColor}, 0.2)` : 'transparent'}; color: ${state.currentSubTab === 'npc' ? 'white' : '#a1a1aa'}; border: 1px solid ${state.currentSubTab === 'npc' ? `rgba(${rgbColor}, 0.4)` : 'transparent'}; white-space: nowrap;">
          NPCs
        </button>
        <button class="hs-group-tab-btn" data-tab="missions" style="padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; border: none; transition: all 0.2s; background: ${state.currentSubTab === 'missions' ? `rgba(${rgbColor}, 0.2)` : 'transparent'}; color: ${state.currentSubTab === 'missions' ? 'white' : '#a1a1aa'}; border: 1px solid ${state.currentSubTab === 'missions' ? `rgba(${rgbColor}, 0.4)` : 'transparent'}; white-space: nowrap;">
          Missions
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="hs-group-tab-content" style="flex: 1; display:flex; flex-direction:column; gap:8px;">
  `;

  if (state.currentSubTab === "members") {
    members.forEach((m) => {
      const isOwnerRole = m.role === "Owner";
      const initials = String(m.name || "?").substring(0, 2).toUpperCase();

      let badgeStyle = `font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: bold; transition: all 0.2s;`;
      if (isOwnerRole) {
        badgeStyle += `background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.4);`;
      } else if (isOwner) {
        badgeStyle += `background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); cursor: pointer;`;
      } else {
        badgeStyle += `background: rgba(59, 130, 246, 0.1); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.2);`;
      }

      html += `
        <div class="hs-member-row" style="background: rgba(24, 24, 27, 0.5); border: 1px solid rgba(63, 63, 70, 0.8); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 16px; flex-shrink:0;">
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-weight:bold; color: #e4e4e7; font-size:14px; flex-shrink: 0;">
            ${initials}
          </div>
          <div style="flex: 1; min-width:0;">
            <div style="font-weight: bold; font-size: 14px; color: #f4f4f5; display: flex; align-items: center; gap: 8px;">
              <span>${m.name}</span>
              <span class="hs-member-role-badge" data-userid="${m.user_id}" data-role="${m.role}" style="${badgeStyle}" title="${isOwner && !isOwnerRole ? 'Click to change role' : ''}">
                ${m.role} ${isOwner && !isOwnerRole ? '<i class="fa-solid fa-pen-to-square" style="margin-left:4px; font-size:9px;"></i>' : ''}
              </span>
            </div>
          </div>
          <div>
            ${isOwner && !isOwnerRole ? `<button class="hs-kick-member" data-userid="${m.user_id}" title="Kick Member" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; cursor: pointer;"><i class="fa-solid fa-user-minus"></i></button>` : ""}
          </div>
        </div>
      `;
    });
  } else if (state.currentSubTab === "player" || state.currentSubTab === "npc") {
    const isNpcTab = state.currentSubTab === "npc";
    const typeKey = isNpcTab ? "npc" : "player";

    html += `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding-bottom: 40px;">
    `;

    const filteredResources = resources.filter(r => {
      if (r.type !== typeKey) return false;
      const isMine = String(r.owner_id) === String(state.currentUser.id);
      const canEdit = isOwner || isMine;

      if (r.hidden === true && !canEdit) return false;

      if (r.visibility === "private" && !canEdit) return false;

      return true;
    });

    if (filteredResources.length === 0) {
      html += `
        <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; border: 2px dashed #3f3f46; border-radius: 12px; color: #71717a;">
          <i class="fa-solid ${isNpcTab ? 'fa-user-ninja' : 'fa-user-shield'} fa-2x" style="margin-bottom: 12px; opacity: 0.5;"></i>
          <div style="font-size: 14px; font-weight: 500; color: #a1a1aa;">No shared ${isNpcTab ? "NPCs" : "player characters"} yet.</div>
        </div>
      `;
    } else {
      filteredResources.forEach(r => {
        const isMine = String(r.owner_id) === String(state.currentUser.id);
        const canRemove = isOwner || isMine;
        const canEdit = isOwner || isMine;
        const hasVtt = game.actors.get(r.resource_id);

        let imgUrl = "icons/svg/mystery-man.svg";
        if (hasVtt) {
          imgUrl = hasVtt.img || hasVtt.prototypeToken?.texture?.src || imgUrl;
        }

        html += `
          <div class="hs-resource-card ${r.active !== false ? 'active' : 'inactive'}" data-id="${r.resource_id}" data-type="${typeKey}" data-name="${r.name}" data-owner="${r.owner_name}" style="background: rgba(24, 24, 27, 0.4); border: 1px solid ${r.active !== false ? 'rgba(16, 185, 129, 0.5)' : 'rgba(63, 63, 70, 0.8)'}; border-radius: 12px; padding: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; ${r.hidden ? 'opacity: 0.6;' : ''}">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
              <div style="position: relative; flex-shrink: 0;">
                <img src="${imgUrl}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #3f3f46;" />
                ${typeKey === 'player' && r.active === false ? `<span style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #3f3f46; color: #d4d4d8; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 4px; white-space: nowrap; border: 1px solid #52525b;">INACTIVE</span>` : ''}
              </div>
              <div style="min-width: 0;">
                <div style="font-weight:bold; font-size:14px; color:#f4f4f5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px;">
                  ${r.name}
                  ${r.hidden ? `<span style="font-size: 9px; padding: 1px 4px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 4px; font-weight: bold;">HIDDEN</span>` : ''}
                  ${r.visibility === 'private' ? `<span style="font-size: 9px; padding: 1px 4px; background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 4px; font-weight: bold;"><i class="fa-solid fa-lock" style="font-size: 8px; margin-right: 2px;"></i>PRIVATE</span>` : ''}
                </div>
                <div style="font-size:11px; color:#71717a; margin-top:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Shared by: ${r.owner_name}</div>
              </div>
            </div>

            <!-- Toggles and Actions -->
            <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
              
              ${canEdit ? `
                <!-- Active Toggle (PC only) -->
                ${typeKey === 'player' ? `
                  <button class="hs-resource-active-toggle" data-id="${r.resource_id}" title="${r.active !== false ? 'Deactivate Character' : 'Activate Character'}" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid ${r.active !== false ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255,255,255,0.1)'}; color: ${r.active !== false ? '#fbbf24' : '#71717a'}; cursor: pointer;">
                    <i class="fa-solid fa-bolt" style="font-size: 11px;"></i>
                  </button>
                ` : ''}

                <!-- Visibility Toggle (All) -->
                <button class="hs-resource-visibility-toggle" data-id="${r.resource_id}" title="${r.visibility === 'public' ? 'Make Private' : 'Make Public'}" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: ${r.visibility === 'public' ? '#34d399' : '#a1a1aa'}; cursor: pointer;">
                  <i class="fa-solid ${r.visibility === 'public' ? 'fa-lock-open' : 'fa-lock'}" style="font-size: 11px;"></i>
                </button>

                <!-- Hidden Toggle (PC/NPC only) -->
                <button class="hs-resource-hidden-toggle" data-id="${r.resource_id}" title="${r.hidden ? 'Show to members' : 'Hide from members'}" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: ${r.hidden ? '#f87171' : '#38bdf8'}; cursor: pointer;">
                  <i class="fa-solid ${r.hidden ? 'fa-eye-slash' : 'fa-eye'}" style="font-size: 11px;"></i>
                </button>

                <!-- Remove Share -->
                <button class="hs-remove-resource" data-id="${r.resource_id}" title="Remove Share" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; cursor: pointer;">
                  <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                </button>
              ` : ""}
            </div>
          </div>
        `;
      });
    }

  } else if (state.currentSubTab === "missions") {
    html += `
      ${isOwner ? `
      <div style="display:flex; justify-content:flex-end; margin-bottom:12px; flex-shrink: 0;">
        <button id="hs-btn-create-mission" style="display: flex; align-items: center; gap: 8px; background: #2563eb; color: white; border: none; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; width: auto; white-space: nowrap;">
          <i class="fa-solid fa-circle-plus"></i> Create Mission
        </button>
      </div>
      ` : ""}
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding-bottom: 40px;">
    `;

    if (missions.length === 0) {
      html += `
        <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; border: 2px dashed #3f3f46; border-radius: 12px; color: #71717a;">
          <i class="fa-solid fa-scroll fa-2x" style="margin-bottom: 12px; opacity: 0.5;"></i>
          <div style="font-size: 14px; font-weight: 500; color: #a1a1aa;">No missions assigned yet.</div>
        </div>
      `;
    } else {
      missions.forEach((m) => {
        let statusColor = "#60a5fa";
        if (m.status === "completed") statusColor = "#34d399";
        if (m.status === "failed") statusColor = "#f87171";

        const steps = Array.isArray(m.steps) ? m.steps : [];
        let totalObj = 0;
        let completedObj = 0;

        if (steps.length > 0) {
          steps.forEach(step => {
            const stepObjs = Array.isArray(step.objectives) ? step.objectives : [];
            totalObj += stepObjs.length;
            completedObj += stepObjs.filter(o => o.completed || (o.current >= o.amount)).length;
          });
        } else if (Array.isArray(m.objectives)) {
          totalObj = m.objectives.length;
          completedObj = m.objectives.filter(o => o.completed || (o.current >= o.amount)).length;
        }

        const rewards = Array.isArray(m.rewards) ? m.rewards : [];
        let rewardsHtml = "";
        if (rewards.length > 0) {
          rewardsHtml = `
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
              ${rewards.map(rw => {
                let icon = '<i class="fa-solid fa-gift" style="color: #c084fc;"></i>';
                if (rw.type === "coin") icon = '<i class="fa-solid fa-coins" style="color: #fbbf24;"></i>';
                if (rw.type === "exp") icon = '<i class="fa-solid fa-star" style="color: #60a5fa;"></i>';
                if (rw.type === "item") {
                  icon = rw.item_img ? `<img src="${rw.item_img}" style="width:16px; height:16px; border-radius: 2px; object-fit: cover;" />` : '<i class="fa-solid fa-bag-shopping" style="color: #34d399;"></i>';
                }
                return `
                  <span style="font-size: 9px; display: inline-flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px; color: #fbbf24;" title="${rw.name}">
                    ${icon} ${rw.amount ? 'x' + rw.amount : ''}
                  </span>
                `;
              }).join("")}
            </div>
          `;
        } else if (m.reward) {
          rewardsHtml = `
            <div style="font-size: 11px; color: #fbbf24; font-weight: 500; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-coins"></i> Reward: ${m.reward}
            </div>
          `;
        }

        html += `
          <div class="hs-mission-card" data-id="${m.id}" style="background: rgba(24, 24, 27, 0.4); border: 1px solid rgba(63, 63, 70, 0.8); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; transition: all 0.2s;">
            ${m.image ? `
              <div style="height: 120px; width: 100%; overflow: hidden; border-bottom: 1px solid rgba(63, 63, 70, 0.4);">
                <img src="${m.image}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" />
              </div>
            ` : ""}
            <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 8px;">
                  <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 9px; font-weight: bold; background: rgba(255,255,255,0.05); color: #d4d4d8; border: 1px solid rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 4px; text-transform: uppercase;">${getMissionTypeLabel(group, m.type)}</span>
                    ${m.required_level ? `<span style="font-size: 9px; font-weight: bold; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); padding: 1px 6px; border-radius: 4px;">LV. ${m.required_level}</span>` : ""}
                  </div>
                  <div style="display:flex; gap:4px; align-items:center; flex-shrink: 0;">
                    ${isOwner ? `
                      <button class="hs-edit-mission" data-id="${m.id}" title="Edit Mission" style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid #3f3f46; color: #d4d4d8; cursor: pointer; padding: 0;">
                        <i class="fa-solid fa-pen" style="font-size:10px;"></i>
                      </button>
                      <button class="hs-delete-mission" data-id="${m.id}" title="Delete Mission" style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; cursor: pointer; padding: 0;">
                        <i class="fa-solid fa-trash" style="font-size:10px;"></i>
                      </button>
                    ` : ""}
                  </div>
                </div>
                <h4 style="font-size: 15px; font-weight: bold; color: white; margin: 8px 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${m.title}">${m.title}</h4>
                ${m.description ? `<p style="margin: 0 0 6px 0; color: #a1a1aa; font-size:12px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;" title="${m.description}">${m.description}</p>` : ""}
                ${m.player_notes ? `<p style="margin: 0 0 6px 0; color: #71717a; font-size:11px; line-height:1.4; font-style: italic; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;" title="${m.player_notes}">Note: ${m.player_notes}</p>` : ""}
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: auto;">
                ${rewardsHtml}
                ${totalObj > 0 ? `
                  <div style="font-size: 11px; color: #a1a1aa; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                    <i class="fa-solid fa-list-check"></i>
                    <span>Objectives: ${completedObj} / ${totalObj}</span>
                  </div>
                ` : ""}
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                  <span class="hs-mission-status-badge" data-missionid="${m.id}" data-status="${m.status}" style="font-size: 10px; font-weight: bold; color: ${statusColor}; background: rgba(0,0,0,0.3); border: 1px solid ${statusColor}; padding: 2px 6px; border-radius: 4px;">
                    ${m.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  }

  html += `</div></div>`;
  parentContainer.innerHTML = html;

  parentContainer.querySelector("#hs-btn-back-dashboard").onclick = () => {
    state.currentGroupId = null;
    render();
  };

  parentContainer.querySelector("#hs-btn-copy-group-invite").onclick = () => {
    navigator.clipboard.writeText(group.share_code);
    ui.notifications?.info("Invite code copied to clipboard!");
  };

  if (isOwner) {
    const btnSettings = parentContainer.querySelector("#hs-btn-group-settings");
    if (btnSettings) btnSettings.onclick = () => showGroupSettingsModal(group);
  }

  parentContainer.querySelectorAll(".hs-group-tab-btn").forEach((btn) => {
    btn.onclick = () => {
      state.currentSubTab = btn.dataset.tab;
      render();
    };
  });

  if (state.currentSubTab === "members") {
    parentContainer.querySelectorAll(".hs-kick-member").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Kick this member from the group?")) return;
        const targetUserId = btn.dataset.userid;
        ui.notifications?.info("Kicking member...");
        try {
          const response = await fetch(`${API_BASE_URL}/api/groups/${group.id}/kick/${targetUserId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          if (response.ok) {
            ui.notifications?.info("Member kicked successfully.");
            await fetchGroupsData();
          } else {
            const err = await response.json();
            ui.notifications?.error(err.message || "Failed to kick member.");
          }
        } catch (e) {
          ui.notifications?.error("Failed to kick member.");
        }
      };
    });

    parentContainer.querySelectorAll(".hs-member-role-badge").forEach((badge) => {
      badge.onclick = (e) => {
        e.stopPropagation();
        if (!isOwner) return;
        const targetUserId = badge.dataset.userid;
        const currentRole = badge.dataset.role;
        showChangeRoleModal(group.id, targetUserId, currentRole, group.roles);
      };
    });
  }

  if (state.currentSubTab === "player" || state.currentSubTab === "npc") {
    const isNpcTab = state.currentSubTab === "npc";

    parentContainer.querySelectorAll(".hs-resource-card").forEach((card) => {
      card.onclick = (e) => {
        if (
          e.target.closest(".hs-remove-resource") ||
          e.target.closest(".hs-resource-active-toggle") ||
          e.target.closest(".hs-resource-visibility-toggle") ||
          e.target.closest(".hs-resource-hidden-toggle")
        ) return;
        const resourceId = card.dataset.id;
        const type = card.dataset.type;
        const name = card.dataset.name;
        const owner = card.dataset.owner;
        openResourceDetails(resourceId, type, name, owner);
      };
    });

    parentContainer.querySelectorAll(".hs-resource-active-toggle").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const resourceId = btn.dataset.id;
        const targetRes = resources.find(r => String(r.resource_id) === String(resourceId));
        if (!targetRes) return;
        const newActive = targetRes.active === false;
        await updateGroupResourceAttribute(group.id, resourceId, { active: newActive });
      };
    });

    parentContainer.querySelectorAll(".hs-resource-visibility-toggle").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const resourceId = btn.dataset.id;
        const targetRes = resources.find(r => String(r.resource_id) === String(resourceId));
        if (!targetRes) return;
        const newVisibility = targetRes.visibility === "public" ? "private" : "public";
        await updateGroupResourceAttribute(group.id, resourceId, { visibility: newVisibility });
      };
    });

    parentContainer.querySelectorAll(".hs-resource-hidden-toggle").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const resourceId = btn.dataset.id;
        const targetRes = resources.find(r => String(r.resource_id) === String(resourceId));
        if (!targetRes) return;
        const newHidden = !targetRes.hidden;
        await updateGroupResourceAttribute(group.id, resourceId, { hidden: newHidden });
      };
    });



    parentContainer.querySelectorAll(".hs-remove-resource").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Remove this shared character/NPC from the group?")) return;
        const resourceId = btn.dataset.id;
        ui.notifications?.info("Removing shared resource...");
        try {
          const response = await fetch(`${API_BASE_URL}/api/groups/${group.id}/resources/${resourceId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          if (response.ok) {
            ui.notifications?.info("Shared resource removed.");
            await fetchGroupsData();
          } else {
            const err = await response.json();
            ui.notifications?.error(err.message || "Failed to remove shared resource.");
          }
        } catch (e) {
          ui.notifications?.error("Failed to remove shared resource.");
        }
      };
    });
  }

  if (state.currentSubTab === "missions") {
    const btnCreateMission = parentContainer.querySelector("#hs-btn-create-mission");
    if (btnCreateMission) btnCreateMission.onclick = () => showCreateOrEditMissionModal(group);

    parentContainer.querySelectorAll(".hs-mission-card").forEach((card) => {
      card.onclick = (e) => {
        if (
          e.target.closest(".hs-edit-mission") ||
          e.target.closest(".hs-delete-mission")
        ) return;
        const missionId = card.dataset.id;
        const mission = missions.find(m => m.id === missionId);
        if (mission) showMissionDetailModal(group, mission);
      };
    });

    parentContainer.querySelectorAll(".hs-edit-mission").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const missionId = btn.dataset.id;
        const mission = missions.find(m => m.id === missionId);
        if (mission) showCreateOrEditMissionModal(group, mission);
      };
    });

    parentContainer.querySelectorAll(".hs-delete-mission").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this mission?")) return;
        const missionId = btn.dataset.id;
        ui.notifications?.info("Deleting mission...");
        try {
          const response = await fetch(`${API_BASE_URL}/api/groups/${group.id}/missions/${missionId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          if (response.ok) {
            ui.notifications?.info("Mission deleted.");
            await fetchGroupsData();
          } else {
            const err = await response.json();
            ui.notifications?.error(err.message || "Failed to delete mission.");
          }
        } catch (e) {
          ui.notifications?.error("Failed to delete mission.");
        }
      };
    });
  }
}

async function updateGroupResourceAttribute(groupId, resourceId, payload) {
  ui.notifications?.info("Updating resource...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/resources/${resourceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      ui.notifications?.info("Resource updated successfully.");
      await fetchGroupsData();
    } else {
      const err = await response.json();
      ui.notifications?.error(err.message || "Failed to update resource.");
    }
  } catch (e) {
    ui.notifications?.error("Server error updating resource.");
  }
}



function showChangeRoleModal(groupId, memberUserId, currentRole, groupRoles) {
  const rolesList = Array.isArray(groupRoles) ? groupRoles : [
    { name: "Owner" },
    { name: "Admin" },
    { name: "Member" }
  ];
  const optionsHtml = rolesList.map(r => `
    <option value="${r.name}" style="background: #27272a; color: #ffffff;" ${String(currentRole).toLowerCase() === String(r.name).toLowerCase() ? 'selected' : ''}>${r.name}</option>
  `).join("");

  const content = `
    <div style="padding: 10px; color: white;">
      <label style="display:block; margin-bottom:8px; color:#e4e4e7; font-weight: 500;">Select Member Role</label>
      <select id="hs-change-member-role" class="silane-input" style="width:100%;">
        ${optionsHtml}
      </select>
    </div>
  `;

  new Dialog(
    {
      title: "Set Member Role",
      content: content,
      buttons: {
        save: {
          label: "Save",
          callback: async (html) => {
            const role = html.find("#hs-change-member-role").val();
            ui.notifications?.info("Updating member role...");
            try {
              const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${memberUserId}/role`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ role }),
              });
              if (res.ok) {
                ui.notifications?.info("Member role updated.");
                await fetchGroupsData();
              } else {
                const err = await res.json();
                ui.notifications?.error(err.message || "Failed to update role.");
              }
            } catch (e) {
              ui.notifications?.error("Server error.");
            }
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "save",
      render: applyDarkThemeToDialog
    },
    { width: 320, classes: ["dialog", "silane-custom-dialog"] }
  ).render(true);
}

function showShareResourceModal(groupId, isNpc = false) {
  const actors = game.actors.filter(a => isNpc ? a.type === "npc" : a.type !== "npc").map(a => ({ id: a.id, name: a.name, type: a.type }));

  if (actors.length === 0) {
    return ui.notifications?.warn(`No ${isNpc ? "NPCs" : "player characters"} found in your sidebar to share.`);
  }

  const optionsHtml = actors.map(a => `
    <option value="${a.id}" data-name="${a.name}">
      ${a.name}
    </option>
  `).join("");

  const content = `
    <div style="padding: 10px; color: white;">
      <label style="display:block; margin-bottom:8px; color:#e4e4e7; font-weight: 500;">Select ${isNpc ? "NPC" : "Player Character"} to Share</label>
      <select id="hs-share-actor-select" class="silane-input" style="width:100%;">
        ${optionsHtml}
      </select>
    </div>
  `;

  new Dialog(
    {
      title: `Share ${isNpc ? "NPC" : "Character"}`,
      content: content,
      buttons: {
        share: {
          label: "Share",
          callback: async (html) => {
            const selectElem = html.find("#hs-share-actor-select")[0];
            const selectedOpt = selectElem.options[selectElem.selectedIndex];

            const resource_id = selectedOpt.value;
            const name = selectedOpt.getAttribute("data-name");
            const type = isNpc ? "npc" : "player";

            ui.notifications?.info("Sharing with group...");
            try {
              const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/resources`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ type, resource_id, name }),
              });
              if (res.ok) {
                ui.notifications?.info("Shared successfully!");
                await fetchGroupsData();
              } else {
                const err = await res.json();
                ui.notifications?.error(err.message || "Failed to share.");
              }
            } catch (e) {
              ui.notifications?.error("Server error.");
            }
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "share",
      render: applyDarkThemeToDialog
    },
    { width: 350, classes: ["dialog", "silane-custom-dialog"] }
  ).render(true);
}



function openResourceDetails(resourceId, type, name, ownerName) {
  if (type === "player" || type === "npc") {
    const actor = game.actors.get(resourceId);
    if (actor) {
      return actor.sheet.render(true);
    }
  }
}

function showCreateOrEditMissionModal(group, mission = null) {
  const groupId = group.id;
  const isEdit = mission !== null;
  const missionTitle = isEdit ? mission.title : "";
  const missionType = isEdit ? mission.type : "main";
  const missionDesc = isEdit ? mission.description : "";
  const missionImage = isEdit ? (mission.image || "") : "";
  const missionReqLevel = isEdit ? (mission.required_level || "") : "";
  const missionNotes = isEdit ? (mission.notes || "") : "";
  const missionPlayerNotes = isEdit ? (mission.player_notes || "") : "";

  const steps = isEdit && Array.isArray(mission.steps) && mission.steps.length > 0
    ? mission.steps
    : [{ title: "Step 1", description: "", objectives: isEdit && Array.isArray(mission.objectives) ? mission.objectives : [] }];

  const rewards = isEdit && Array.isArray(mission.rewards)
    ? mission.rewards
    : (isEdit && mission.reward ? [{ type: "custom", name: mission.reward, amount: 1 }] : []);

  const content = `
    <div style="padding: 10px; color: white; max-height: 70vh; overflow-y: auto; font-family: sans-serif;">
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Mission Title</label>
        <input type="text" id="hs-mission-title" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" placeholder="e.g. Slay the Dragon" value="${missionTitle}" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Mission Type</label>
        <select id="hs-mission-type" class="silane-input" style="width:100%;">
          ${(Array.isArray(group.mission_types) && group.mission_types.length > 0
            ? group.mission_types
            : [{ id: "main", name: "Main Quest" }, { id: "side", name: "Side Quest" }]
          ).map(t => `<option value="${t.id}" style="background: #27272a; color: #ffffff;" ${missionType === t.id ? 'selected' : ''}>${t.name}</option>`).join("")}
        </select>
      </div>
      ${isEdit ? `
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Mission Status</label>
        <select id="hs-mission-status" class="silane-input" style="width:100%;">
          <option value="active" style="background: #27272a; color: #ffffff;" ${mission.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="completed" style="background: #27272a; color: #ffffff;" ${mission.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="failed" style="background: #27272a; color: #ffffff;" ${mission.status === 'failed' ? 'selected' : ''}>Failed</option>
        </select>
      </div>
      ` : ""}
      <div style="margin-bottom: 12px; display: flex; gap: 10px; align-items: flex-end;">
        <div style="flex: 1;">
          <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Mission Image URL (Optional)</label>
          <input type="text" id="hs-mission-image" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" placeholder="URL/Path to image (e.g. icons/svg/swords.svg)" value="${missionImage}" />
        </div>
        <div style="flex-shrink: 0;">
          <input type="file" id="hs-mission-image-file" style="display: none;" accept="image/*" />
          <button type="button" id="hs-btn-upload-mission-image" style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8; border-radius: 6px; padding: 8px 12px; font-size: 12px; font-weight: 600; cursor: pointer;">
            <i class="fa-solid fa-upload"></i> Upload
          </button>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Required Level (Optional)</label>
        <input type="number" id="hs-mission-level" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" placeholder="e.g. 5" value="${missionReqLevel}" min="1" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Description</label>
        <textarea id="hs-mission-desc" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b; resize: vertical; min-height: 80px;" placeholder="Describe what the group needs to do...">${missionDesc}</textarea>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Player Notes (Visible to all)</label>
        <textarea id="hs-mission-player-notes" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b; resize: vertical; min-height: 50px;" placeholder="Hints or details visible to players...">${missionPlayerNotes}</textarea>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#818cf8; font-weight: 500;">DM Notes (Visible to Owner only)</label>
        <textarea id="hs-mission-dm-notes" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b; resize: vertical; min-height: 50px;" placeholder="Secrets, monster stats, or DM info...">${missionNotes}</textarea>
      </div>

      <div style="margin-bottom: 12px; border-top: 1px solid #3f3f46; padding-top: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Quest Steps</label>
        <div id="hs-steps-list-container" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Steps will be injected here -->
        </div>
        <button type="button" id="hs-add-step-btn" style="background: rgba(255,255,255,0.05); border: 1px solid #3f3f46; color: white; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; width: auto; font-weight: 600; margin-top: 6px;">
          <i class="fa-solid fa-plus"></i> Add Step
        </button>
      </div>

      <div style="margin-bottom: 12px; border-top: 1px solid #3f3f46; padding-top: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Quest Rewards</label>
        <div id="hs-rewards-list-container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
          <!-- Rewards will be injected here -->
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="hs-add-reward-btn" data-reward-type="coin" style="background: rgba(251, 191, 36, 0.1); border: 1px dashed rgba(251, 191, 36, 0.4); color: #fbbf24; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 600;">
            <i class="fa-solid fa-coins"></i> Coin
          </button>
          <button type="button" class="hs-add-reward-btn" data-reward-type="exp" style="background: rgba(96, 165, 250, 0.1); border: 1px dashed rgba(96, 165, 250, 0.4); color: #60a5fa; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 600;">
            <i class="fa-solid fa-star"></i> EXP
          </button>
          <button type="button" class="hs-add-reward-btn" data-reward-type="item" style="background: rgba(52, 211, 153, 0.1); border: 1px dashed rgba(52, 211, 153, 0.4); color: #34d399; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 600;">
            <i class="fa-solid fa-bag-shopping"></i> VTT Item
          </button>
          <button type="button" class="hs-add-reward-btn" data-reward-type="custom" style="background: rgba(192, 132, 252, 0.1); border: 1px dashed rgba(192, 132, 252, 0.4); color: #c084fc; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 600;">
            <i class="fa-solid fa-gift"></i> Custom
          </button>
        </div>
      </div>
    </div>
  `;

  new Dialog(
    {
      title: isEdit ? "Edit Campaign Mission" : "Assign Campaign Mission",
      content: content,
      buttons: {
        save: {
          label: isEdit ? "Save Changes" : "Assign",
          callback: async (html) => {
            const title = html.find("#hs-mission-title").val().trim();
            const type = html.find("#hs-mission-type").val();
            const status = isEdit ? html.find("#hs-mission-status").val() : "active";
            const description = html.find("#hs-mission-desc").val().trim();
            const image = html.find("#hs-mission-image").val().trim();
            const required_level = html.find("#hs-mission-level").val() ? parseInt(html.find("#hs-mission-level").val()) : null;
            const notes = html.find("#hs-mission-dm-notes").val().trim();
            const player_notes = html.find("#hs-mission-player-notes").val().trim();

            const gatheredSteps = [];
            html.find(".hs-step-row").each((i, stepEl) => {
              const stepRow = $(stepEl);
              const sTitle = stepRow.find(".step-title").val().trim();
              const sDesc = stepRow.find(".step-description").val().trim();
              const sObjectives = [];
              stepRow.find(".hs-objective-row").each((j, objEl) => {
                const objRow = $(objEl);
                const oType = objRow.find(".obj-type").val();
                const oTarget = objRow.find(".obj-target").val().trim();
                const oAmount = parseInt(objRow.find(".obj-amount").val()) || 1;
                const oCurrent = parseInt(objRow.find(".obj-current").val()) || 0;
                if (oTarget) {
                  sObjectives.push({
                    type: oType,
                    target: oTarget,
                    amount: oAmount,
                    current: oCurrent,
                    completed: oCurrent >= oAmount
                  });
                }
              });
              gatheredSteps.push({
                title: sTitle || `Step ${i + 1}`,
                description: sDesc,
                objectives: sObjectives
              });
            });

            const gatheredRewards = [];
            html.find(".hs-reward-row").each((i, rwEl) => {
              const row = $(rwEl);
              const rType = row.attr("data-type");
              if (rType === "coin") {
                const denom = row.find(".reward-denomination").val();
                const amount = parseInt(row.find(".reward-amount").val()) || 0;
                gatheredRewards.push({
                  type: "coin",
                  denomination: denom,
                  amount,
                  name: `${amount} ${denom.toUpperCase()}`
                });
              } else if (rType === "exp") {
                const amount = parseInt(row.find(".reward-amount").val()) || 0;
                gatheredRewards.push({
                  type: "exp",
                  amount,
                  name: `${amount} EXP`
                });
              } else if (rType === "item") {
                const name = row.find(".reward-item-name").val().trim();
                const uuid = row.find(".reward-item-uuid").val().trim();
                const img = row.find(".reward-item-img").val().trim();
                const amount = parseInt(row.find(".reward-amount").val()) || 1;
                if (name && uuid) {
                  gatheredRewards.push({
                    type: "item",
                    name,
                    item_id: uuid,
                    item_img: img,
                    amount
                  });
                }
              } else if (rType === "custom") {
                const name = row.find(".reward-name").val().trim();
                const amount = parseInt(row.find(".reward-amount").val()) || 1;
                if (name) {
                  gatheredRewards.push({
                    type: "custom",
                    name,
                    amount
                  });
                }
              }
            });

            if (!title) return ui.notifications?.warn("Title cannot be empty.");

            ui.notifications?.info(isEdit ? "Updating mission..." : "Assigning mission...");

            const url = isEdit
              ? `${API_BASE_URL}/api/groups/${groupId}/missions/${mission.id}`
              : `${API_BASE_URL}/api/groups/${groupId}/missions`;

            const method = isEdit ? "PATCH" : "POST";

            const body = {
              title,
              type,
              status,
              description,
              image,
              required_level,
              notes,
              player_notes,
              objectives: [],
              steps: gatheredSteps,
              rewards: gatheredRewards
            };

            try {
              const res = await fetch(url, {
                method,
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(body),
              });
              if (res.ok) {
                ui.notifications?.info(isEdit ? "Mission updated successfully!" : "Mission assigned successfully!");
                await fetchGroupsData();
              } else {
                const err = await res.json();
                ui.notifications?.error(err.message || "Failed to save mission.");
              }
            } catch (e) {
              ui.notifications?.error("Server error.");
            }
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "save",
      render: (html) => {
        applyDarkThemeToDialog(html);

        const fileInput = html.find("#hs-mission-image-file");
        const uploadBtn = html.find("#hs-btn-upload-mission-image");
        const urlInput = html.find("#hs-mission-image");

        uploadBtn.click(() => fileInput.click());

        fileInput.change(async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          ui.notifications?.info("Uploading image...");
          uploadBtn.html('<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading...');
          uploadBtn.prop('disabled', true);

          try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${API_BASE_URL}/api/silane_assets/upload`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${getToken()}`
              },
              body: formData
            });

            const result = await response.json();
            if (response.ok && result.success) {
              const url = result.data?.url;
              urlInput.val(url);
              ui.notifications?.info("Image uploaded successfully!");
            } else {
              ui.notifications?.error(result.message || "Failed to upload image.");
            }
          } catch (err) {
            ui.notifications?.error("Failed to upload image.");
          } finally {
            uploadBtn.html('<i class="fa-solid fa-upload"></i> Upload');
            uploadBtn.prop('disabled', false);
            fileInput.val("");
          }
        });

        const stepsListContainer = html.find("#hs-steps-list-container");
        const addStepBtn = html.find("#hs-add-step-btn");

        const addStepRow = (step = { title: "", description: "", objectives: [] }) => {
          const stepIdx = html.find(".hs-step-row").length;
          const stepRow = $(`
            <div class="hs-step-row" style="background: rgba(0,0,0,0.15); border: 1px solid #3f3f46; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="font-size: 11px; font-weight: bold; color: #a1a1aa; background: #27272a; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Step <span class="step-num">${stepIdx + 1}</span></span>
                <input type="text" class="step-title" value="${step.title || ''}" placeholder="Step title (e.g. Find the Alchemist)" style="flex: 1; border-radius:6px; padding:6px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size:12px; font-weight: bold;" />
                <button type="button" class="hs-remove-step-btn" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;">
                  <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                </button>
              </div>
              <input type="text" class="step-description" value="${step.description || ''}" placeholder="Step description (optional)..." style="width: 100%; border-radius:6px; padding:6px; background: rgba(0,0,0,0.3); color: #e4e4e7; border: 1px solid #3f3f46; font-size: 11px;" />
              
              <div style="margin-left: 12px; border-left: 2px dashed #3f3f46; padding-left: 12px; margin-top: 4px;">
                <div class="step-objectives-list" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px;">
                  <!-- Objective rows will be injected here -->
                </div>
                <button type="button" class="hs-add-step-objective-btn" style="background: rgba(255,255,255,0.03); border: 1px solid #3f3f46; color: #a1a1aa; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: pointer; font-weight: bold; width: fit-content;">
                  <i class="fa-solid fa-plus" style="font-size:8px;"></i> Add Objective
                </button>
              </div>
            </div>
          `);

          const objectivesList = stepRow.find(".step-objectives-list");
          const addObjBtn = stepRow.find(".hs-add-step-objective-btn");

          const addObjectiveRow = (obj = { type: "defeat", target: "", amount: 1, current: 0 }) => {
            const objRow = $(`
              <div class="hs-objective-row" style="display: flex; gap: 4px; align-items: center;">
                <select class="obj-type" style="width: 80px; border-radius:4px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 10px;">
                  <option value="defeat" ${obj.type === 'defeat' ? 'selected' : ''}>⚔️ Defeat</option>
                  <option value="collect" ${obj.type === 'collect' ? 'selected' : ''}>🎒 Collect</option>
                  <option value="visit" ${obj.type === 'visit' ? 'selected' : ''}>📍 Visit</option>
                  <option value="reach" ${obj.type === 'reach' ? 'selected' : ''}>🏆 Reach</option>
                  <option value="custom" ${obj.type === 'custom' ? 'selected' : ''}>📌 Custom</option>
                </select>
                <input type="text" class="obj-target" value="${obj.target}" style="flex: 1; border-radius:4px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 10px;" placeholder="Target name..." />
                <input type="number" class="obj-amount" value="${obj.amount}" style="width: 40px; border-radius:4px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 10px; text-align: center;" min="1" placeholder="Qty" />
                <input type="number" class="obj-current" value="${obj.current || 0}" style="width: 40px; border-radius:4px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 10px; text-align: center;" min="0" placeholder="Done" />
                <button type="button" class="hs-remove-obj-btn" style="background: transparent; border: none; color: #f87171; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;"><i class="fa-solid fa-xmark" style="font-size:12px;"></i></button>
              </div>
            `);
            objRow.find(".hs-remove-obj-btn").click(() => objRow.remove());
            objectivesList.append(objRow);
          };

          addObjBtn.click(() => addObjectiveRow());

          if (Array.isArray(step.objectives)) {
            step.objectives.forEach(obj => addObjectiveRow(obj));
          } else {
            addObjectiveRow();
          }

          stepRow.find(".hs-remove-step-btn").click(() => {
            stepRow.remove();
            html.find(".hs-step-row").each((i, el) => {
              $(el).find(".step-num").text(i + 1);
            });
          });

          stepsListContainer.append(stepRow);
        };

        addStepBtn.click(() => addStepRow());

        steps.forEach(s => addStepRow(s));

        const rewardsListContainer = html.find("#hs-rewards-list-container");

        const addRewardRow = (rw = { type: "custom", name: "", amount: 1 }) => {
          let rewardHtml = "";
          if (rw.type === "coin") {
            const denom = rw.denomination || "gp";
            rewardHtml = `
              <div class="hs-reward-row hs-reward-coin" data-type="coin" style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; padding: 10px; border-radius: 6px;">
                <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                  <i class="fa-solid fa-coins" style="color: #fbbf24; font-size: 12px;"></i>
                </div>
                <select class="reward-denomination" style="width: 70px; border-radius:6px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 11px;">
                  <option value="cp" ${denom === 'cp' ? 'selected' : ''}>CP</option>
                  <option value="sp" ${denom === 'sp' ? 'selected' : ''}>SP</option>
                  <option value="ep" ${denom === 'ep' ? 'selected' : ''}>EP</option>
                  <option value="gp" ${denom === 'gp' ? 'selected' : ''}>GP</option>
                  <option value="pp" ${denom === 'pp' ? 'selected' : ''}>PP</option>
                </select>
                <input type="number" class="reward-amount" value="${rw.amount || 100}" style="flex: 1; border-radius:6px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 11px;" min="1" placeholder="Amount" />
                <button type="button" class="hs-remove-reward-btn" style="background: transparent; border: none; color: #f87171; cursor: pointer; padding: 0;"><i class="fa-solid fa-xmark"></i></button>
              </div>
            `;
          } else if (rw.type === "exp") {
            rewardHtml = `
              <div class="hs-reward-row hs-reward-exp" data-type="exp" style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; padding: 10px; border-radius: 6px;">
                <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                  <i class="fa-solid fa-star" style="color: #60a5fa; font-size: 12px;"></i>
                </div>
                <span style="font-size: 11px; font-weight: bold; flex: 1; color: #e4e4e7;">Experience Points (EXP)</span>
                <input type="number" class="reward-amount" value="${rw.amount || 100}" style="width: 100px; border-radius:6px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 11px;" min="1" placeholder="EXP Amount" />
                <button type="button" class="hs-remove-reward-btn" style="background: transparent; border: none; color: #f87171; cursor: pointer; padding: 0;"><i class="fa-solid fa-xmark"></i></button>
              </div>
            `;
          } else if (rw.type === "item") {
            const itemImgHtml = rw.item_img 
              ? `<img src="${rw.item_img}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" />` 
              : `<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;"><i class="fa-solid fa-bag-shopping" style="color: #34d399; font-size: 12px;"></i></div>`;
            
            rewardHtml = `
              <div class="hs-reward-row hs-reward-item" data-type="item" style="display: flex; flex-direction: column; gap: 6px; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; padding: 10px; border-radius: 6px; position: relative;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <div class="reward-item-img-container" style="flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    ${itemImgHtml}
                  </div>
                  <span class="reward-item-label" style="font-size: 11px; font-weight: bold; flex: 1; color: #e4e4e7;">${rw.name || 'Select VTT Item'}</span>
                  <input type="number" class="reward-amount" value="${rw.amount || 1}" style="width: 50px; border-radius:6px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 11px;" min="1" placeholder="Qty" />
                  <button type="button" class="hs-remove-reward-btn" style="background: transparent; border: none; color: #f87171; cursor: pointer; padding: 0;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                ${!rw.item_id ? `
                <div class="hs-item-search-container" style="position: relative;">
                  <input type="text" class="hs-item-search-input" placeholder="Type item name to search..." style="width: 100%; border-radius:6px; padding:6px; background: rgba(0,0,0,0.3); color: white; border: 1px solid #52525b; font-size: 11px;" />
                  <div class="hs-item-search-results" style="display: none; position: absolute; left: 0; right: 0; top: 100%; background: #1e1e24; border: 1px solid #3f3f46; border-radius: 6px; max-height: 150px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
                </div>
                ` : `<div style="font-size: 9px; color: #71717a; font-family: monospace;">UUID: ${rw.item_id}</div>`}
                <input type="hidden" class="reward-item-name" value="${rw.name || ''}" />
                <input type="hidden" class="reward-item-uuid" value="${rw.item_id || ''}" />
                <input type="hidden" class="reward-item-img" value="${rw.item_img || ''}" />
              </div>
            `;
          } else if (rw.type === "custom") {
            rewardHtml = `
              <div class="hs-reward-row hs-reward-custom" data-type="custom" style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; padding: 10px; border-radius: 6px;">
                <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                  <i class="fa-solid fa-gift" style="color: #c084fc; font-size: 12px;"></i>
                </div>
                <input type="text" class="reward-name" value="${rw.name || ''}" style="flex: 2; border-radius:6px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 11px;" placeholder="Reward name (e.g. Magic Potion)..." />
                <input type="number" class="reward-amount" value="${rw.amount || 1}" style="width: 60px; border-radius:6px; padding:4px; background: rgba(0,0,0,0.4); color: white; border: 1px solid #52525b; font-size: 11px;" min="1" placeholder="Qty" />
                <button type="button" class="hs-remove-reward-btn" style="background: transparent; border: none; color: #f87171; cursor: pointer; padding: 0;"><i class="fa-solid fa-xmark"></i></button>
              </div>
            `;
          }

          const row = $(rewardHtml);
          row.find(".hs-remove-reward-btn").click(() => row.remove());
          rewardsListContainer.append(row);
        };

        rewards.forEach(r => addRewardRow(r));

        html.find(".hs-add-reward-btn").click((e) => {
          const type = $(e.currentTarget).attr("data-reward-type");
          addRewardRow({ type, name: "", amount: type === "exp" ? 100 : 1 });
        });

        html.on("input", ".hs-item-search-input", (e) => {
          const input = $(e.currentTarget);
          const query = input.val().trim().toLowerCase();
          const resultsDiv = input.siblings(".hs-item-search-results");
          if (!query) {
            resultsDiv.hide().empty();
            return;
          }

          const results = [];
          for (let item of game.items) {
            if (item.name.toLowerCase().includes(query)) {
              results.push({
                name: item.name,
                img: item.img,
                uuid: item.uuid,
                source: "World"
              });
            }
          }
          for (let pack of game.packs) {
            if (pack.metadata.type === "Item" && pack.indexed) {
              for (let entry of pack.index) {
                if (entry.name.toLowerCase().includes(query)) {
                  results.push({
                    name: entry.name,
                    img: entry.img,
                    uuid: `Compendium.${pack.collection}.${entry._id}`,
                    source: pack.metadata.label
                  });
                }
              }
            }
          }

          const sliced = results.slice(0, 10);
          if (sliced.length === 0) {
            resultsDiv.html(`<div style="padding: 8px; font-size: 11px; color: #71717a;">No items found</div>`).show();
            return;
          }

          const itemsHtml = sliced.map(item => `
            <div class="hs-search-item-row" data-uuid="${item.uuid}" data-name="${item.name}" data-img="${item.img}" style="display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-bottom: 1px solid #27272a;">
              <img src="${item.img}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);" />
              <div style="flex: 1; min-width: 0; font-size: 11px; color: #e4e4e7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
              <div style="font-size: 9px; color: #71717a;">${item.source}</div>
            </div>
          `).join("");

          resultsDiv.html(itemsHtml).show();
        });

        html.on("click", ".hs-search-item-row", (e) => {
          const row = $(e.currentTarget);
          const uuid = row.attr("data-uuid");
          const name = row.attr("data-name");
          const img = row.attr("data-img");

          const container = row.closest(".hs-reward-row");
          container.find(".reward-item-label").text(name);
          container.find(".reward-item-name").val(name);
          container.find(".reward-item-uuid").val(uuid);
          container.find(".reward-item-img").val(img);
          container.find(".hs-item-search-container").remove();
          
          const imgHtml = img 
            ? `<img src="${img}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" />` 
            : `<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;"><i class="fa-solid fa-bag-shopping" style="color: #34d399; font-size: 12px;"></i></div>`;
          container.find(".reward-item-img-container").html(imgHtml);
          
          container.append(`<div style="font-size: 9px; color: #71717a; font-family: monospace;">UUID: ${uuid}</div>`);
        });

        $(document).click((e) => {
          if (!$(e.target).closest(".hs-item-search-container").length) {
            html.find(".hs-item-search-results").hide().empty();
          }
        });
      }
    },
    { width: 500, classes: ["dialog", "silane-custom-dialog"] }
  ).render(true);
}

function showMissionDetailModal(group, mission) {
  const isOwner = String(group.creator_id) === String(state.currentUser.id);
  const statusColor = mission.status === "completed" ? "#34d399" : mission.status === "failed" ? "#f87171" : "#60a5fa";

  const rewards = Array.isArray(mission.rewards) ? mission.rewards : [];
  let rewardsHtml = "";
  if (rewards.length > 0) {
    rewardsHtml = `
      <div style="margin-top: 12px; padding: 12px; border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.05); display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-star"></i> Quest Rewards
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px;">
          ${rewards.map(rw => {
      let icon = '<i class="fa-solid fa-gift" style="color: #c084fc; font-size: 14px;"></i>';
      let name = rw.name;
      if (rw.type === "coin") {
        icon = '<i class="fa-solid fa-coins" style="color: #fbbf24; font-size: 14px;"></i>';
      } else if (rw.type === "exp") {
        icon = '<i class="fa-solid fa-star" style="color: #60a5fa; font-size: 14px;"></i>';
      } else if (rw.type === "item") {
        icon = rw.item_img ? `<img src="${rw.item_img}" style="width:100%; height:100%; object-fit: cover;" />` : '<i class="fa-solid fa-bag-shopping" style="color: #34d399; font-size: 14px;"></i>';
      }
      return `
              <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #fbbf24; font-weight: 500; background: rgba(0,0,0,0.4); border: 1px solid rgba(251, 191, 36, 0.15); padding: 8px; border-radius: 8px;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  ${icon}
                </div>
                <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                  <span style="color: #fbbf24; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;" title="${name}">${name}</span>
                  ${rw.amount ? `<span style="color: #a1a1aa; font-size: 9px; font-family: monospace; margin-top: 2px;">Qty: x${rw.amount}</span>` : ""}
                </div>
              </div>
            `;
    }).join("")}
        </div>
      </div>
    `;
  } else if (mission.reward) {
    rewardsHtml = `
      <div style="margin-top: 12px; padding: 12px; border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.05); display: flex; align-items: center; gap: 8px; color: #fbbf24; font-weight: 600; font-size:12px;">
        <i class="fa-solid fa-coins"></i>
        <span>Reward: ${mission.reward}</span>
      </div>
    `;
  }

  let stepsHtml = "";
  const steps = Array.isArray(mission.steps) ? mission.steps : [];
  if (steps.length > 0) {
    stepsHtml = `
      <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
        <h4 style="margin: 0; font-size: 13px; text-transform: uppercase; color: #a1a1aa; font-weight: 600; letter-spacing: 0.05em;">Quest Steps</h4>
        ${steps.map((step, sIdx) => {
      const stepObjs = Array.isArray(step.objectives) ? step.objectives : [];
      const totalObj = stepObjs.length;
      const doneObj = stepObjs.filter(o => o.completed || (o.current >= o.amount)).length;
      return `
            <div style="border: 1px solid #3f3f46; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 10px; font-weight: bold; background: #27272a; color: #a1a1aa; padding: 1px 5px; border-radius: 4px; font-family: monospace;">Step ${sIdx + 1}</span>
                  <span style="font-size: 12px; font-weight: bold; color: white;">${step.title || 'Step ' + (sIdx + 1)}</span>
                </div>
                ${totalObj > 0 ? `<span style="font-size: 10px; color: #71717a; font-family: monospace;">${doneObj} / ${totalObj} Done</span>` : ""}
              </div>
              ${step.description ? `<div style="font-size: 11px; color: #a1a1aa; margin-left: 6px; margin-bottom: 6px;">${step.description}</div>` : ""}
              ${stepObjs.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 6px; margin-left: 6px; margin-top: 6px;">
                  ${stepObjs.map((obj, oIdx) => {
        const isDone = obj.completed || (obj.current >= obj.amount);
        let icon = "📌";
        if (obj.type === "defeat") icon = "⚔️";
        if (obj.type === "collect") icon = "🎒";
        if (obj.type === "visit" ? "📍" : obj.type === "reach" ? "🏆" : "📌") icon = obj.type === "visit" ? "📍" : obj.type === "reach" ? "🏆" : "📌";
        const progress = obj.amount > 0 ? Math.min(((obj.current || 0) / obj.amount) * 100, 100) : 0;

        return `
                      <div class="hs-detail-objective-row" data-step-idx="${sIdx}" data-obj-idx="${oIdx}" style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); border: 1px solid ${isDone ? 'rgba(52, 211, 153, 0.2)' : '#3f3f46'}; padding: 6px 10px; border-radius: 6px; cursor: ${isOwner ? 'pointer' : 'default'};" title="${isOwner ? 'Click to toggle completion' : ''}">
                        <span style="font-size: 12px;">${icon}</span>
                        <div style="flex: 1; min-width: 0;">
                          <div style="font-size: 11px; font-weight: 600; color: ${isDone ? '#34d399' : '#e4e4e7'}; ${isDone ? 'text-decoration: line-through;' : ''}">
                            ${obj.target || "Objective"} (${obj.type})
                          </div>
                          <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                            <div style="flex: 1; height: 4px; background: #27272a; border-radius: 9999px; overflow: hidden; border: 1px solid #3f3f46;">
                              <div style="width: ${progress}%; height: 100%; background: ${isDone ? '#34d399' : '#3b82f6'}; border-radius: 9999px;"></div>
                            </div>
                            <span style="font-size: 9px; color: #a1a1aa; font-family: monospace; font-weight: 600;">${obj.current || 0} / ${obj.amount || 1}</span>
                          </div>
                        </div>
                        ${isDone ? '<i class="fa-solid fa-check" style="color:#34d399; font-size: 10px;"></i>' : ''}
                      </div>
                    `;
      }).join("")}
                </div>
              ` : ""}
            </div>
          `;
    }).join("")}
      </div>
    `;
  } else if (Array.isArray(mission.objectives) && mission.objectives.length > 0) {
    stepsHtml = `
      <div style="margin-top: 15px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #a1a1aa; font-weight: 600; letter-spacing: 0.05em;">Objectives</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${mission.objectives.map((obj, oIdx) => {
      const isDone = obj.completed || (obj.current >= obj.amount);
      const icon = obj.type === "defeat" ? "⚔️" : obj.type === "collect" ? "🎒" : obj.type === "visit" ? "📍" : obj.type === "reach" ? "🏆" : "📌";
      const progress = obj.amount > 0 ? Math.min(((obj.current || 0) / obj.amount) * 100, 100) : 0;
      return `
              <div class="hs-detail-legacy-objective-row" data-obj-idx="${oIdx}" style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.2); border: 1px solid ${isDone ? 'rgba(52, 211, 153, 0.2)' : '#3f3f46'}; padding: 8px 12px; border-radius: 6px; cursor: ${isOwner ? 'pointer' : 'default'};" title="${isOwner ? 'Click to toggle completion' : ''}">
                <span style="font-size: 16px;">${icon}</span>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 13px; font-weight: 600; color: ${isDone ? '#34d399' : '#e4e4e7'}; ${isDone ? 'text-decoration: line-through;' : ''}">
                    ${obj.target || "Objective"} (${obj.type})
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <div style="flex: 1; height: 6px; background: #27272a; border-radius: 9999px; overflow: hidden; border: 1px solid #3f3f46;">
                      <div style="width: ${progress}%; height: 100%; background: ${isDone ? '#34d399' : '#3b82f6'}; border-radius: 9999px;"></div>
                    </div>
                    <span style="font-size: 11px; color: #a1a1aa; font-family: monospace; font-weight: 600;">${obj.current || 0} / ${obj.amount || 1}</span>
                  </div>
                </div>
                ${isDone ? '<i class="fa-solid fa-check" style="color:#34d399;"></i>' : ''}
              </div>
            `;
    }).join("")}
        </div>
      </div>
    `;
  }

  const content = `
    <div style="padding: 15px; color: white; display: flex; flex-direction: column; gap: 12px; font-family: sans-serif; max-height: 70vh; overflow-y: auto;">
      ${mission.image ? `
        <div style="width: 100%; height: 140px; overflow: hidden; border-radius: 8px; border: 1px solid #3f3f46;">
          <img src="${mission.image}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      ` : ""}
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="font-size: 9px; font-weight: bold; background: rgba(255,255,255,0.05); color: #d4d4d8; border: 1px solid rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
              ${getMissionTypeLabel(group, mission.type)}
            </span>
            ${mission.required_level ? `
              <span style="font-size: 9px; font-weight: bold; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); padding: 2px 8px; border-radius: 4px;">
                LV. ${mission.required_level}
              </span>
            ` : ""}
          </div>
          <h3 style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold;">${mission.title}</h3>
        </div>
        <span style="font-size: 11px; font-weight: bold; color: ${statusColor}; background: rgba(0,0,0,0.3); border: 1px solid ${statusColor}; padding: 3px 8px; border-radius: 6px;">
          ${mission.status.toUpperCase()}
        </span>
      </div>

      <hr style="border: 0; border-top: 1px solid #3f3f46; margin: 5px 0;" />

      <div style="font-size: 13px; line-height: 1.5; color: #d4d4d8; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #71717a; margin-bottom: 4px;">Description</div>
          <p style="margin: 0;">${mission.description || "No description provided."}</p>
        </div>
        
        ${mission.player_notes ? `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #71717a; margin-bottom: 4px;">Player Notes</div>
            <p style="margin: 0; font-style: italic; color: #a1a1aa;">${mission.player_notes}</p>
          </div>
        ` : ""}

        ${isOwner && mission.notes ? `
          <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.1); padding: 10px; border-radius: 6px;">
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #818cf8; margin-bottom: 4px;">DM Notes (Owner Only)</div>
            <p style="margin: 0; color: #c7d2fe;">${mission.notes}</p>
          </div>
        ` : ""}
        
        ${rewardsHtml}
      </div>

      ${stepsHtml}
    </div>
  `;

  new Dialog({
    title: `Mission Details`,
    content: content,
    buttons: {
      ok: { label: "Close" }
    },
    default: "ok",
    render: (html) => {
      applyDarkThemeToDialog(html);

      if (isOwner) {
        html.on("click", ".hs-detail-objective-row", async (e) => {
          const row = $(e.currentTarget);
          const sIdx = parseInt(row.attr("data-step-idx"));
          const oIdx = parseInt(row.attr("data-obj-idx"));

          const nextSteps = JSON.parse(JSON.stringify(steps));
          const targetObj = nextSteps[sIdx].objectives[oIdx];
          const isDone = targetObj.completed || (targetObj.current >= targetObj.amount);

          if (isDone) {
            targetObj.current = 0;
            targetObj.completed = false;
          } else {
            targetObj.current = targetObj.amount;
            targetObj.completed = true;
          }

          ui.notifications?.info("Updating objective...");
          try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${group.id}/missions/${mission.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({ steps: nextSteps }),
            });
            if (res.ok) {
              ui.notifications?.info("Objective updated!");
              await fetchGroupsData();
              html.closest(".dialog").find(".dialog-buttons button.ok").click();
              setTimeout(async () => {
                const freshGroup = [...state.owned, ...state.member].find(g => String(g.id) === String(group.id));
                const freshMission = freshGroup?.missions?.find(m => m.id === mission.id);
                if (freshMission) showMissionDetailModal(freshGroup, freshMission);
              }, 100);
            } else {
              ui.notifications?.error("Failed to update objective.");
            }
          } catch (err) {
            ui.notifications?.error("Server error.");
          }
        });

        html.on("click", ".hs-detail-legacy-objective-row", async (e) => {
          const row = $(e.currentTarget);
          const oIdx = parseInt(row.attr("data-obj-idx"));

          const nextObjectives = JSON.parse(JSON.stringify(mission.objectives || []));
          const targetObj = nextObjectives[oIdx];
          const isDone = targetObj.completed || (targetObj.current >= targetObj.amount);

          if (isDone) {
            targetObj.current = 0;
            targetObj.completed = false;
          } else {
            targetObj.current = targetObj.amount;
            targetObj.completed = true;
          }

          ui.notifications?.info("Updating objective...");
          try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${group.id}/missions/${mission.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({ objectives: nextObjectives }),
            });
            if (res.ok) {
              ui.notifications?.info("Objective updated!");
              await fetchGroupsData();
              html.closest(".dialog").find(".dialog-buttons button.ok").click();
              setTimeout(() => {
                const freshGroup = [...state.owned, ...state.member].find(g => String(g.id) === String(group.id));
                const freshMission = freshGroup?.missions?.find(m => m.id === mission.id);
                if (freshMission) showMissionDetailModal(freshGroup, freshMission);
              }, 100);
            } else {
              ui.notifications?.error("Failed to update objective.");
            }
          } catch (err) {
            ui.notifications?.error("Server error.");
          }
        });
      }
    }
  }, { width: 420, classes: ["dialog", "silane-custom-dialog"] }).render(true);
}

function showGroupSettingsModal(group) {
  const isFriendInvite = group.friend_invite_enabled !== false;
  const iconVal = group.icon || "";
  const maxMembersVal = group.max_members || 12;

  const content = `
    <div style="padding: 10px; color: white; max-height: 70vh; overflow-y: auto; font-family: sans-serif;">
      <div style="margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
        <label style="display:block; color:#e4e4e7; font-weight: 500;">Group Icon</label>
        <div style="display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; padding: 12px; border-radius: 8px;">
          <div id="hs-group-icon-preview" style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.05); border: 2px solid ${group.color || '#6366f1'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${iconVal ? `<img src="${iconVal}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<i class="fa-solid fa-users" style="font-size: 20px; color: #a1a1aa;"></i>`}
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="hs-edit-group-icon" class="silane-input" style="width:100%; border-radius:6px; padding:6px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b; font-size: 11px;" placeholder="Icon URL (e.g. icons/svg/clockwork.svg)" value="${iconVal}" />
            <div style="display: flex; gap: 6px;">
              <input type="file" id="hs-group-icon-file" style="display: none;" accept="image/*" />
              <button type="button" id="hs-btn-upload-group-icon" style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8; border-radius: 4px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer;">
                <i class="fa-solid fa-upload"></i> Upload
              </button>
              <button type="button" id="hs-btn-remove-group-icon" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 4px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer;">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Group Name</label>
        <input type="text" id="hs-edit-group-name" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" value="${group.name}" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Description</label>
        <textarea id="hs-edit-group-desc" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b; resize: vertical; min-height: 60px;">${group.description || ''}</textarea>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
          <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Color Tag</label>
          <input type="color" id="hs-edit-group-color" style="width:100%; height:40px; border-radius:6px; border: 1px solid #52525b; background: transparent; cursor: pointer; padding: 0;" value="${group.color || '#6366f1'}" />
        </div>
        <div>
          <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Max Members (Max 12)</label>
          <input type="number" id="hs-edit-group-max" class="silane-input" style="width:100%; height:40px; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" value="${maxMembersVal}" min="1" max="12" />
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Group Password (Optional)</label>
        <input type="password" id="hs-edit-group-pass" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" placeholder="Enter to change password" />
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 5px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="hs-edit-group-invite" style="width:16px; height:16px; cursor:pointer;" ${isFriendInvite ? 'checked' : ''} />
          <label for="hs-edit-group-invite" style="color:#e4e4e7; font-size:13px; cursor:pointer; font-weight: 500;">Friend Invite Enabled</label>
        </div>
      </div>
    </div>
  `;

  new Dialog({
    title: "Group Settings",
    content: content,
    buttons: {
      save: {
        label: "Save",
        callback: async (html) => {
          const name = html.find("#hs-edit-group-name").val().trim();
          const description = html.find("#hs-edit-group-desc").val().trim();
          const color = html.find("#hs-edit-group-color").val();
          const max_members = Math.min(12, Math.max(1, parseInt(html.find("#hs-edit-group-max").val()) || 12));
          const password = html.find("#hs-edit-group-pass").val().trim();
          const friend_invite_enabled = html.find("#hs-edit-group-invite").is(":checked");
          const icon = html.find("#hs-edit-group-icon").val().trim();

          if (!name) return ui.notifications?.warn("Name cannot be empty.");

          ui.notifications?.info("Updating settings...");
          const body = {
            name,
            description,
            color,
            max_members,
            icon: icon || null,
            friend_invite_enabled,
            ...(password ? { password } : {})
          };

          try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${group.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify(body),
            });
            if (res.ok) {
              ui.notifications?.info("Settings updated successfully!");
              await fetchGroupsData();
            } else {
              const result = await res.json();
              ui.notifications?.error(result.message || "Failed to update settings.");
            }
          } catch (e) {
            ui.notifications?.error("Server error.");
          }
        }
      },
      cancel: { label: "Cancel" }
    },
    default: "save",
    render: (html) => {
      applyDarkThemeToDialog(html);

      const fileInput = html.find("#hs-group-icon-file");
      const uploadBtn = html.find("#hs-btn-upload-group-icon");
      const removeBtn = html.find("#hs-btn-remove-group-icon");
      const iconInput = html.find("#hs-edit-group-icon");
      const previewDiv = html.find("#hs-group-icon-preview");

      const updatePreview = (url) => {
        if (url) {
          previewDiv.html(`<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" />`);
        } else {
          previewDiv.html(`<i class="fa-solid fa-users" style="font-size: 20px; color: #a1a1aa;"></i>`);
        }
      };

      iconInput.on("input", () => {
        updatePreview(iconInput.val().trim());
      });

      uploadBtn.click(() => fileInput.click());

      removeBtn.click(() => {
        iconInput.val("");
        updatePreview("");
      });

      fileInput.change(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        ui.notifications?.info("Uploading icon...");
        uploadBtn.html('<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading...');
        uploadBtn.prop('disabled', true);

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(`${API_BASE_URL}/api/silane_assets/upload`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`
            },
            body: formData
          });

          const result = await response.json();
          if (response.ok && result.success) {
            const url = result.data?.url;
            iconInput.val(url);
            updatePreview(url);
            ui.notifications?.info("Icon uploaded successfully!");
          } else {
            ui.notifications?.error(result.message || "Failed to upload icon.");
          }
        } catch (err) {
          ui.notifications?.error("Failed to upload icon.");
        } finally {
          uploadBtn.html('<i class="fa-solid fa-upload"></i> Upload Icon');
          uploadBtn.prop('disabled', false);
          fileInput.val("");
        }
      });
    }
  }, { width: 380, classes: ["dialog", "silane-custom-dialog"] }).render(true);
}

function showGroupRolesModal(group) {
  const roles = Array.isArray(group.roles) ? group.roles : [
    { name: "Owner", permissions: ["manage_group", "invite", "kick"] },
    { name: "Member", permissions: ["view"] }
  ];

  const renderRolesList = (html, currentGroup) => {
    const container = html.find("#hs-roles-list-container");
    container.empty();

    const currentRoles = Array.isArray(currentGroup.roles) ? currentGroup.roles : roles;

    currentRoles.forEach((r, idx) => {
      const isOwnerRole = String(r.name).toLowerCase() === "owner";
      const isMemberRole = String(r.name).toLowerCase() === "member";
      const perms = Array.isArray(r.permissions) ? r.permissions : [];

      const card = $(`
        <div style="background: rgba(0,0,0,0.2); border: 1px solid #3f3f46; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: bold; font-size: 14px; color: #f4f4f5;">
              ${r.name} 
              ${isOwnerRole ? '<span style="font-size: 9px; color: #818cf8; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); padding: 1px 4px; border-radius: 4px; margin-left: 6px;">Owner</span>' : ''}
            </div>
            <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px; line-height: 1.4;">
              Permissions: ${perms.length > 0 ? perms.join(", ") : "None"}
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="hs-edit-role-btn" data-index="${idx}" style="background: transparent; border: 1px solid #52525b; color: #e4e4e7; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">
              <i class="fa-solid fa-pen"></i>
            </button>
            ${(!isOwnerRole && !isMemberRole) ? `
              <button class="hs-delete-role-btn" data-index="${idx}" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ""}
          </div>
        </div>
      `);

      card.find(".hs-edit-role-btn").click(() => {
        showEditRoleModal(currentGroup, idx);
      });

      card.find(".hs-delete-role-btn").click(async () => {
        if (!confirm(`Are you sure you want to delete the "${r.name}" role?`)) return;
        const nextRoles = currentRoles.filter((_, i) => i !== idx);

        ui.notifications?.info("Deleting role...");
        try {
          const res = await fetch(`${API_BASE_URL}/api/groups/${currentGroup.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ roles: nextRoles }),
          });
          if (res.ok) {
            ui.notifications?.info("Role deleted successfully.");
            const updated = await fetch(`${API_BASE_URL}/api/groups/${currentGroup.id}`, {
              headers: { Authorization: `Bearer ${getToken()}` }
            });
            const updatedResult = await updated.json();
            if (updatedResult.success) {
              renderRolesList(html, updatedResult.data);
              await fetchGroupsData();
            }
          } else {
            const err = await res.json();
            ui.notifications?.error(err.message || "Failed to delete role.");
          }
        } catch (e) {
          ui.notifications?.error("Server error deleting role.");
        }
      });

      container.append(card);
    });
  };

  const content = `
    <div style="padding: 10px; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="margin:0; font-size:14px; color:#e4e4e7;">Group Roles</h4>
        <button id="hs-add-role-btn" style="background: #2563eb; border: none; color: white; border-radius: 4px; padding: 4px 8px; font-size:11px; cursor:pointer;">
          <i class="fa-solid fa-plus"></i> Add Role
        </button>
      </div>
      <div id="hs-roles-list-container" style="display:flex; flex-direction:column; gap:10px; max-height: 400px; overflow-y: auto;">
        <!-- Injected role cards -->
      </div>
    </div>
  `;

  new Dialog({
    title: "Manage Group Roles",
    content: content,
    buttons: {
      close: { label: "Close" }
    },
    default: "close",
    render: (html) => {
      applyDarkThemeToDialog(html);
      renderRolesList(html, group);

      html.find("#hs-add-role-btn").click(() => {
        showEditRoleModal(group, -1);
      });
    }
  }, { width: 420, classes: ["dialog", "silane-custom-dialog"] }).render(true);
}

function showEditRoleModal(group, roleIndex = -1) {
  const currentRoles = Array.isArray(group.roles) ? group.roles : [
    { name: "Owner", permissions: ["manage_group", "invite", "kick"] },
    { name: "Member", permissions: ["view"] }
  ];
  const isEdit = roleIndex >= 0;
  const role = isEdit ? currentRoles[roleIndex] : { name: "", permissions: ["view"] };

  const availablePerms = [
    { key: "manage_group", label: "Manage settings / roles" },
    { key: "invite", label: "Invite new members" },
    { key: "kick", label: "Kick members" },
    { key: "view", label: "View shared resources" }
  ];

  const checkboxesHtml = availablePerms.map(p => `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
      <input type="checkbox" class="role-perm-checkbox" value="${p.key}" ${role.permissions.includes(p.key) ? 'checked' : ''} />
      <span style="font-size: 13px;">${p.label}</span>
    </div>
  `).join("");

  const content = `
    <div style="padding: 10px; color: white;">
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Role Name</label>
        <input type="text" id="hs-edit-role-name" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" value="${role.name}" placeholder="e.g. Moderator" ${String(role.name).toLowerCase() === 'owner' ? 'disabled' : ''} />
      </div>
      <div>
        <label style="display:block; margin-bottom:8px; color:#e4e4e7; font-weight: 500;">Permissions</label>
        ${checkboxesHtml}
      </div>
    </div>
  `;

  new Dialog({
    title: isEdit ? `Edit Role: ${role.name}` : "Add Role",
    content: content,
    buttons: {
      save: {
        label: "Save",
        callback: async (html) => {
          const name = html.find("#hs-edit-role-name").val().trim();
          if (!name) return ui.notifications?.warn("Role name is required.");

          const permissions = [];
          html.find(".role-perm-checkbox:checked").each((i, el) => {
            permissions.push($(el).val());
          });

          let nextRoles;
          if (isEdit) {
            nextRoles = currentRoles.map((r, i) => i === roleIndex ? { ...r, name, permissions } : r);
          } else {
            if (currentRoles.some(r => r.name.toLowerCase() === name.toLowerCase())) {
              return ui.notifications?.warn("A role with this name already exists.");
            }
            nextRoles = [...currentRoles, { name, permissions }];
          }

          ui.notifications?.info("Saving role...");
          try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${group.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({ roles: nextRoles }),
            });
            if (res.ok) {
              ui.notifications?.info("Role saved successfully!");
              await fetchGroupsData();
              const updated = await fetch(`${API_BASE_URL}/api/groups/${group.id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
              });
              const updatedResult = await updated.json();
              if (updatedResult.success) {
                showGroupRolesModal(updatedResult.data);
              }
            } else {
              const err = await res.json();
              ui.notifications?.error(err.message || "Failed to save role.");
            }
          } catch (e) {
            ui.notifications?.error("Server error.");
          }
        }
      },
      cancel: { label: "Cancel" }
    },
    default: "save",
    render: applyDarkThemeToDialog
  }, { width: 320, classes: ["dialog", "silane-custom-dialog"] }).render(true);
}

function showCreateGroupModal() {
  const content = `
    <div style="padding: 10px; color: white;">
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Group Name</label>
        <input type="text" id="hs-create-group-name" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" placeholder="e.g. Critical Role Campaign" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Description</label>
        <textarea id="hs-create-group-desc" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b; resize: vertical; min-height: 60px;" placeholder="Optional campaign description..."></textarea>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Color Tag</label>
        <input type="color" id="hs-create-group-color" style="width:100%; height:40px; border-radius:6px; border: 1px solid #52525b; background: transparent; cursor: pointer;" value="#6366f1" />
      </div>
      <div style="margin-bottom: 5px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Group Password (Optional)</label>
        <input type="password" id="hs-create-group-pass" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" placeholder="Required to join if set" />
      </div>
    </div>
  `;

  new Dialog(
    {
      title: "Create Campaign Group",
      content: content,
      buttons: {
        create: {
          label: "Create",
          callback: async (html) => {
            const name = html.find("#hs-create-group-name").val().trim();
            const description = html.find("#hs-create-group-desc").val().trim();
            const color = html.find("#hs-create-group-color").val();
            const password = html.find("#hs-create-group-pass").val().trim();

            if (!name) return ui.notifications?.warn("Name cannot be empty.");

            ui.notifications?.info("Creating group...");
            try {
              const res = await fetch(`${API_BASE_URL}/api/groups`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ name, description, color, password }),
              });
              const result = await res.json();
              if (res.ok) {
                ui.notifications?.info("Group created successfully!");
                await fetchGroupsData();
              } else {
                ui.notifications?.error(result.message || "Failed to create group.");
              }
            } catch (e) {
              ui.notifications?.error("Server error.");
            }
          },
        },
        cancel: { label: "Cancel" },
      },
      default: "create",
      render: applyDarkThemeToDialog,
    },
    { width: 380, classes: ["dialog", "silane-custom-dialog"] },
  ).render(true);
}

function showJoinGroupModal() {
  const content = `
    <div style="padding: 10px; color: white;">
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Invite Code / share code</label>
        <input type="text" id="hs-join-group-code" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" autofocus placeholder="Enter code (e.g. 3B8F2A)..." />
      </div>
      <div style="margin-bottom: 5px;">
        <label style="display:block; margin-bottom:5px; color:#e4e4e7; font-weight: 500;">Password (Optional)</label>
        <input type="password" id="hs-join-group-pass" class="silane-input" style="width:100%; border-radius:6px; padding:8px; background: rgba(0,0,0,0.3); color: #ffffff; border: 1px solid #52525b;" placeholder="Enter password if required" />
      </div>
    </div>
  `;

  new Dialog(
    {
      title: "Join Group",
      content: content,
      buttons: {
        join: {
          label: "Join",
          callback: async (html) => {
            const code = html.find("#hs-join-group-code").val().trim();
            const password = html.find("#hs-join-group-pass").val().trim();

            if (!code) return ui.notifications?.warn("Invite code cannot be empty.");

            ui.notifications?.info("Joining group...");
            try {
              const res = await fetch(`${API_BASE_URL}/api/groups/join`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ code, password }),
              });
              const result = await res.json();
              if (res.ok) {
                ui.notifications?.info("Successfully joined group!");
                await fetchGroupsData();
              } else {
                ui.notifications?.error(result.message || "Failed to join group.");
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

