import { getConfig, getFailuresAcrossProjects } from "../lib/gitlab.js";

const content = document.getElementById("content");

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units = [
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n}${label} ago`;
  }
  return "just now";
}

function render(failures) {
  if (failures.length === 0) {
    content.innerHTML = `<p class="state">✓ No failing pipelines</p>`;
    return;
  }

  content.innerHTML = "";
  for (const f of failures) {
    const a = document.createElement("a");
    a.className = "pipeline";
    a.href = f.web_url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.innerHTML = `
      <div class="project"><span class="dot"></span>${f.projectName}</div>
      <div class="meta">${f.ref} • #${f.id} • ${timeAgo(f.updated_at)}</div>
    `;
    content.appendChild(a);
  }
}

async function load() {
  content.innerHTML = `<p class="state">Loading…</p>`;

  const cfg = await getConfig();
  if (!cfg.token || cfg.projectIds.length === 0) {
    content.innerHTML = `<p class="state">Not configured yet — open Settings to add your GitLab host, token and project IDs.</p>`;
    return;
  }

  try {
    const failures = await getFailuresAcrossProjects(cfg);
    failures.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    render(failures);
  } catch (err) {
    content.innerHTML = `<p class="state">Error: ${err.message}</p>`;
  }
}

document.getElementById("refresh").addEventListener("click", load);
document.getElementById("open-options").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

load();
