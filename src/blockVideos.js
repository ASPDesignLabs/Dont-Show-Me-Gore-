// blockVideos.js — Don't Show Me Gore
// -------------------------------------------------
// Features:
// - Shields autoplay videos/iframes on X/Twitter until clicked
// - Trusted Creators: posts/videos always visible
// - Blacklisted Creators: posts/videos replaced with cat pics
// - Inline Trust / Blacklist buttons injected on neutral tweets
// - Buttons disappear after trust/blacklist
// - Overlay supports presets (solid/gradient), opacity, border, blur
// - Cat pic pool configurable (1–200 images in /cat/)
// - 🚫 Ads are never modified (ToS compliance)

// ----------------------
// Globals
// ----------------------
let trustedCreators = [];
let blacklistedCreators = [];
let overlayPreset = "custom";

let overlayMode = "solid";
let overlayColor = "#000000";
let overlayOpacity = 0.9;
let overlayGradientStart = "#1DA1F2";
let overlayGradientEnd = "#15202b";
let overlayGradientAngle = 135;
let overlayBorderEnabled = true;
let overlayBorderColor = "#FF0000";
let overlayBorderWidth = 3;

let overlayBlurEnabled = false;
let overlayBlurStrength = 8;

let catImageCount = 20;
let catPics = [];

// ----------------------
// Presets
// ----------------------
const overlayPresets = {
  twitterDark: { mode: "solid", color: "#000000", opacity: 0.9, borderEnabled: true, borderColor: "#FFFFFF", borderWidth: 2 },
  twitterLight: { mode: "solid", color: "#FFFFFF", opacity: 0.9, borderEnabled: true, borderColor: "#000000", borderWidth: 2 },
  skyGradient: { mode: "gradient", gradientStart: "#1DA1F2", gradientEnd: "#15202B", gradientAngle: 135, opacity: 0.9 },
  sunrise: { mode: "gradient", gradientStart: "#FF9A9E", gradientEnd: "#FAD0C4", gradientAngle: 45, opacity: 0.9 },
  emerald: { mode: "gradient", gradientStart: "#10B981", gradientEnd: "#064E3B", gradientAngle: 135, opacity: 0.9 },
};

// ----------------------
// Helpers
// ----------------------
function buildCatPicArray() {
  const arr = [];
  const count = Math.min(Math.max(catImageCount, 1), 200);
  for (let i = 1; i <= count; i++) {
    arr.push(chrome.runtime.getURL(`cat/cat${i}.jpg`));
  }
  return arr;
}
function getTweetHandle(tweet) {
  const link = tweet && tweet.querySelector('a[href^="/"][role="link"]');
  if (link) return "@" + link.getAttribute("href").replace("/", "");
  return null;
}
function rgbaFromHex(hex, opacity) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
function buildOverlayBackground() {
  if (overlayMode === "gradient") {
    return `linear-gradient(${overlayGradientAngle}deg, ${overlayGradientStart}, ${overlayGradientEnd})`;
  }
  return rgbaFromHex(overlayColor, overlayOpacity);
}
function pickTextColorForBackground(hex) {
  if (!hex || hex.length < 7) return "#FFFFFF";
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#000000" : "#FFFFFF";
}
function buildButtonStyle(baseColor) {
  const textColor = pickTextColorForBackground(baseColor);
  return `
    background:${baseColor};
    color:${textColor};
    border:${overlayBorderWidth}px solid ${overlayBorderColor};
    padding:2px 6px;
    border-radius:4px;
    font-size:11px;
    cursor:pointer;
  `;
}

// ----------------------
// Settings Loader
// ----------------------
function loadSettings(callback) {
  chrome.storage.sync.get(
    {
      trustedCreators: [],
      blacklistedCreators: [],
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
      overlayBlurEnabled: false,
      overlayBlurStrength: 8,
      catImageCount: 20,
    },
    (data) => {
      trustedCreators = data.trustedCreators || [];
      blacklistedCreators = data.blacklistedCreators || [];
      overlayPreset = data.overlayPreset || "custom";
      overlayMode = data.overlayMode;
      overlayColor = data.overlayColor;
      overlayOpacity = data.overlayOpacity;
      overlayGradientStart = data.overlayGradientStart;
      overlayGradientEnd = data.overlayGradientEnd;
      overlayGradientAngle = data.overlayGradientAngle;
      overlayBorderEnabled = data.overlayBorderEnabled;
      overlayBorderColor = data.overlayBorderColor;
      overlayBorderWidth = data.overlayBorderWidth;
      overlayBlurEnabled = data.overlayBlurEnabled || false;
      overlayBlurStrength = data.overlayBlurStrength ?? 8;
      catImageCount = data.catImageCount ?? 20;
      catPics = buildCatPicArray();
      if (callback) callback(data.shieldEnabled);
    }
  );
}

