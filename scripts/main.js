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
});