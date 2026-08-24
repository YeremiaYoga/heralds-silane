export let API_BASE_URL = "https://azcn87b0k85drpfp.phanneldeliver.my.id";
export const initializeApiBaseUrl = () => {
  const mode = game.settings.get("heralds-silane", "apiMode");
  if (mode === "local") {
    API_BASE_URL = "http://localhost:19984";
  } else if (mode === "prod") {
    API_BASE_URL = "https://azcn87b0k85drpfp.phanneldeliver.my.id";
  } else {
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
  const applyStyles = () => {
    const dialogElement = html.closest(".app")?.[0] || html.closest(".dialog")?.[0];
    const contentElement = dialogElement?.querySelector(".window-content");
    if (dialogElement) {
      dialogElement.style.height = "auto";
      dialogElement.style.maxHeight = "85vh";
    }
    if (contentElement) {
      contentElement.style.backgroundColor = "#18181b";
      contentElement.style.color = "white";
      contentElement.style.backgroundImage = "none";
      contentElement.style.overflowY = "auto";
      contentElement.style.maxHeight = "72vh";
    }
    html.closest(".dialog")?.find(".dialog-buttons").css({
      "margin-top": "12px",
      "padding-top": "8px",
      "border-top": "1px solid #3f3f46"
    });
    html.closest(".dialog")?.find(".dialog-buttons button").css({
      color: "white",
      border: "1px solid #3f3f46",
      background: "rgba(0,0,0,0.4)",
      height: "36px",
      "font-weight": "600"
    });
  };

  applyStyles();
  setTimeout(applyStyles, 50);
  setTimeout(applyStyles, 200);
};

export async function ensureDirectoryExistsRecursive(source, targetPath) {
  const parts = targetPath.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    try {
      await FilePicker.createDirectory(source, current, {});
    } catch (e) {
      // Directory may already exist
    }
  }
}

async function hmacSha256(key, message) {
  const g = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const m = typeof message === "string" ? new TextEncoder().encode(message) : message;
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", g, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await window.crypto.subtle.sign("HMAC", cryptoKey, m);
  return new Uint8Array(sig);
}

