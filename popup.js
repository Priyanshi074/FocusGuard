const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("start");
const startBreakBtn = document.getElementById("startBreak");
const cancelBtn = document.getElementById("cancel");
const completedEl = document.getElementById("completed");
const focusInput = document.getElementById("focusMinutes");
const breakInput = document.getElementById("breakMinutes");
const taskInput = document.getElementById("task");
const pauseBtn = document.getElementById("pause");

// Format time MM:SS
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Update UI state
function refresh() {
  chrome.runtime.sendMessage({ cmd: "getState" }, (res) => {
    if (!res) return;

    const { session, remaining, stats, settings } = res;

    // Timer + completed sessions
    timerEl.textContent = fmt(remaining ?? settings.focusMinutes * 60 * 1000);
    completedEl.textContent = stats?.completedFocus ?? 0;

    // Inputs
    focusInput.value = settings?.focusMinutes ?? 25;
    breakInput.value = settings?.breakMinutes ?? 5;
    taskInput.value = session?.task ?? "";

    // Buttons
    startBtn.disabled = session?.active && session.type === "focus";
    startBreakBtn.disabled = session?.active && session.type === "break";
    cancelBtn.disabled = !session?.active;

    if (session?.active) {
      pauseBtn.disabled = false;
      if (session.paused) {
        pauseBtn.textContent = "Resume";
        pauseBtn.dataset.state = "paused";
      } else {
        pauseBtn.textContent = "Pause";
        pauseBtn.dataset.state = "running";
      }
    } else {
      pauseBtn.disabled = true;
      pauseBtn.textContent = "Pause";
      pauseBtn.dataset.state = "running";
    }
  });
}

// Start focus session
startBtn.addEventListener("click", () => {
  const focusMinutes = Math.max(1, parseInt(focusInput.value || "25", 10));
  const breakMinutes = Math.max(1, parseInt(breakInput.value || "5", 10));
  const task = taskInput.value.trim();

  chrome.runtime.sendMessage(
    {
      cmd: "saveSettings",
      settings: { focusMinutes, breakMinutes },
    },
    () => {
      chrome.runtime.sendMessage(
        { cmd: "start", minutes: focusMinutes, task },
        refresh
      );
    }
  );
});

// Start break session
startBreakBtn.addEventListener("click", () => {
  const focusMinutes = Math.max(1, parseInt(focusInput.value || "25", 10));
  const breakMinutes = Math.max(1, parseInt(breakInput.value || "5", 10));

  chrome.runtime.sendMessage(
    {
      cmd: "saveSettings",
      settings: { focusMinutes, breakMinutes },
    },
    () => {
      chrome.runtime.sendMessage(
        { cmd: "startBreak", minutes: breakMinutes },
        refresh
      );
    }
  );
});

// Pause / Resume session
pauseBtn.addEventListener("click", () => {
  if (pauseBtn.dataset.state === "paused") {
    chrome.runtime.sendMessage({ cmd: "resume" }, refresh);
  } else {
    chrome.runtime.sendMessage({ cmd: "pause" }, refresh);
  }
});

// Cancel session
cancelBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ cmd: "cancel" }, refresh);
});

// Live countdown updater
let timerInterval = null;
function tick() {
  chrome.runtime.sendMessage({ cmd: "getState" }, (res) => {
    if (!res) return;
    timerEl.textContent = fmt(res.remaining ?? 0);
  });
}

// Initialize
refresh();
if (timerInterval) clearInterval(timerInterval);
timerInterval = setInterval(tick, 1000);
