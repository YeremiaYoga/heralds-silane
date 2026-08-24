import * as hs from "./heraldSilane.js";
import { initializeApiBaseUrl, API_BASE_URL } from "./helper.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    hs.heraldSilane_renderAccessButton();
  }, 1000);

  try {
    const worldId = game.world.id;
    const worldTitle = game.world.title;
    const actors = game.actors.contents
      .filter(a => a.type === "character" || a.type === "pc" || a.type === "npc")
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img || "icons/svg/mystery-man.svg",
        type: a.type
      }));

    let backups = {};
    try {
      const stored = localStorage.getItem("heraldSilane_worldBackups");
      if (stored) backups = JSON.parse(stored);
    } catch (e) {}

    backups[worldId] = {
      id: worldId,
      title: worldTitle,
      lastUpdated: new Date().toISOString(),
      actors: actors
    };

    localStorage.setItem("heraldSilane_worldBackups", JSON.stringify(backups));
  } catch (e) {
    console.error("Herald Silane - Failed to auto-cache world actors:", e);
  }
  setTimeout(() => {
    checkAndRunAutoBackup();
    setInterval(checkAndRunAutoBackup, 15 * 60 * 1000);
  }, 5000);
});

async function checkAndRunAutoBackup() {
  if (!game.user.isGM) return;

  const settings = game.settings.get("heralds-silane", "backupSettings") || {
    enabled: false,
    hour: "12:00",
    targets: {}
  };
  if (!settings.enabled) return;

  const now = new Date();
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  let scheduledHour = 12;
  let scheduledMinute = 0;

  const timeStr = String(settings.hour || "12:00");
  if (timeStr.includes(":")) {
    const parts = timeStr.split(":");
    scheduledHour = parseInt(parts[0]) || 0;
    scheduledMinute = parseInt(parts[1]) || 0;
  } else {
    scheduledHour = parseInt(timeStr) || 0;
    scheduledMinute = 0;
  }

  if (currentH < scheduledHour) return;
  if (currentH === scheduledHour && currentM < scheduledMinute) return;

  const todayStr = now.toDateString();
  const lastBackupDate = game.settings.get("heralds-silane", "lastAutoBackupDate");

  if (lastBackupDate === todayStr) return;

  console.log(`Herald Silane - Auto-backup triggered at ${now.toLocaleTimeString()}`);

  const targets = settings.targets || {};
  const selectedActorIds = Object.keys(targets).filter(id => targets[id] === true);

  if (selectedActorIds.length === 0) {
    console.log("Herald Silane - No actors selected for auto-backup.");
    await game.settings.set("heralds-silane", "lastAutoBackupDate", todayStr);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const actorId of selectedActorIds) {
    const actor = game.actors.get(actorId);
    if (!actor) continue;

    try {
      const actorData = actor.toObject();
      const token = localStorage.getItem("heraldSilane_token");
      const worldId = game.world.id;
      const worldTitle = game.world.title;

      const response = await fetch(`${API_BASE_URL}/api/silane_assets/character/backup/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: actorId,
          name: actor.name,
          worldId: worldId,
          worldTitle: worldTitle,
          actorData: actorData
        })
      });

      if (response.ok) {
        successCount++;
      } else {
        failCount++;
        console.error(`Herald Silane - Auto-backup failed for ${actor.name}`);
      }
    } catch (err) {
      failCount++;
      console.error(`Herald Silane - Auto-backup error for ${actor.name}:`, err);
    }
  }

  await game.settings.set("heralds-silane", "lastAutoBackupDate", todayStr);
  if (successCount > 0 || failCount > 0) {
    ui.notifications?.info(`Herald Silane: Auto-backup completed. Success: ${successCount}, Failed: ${failCount}`);
  }
}

Hooks.once("init", () => {
  game.settings.register("heralds-silane", "apiMode", {
    name: "API Environment",
    scope: "client",
    config: true,
    type: String,
    choices: {
      auto: "Auto Detect",
      local: "Local",
      prod: "Production",
    },
    default: "auto",
    requiresReload: true,
  });

  initializeApiBaseUrl();

  game.settings.register("heralds-silane", "windowSize", {
    name: "Silane Window Size",
    scope: "client",
    config: false,
    type: String,
    default: "large",
  });

  game.settings.register("heralds-silane", "characterDetailMode", {
    name: "Character Detail View",
    scope: "client",
    config: false,
    type: String,
    default: "all",
  });

  game.settings.register("heralds-silane", "folderColor", {
    name: "Folder Color",
    scope: "client",
    config: false,
    type: String,
    default: "#fbbf24",
  });

  game.settings.register("heralds-silane", "borderColor", {
    name: "Border Color",
    scope: "client",
    config: false,
    type: String,
    default: "#fbbf24",
  });

  game.settings.register("heralds-silane", "syncColors", {
    name: "Sync Colors",
    scope: "client",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register("heralds-silane", "backupSettings", {
    name: "Backup Settings",
    scope: "world",
    config: false,
    type: Object,
    default: {
      enabled: false,
      hour: 12,
      targets: {}
    }
  });

  game.settings.register("heralds-silane", "lastAutoBackupDate", {
    name: "Last Auto Backup Date",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register("heralds-silane", "worldGroupId", {
    name: "World Group Silane ID",
    hint: "The Silane Group ID for this world",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register("heralds-silane", "storageConfig", {
    name: "Storage Configuration",
    hint: "Storage method (Local / S3) and credentials for imported character assets",
    scope: "world",
    config: false,
    type: Object,
    default: {
      method: "local",
      localPath: "assets/silane/character/art",
      s3: {
        endpoint: "",
        accessKeyId: "",
        secretAccessKey: "",
        region: "us-east-1",
        bucket: ""
      }
    }
  });
});