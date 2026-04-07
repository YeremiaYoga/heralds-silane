import * as hs from "./heraldSilane.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    hs.heraldSilane_renderAccessButton();
  }, 1000);
});
