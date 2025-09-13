let trustedCreators = [];
let blacklistedCreators = [];
let trustedSortMode = "alpha";
let blacklistSortMode = "alpha";

// -------------------
// Load/Save
// -------------------
function loadData() {
  chrome.storage.sync.get(
    ["trustedCreators", "blacklistedCreators"],
    (data) => {
      trustedCreators = data.trustedCreators || [];
      blacklistedCreators = data.blacklistedCreators || [];
      renderTrusted();
      renderBlacklist();
    }
  );
}

function saveData() {
  chrome.storage.sync.set({
    trustedCreators,
    blacklistedCreators,
  });
}

// -------------------
// Trusted Rendering
// -------------------
function renderTrusted() {
  const filter = document
    .getElementById("trustedFilter")
    .value.toLowerCase();
  const container = document.getElementById("trustedListContainer");
  container.innerHTML = "";

  let list = [...trustedCreators];
  if (trustedSortMode === "alpha") list.sort((a, b) => a.localeCompare(b));
  else list = list.slice().reverse();

  list
    .filter((h) => h.toLowerCase().includes(filter))
    .forEach((handle, idx) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center justify-between px-2 py-1 bg-black hover:bg-neutral-900 rounded mb-1";

      const input = document.createElement("input");
      input.value = handle;
      input.className =
        "flex-1 bg-transparent text-sm font-medium outline-none text-gray-100";
      input.onchange = () => {
        trustedCreators[idx] = input.value.trim();
        saveData();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Delete") {
          trustedCreators.splice(idx, 1);
          saveData();
          renderTrusted();
        }
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "text-red-400 hover:text-red-600 text-xs font-bold";
      removeBtn.textContent = "✖";
      removeBtn.onclick = () => {
        trustedCreators.splice(idx, 1);
        saveData();
        renderTrusted();
      };

      row.append(input, removeBtn);
      container.appendChild(row);
    });
}

// -------------------
// Blacklist Rendering
// -------------------
function renderBlacklist() {
  const filter = document
    .getElementById("blacklistFilter")
    .value.toLowerCase();
  const container = document.getElementById("blacklistListContainer");
  container.innerHTML = "";

  let list = [...blacklistedCreators];
  if (blacklistSortMode === "alpha") list.sort((a, b) => a.localeCompare(b));
  else list = list.slice().reverse();

  list
    .filter((h) => h.toLowerCase().includes(filter))
    .forEach((handle, idx) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center justify-between px-2 py-1 bg-black hover:bg-neutral-900 rounded mb-1";

      const input = document.createElement("input");
      input.value = handle;
      input.className =
        "flex-1 bg-transparent text-sm font-medium outline-none text-red-400";
      input.onchange = () => {
        blacklistedCreators[idx] = input.value.trim();
        saveData();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Delete") {
          blacklistedCreators.splice(idx, 1);
          saveData();
          renderBlacklist();
        }
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "text-red-400 hover:text-red-600 text-xs font-bold";
      removeBtn.textContent = "✖";
      removeBtn.onclick = () => {
        blacklistedCreators.splice(idx, 1);
        saveData();
        renderBlacklist();
      };

      row.append(input, removeBtn);
      container.appendChild(row);
    });
}

// -------------------
// Trusted Events
// -------------------
document.getElementById("addTrustedBtn").onclick = () => {
  const val = document.getElementById("trustedInput").value.trim();
  if (!val) return;
  trustedCreators.push(val);
  saveData();
  document.getElementById("trustedInput").value = "";
  renderTrusted();
};
document.getElementById("trustedFilter").oninput = () => renderTrusted();
document.getElementById("clearTrustedBtn").onclick = () => {
  if (confirm("Clear all trusted creators?")) {
    trustedCreators = [];
    saveData();
    renderTrusted();
  }
};
document.getElementById("trustedSortAlpha").onclick = () => {
  trustedSortMode = "alpha";
  renderTrusted();
};
document.getElementById("trustedSortRecent").onclick = () => {
  trustedSortMode = "recent";
  renderTrusted();
};

// -------------------
// Blacklist Events
// -------------------
document.getElementById("addBlacklistBtn").onclick = () => {
  const val = document.getElementById("blacklistInput").value.trim();
  if (!val) return;
  blacklistedCreators.push(val);
  saveData();
  document.getElementById("blacklistInput").value = "";
  renderBlacklist();
};
document.getElementById("blacklistFilter").oninput = () => renderBlacklist();
document.getElementById("clearBlacklistBtn").onclick = () => {
  if (confirm("Clear all blacklisted creators?")) {
    blacklistedCreators = [];
    saveData();
    renderBlacklist();
  }
};
document.getElementById("blacklistSortAlpha").onclick = () => {
  blacklistSortMode = "alpha";
  renderBlacklist();
};
document.getElementById("blacklistSortRecent").onclick = () => {
  blacklistSortMode = "recent";
  renderBlacklist();
};

// -------------------
// Init
// -------------------
loadData();
