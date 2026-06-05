const baseUrlEl = document.getElementById("baseUrl");
const tokenEl = document.getElementById("token");
const projectIdsEl = document.getElementById("projectIds");
const statusEl = document.getElementById("status");

async function restore() {
  const { baseUrl, token, projectIds } = await chrome.storage.local.get([
    "baseUrl",
    "token",
    "projectIds",
  ]);
  baseUrlEl.value = baseUrl || "https://gitlab.com";
  tokenEl.value = token || "";
  projectIdsEl.value = (projectIds || []).join(", ");
}

async function save() {
  const projectIds = projectIdsEl.value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  await chrome.storage.local.set({
    baseUrl: baseUrlEl.value.trim().replace(/\/$/, ""),
    token: tokenEl.value.trim(),
    projectIds,
  });

  statusEl.textContent = "Saved.";
  setTimeout(() => (statusEl.textContent = ""), 2000);
}

document.getElementById("save").addEventListener("click", save);
restore();
