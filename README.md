# ⏳ FocusGuard – Pomodoro Timer + Site Blocker 🚫

FocusGuard is a **Chrome Extension** that helps you stay productive by combining:
- A **Pomodoro Timer** for structured work & breaks.
- A **Site Blocker** to keep you away from distractions (YouTube, Instagram, etc.).
- **Motivational Boosts** when you need them most.

---

## 🎯 Purpose
Many people struggle with online distractions.  
FocusGuard ensures **deep work** sessions with short breaks to recharge, making productivity effortless.

---

## 🏗 Architecture
The extension is built with **Chrome Manifest V3** and modular design:

1. **Manifest (manifest.json)** – Defines metadata, permissions, and entry points.  
2. **Popup (popup.html + popup.js)** – Timer controls (Start, Pause, Break, Cancel).  
3. **Background (background.js)** – Timer logic, site blocking, and notifications.  
4. **Block Page (blocked.html)** – Motivational quotes + option to unblock for 5 minutes.  
5. **Options Page (options.html)** – Add/remove blocked sites & set durations.  
6. **Icons** – Custom icons for toolbar, store, and management page.  

---

## 🔄 Workflow
1. Start a **focus session** from the popup.  
2. If you visit a blocked site → redirected to **blocked.html**.  
3. Choose:
   - ✨ Stay Motivated  
   - ⏳ Allow site for 5 minutes  
4. Get notified when session ends → take a break!  

---

## ⚡ Features
- ✅ Pomodoro-style **focus & break sessions**
- ✅ Pause / Resume / Cancel timers
- ✅ Block **distracting sites**
- ✅ Temporary whitelist (5 minutes)
- ✅ Motivational quotes
- ✅ Customizable settings
- ✅ Persistent state (works even if popup closed)
- ✅ Minimalist, clean UI

---

## 🛠 Tech Stack
- **Frontend:** HTML, CSS, JavaScript  
- **APIs Used:**
  - `chrome.runtime` – message passing  
  - `chrome.storage` – persistent state  
  - `chrome.tabs`, `chrome.webNavigation` – site blocking  
  - `chrome.alarms` – timers  
  - `chrome.notifications` – reminders  

---

## 📸 Screenshots

Here’s a quick look at **FocusGuard** in action:

### 🔹 Popup – Timer Controls
Stay focused with **Start, Pause, Break, Cancel** options and a live countdown.

<img src="screenshots/popup.png" alt="Popup UI" width="400"/>

---

### 🔹 Block Page – Distraction Warning
Tried to open YouTube/Instagram? 🚫  
FocusGuard gently reminds you with a **motivational quote** and shows the **time left** in your focus session.

<img src="screenshots/block-page.png" alt="Blocked Page" width="600"/>
<img src="screenshots/pause-resume.png" alt="Blocked Page" width="600"/>
---

### 🔹 Options Page – Settings
Easily **customize your focus/break durations** ⏳ and **manage blocked websites** 📋.

<img src="screenshots/options.png" alt="Options Page" width="600"/>

---

## 🚀 Possible Improvements
- 🌙 Dark mode UI  
- ☁️ Sync with Chrome storage  
- 📊 Productivity stats  
- 🤖 AI-generated quotes  
- ⌨️ Keyboard shortcuts  

---

## 📝 Use Cases
- 👩‍🎓 Students – study with fewer distractions  
- 💼 Professionals – focus on deep work  
- 🌍 Anyone – build consistency & discipline  

---

## 📦 Installation (Developer Mode)
1. Clone this repo  
   ```bash
   git clone https://github.com/<your-username>/FocusGuard.git
   ```
2. Open Chrome → Extensions → Enable Developer Mode.
3. Click Load Unpacked and select the project folder.
4. Start focusing 🚀

---

## 📜 License
MIT License – feel free to use and improve this project.

## ⭐ Contribute
Contributions are welcome! If you like FocusGuard, please ⭐ star the repo 😊
