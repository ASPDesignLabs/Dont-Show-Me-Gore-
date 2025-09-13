let trustedCreators = [];
let blacklistedCreators = [];

// ---------------------
// Trusted Handling
// ---------------------
function renderTrusted() {
  const list = document.getElementById("trustedList");
  list.innerHTML = "";

  trustedCreators.forEach((handle, idx) => {
    const item = document.createElement("div");
    item.className =
      "flex items-center justify-between px-2 py-1 border-b border-gray-700";

    const span = document.createElement("span");
    span.className = "text-sm font-semibold";
    span.textContent = handle;

    const removeBtn = document.createElement("button");
    removeBtn.className = "text-red-400 hover:text-red-600 text-xs font-bold";
    removeBtn.textContent = "✖";
    removeBtn.onclick = () => {
      trustedCreators.splice(idx, 1);
      saveTrusted();
      renderTrusted();
    };

    item.append(span, removeBtn);
    list.appendChild(item);
  });
}

function saveTrusted() {
  chrome.storage.sync.set({ trustedCreators });
}

function loadTrusted() {
  chrome.storage.sync.get(["trustedCreators"], (data) => {
    trustedCreators = data.trustedCreators || [];
    renderTrusted();
  });
}

document.getElementById("addBtn").onclick = () => {
  const val = document.getElementById("newHandle").value.trim();
  if (!val) return;
  trustedCreators.push(val);
  saveTrusted();
  document.getElementById("newHandle").value = "";
  renderTrusted();
};

document.getElementById("clearTrustedBtn").onclick = () => {
  if (confirm("Clear trusted creators?")) {
    trustedCreators = [];
    saveTrusted();
    renderTrusted();
  }
};

// ---------------------
// Blacklist Handling
// ---------------------
function renderBlacklist() {
  const list = document.getElementById("blacklistList");
  list.innerHTML = "";

  blacklistedCreators.forEach((handle, idx) => {
    const item = document.createElement("div");
    item.className =
      "flex items-center justify-between px-2 py-1 border-b border-gray-700";

    const span = document.createElement("span");
    span.className = "text-sm font-semibold text-red-400";
    span.textContent = handle;

    const removeBtn = document.createElement("button");
    removeBtn.className = "text-red-400 hover:text-red-600 text-xs font-bold";
    removeBtn.textContent = "✖";
    removeBtn.onclick = () => {
      blacklistedCreators.splice(idx, 1);
      saveBlacklist();
      renderBlacklist();
    };

    item.append(span, removeBtn);
    list.appendChild(item);
  });
}

function saveBlacklist() {
  chrome.storage.sync.set({ blacklistedCreators });
}

function loadBlacklist() {
  chrome.storage.sync.get(["blacklistedCreators"], (data) => {
    blacklistedCreators = data.blacklistedCreators || [];
    renderBlacklist();
  });
}

document.getElementById("clearBlacklistBtn").onclick = () => {
  if (confirm("Clear blacklist?")) {
    blacklistedCreators = [];
    saveBlacklist();
    renderBlacklist();
  }
};

// ---------------------
// Manage Lists Btn
// ---------------------
document.getElementById("manageListBtn").addEventListener("click", () => {
  chrome.windows.create({
    url: "public/trustedManager.html",
    type: "popup",
    width: 500,
    height: 600,
  });
});

// ---------------------
// Export/Import Both Lists
// ---------------------
document.getElementById("exportBtn").onclick = () => {
  const data = {
    trustedCreators,
    blacklistedCreators,
  };
  document.getElementById("importArea").value = JSON.stringify(
    data,
    null,
    2
  );
};

