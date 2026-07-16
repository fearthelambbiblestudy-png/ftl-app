(function () {
  "use strict";

  const STORAGE_KEY = "ftl_config_v2";

  const els = {
    statusPanel: document.getElementById("statusPanel"),
    searchInput: document.getElementById("searchInput"),
    refreshBtn: document.getElementById("refreshBtn"),
    tabs: document.querySelectorAll(".tab"),
    panels: {
      recordings: document.getElementById("recordingsPanel"),
      notes: document.getElementById("notesPanel"),
    },
    grids: {
      recordings: document.getElementById("recordingsGrid"),
      notes: document.getElementById("notesGrid"),
    },
    emptyEls: {
      recordings: document.getElementById("recordingsEmpty"),
      notes: document.getElementById("notesEmpty"),
    },
    counts: {
      recordings: document.getElementById("countRecordings"),
      notes: document.getElementById("countNotes"),
    },
    setupOverlay: document.getElementById("setupOverlay"),
    apiKeyInput: document.getElementById("apiKeyInput"),
    playlistIdInput: document.getElementById("playlistIdInput"),
    folderIdInput: document.getElementById("folderIdInput"),
    saveConfigBtn: document.getElementById("saveConfigBtn"),
    settingsBtn: document.getElementById("settingsBtn"),
    previewOverlay: document.getElementById("previewOverlay"),
    previewFrame: document.getElementById("previewFrame"),
    previewTitle: document.getElementById("previewTitle"),
    previewClose: document.getElementById("previewClose"),
  };

  let recordings = [];
  let notes = [];

  function loadConfig() {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) {
      try {
        return JSON.parse(fromStorage);
      } catch (e) {
        /* fall through */
      }
    }
    const def = window.FTL_DEFAULT_CONFIG || {};
    if (def.API_KEY && def.YOUTUBE_PLAYLIST_ID && def.DRIVE_FOLDER_ID) return def;
    return null;
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function showSetup(prefill) {
    els.setupOverlay.hidden = false;
    if (prefill) {
      els.apiKeyInput.value = prefill.API_KEY || "";
      els.playlistIdInput.value = prefill.YOUTUBE_PLAYLIST_ID || "";
      els.folderIdInput.value = prefill.DRIVE_FOLDER_ID || "";
    }
  }

  function hideSetup() {
    els.setupOverlay.hidden = true;
  }

  function setStatus(msg) {
    if (!msg) {
      els.statusPanel.hidden = true;
      els.statusPanel.textContent = "";
      return;
    }
    els.statusPanel.hidden = false;
    els.statusPanel.textContent = msg;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Recordings (YouTube playlist) ----------

  async function fetchAllPlaylistItems(cfg) {
    const items = [];
    let pageToken = "";
    do {
      const url =
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet&maxResults=50&playlistId=${encodeURIComponent(cfg.YOUTUBE_PLAYLIST_ID)}` +
        `&key=${encodeURIComponent(cfg.API_KEY)}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
      const resp = await fetch(url);
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`YouTube API error (${resp.status}): ${body}`);
      }
      const data = await resp.json();
      items.push(...(data.items || []));
      pageToken = data.nextPageToken || "";
    } while (pageToken);
    return items;
  }

  function mapPlaylistItemToRecording(item) {
    const snippet = item.snippet || {};
    const videoId = snippet.resourceId && snippet.resourceId.videoId;
    if (!videoId) return null;
    // Deleted/private videos still show up as placeholder items - skip those.
    if (snippet.title === "Deleted video" || snippet.title === "Private video") return null;
    const thumb =
      (snippet.thumbnails &&
        (snippet.thumbnails.medium || snippet.thumbnails.default || snippet.thumbnails.high)) ||
      null;
    return {
      id: videoId,
      name: snippet.title || "Untitled recording",
      createdTime: snippet.publishedAt,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbUrl: thumb ? thumb.url : null,
    };
  }

  async function fetchRecordings(cfg) {
    const items = await fetchAllPlaylistItems(cfg);
    return items
      .map(mapPlaylistItemToRecording)
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
  }

  // ---------- Notes (Google Drive folder) ----------

  async function fetchNotes(cfg) {
    const fields = "files(id,name,mimeType,webViewLink,createdTime,modifiedTime)";
    const q = encodeURIComponent(`'${cfg.DRIVE_FOLDER_ID}' in parents and trashed = false`);
    const url =
      `https://www.googleapis.com/drive/v3/files?q=${q}` +
      `&fields=${encodeURIComponent(fields)}&pageSize=1000&key=${encodeURIComponent(cfg.API_KEY)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Drive API error (${resp.status}): ${body}`);
    }
    const data = await resp.json();
    return (data.files || []).sort(
      (a, b) => new Date(b.modifiedTime || b.createdTime) - new Date(a.modifiedTime || a.createdTime)
    );
  }

  function noteDownloadUrl(file, cfg) {
    return `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${encodeURIComponent(cfg.API_KEY)}`;
  }

  async function openNotePreview(file, cfg) {
    els.previewTitle.textContent = file.name;
    els.previewFrame.srcdoc = "<p style='font-family:sans-serif;padding:20px;color:#888;'>Loading...</p>";
    els.previewOverlay.hidden = false;
    try {
      const resp = await fetch(noteDownloadUrl(file, cfg));
      if (!resp.ok) throw new Error(`Could not load note (${resp.status})`);
      const text = await resp.text();
      els.previewFrame.srcdoc = text;
    } catch (err) {
      els.previewFrame.srcdoc =
        `<p style="font-family:sans-serif;padding:20px;color:#c00;">Couldn't load this note for preview. Try Download instead.<br>${escapeHtml(
          err.message
        )}</p>`;
    }
  }

  // ---------- Rendering ----------

  function renderRecordingCard(rec) {
    const card = document.createElement("div");
    card.className = "card";
    const thumb = rec.thumbUrl
      ? `<img class="card-thumb" src="${rec.thumbUrl}" alt="" loading="lazy" />`
      : "";
    card.innerHTML = `
      ${thumb}
      <div class="card-title">${escapeHtml(rec.name)}</div>
      <div class="card-meta">${formatDate(rec.createdTime)}</div>
      <div class="card-actions">
        <a class="download" href="${rec.watchUrl}" target="_blank" rel="noopener">Watch</a>
      </div>
    `;
    return card;
  }

  function renderNoteCard(file, cfg) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${escapeHtml(file.name)}</div>
      <div class="card-meta">${formatDate(file.modifiedTime || file.createdTime)}</div>
      <div class="card-actions">
        <a class="view preview-link" href="#">Preview</a>
        <a class="download" href="${noteDownloadUrl(file, cfg)}" target="_blank" rel="noopener">Download</a>
      </div>
    `;
    const previewLink = card.querySelector(".preview-link");
    previewLink.addEventListener("click", (e) => {
      e.preventDefault();
      openNotePreview(file, cfg);
    });
    return card;
  }

  function renderGrid(key, list, renderFn) {
    const grid = els.grids[key];
    grid.innerHTML = "";
    if (list.length === 0) {
      els.emptyEls[key].hidden = false;
      return;
    }
    els.emptyEls[key].hidden = true;
    const frag = document.createDocumentFragment();
    list.forEach((item) => frag.appendChild(renderFn(item)));
    grid.appendChild(frag);
  }

  let currentConfig = null;

  function render() {
    const query = els.searchInput.value.trim().toLowerCase();

    const filteredRecordings = query
      ? recordings.filter((r) => r.name.toLowerCase().includes(query))
      : recordings;
    const filteredNotes = query
      ? notes.filter((n) => n.name.toLowerCase().includes(query))
      : notes;

    els.counts.recordings.textContent = filteredRecordings.length;
    els.counts.notes.textContent = filteredNotes.length;

    renderGrid("recordings", filteredRecordings, renderRecordingCard);
    renderGrid("notes", filteredNotes, (f) => renderNoteCard(f, currentConfig));
  }

  async function loadLibrary(cfg) {
    currentConfig = cfg;
    setStatus("Loading library...");
    try {
      const [recs, noteFiles] = await Promise.all([fetchRecordings(cfg), fetchNotes(cfg)]);
      recordings = recs;
      notes = noteFiles;
      setStatus(null);
      render();
    } catch (err) {
      console.error(err);
      setStatus(
        "Couldn't load the library. Double check your API Key, Playlist ID, and Folder ID in Settings, " +
          "and make sure the playlist is Public/Unlisted (not Private) and the Drive folder is shared " +
          "as 'Anyone with the link can view.'"
      );
    }
  }

  function switchTab(tab) {
    els.tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    Object.keys(els.panels).forEach((key) => {
      els.panels[key].classList.toggle("active", key === tab);
    });
  }

  function init() {
    els.tabs.forEach((tab) => {
      tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    els.searchInput.addEventListener("input", render);

    els.settingsBtn.addEventListener("click", () => {
      const cfg = loadConfig() || {};
      showSetup(cfg);
    });

    els.saveConfigBtn.addEventListener("click", () => {
      const cfg = {
        API_KEY: els.apiKeyInput.value.trim(),
        YOUTUBE_PLAYLIST_ID: els.playlistIdInput.value.trim(),
        DRIVE_FOLDER_ID: els.folderIdInput.value.trim(),
      };
      if (!cfg.API_KEY || !cfg.YOUTUBE_PLAYLIST_ID || !cfg.DRIVE_FOLDER_ID) {
        alert("Please fill in the API Key, Playlist ID, and Folder ID.");
        return;
      }
      saveConfig(cfg);
      hideSetup();
      loadLibrary(cfg);
    });

    els.refreshBtn.addEventListener("click", () => {
      const cfg = loadConfig();
      if (cfg) loadLibrary(cfg);
    });

    els.previewClose.addEventListener("click", () => {
      els.previewOverlay.hidden = true;
      els.previewFrame.srcdoc = "";
    });

    const cfg = loadConfig();
    if (cfg) {
      loadLibrary(cfg);
    } else {
      showSetup(null);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
