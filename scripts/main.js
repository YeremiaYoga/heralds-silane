import * as hs from "./heraldSilane.js";
import { initializeApiBaseUrl } from "./helper.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    hs.heraldSilane_renderAccessButton();
  }, 1000);

  // Auto-cache active world actors for Character Backup tab
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
});

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
});