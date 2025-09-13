// blockVideos.js — Don't Show Me Gore!
// -------------------------------------

let trustedCreators = [];
let overlayPreset = "custom";

// Overlay vars
let overlayMode = "solid";
let overlayColor = "#000000";
let overlayOpacity = 0.9;
let overlayGradientStart = "#1DA1F2";
let overlayGradientEnd = "#15202b";
let overlayGradientAngle = 135;
let overlayBorderEnabled = true;
let overlayBorderColor = "#FF0000";
let overlayBorderWidth = 3;

// Presets map
const overlayPresets = {
  twitterDark: {
    mode: "solid",
    color: "#000000",
    opacity: 0.9,
    borderEnabled: true,
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },
  twitterLight: {
    mode: "solid",
    color: "#FFFFFF",
    opacity: 0.9,
    borderEnabled: true,
    borderColor: "#000000",
    borderWidth: 2,
  },
  skyGradient: {
    mode: "gradient",
    gradientStart: "#1DA1F2",
    gradientEnd: "#15202B",
    gradientAngle: 135,
    opacity: 0.9,
  },
  sunrise: {
    mode: "gradient",
    gradientStart: "#FF9A9E",
    gradientEnd: "#FAD0C4",
    gradientAngle: 45,
    opacity: 0.9,
  },
  emerald: {
    mode: "gradient",
    gradientStart: "#10B981",
    gradientEnd: "#064E3B",
    gradientAngle: 135,
    opacity: 0.9,
  },
};

// ----------------------
// Settings load/save
// ----------------------
function loadSettings(callback) {
  chrome.storage.sync.get(
    {
      trustedCreators: [],
      shieldEnabled: true,
      overlayPreset: "custom",
      overlayMode: "solid",
      overlayColor: "#000000",
      overlayOpacity: 0.9,
      overlayGradientStart: "#1DA1F2",
      overlayGradientEnd: "#15202b",
      overlayGradientAngle: 135,
      overlayBorderEnabled: true,
      overlayBorderColor: "#FF0000",
      overlayBorderWidth: 3,
    },
    (data) => {
      trustedCreators = data.trustedCreators || [];
      overlayPreset = data.overlayPreset || "custom";

      if (overlayPreset !== "custom" && overlayPresets[overlayPreset]) {
        const preset = overlayPresets[overlayPreset];
        overlayMode = preset.mode || overlayMode;
        overlayColor = preset.color || overlayColor;
        overlayOpacity = preset.opacity || overlayOpacity;
        overlayGradientStart = preset.gradientStart || overlayGradientStart;
        overlayGradientEnd = preset.gradientEnd || overlayGradientEnd;
        overlayGradientAngle = preset.gradientAngle || overlayGradientAngle;
        overlayBorderEnabled =
          preset.borderEnabled !== undefined
            ? preset.borderEnabled
            : overlayBorderEnabled;
        overlayBorderColor = preset.borderColor || overlayBorderColor;
        overlayBorderWidth =
          preset.borderWidth !== undefined
            ? preset.borderWidth
            : overlayBorderWidth;
      } else {
        overlayMode = data.overlayMode;
        overlayColor = data.overlayColor;
        overlayOpacity = data.overlayOpacity;
        overlayGradientStart = data.overlayGradientStart;
        overlayGradientEnd = data.overlayGradientEnd;
        overlayGradientAngle = data.overlayGradientAngle;
        overlayBorderEnabled = data.overlayBorderEnabled;
        overlayBorderColor = data.overlayBorderColor;
        overlayBorderWidth = data.overlayBorderWidth;
      }

      if (callback) callback(data.shieldEnabled);
    }
  );
}

// ----------------------
// Helpers
// ----------------------
function getTweetHandle(tweet) {
  const link = tweet && tweet.querySelector('a[href^="/"][role="link"]');
  if (link) return "@" + link.getAttribute("href").replace("/", "");
  return null;
}

function rgbaFromHex(hex, opacity) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function buildOverlayBackground() {
  if (overlayMode === "gradient") {
    return `linear-gradient(${overlayGradientAngle}deg, ${overlayGradientStart}, ${overlayGradientEnd})`;
  }
  return rgbaFromHex(overlayColor, overlayOpacity);
}

// ----------------------
// Shield Rendering
// ----------------------
function wrapMediaWithShield(mediaElement) {
  if (mediaElement.dataset.protected === "true") return;
  mediaElement.dataset.protected = "true";

  const container = mediaElement.parentElement;
  if (!container) return;
  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const tweet = mediaElement.closest('[data-testid="tweet"]');
  const handle = tweet ? getTweetHandle(tweet) : null;
  const isTrusted = handle && trustedCreators.includes(handle);

  const shield = document.createElement("div");
  const background = buildOverlayBackground();
  const borderStyle = overlayBorderEnabled
    ? `${overlayBorderWidth}px solid ${overlayBorderColor}`
    : "none";

  shield.style.cssText = `
    position:absolute; inset:0;
    background:${background};
    border:${borderStyle};
    border-radius:6px;
    z-index:999999;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    cursor:pointer;
    pointer-events:auto;
    padding:20px;
    color:#fff;
  `;

  shield.innerHTML = `
    <div style="font-size:22px; margin-bottom:8px;">🛡️</div>
    <div style="font-size:14px; margin-bottom:6px;">Protected by Don't Show Me Gore!</div>
    <div style="font-size:12px; color:#aaa;">Click shield to unlock</div>
  `;

  container.appendChild(shield);
  mediaElement.pause?.();

  shield.addEventListener("click", () => {
    shield.style.transition = "opacity 0.25s ease";
    shield.style.opacity = "0";
    setTimeout(() => {
      shield.remove();
      mediaElement.muted = true;
      mediaElement.play?.().catch(() => {});
    }, 250);
  });
}

// ----------------------
// Filters + Protection
// ----------------------
function isTrusted(mediaElement) {
  const tweet = mediaElement.closest('[data-testid="tweet"]');
  const handle = tweet && getTweetHandle(tweet);
  return handle && trustedCreators.includes(handle);
}

function isAdElement(mediaElement) {
  const tweet = mediaElement.closest('[data-testid="tweet"]');
  if (!tweet) return false;
  return Array.from(tweet.querySelectorAll("span")).some(
    (s) => s.textContent.trim() === "Ad"
  );
}

function protectMedia() {
  document.querySelectorAll("video:not([data-protected])").forEach((vid) => {
    if (isAdElement(vid) || isTrusted(vid)) {
      vid.dataset.protected = "true";
    } else {
      wrapMediaWithShield(vid);
    }
  });
}

// ----------------------
// Init
// ----------------------
function initShield() {
  loadSettings((enabled) => {
    if (!enabled) return;
    protectMedia();
    const observer = new MutationObserver(() => protectMedia());
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

initShield();