// ----------------------
// Blacklist Replace
// ----------------------
function replaceWithCat(tweet, handle) {
  if (!catPics.length) catPics = buildCatPicArray();
  const img = catPics[Math.floor(Math.random() * catPics.length)];
  tweet.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center;color:#fff;">
      <div style="width:100%;height:220px;overflow:hidden;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#000;">
        <img src="${img}" style="width:100%; height:100%; object-fit:cover; object-position:center;" />
      </div>
      <p style="margin-top:8px;font-size:14px;color:#aaa;">
        All posts from <strong>${handle}</strong> are hidden.<br/>
        You flagged this creator. Enjoy a cat instead 🐱
      </p>
    </div>
  `;
}

// ----------------------
// Tweet Controls
// ----------------------
function injectTweetControls(tweet, handle) {
  if (!handle) return;
  if (tweet.querySelector(".dsg-controls")) return;
  if (isAdElement(tweet)) return; // 🚫 do not modify ads
  if (trustedCreators.includes(handle) || blacklistedCreators.includes(handle)) {
    return;
  }

  const baseFill = overlayMode === "gradient" ? overlayGradientStart : overlayColor;

  const bar = document.createElement("div");
  bar.className = "dsg-controls";
  bar.style.cssText = `
    position:absolute; top:4px; right:4px;
    display:flex; gap:5px; z-index:100000;
  `;

  const trustBtn = document.createElement("button");
  trustBtn.textContent = "Trust";
  trustBtn.style.cssText = buildButtonStyle(baseFill);

  const blacklistBtn = document.createElement("button");
  blacklistBtn.textContent = "🚫";
  blacklistBtn.style.cssText = buildButtonStyle(baseFill);

  trustBtn.onclick = (e) => {
    e.stopPropagation();
    trustedCreators.push(handle);
    chrome.storage.sync.set({ trustedCreators });
    bar.remove();
  };

  blacklistBtn.onclick = (e) => {
    e.stopPropagation();
    blacklistedCreators.push(handle);
    chrome.storage.sync.set({ blacklistedCreators });
    replaceWithCat(tweet, handle);
  };

  bar.appendChild(trustBtn);
  bar.appendChild(blacklistBtn);
  tweet.style.position = "relative";
  tweet.appendChild(bar);
}

// ----------------------
// Video Shield
// ----------------------
function wrapMediaWithShield(mediaElement) {
  if (mediaElement.dataset.protected === "true") return;
  mediaElement.dataset.protected = "true";

  const tweet = mediaElement.closest('[data-testid="tweet"]');
  const handle = tweet ? getTweetHandle(tweet) : null;

  if (isAdElement(tweet)) {
    mediaElement.dataset.protected = "true"; // 🚫 leave ads untouched
    return;
  }
  if (handle && trustedCreators.includes(handle)) return;

  const container = mediaElement.parentElement;
  if (!container) return;
  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const background = buildOverlayBackground();
  const borderStyle = overlayBorderEnabled
    ? `${overlayBorderWidth}px solid ${overlayBorderColor}`
    : "none";

  const shield = document.createElement("div");
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
    ${overlayBlurEnabled ? 
      `backdrop-filter: blur(${overlayBlurStrength}px); -webkit-backdrop-filter: blur(${overlayBlurStrength}px);` 
      : ""}
  `;

  const baseFill = overlayMode === "gradient" ? overlayGradientStart : overlayColor;

  let actionHtml = "";
  if (handle && !trustedCreators.includes(handle) && !blacklistedCreators.includes(handle)) {
    actionHtml = `
      <div style="margin-top:12px; display:flex; flex-direction:column; gap:6px;">
        <button id="trust-toggle" style="${buildButtonStyle(baseFill)}">
          + Trust ${handle}
        </button>
        <button id="blacklist-toggle" style="${buildButtonStyle(baseFill)}">
          🚫 Blacklist ${handle}
        </button>
      </div>`;
  }

  shield.innerHTML = `
    <div style="font-size:22px; margin-bottom:8px;">🛡️</div>
    <div style="font-size:14px; margin-bottom:6px;">Protected by Don't Show Me Gore!</div>
    <div style="font-size:12px; color:#aaa;">Click shield to unlock</div>
    ${actionHtml}
  `;

  container.appendChild(shield);
  mediaElement.pause?.();

  function unlockAndRemove() {
    shield.style.transition = "opacity 0.25s ease";
    shield.style.opacity = "0";
    setTimeout(() => {
      shield.remove();
      mediaElement.muted = true;
      mediaElement.play?.().catch(() => {});
    }, 250);
  }

  if (handle) {
    const trustBtn = shield.querySelector("#trust-toggle");
    const blacklistBtn = shield.querySelector("#blacklist-toggle");

    if (trustBtn) {
      trustBtn.addEventListener("click", (e) => {
        e.stopPropagation(); e.preventDefault();
        trustedCreators.push(handle);
        chrome.storage.sync.set({ trustedCreators });
        unlockAndRemove();
      });
    }
    if (blacklistBtn) {
      blacklistBtn.addEventListener("click", (e) => {
        e.stopPropagation(); e.preventDefault();
        blacklistedCreators.push(handle);
        chrome.storage.sync.set({ blacklistedCreators });
        replaceWithCat(tweet, handle);
      });
    }
  }

  shield.addEventListener("click", (e) => {
    if (e.target.id !== "trust-toggle" && e.target.id !== "blacklist-toggle") {
      unlockAndRemove();
    }
  });
}