document.getElementById("importBtn").onclick = () => {
  try {
    const raw = document.getElementById("importArea").value.trim();
    if (!raw) return;
    const data = JSON.parse(raw);

    if (Array.isArray(data.trustedCreators)) {
      trustedCreators = data.trustedCreators;
      saveTrusted();
      renderTrusted();
    }
    if (Array.isArray(data.blacklistedCreators)) {
      blacklistedCreators = data.blacklistedCreators;
      saveBlacklist();
      renderBlacklist();
    }
  } catch (err) {
    alert("Invalid JSON. Please check and try again.");
  }
};

// ---------------------
// Overlay Settings
// ---------------------
function saveOverlaySettings() {
  const data = {
    overlayPreset: document.getElementById("overlayPreset").value,
    overlayMode: document.getElementById("overlayMode").value,
    overlayColor: document.getElementById("overlayColor").value,
    overlayOpacity:
      parseInt(document.getElementById("overlayOpacity").value, 10) / 100,
    overlayGradientStart: document.getElementById("overlayGradientStart").value,
    overlayGradientEnd: document.getElementById("overlayGradientEnd").value,
    overlayGradientAngle: parseInt(
      document.getElementById("overlayGradientAngle").value,
      10
    ),
    overlayBorderEnabled:
      document.getElementById("overlayBorderEnabled").checked,
    overlayBorderColor: document.getElementById("overlayBorderColor").value,
    overlayBorderWidth: parseInt(
      document.getElementById("overlayBorderWidth").value,
      10
    ),
  };

  chrome.storage.sync.set(data);
}

function loadOverlaySettings() {
  chrome.storage.sync.get(
    [
      "overlayPreset",
      "overlayMode",
      "overlayColor",
      "overlayOpacity",
      "overlayGradientStart",
      "overlayGradientEnd",
      "overlayGradientAngle",
      "overlayBorderEnabled",
      "overlayBorderColor",
      "overlayBorderWidth",
    ],
    (data) => {
      document.getElementById("overlayPreset").value =
        data.overlayPreset || "custom";

      document.getElementById("overlayMode").value = data.overlayMode || "solid";
      document.getElementById("overlayColor").value =
        data.overlayColor || "#000000";

      const percent = Math.round((data.overlayOpacity ?? 0.9) * 100);
      document.getElementById("overlayOpacity").value = percent;
      document.getElementById("opacityValue").textContent = percent + "%";

      document.getElementById("overlayGradientStart").value =
        data.overlayGradientStart || "#1DA1F2";
      document.getElementById("overlayGradientEnd").value =
        data.overlayGradientEnd || "#15202b";
      document.getElementById("overlayGradientAngle").value =
        data.overlayGradientAngle ?? 135;
      document.getElementById("gradientAngleValue").textContent =
        (data.overlayGradientAngle ?? 135) + "°";

      document.getElementById("overlayBorderEnabled").checked =
        data.overlayBorderEnabled !== false;
      document.getElementById("overlayBorderColor").value =
        data.overlayBorderColor || "#FF0000";
      document.getElementById("overlayBorderWidth").value =
        data.overlayBorderWidth ?? 3;
      document.getElementById("borderWidthValue").textContent =
        (data.overlayBorderWidth ?? 3) + "px";

      toggleModeUI();
    }
  );
}

function toggleModeUI() {
  const mode = document.getElementById("overlayMode").value;
  document
    .getElementById("solidColorControls")
    .classList.toggle("hidden", mode !== "solid");
  document
    .getElementById("gradientControls")
    .classList.toggle("hidden", mode !== "gradient");
}

// ---------------------
// Settings Event Binding
// ---------------------
[
  "overlayPreset",
  "overlayMode",
  "overlayColor",
  "overlayOpacity",
  "overlayGradientStart",
  "overlayGradientEnd",
  "overlayGradientAngle",
  "overlayBorderEnabled",
  "overlayBorderColor",
  "overlayBorderWidth",
].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", saveOverlaySettings);
  el.addEventListener("change", saveOverlaySettings);
});

// ---------------------
// Init
// ---------------------
loadTrusted();
loadBlacklist();
loadOverlaySettings();
