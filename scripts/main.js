import * as hs from "./heraldSilane.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    hs.heraldSilane_renderAccessButton();
  }, 1000);
});


Hooks.once("init", () => {
  game.settings.register("herald-silane", "windowSize", {
    name: "Silane Window Size",
    scope: "client",
    config: false, 
    type: String,
    default: "large",
  });

  game.settings.register("herald-silane", "characterDetailMode", {
    name: "Character Detail View",
    scope: "client",
    config: false,
    type: String,
    default: "all",
  });

  game.settings.register("herald-silane", "folderColor", {
    name: "Folder Color",
    scope: "client",
    config: false, 
    type: String,
    default: "#fbbf24", 
  });

  // 🔥 SETTING UNTUK BORDER COLOR
  game.settings.register("herald-silane", "borderColor", {
    name: "Border Color",
    scope: "client",
    config: false, 
    type: String,
    default: "#fbbf24", 
  });

  game.settings.register("herald-silane", "syncColors", {
    name: "Sync Colors",
    scope: "client",
    config: false, 
    type: Boolean,
    default: true, 
  });
});

