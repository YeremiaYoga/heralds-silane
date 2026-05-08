import * as hs from "./heraldSilane.js";
import { initializeApiBaseUrl } from "./helper.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    hs.heraldSilane_renderAccessButton();
  }, 1000);
});

Hooks.once("init", () => {
  game.settings.register("heralds-silane", "apiMode", {
    name: "API Environment",
    scope: "client",
    config: true,
    type: String,
    choices: {
      local: "Local",
      prod: "Production",
    },
    default: "prod",
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