async function sha256Hex(buffer) {
  const buf = typeof buffer === "string" ? new TextEncoder().encode(buffer) : buffer;
  const hash = await window.crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadImageToS3(file, s3Config) {
  const { endpoint, accessKeyId, secretAccessKey, region = "us-east-1", bucket } = s3Config;

  if (!bucket) {
    ui.notifications?.warn("S3 Bucket is not configured in World Management. Falling back to local storage.");
    return null;
  }

  // 1. Attempt native Foundry S3 upload if FilePicker and S3 source are available
  if (typeof FilePicker !== "undefined" && FilePicker._sources?.s3 && typeof FilePicker.upload === "function") {
    try {
      const targetDir = "assets/silane/character/art";
      const uploadRes = await FilePicker.upload("s3", targetDir, file, { bucket });
      if (uploadRes && uploadRes.path) return uploadRes.path;
    } catch (e) {
      console.warn("Foundry FilePicker S3 upload fallback failed, proceeding to SigV4 REST API:", e);
    }
  }

  if (!accessKeyId || !secretAccessKey) {
    ui.notifications?.error("S3 Access Key ID and Secret Access Key are required for custom S3 uploads.");
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.substring(0, 8);

  const cleanFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const objectPath = `assets/silane/character/art/${cleanFilename}`;

  let host = "";
  let primaryS3Url = "";
  let secondaryS3Url = "";
  let path = "";

  if (endpoint && endpoint.trim()) {
    let cleanEndpoint = endpoint.trim().replace(/\/$/, "");
    if (!cleanEndpoint.startsWith("http://") && !cleanEndpoint.startsWith("https://")) {
      cleanEndpoint = "https://" + cleanEndpoint;
    }
    const urlObj = new URL(cleanEndpoint);
    host = urlObj.host;

    if (host.startsWith(`${bucket}.`)) {
      primaryS3Url = `${cleanEndpoint}/${objectPath}`;
      path = `/${objectPath}`;
    } else {
      primaryS3Url = `${cleanEndpoint}/${bucket}/${objectPath}`;
      secondaryS3Url = `${cleanEndpoint}/${objectPath}`;
      path = `/${bucket}/${objectPath}`;
    }
  } else {
    host = `${bucket}.s3.${region}.amazonaws.com`;
    primaryS3Url = `https://${host}/${objectPath}`;
    path = `/${objectPath}`;
  }

  const payloadHash = await sha256Hex(fileBytes);

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");

  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join("\n");

  const kDate = await hmacSha256("AWS4" + secretAccessKey, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, "s3");
  const kSigning = await hmacSha256(kService, "aws4_request");

  const signatureBytes = await hmacSha256(kSigning, stringToSign);
  const signature = bytesToHex(signatureBytes);

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Try primary URL
  try {
    const uploadResponse = await fetch(primaryS3Url, {
      method: "PUT",
      headers: {
        "Host": host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authorizationHeader,
        "Content-Type": file.type || "application/octet-stream"
      },
      body: fileBytes
    });

    if (uploadResponse.ok) {
      ui.notifications?.info(`Asset successfully uploaded to S3 Bucket [${bucket}]`);
      return primaryS3Url;
    }
  } catch (err) {
    console.warn("Primary S3 upload failed:", err);
  }

  // Try secondary URL (without bucket path prefix)
  if (secondaryS3Url) {
    try {
      const uploadResponse = await fetch(secondaryS3Url, {
        method: "PUT",
        headers: {
          "Host": host,
          "x-amz-date": amzDate,
          "x-amz-content-sha256": payloadHash,
          "Authorization": authorizationHeader,
          "Content-Type": file.type || "application/octet-stream"
        },
        body: fileBytes
      });

      if (uploadResponse.ok) {
        ui.notifications?.info(`Asset successfully uploaded to S3 Bucket [${bucket}]`);
        return secondaryS3Url;
      }
    } catch (err) {
      console.warn("Secondary S3 upload failed:", err);
    }
  }

  return null;
}

export async function downloadAndCacheImageToFoundry(url, filename) {
  if (url && typeof url === "object") {
    url = url.src || url.url || url.path || null;
  }
  if (!url || typeof url !== "string") return url || "icons/svg/mystery-man.svg";
  if (!url.startsWith("http://") && !url.startsWith("https://")) return url;

  try {
    let storageConfig;
    try {
      storageConfig = game.settings.get("heralds-silane", "storageConfig");
    } catch (e) {}

    if (!storageConfig) {
      storageConfig = {
        method: "local",
        localPath: "assets/silane/character/art",
        s3: { endpoint: "", accessKeyId: "", secretAccessKey: "", region: "us-east-1", bucket: "" }
      };
    }

    let blob = null;

    // 1. Try direct fetch
    try {
      const res = await fetch(url);
      if (res.ok) blob = await res.blob();
    } catch (e) {}

    // 2. Try proxy via silane_assets (bypasses browser CORS restrictions on external domain)
    if (!blob) {
      try {
        const proxyUrl = `${API_BASE_URL}/api/silane_assets/proxy-image?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) blob = await res.blob();
      } catch (e) {}
    }

    // 3. Try proxy via root API
    if (!blob) {
      try {
        const proxyUrl = `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) blob = await res.blob();
      } catch (e) {}
    }

    // 4. Try replacing http with https
    if (!blob && url.startsWith("http://")) {
      try {
        const httpsUrl = url.replace("http://", "https://");
        const res = await fetch(httpsUrl);
        if (res.ok) blob = await res.blob();
      } catch (e) {}
    }

    if (!blob) {
      blob = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width || 300;
            canvas.height = img.naturalHeight || img.height || 300;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            try {
              canvas.toBlob((b) => resolve(b), "image/png");
            } catch (err) {
              resolve(null);
            }
          } catch (err) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }

    if (!blob) return url;

    const mimeType = blob.type || "image/png";
    let ext = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
    else if (mimeType.includes("webp")) ext = "webp";
    else if (mimeType.includes("gif")) ext = "gif";
    else if (mimeType.includes("svg")) ext = "svg";

    const cleanName = (filename || "asset").replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanFilename = `${cleanName}_${Date.now()}.${ext}`;
    const file = new File([blob], cleanFilename, { type: mimeType });

    if (storageConfig.method === "s3" && storageConfig.s3) {
      const s3Url = await uploadImageToS3(file, storageConfig.s3);
      if (s3Url) return s3Url;
    }

    // Local Storage Mode (Default): assets/silane/character/art
    const targetDir = storageConfig.localPath || "assets/silane/character/art";
    await ensureDirectoryExistsRecursive("data", targetDir);

    const uploadRes = await FilePicker.upload("data", targetDir, file, {});
    if (uploadRes && uploadRes.path) {
      return uploadRes.path;
    }
  } catch (err) {
    console.warn("Silane Storage Helper: Failed to cache image, using original URL:", err);
  }
  return url;
}

export function sanitizeFoundryItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    if (!item || typeof item !== "object") return item;

    // Fix spell innate suffix
    if (item.type === "spell" && item.name) {
      if (item.name.endsWith(" (In)") || item.name.endsWith(" (in)")) {
        item.name = item.name.slice(0, -5) + " (IN)";
      } else if (item.name.endsWith("(In)") || item.name.endsWith("(in)")) {
        item.name = item.name.slice(0, -4) + " (IN)";
      }

      if (item.name.endsWith("(In)") || item.name.endsWith("(IN)")) {
        if (!item.system) item.system = {};
        item.system.method = "innate";
        item.system.prepared = 0;
        delete item.system.preparation;
      }
    }

    // Fix D&D 5e v3+ Activities validation errors (e.g. SummonActivity profiles validation error like dnd5eactivity001)
    if (item.system && item.system.activities && typeof item.system.activities === "object") {
      Object.entries(item.system.activities).forEach(([actId, activity]) => {
        if (activity && typeof activity === "object") {
          // Fix SummonActivity profiles validation requirement for any summon activity or activity with empty profiles
          if (activity.type === "summon" || actId.toLowerCase().includes("summon") || activity.profiles !== undefined) {
            if (!Array.isArray(activity.profiles) || activity.profiles.length === 0) {
              const profileId = (typeof foundry !== "undefined" && foundry.utils?.randomID)
                ? foundry.utils.randomID()
                : "profile00000000";
              activity.profiles = [
                {
                  _id: profileId,
                  name: "",
                  uuid: "",
                  count: "1",
                  level: { min: null, max: null }
                }
              ];
            }
          }
        }
      });
    }

    return item;
  });
}