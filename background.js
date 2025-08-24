// FocusGuard Background (Service Worker) - Manifest V3

const STORAGE_KEYS = {
  SETTINGS: "fg_settings",
  BLOCKLIST: "fg_blocklist",
  SESSION: "fg_session",
  STATS: "fg_stats",
  BYPASS: "fg_bypass", // { hostname: timestampUntil }
};

const DEFAULTS = {
  settings: { focusMinutes: 25, breakMinutes: 5, autoStartBreak: false },
  blocklist: [
    "youtube.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "reddit.com",
  ],
  session: { active: false, type: "idle", endTime: 0, task: "" },
  stats: { completedFocus: 0 },
};

const ALARM_NAME = "fg-timer";

async function get(key) {
  return new Promise((resolve) =>
    chrome.storage.sync.get(key, (data) => resolve(data[key]))
  );
}
async function set(obj) {
  return new Promise((resolve) =>
    chrome.storage.sync.set(obj, () => resolve(true))
  );
}

chrome.runtime.onInstalled.addListener(async () => {
  const [settings, blocklist, session, stats, bypass] = await Promise.all([
    get(STORAGE_KEYS.SETTINGS),
    get(STORAGE_KEYS.BLOCKLIST),
    get(STORAGE_KEYS.SESSION),
    get(STORAGE_KEYS.STATS),
    get(STORAGE_KEYS.BYPASS),
  ]);

  if (!settings) await set({ [STORAGE_KEYS.SETTINGS]: DEFAULTS.settings });
  if (!Array.isArray(blocklist))
    await set({ [STORAGE_KEYS.BLOCKLIST]: DEFAULTS.blocklist });
  if (!session) await set({ [STORAGE_KEYS.SESSION]: DEFAULTS.session });
  if (!stats) await set({ [STORAGE_KEYS.STATS]: DEFAULTS.stats });
  if (!bypass) await set({ [STORAGE_KEYS.BYPASS]: {} });
});

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

function isBlocked(hostname, blocklist) {
  if (!hostname) return false;
  return blocklist.some(
    (domain) => hostname === domain || hostname.endsWith("." + domain)
  );
}

async function updateBadge(session) {
  if (session.active && session.endTime) {
    const remaining = Math.max(0, session.endTime - Date.now());
    const mins = Math.ceil(remaining / 60000);
    await chrome.action.setBadgeText({ text: String(mins) });
  } else {
    await chrome.action.setBadgeText({ text: "" });
  }
}

async function startSession(type = "focus", minutes = 25, task = "") {
  const endTime = Date.now() + minutes * 60 * 1000;
  const session = {
    active: true,
    type,
    endTime,
    task,
    paused: false,
    remaining: minutes * 60 * 1000,
  };
  await set({ [STORAGE_KEYS.SESSION]: session });
  await updateBadge(session);
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, { when: endTime });
}

async function pauseSession() {
  const session = await get(STORAGE_KEYS.SESSION);
  if (!session?.active || session.paused) return;
  const remaining = Math.max(0, session.endTime - Date.now());
  session.paused = true;
  session.remaining = remaining;
  await set({ [STORAGE_KEYS.SESSION]: session });
  await chrome.alarms.clear(ALARM_NAME);
  await updateBadge(session);
}

async function resumeSession() {
  const session = await get(STORAGE_KEYS.SESSION);
  if (!session?.active || !session.paused) return;
  const endTime = Date.now() + (session.remaining || 0);
  session.paused = false;
  session.endTime = endTime;
  await set({ [STORAGE_KEYS.SESSION]: session });
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, { when: endTime });
  await updateBadge(session);
}

async function endSession(trigger = "alarm") {
  const session = await get(STORAGE_KEYS.SESSION);
  if (!session?.active) return;
  const settings = await get(STORAGE_KEYS.SETTINGS);
  const stats = (await get(STORAGE_KEYS.STATS)) || { completedFocus: 0 };

  if (session.type === "focus") {
    stats.completedFocus += 1;
    await set({ [STORAGE_KEYS.STATS]: stats });
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Focus session complete 🎉",
      message: settings.autoStartBreak
        ? "Starting your break now."
        : "Time for a break!",
    });
    if (settings.autoStartBreak) {
      await startSession("break", settings.breakMinutes, "");
      return;
    }
  } else if (session.type === "break") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Break ended ⏰",
      message: "Ready for another focus sprint?",
    });
  }

  const newSession = { active: false, type: "idle", endTime: 0, task: "" };
  await set({ [STORAGE_KEYS.SESSION]: newSession });
  await updateBadge(newSession);
  await chrome.alarms.clear(ALARM_NAME);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await endSession("alarm");
  }
});

