# FTL — Meeting Library

A simple, free library for your team's recorded video meetings and meeting notes.

- **Recordings** are pulled from a YouTube playlist (works with unlisted videos).
- **Meeting notes** are pulled from a shared Google Drive folder (HTML files, or anything else you drop in there) — open a note instantly in an inline preview, or download it.

FTL doesn't copy or store your videos or notes anywhere — it just reads the playlist/folder each time and links out (or renders notes inline). No extra storage cost.

## How it works

- You keep adding recordings to your existing YouTube playlist and notes (HTML files) to your Drive folder, same as you do today.
- FTL lists both automatically each time it loads (or when you hit refresh) — nothing to re-configure as they grow week to week.
- Recordings show a thumbnail, title, date, and a **Watch** button (opens on YouTube).
- Notes show a title, last-modified date, a **Preview** button (renders the HTML right inside FTL), and a **Download** button.
- Everything is searchable by name across both tabs.

Total cost: **$0**, as long as you stay within Google's free API quotas (YouTube Data API: 10,000 units/day; Drive API: 100,000 requests/day — both far more than a team library needs).

## 1. YouTube playlist

You already have this. Two things to check:

1. Open your playlist and confirm its visibility is **Public** or **Unlisted** — not **Private**. (Individual videos inside can still be Unlisted; it's the *playlist itself* that needs to not be Private, so the app's API key can read its contents.)
2. Copy the playlist ID from its URL: `https://www.youtube.com/playlist?list=PLAYLIST_ID_IS_HERE`

## 2. Google Drive notes folder

1. Create a folder in Google Drive for your notes, e.g. "FTL Meeting Notes."
2. Upload your HTML notes file(s) into it. If you keep one file that grows weekly, or add a new file each week — either works, FTL just lists whatever's in the folder.
3. Right-click the folder → **Share** → **General access** → set to **"Anyone with the link"**, role **Viewer**.
4. Copy the folder's ID from its URL: `https://drive.google.com/drive/folders/FOLDER_ID_IS_HERE`

## 3. Get one free Google API key (covers both YouTube + Drive)

1. Go to console.cloud.google.com and create a project (free).
2. Go to **APIs & Services → Library** and enable both:
   - **YouTube Data API v3**
   - **Google Drive API**
3. Go to **APIs & Services → Credentials → Create Credentials → API key**.
4. Restrict the key to those two APIs (recommended, for security).
5. Copy the API key.

## 4. Configure FTL

Open `www/config.js` and fill in the three values, so every teammate gets a pre-configured app:

```js
window.FTL_DEFAULT_CONFIG = {
  API_KEY: "your-api-key-here",
  YOUTUBE_PLAYLIST_ID: "your-playlist-id-here",
  DRIVE_FOLDER_ID: "your-notes-folder-id-here",
};
```

(Alternatively, leave these blank and each person can enter their own values inside the app on first launch — saved on their device only, via the gear icon.)

## 5. Run it as a website (free)

```bash
npm install
npm run serve
```

Then open http://localhost:8080. To make it available to your whole team for free, deploy the `www` folder to any free static host: **Vercel**, **Netlify**, **Cloudflare Pages**, or **GitHub Pages** all have generous free tiers that comfortably fit this.

## 6. Build the Android APK (free)

Building an APK requires the Android SDK, which is a large toolchain. The easiest free route is via **GitHub Actions** (included in this project) — no Android Studio needed:

1. Push this project to a GitHub repository (public or private — Actions is free for both).
2. GitHub automatically runs `.github/workflows/build-apk.yml`, which builds a debug APK.
3. Go to the **Actions** tab → the latest run → download the `FTL-debug-apk` artifact. That's your installable `app-debug.apk`.
4. Transfer it to an Android phone (email, Drive, USB) and open it to install. You'll need to allow "Install unknown apps" for that source — normal for apps installed outside the Play Store.

Local alternative (needs Android Studio / Android SDK installed):
```bash
cd android
./gradlew assembleDebug
```
APK appears at `android/app/build/outputs/apk/debug/app-debug.apk`.

Publishing to the Play Store is optional (one-time $25) — not required to install on your team's phones.

## Weekly workflow

- New recording → add it to the YouTube playlist like you already do.
- New/updated notes → upload or edit the HTML file in the Drive notes folder.
- Open FTL, hit refresh (the circular arrow, top right) — both tabs update automatically. No rebuild, no redeploy.

## Notes on cost

- **Web app hosting**: free (static site on any free-tier host).
- **APK build**: free (GitHub Actions).
- **API calls**: free (both YouTube and Drive quotas are far above what this app uses).
- **Storage**: free — you keep using YouTube + your existing Drive storage as you already do.
- **Play Store listing**: optional, $25 one-time — skip this if you're only sideloading internally.

## Optional: tighter access control

The current setup uses an API key + "Anyone with the link can view" for the Drive folder, and a Public/Unlisted playlist. This is the simplest free option and fine for an internal team link that isn't shared publicly. If you want per-user Google sign-in instead, that requires adding OAuth — happy to build that if it matters to you.
