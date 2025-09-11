// blockVideos.js — Don't Show Me Gore! (X Only)
// ----------------------------------------------
// Features:
// - Overlays shields on <video>/<iframe> until explicitly unlocked
// - Skips shielding for ads ("Ad" marker in tweet)
// - Trusted Creators list (persistent via chrome.storage.sync)
// - Inline trust/untrust toggle lives safely INSIDE our shield overlay
//   (avoids touching React-managed DOM!)

// ----------------------
// Globals
// ----------------------
let trustedCreators = [];

// ----------------------
// Trusted Creators Store
// ----------------------
function loadTrustedCreators(callback) {
  chrome.storage.sync.get("trustedCreators", (data) => {
    trustedCreators = data.trustedCreators || [];
    if (callback) callback();
  });
}
function saveTrustedCreators() {
  chrome.storage.sync.set({ trustedCreators });
}

function getTweetHandle(tweet) {
  const link = tweet && tweet.querySelector('a[href^="/"][role="link"]');
  if (link) {
    return "@" + link.getAttribute("href").replace("/", "");
  }
  return null;
}

// ----------------------
// Shield Rendering
// ----------------------
function wrapMediaWithShield(mediaElement) {
  if (mediaElement.dataset.protected === "true") return;
  mediaElement.dataset.protected = "true";

  // Container must allow absolute overlay
  const container = mediaElement.parentElement;
  if (!container) return;
  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const tweet = mediaElement.closest('[data-testid="tweet"]');
  const handle = tweet ? getTweetHandle(tweet) : null;
  const isTrusted = handle && trustedCreators.includes(handle);

  // Build overlay shield
  const shield = document.createElement("div");
  shield.style.cssText = `
    position:absolute; inset:0;
    background:rgba(0,0,0,0.9);
    color:#fff;
    border:2px solid crimson;
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
  `;

  let trustHtml = "";
  if (handle) {
    trustHtml = `
      <div id="trust-toggle"
           style="margin-top:10px; padding:4px 10px; border-radius:4px;
                  font-size:12px; font-weight:bold;
                  background:${isTrusted ? "#0f5132" : "#783c3c"};
                  color:#fff; cursor:pointer;">
        ${isTrusted ? "Trusted" : "+ Trust"} ${handle}
      </div>`;
  }

  shield.innerHTML = `
    <div style="font-size:22px; margin-bottom:8px;">🛡️</div>
    <div style="font-size:14px; margin-bottom:6px;">Protected by Don't Show Me Gore!</div>
    <div style="font-size:12px; color:#aaa;">Click shield to unlock</div>
    ${trustHtml}
  `;

  container.appendChild(shield);

  // Pause initially
  mediaElement.pause?.();

  // Unlock logic
  function unlockAndRemove() {
    shield.style.transition = "opacity 0.25s ease";
    shield.style.opacity = "0";
    setTimeout(() => {
      shield.remove();
      mediaElement.muted = true;
      mediaElement.play?.().catch(() => {});
    }, 250);
  }

  // Trust logic
  if (handle) {
    const btn = shield.querySelector("#trust-toggle");
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); e.preventDefault();
      if (trustedCreators.includes(handle)) {
        trustedCreators = trustedCreators.filter(h => h !== handle);
      } else {
        trustedCreators.push(handle);
      }
      saveTrustedCreators();
      unlockAndRemove();
    });
  }

  shield.addEventListener("click", (e) => {
    if (e.target.id !== "trust-toggle") {
      unlockAndRemove();
    }
  });
}

// ----------------------
// Filters
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

// ----------------------
// Protect Media
// ----------------------
function protectMedia() {
  document.querySelectorAll("video:not([data-protected])").forEach((vid) => {
    if (isAdElement(vid) || isTrusted(vid)) {
      vid.dataset.protected = "true";
    } else {
      wrapMediaWithShield(vid);
    }
  });

  document.querySelectorAll("iframe:not([data-protected])").forEach((frame) => {
    if (frame.src.includes("twitter.com") || frame.src.includes("x.com")) {
      if (isAdElement(frame) || isTrusted(frame)) {
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
  loadTrustedCreators(() => {
    chrome.storage.sync.get("shieldEnabled", (data) => {
      if (data.shieldEnabled === false) return;
      protectMedia();
      const observer = new MutationObserver(() => {
        protectMedia();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });
}

initShield();