// Blocking logic
chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    if (details.frameId !== 0) return; // only top-level
    const url = details.url;
    const hostname = hostnameFromUrl(url);
    if (!hostname) return;

    const [session, blocklist, bypass] = await Promise.all([
      get(STORAGE_KEYS.SESSION),
      get(STORAGE_KEYS.BLOCKLIST),
      get(STORAGE_KEYS.BYPASS),
    ]);

    if (!session?.active || session.type !== "focus") return;
    if (!Array.isArray(blocklist)) return;

    // Bypass check (moved here instead of top-level)
    const now = Date.now();
    if (bypass && bypass[hostname] && bypass[hostname] > now) {
      if (!session.paused) {
        await pauseSession();
      }
      return;
    }

    if (isBlocked(hostname, blocklist)) {
      const blockedUrl =
        chrome.runtime.getURL("blocked.html") +
        `?url=${encodeURIComponent(url)}`;
      try {
        await chrome.tabs.update(details.tabId, { url: blockedUrl });
      } catch (e) {
        // ignore
      }
    }
  },
  { url: [{ urlMatches: "http.*" }] }
);

// Respond to messages from popup/options/blocked
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.cmd === "getState") {
      const [session, stats, settings] = await Promise.all([
        get(STORAGE_KEYS.SESSION),
        get(STORAGE_KEYS.STATS),
        get(STORAGE_KEYS.SETTINGS),
      ]);

      let remaining = 0;
      if (session?.active) {
        if (session.paused) {
          remaining = session.remaining || 0; // use saved remaining on pause
        } else {
          remaining = Math.max(0, (session.endTime || 0) - Date.now());
        }
      }

      sendResponse({ session, remaining, stats, settings });
    } else if (msg.cmd === "start") {
      await startSession("focus", msg.minutes, msg.task || "");
      sendResponse({ ok: true });
    } else if (msg.cmd === "startBreak") {
      await startSession("break", msg.minutes);
      sendResponse({ ok: true });
    } else if (msg.cmd === "pause") {
      await pauseSession();
      sendResponse({ ok: true });
    } else if (msg.cmd === "resume") {
      await resumeSession();
      sendResponse({ ok: true });
    } else if (msg.cmd === "cancel") {
      await endSession("manual");
      sendResponse({ ok: true });
    } else if (msg.cmd === "getSettings") {
      sendResponse({ settings: await get(STORAGE_KEYS.SETTINGS) });
    } else if (msg.cmd === "saveSettings") {
      const current = (await get(STORAGE_KEYS.SETTINGS)) || {};
      await set({ [STORAGE_KEYS.SETTINGS]: { ...current, ...msg.settings } });
      sendResponse({ ok: true });
    } else if (msg.cmd === "getBlocklist") {
      sendResponse({ blocklist: (await get(STORAGE_KEYS.BLOCKLIST)) || [] });
    } else if (msg.cmd === "addDomain") {
      const list = (await get(STORAGE_KEYS.BLOCKLIST)) || [];
      const dom = (msg.domain || "")
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .trim();
      if (dom && !list.includes(dom)) list.push(dom);
      await set({ [STORAGE_KEYS.BLOCKLIST]: list });
      sendResponse({ blocklist: list });
    } else if (msg.cmd === "removeDomain") {
      let list = (await get(STORAGE_KEYS.BLOCKLIST)) || [];
      list = list.filter((d) => d !== msg.domain);
      await set({ [STORAGE_KEYS.BLOCKLIST]: list });
      sendResponse({ blocklist: list });
    } else if (msg.cmd === "snooze") {
      const { hostname, minutes } = msg;
      const until = Date.now() + Math.max(1, minutes) * 60 * 1000;
      const bypass = (await get(STORAGE_KEYS.BYPASS)) || {};
      bypass[hostname] = until;
      await set({ [STORAGE_KEYS.BYPASS]: bypass });
      sendResponse({ ok: true, until });
    }
  })();
  return true; // keep sendResponse async
});

// Keep badge updated every minute
setInterval(async () => {
  const session = await get(STORAGE_KEYS.SESSION);
  await updateBadge(session || DEFAULTS.session);
}, 60000);
