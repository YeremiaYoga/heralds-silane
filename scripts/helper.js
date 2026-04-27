// export const API_BASE_URL = "http://localhost:19984";
export const API_BASE_URL = "https://azcn87b0k85drpfp.phanneldeliver.my.id";


export function heraldSilane_getWindowDimensions() {
  const size = game.settings.get("herald-silane", "windowSize");
  let dims;

  switch (size) {
    case "small": 
      dims = { width: 600, height: 400 }; 
      break;
    case "medium": 
      dims = { width: 750, height: 500 }; 
      break;
    case "xlarge": 
      dims = { width: 1100, height: 700 }; 
      break;
    case "xxlarge": 
      dims = { width: 1300, height: 800 }; 
      break;
    case "large":
    default: 
      dims = { width: 900, height: 580 }; 
      break;
  }

  dims.overrideHeight = dims.height - 30;

  return dims;
}