// ----------------------
// Tweet Scan
// ----------------------
function checkTweets() {
  document
    .querySelectorAll('[data-testid="tweet"]:not([data-protected])')
    .forEach((tweet) => {
      const handle = getTweetHandle(tweet);
      if (!handle) return;
      tweet.dataset.protected = "true";

      if (isAdElement(tweet)) {
        return; // 🚫 skip ads entirely
      }

      if (blacklistedCreators.includes(handle)) {
        replaceWithCat(tweet, handle);
        return;
      }

      injectTweetControls(tweet, handle);
    });
}

// ----------------------
// Filters
// ----------------------
function isTrusted(media) {
  const tweet = media.closest('[data-testid="tweet"]');
  const handle = tweet && getTweetHandle(tweet);
  return handle && trustedCreators.includes(handle);
}
function isAdElement(tweet) {
  if (!tweet) return false;
  return Array.from(tweet.querySelectorAll("span")).some(
    (s) => s.textContent.trim() === "Ad"
  );
}

// ----------------------
// Protect Media
// ----------------------
function protectMedia() {
  checkTweets();

  document.querySelectorAll("video:not([data-protected])").forEach((vid) => {
    const tweet = vid.closest('[data-testid="tweet"]');
    if (!tweet) return;

    const handle = getTweetHandle(tweet);
    if (handle && blacklistedCreators.includes(handle)) {
      replaceWithCat(tweet, handle);
      vid.dataset.protected = "true";
      return;
    }
    if (isAdElement(tweet) || isTrusted(vid)) {
      vid.dataset.protected = "true";
    } else {
      wrapMediaWithShield(vid);
    }
  });

  document.querySelectorAll("iframe:not([data-protected])").forEach((frame) => {
    const tweet = frame.closest('[data-testid="tweet"]');
    if (!tweet) return;

    const handle = getTweetHandle(tweet);
    if (handle && blacklistedCreators.includes(handle)) {
      replaceWithCat(tweet, handle);
      frame.dataset.protected = "true";
      return;
    }
    if (frame.src.includes("twitter.com") || frame.src.includes("x.com")) {
      if (isAdElement(tweet) || isTrusted(frame)) {
        frame.dataset.protected = "true";
      } else {
        wrapMediaWithShield(frame);
      }
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
