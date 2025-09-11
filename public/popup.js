let trustedCreators = [];

// Initialize
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
    removeBtn.className =
      "text-red-400 hover:text-red-600 text-xs font-bold";
    removeBtn.textContent = "✖";
    removeBtn.onclick = () => {
      trustedCreators.splice(idx, 1);
      save();
      renderList();
    };

    item.append(span, removeBtn);
    list.appendChild(item);
  });
}

function save() {
  chrome.storage.sync.set({ trustedCreators });
}
function load() {
  chrome.storage.sync.get(["trustedCreators", "shieldEnabled"], (data) => {
    trustedCreators = data.trustedCreators || [];
    renderList();
    document.getElementById("enableToggle").checked =
      data.shieldEnabled !== false;
  });
}

document.getElementById("addBtn").onclick = () => {
  const inp = document.getElementById("newHandle");
  let h = inp.value.trim();
  if (!h) return;
  if (!h.startsWith("@")) h = "@" + h;
  if (!trustedCreators.includes(h)) {
    trustedCreators.push(h);
    save();
    renderList();
  }
  inp.value = "";
};

document.getElementById("exportBtn").onclick = () => {
  document.getElementById("importArea").value = JSON.stringify(
    trustedCreators,
    null,
    2
  );
};

document.getElementById("importBtn").onclick = () => {
  try {
    const parsed = JSON.parse(document.getElementById("importArea").value);
    if (Array.isArray(parsed)) {
      trustedCreators = parsed;
      save();
      renderList();
    }
  } catch (e) {
    alert("Invalid JSON");
  }
};

document.getElementById("enableToggle").onchange = (e) => {
  chrome.storage.sync.set({ shieldEnabled: e.target.checked });
};

// Load on open
load();
