const focusInput = document.getElementById('focusMinutes');
const breakInput = document.getElementById('breakMinutes');
const autoStartBreak = document.getElementById('autoStartBreak');
const saveBtn = document.getElementById('saveSettings');
const addForm = document.getElementById('addForm');
const domainInput = document.getElementById('domain');
const listEl = document.getElementById('list');

function renderList(items) {
  listEl.innerHTML = '';
  for (const d of items) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${d}</span>`;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ cmd: 'removeDomain', domain: d }, (res) => {
        renderList(res.blocklist || []);
      });
    });
    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

function load() {
  chrome.runtime.sendMessage({ cmd: 'getSettings' }, (res) => {
    const s = res?.settings || { focusMinutes: 25, breakMinutes: 5, autoStartBreak: false };
    focusInput.value = s.focusMinutes;
    breakInput.value = s.breakMinutes;
    autoStartBreak.checked = !!s.autoStartBreak;
  });
  chrome.runtime.sendMessage({ cmd: 'getBlocklist' }, (res) => {
    renderList(res?.blocklist || []);
  });
}

saveBtn.addEventListener('click', () => {
  const settings = {
    focusMinutes: Math.max(1, parseInt(focusInput.value || '25', 10)),
    breakMinutes: Math.max(1, parseInt(breakInput.value || '5', 10)),
    autoStartBreak: !!autoStartBreak.checked
  };
  chrome.runtime.sendMessage({ cmd: 'saveSettings', settings }, () => {
    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => saveBtn.textContent = 'Save', 1200);
  });
});

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const domain = (domainInput.value || '').trim();
  if (!domain) return;
  chrome.runtime.sendMessage({ cmd: 'addDomain', domain }, (res) => {
    domainInput.value = '';
    renderList(res?.blocklist || []);
  });
});

load();