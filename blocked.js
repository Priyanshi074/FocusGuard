function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const params = new URLSearchParams(location.search);
const originalUrl = params.get("url") || "";
try {
  const u = new URL(originalUrl);
  document.getElementById("target").textContent = `Blocked: ${u.hostname}`;
} catch {}

function tick() {
  chrome.runtime.sendMessage({ cmd: "getState" }, (res) => {
    const remaining = res?.remaining ?? 0;
    document.getElementById("timer").textContent = fmt(remaining);
  });
}
setInterval(tick, 1000);
tick();

// Snooze button
document.getElementById("snooze").addEventListener("click", () => {
  try {
    const host = new URL(originalUrl).hostname.replace(/^www\./, "");
    chrome.runtime.sendMessage(
      { cmd: "snooze", hostname: host, minutes: 5 },
      () => {
        if (originalUrl) {
          chrome.tabs.update({ url: originalUrl });
        }
      }
    );
  } catch {}
});

// New tab button
document.getElementById("newtab").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://newtab" });
});
