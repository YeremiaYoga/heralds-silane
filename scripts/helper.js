export let API_BASE_URL = "https://azcn87b0k85drpfp.phanneldeliver.my.id";

export const initializeApiBaseUrl = () => {
  const mode = game.settings.get("heralds-silane", "apiMode");
  if (mode === "local") {
    API_BASE_URL = "http://localhost:19984";
  } else if (mode === "prod") {
    API_BASE_URL = "https://azcn87b0k85drpfp.phanneldeliver.my.id";
  } else {
    // mode === "auto" (default)
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname.startsWith("192.168.") || 
                    window.location.hostname.startsWith("10.");
    API_BASE_URL = isLocal
      ? "http://localhost:19984"
      : "https://azcn87b0k85drpfp.phanneldeliver.my.id";
  }
};
export function heraldSilane_getWindowDimensions() {
  const size = game.settings.get("heralds-silane", "windowSize");
  let dims;

  switch (size) {
    case "small": dims = { width: 600, height: 400 }; break;
    case "medium": dims = { width: 750, height: 500 }; break;
    case "xlarge": dims = { width: 1100, height: 700 }; break;
    case "xxlarge": dims = { width: 1300, height: 800 }; break;
    case "large":
    default: dims = { width: 900, height: 580 }; break;
  }

  dims.overrideHeight = dims.height - 30;
  return dims;
}

// 🔥 TAMBAHKAN HELPER INI UNTUK KONVERSI HEX KE RGB
export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export const applyDarkThemeToDialog = (html) => {
  const dialogElement = html.closest(".app")?.[0] || html.closest(".dialog")?.[0];
  const contentElement = dialogElement?.querySelector(".window-content");
  if (contentElement) {
    contentElement.style.backgroundColor = "#18181b";
    contentElement.style.color = "white";
    contentElement.style.backgroundImage = "none";
  }

  html.closest(".dialog")?.find(".dialog-buttons button").css({
    color: "white",
    border: "1px solid #3f3f46",
    background: "rgba(0,0,0,0.4)",
  });
};