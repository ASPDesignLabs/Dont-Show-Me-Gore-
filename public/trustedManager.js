let trustedCreators = [];
let sortMode = "alpha"; // "alpha" = alphabetical, "recent" = most recent first

function loadTrusted() {
  chrome.storage.sync.get(["trustedCreators"], (data) => {
    trustedCreators = data.trustedCreators || [];
    renderList();
  });
}

function saveTrusted() {
  chrome.storage.sync.set({ trustedCreators });
}

function renderList() {
  const filter = document.getElementById("filterBox").value.toLowerCase();
  const container = document.getElementById("trustedListContainer");
  container.innerHTML = "";

  let list = [...trustedCreators];
  if (sortMode === "alpha") {
    list.sort((a, b) => a.localeCompare(b));
  } else {
    list = list.slice().reverse(); // most recent entries appear first
  }

  list
    .filter((h) => h.toLowerCase().includes(filter))
    .forEach((handle, idx) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center justify-between px-3 py-2 bg-black hover:bg-neutral-900";

      // Inline editable field
      const input = document.createElement("input");
      input.value = handle;
      input.className =
        "flex-1 bg-transparent text-sm font-medium outline-none text-gray-100";
      input.onchange = () => {
        trustedCreators[idx] = input.value.trim();
        saveTrusted();
      };

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.className =
        "ml-3 text-gray-500 hover:text-red-500 font-bold text-sm";
      removeBtn.textContent = "✖";
      removeBtn.onclick = () => {
        trustedCreators = trustedCreators.filter((h) => h !== handle);
        saveTrusted();
        renderList();
      };

      // Keyboard shortcut: Delete to remove
      input.addEventListener("keydown", (e) => {
        if (e.key === "Delete") {
          trustedCreators = trustedCreators.filter((h) => h !== handle);
          saveTrusted();
          renderList();
        }
      });

      row.append(input, removeBtn);
      container.appendChild(row);
    });
}

// Add new handle
document.getElementById("addHandleBtn").onclick = () => {
  const val = document.getElementById("handleInput").value.trim();
  if (!val) return;
  trustedCreators.push(val);
  saveTrusted();
  document.getElementById("handleInput").value = "";
  renderList();
};

// Add on Enter
document.getElementById("handleInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("addHandleBtn").click();
});

// Search filter
document.getElementById("filterBox").oninput = () => renderList();

// Clear All button
document.getElementById("clearAllBtn").onclick = () => {
  if (confirm("Clear all trusted creators?")) {
    trustedCreators = [];
    saveTrusted();
    renderList();
  }
};

// Sort toggle buttons
document.getElementById("sortAlphaBtn").onclick = () => {
  sortMode = "alpha";
  renderList();
};

document.getElementById("sortRecentBtn").onclick = () => {
  sortMode = "recent";
  renderList();
};

loadTrusted();
