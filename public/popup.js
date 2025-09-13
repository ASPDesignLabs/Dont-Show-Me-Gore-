let trustedCreators = [];

// Preset definitions
const overlayPresets = {
  custom: { label: "Custom" },
  twitterDark: {
    label: "Twitter Dark",
    mode: "solid",
    color: "#000000",
    opacity: 0.9,
    borderEnabled: true,
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },
  twitterLight: {
    label: "Twitter Light",
    mode: "solid",
    color: "#FFFFFF",
    opacity: 0.9,
    borderEnabled: true,
    borderColor: "#000000",
    borderWidth: 2,
  },
  skyGradient: {
    label: "Sky → Dark Blue",
    mode: "gradient",
    gradientStart: "#1DA1F2",
    gradientEnd: "#15202B",
    gradientAngle: 135,
    opacity: 0.9,
  },
  sunrise: {
    label: "Sunrise Fade",
    mode: "gradient",
    gradientStart: "#FF9A9E",
    gradientEnd: "#FAD0C4",
    gradientAngle: 45,
    opacity: 0.9,
  },
  emerald: {
    label: "Emerald Fade",
    mode: "gradient",
    gradientStart: "#10B981",
    gradientEnd: "#064E3B",
    gradientAngle: 135,
    opacity: 0.9,
  },
};

// ---------------------
// Trusted List Handling
// ---------------------
function renderList() {
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
      saveTrustedList();
      renderList();
    };

    item.append(span, removeBtn);
    list.appendChild(item);
  });
}

function saveTrustedList() {
  chrome.storage.sync.set({ trustedCreators });
}

function loadTrustedList() {
  chrome.storage.sync.get(["trustedCreators", "shieldEnabled"], (data) => {
    trustedCreators = data.trustedCreators || [];
    renderList();
    document.getElementById("enableToggle").checked =
      data.shieldEnabled !== false;
  });
}

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
      const presetKey = data.overlayPreset || "custom";
      document.getElementById("overlayPreset").value = presetKey;

      // Mode + Colors
      document.getElementById("overlayMode").value = data.overlayMode || "solid";
      document.getElementById("overlayColor").value =
        data.overlayColor || "#000000";

      // Opacity
      const percent = Math.round((data.overlayOpacity ?? 0.9) * 100);
      document.getElementById("overlayOpacity").value = percent;
      document.getElementById("opacityValue").textContent = percent + "%";

      // Gradient
      document.getElementById("overlayGradientStart").value =
        data.overlayGradientStart || "#1DA1F2";
      document.getElementById("overlayGradientEnd").value =
        data.overlayGradientEnd || "#15202b";
      document.getElementById("overlayGradientAngle").value =
        data.overlayGradientAngle ?? 135;
      document.getElementById("gradientAngleValue").textContent =
        (data.overlayGradientAngle ?? 135) + "°";

      // Border
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

// ---------------------
// Preset Application
// ---------------------
function applyPreset(presetKey) {
  if (presetKey === "custom") return;
  const preset = overlayPresets[presetKey];
  if (!preset) return;

  if (preset.mode) document.getElementById("overlayMode").value = preset.mode;

  if (preset.mode === "solid" && preset.color) {
    document.getElementById("overlayColor").value = preset.color;
  }
  if (preset.mode === "gradient") {
    if (preset.gradientStart)
      document.getElementById("overlayGradientStart").value =
        preset.gradientStart;
    if (preset.gradientEnd)
      document.getElementById("overlayGradientEnd").value = preset.gradientEnd;
    if (preset.gradientAngle) {
      document.getElementById("overlayGradientAngle").value =
        preset.gradientAngle;
      document.getElementById("gradientAngleValue").textContent =
        preset.gradientAngle + "°";
    }
  }

  if (preset.opacity !== undefined) {
    const percent = Math.round(preset.opacity * 100);
    document.getElementById("overlayOpacity").value = percent;
    document.getElementById("opacityValue").textContent = percent + "%";
  }

  if (preset.borderEnabled !== undefined) {
    document.getElementById("overlayBorderEnabled").checked =
      preset.borderEnabled;
  }
  if (preset.borderColor) {
    document.getElementById("overlayBorderColor").value = preset.borderColor;
  }
  if (preset.borderWidth !== undefined) {
    document.getElementById("overlayBorderWidth").value = preset.borderWidth;
    document.getElementById("borderWidthValue").textContent =
      preset.borderWidth + "px";
  }

  // Save after applying
  saveOverlaySettings();
  toggleModeUI();
}

// ---------------------
// UI Wiring
// ---------------------
function toggleModeUI() {
  const mode = document.getElementById("overlayMode").value;
  document
    .getElementById("solidColorControls")
    .classList.toggle("hidden", mode !== "solid");
  document
    .getElementById("gradientControls")
    .classList.toggle("hidden", mode !== "gradient");
}

// Bulk save on any input/change
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
  el.addEventListener("input", (e) => {
    if (id === "overlayPreset") {
      applyPreset(e.target.value);
    } else {
      saveOverlaySettings();
    }
  });
  el.addEventListener("change", (e) => {
    if (id === "overlayPreset") {
      applyPreset(e.target.value);
    } else {
      saveOverlaySettings();
    }
  });
});

// ---------------------
// Init
// ---------------------
loadTrustedList();
loadOverlaySettings();
