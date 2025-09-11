# Don't Show Me Gore!

🛡️ A browser extension that shields autoplay videos on [X](https://x.com) until you explicitly unlock them — designed for safety, accessibility, and mental health.

---

## ✨ Features
- Overlays 🛡️ shields on all X videos (no autoplay ambushes).
- Unlock manually with a click.
- Detects *Promoted Ads* → lets them play unshielded (compliant).
- Trusted Creators system:
  - Add accounts to your whitelist via the popup manager or in-video shield UI.
  - Trusted accounts play unshielded by default.
- Export/import your trusted list (JSON).
- Dark mode popup UI styled with Tailwind.

---

## 📦 Installation (Developer Mode)

1. Clone or download this repo.
2. In Chrome/Edge: open `chrome://extensions` → enable "Developer mode".
3. Click **Load unpacked** → select the project folder.
4. In Firefox: use `about:debugging` → "Load Temporary Add-on".

---

## 🔒 Privacy

- Runs **entirely in your browser.**
- Does **not** collect, transmit, or share your browsing data.
- Trusted account whitelist is stored locally in `chrome.storage.sync`.
- No analytics, no external network requests.

---

## ⚖️ Terms of Use / ToS Compliance

- Does not interact with X’s APIs.
- Does not automate likes, retweets, follows, or posts.
- Ads remain visible (not stripped).
- Not affiliated with or endorsed by X Corp.
- Intended purely as a **personal accessibility & safety tool**.

See [LICENSE](LICENSE) for full legal terms (MIT).

---

## 📜 License

MIT © 2025 Snakesan
