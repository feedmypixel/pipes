/**
 * Background service worker.
 *
 * Polls GitLab on an interval (via chrome.alarms) and raises a desktop
 * notification when a watched project's pipeline newly enters the failed state.
 *
 * This is deliberately simple — a starting point. See the roadmap in README.md.
 */

import { getConfig, getFailuresAcrossProjects } from "../lib/gitlab.js";

const ALARM_NAME = "poll-pipelines";
const POLL_MINUTES = 5;

// Track which failed pipeline IDs we've already notified about, so we don't
// re-notify on every poll. Kept in storage so it survives worker suspension.
async function getSeen() {
  const { seenFailures } = await chrome.storage.local.get("seenFailures");
  return new Set(seenFailures || []);
}

async function setSeen(set) {
  await chrome.storage.local.set({ seenFailures: [...set].slice(-200) });
}

async function poll() {
  const cfg = await getConfig();
  if (!cfg.token || cfg.projectIds.length === 0) return;

  let failures;
  try {
    failures = await getFailuresAcrossProjects(cfg);
  } catch (err) {
    console.warn("Pipeline poll failed:", err.message);
    return;
  }

  const seen = await getSeen();
  const fresh = failures.filter((f) => !seen.has(f.id));

  for (const f of fresh) {
    chrome.notifications.create(`pipeline-${f.id}`, {
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: `Pipeline failed: ${f.projectName}`,
      message: `${f.ref} • ${f.web_url}`,
      priority: 1,
    });
    seen.add(f.id);
  }

  await setSeen(seen);

  // Reflect total failure count on the toolbar badge.
  const count = failures.length;
  await chrome.action.setBadgeText({ text: count ? String(count) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#db3b21" });
}

// Open the pipeline in a tab when its notification is clicked.
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const id = Number(notificationId.replace("pipeline-", ""));
  const cfg = await getConfig();
  const failures = await getFailuresAcrossProjects(cfg).catch(() => []);
  const match = failures.find((f) => f.id === id);
  if (match) chrome.tabs.create({ url: match.web_url });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: POLL_MINUTES });
  poll();
});

chrome.runtime.onStartup.addListener(() => poll());

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) poll();
});
