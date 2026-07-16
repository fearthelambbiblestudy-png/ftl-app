// Default config (optional). If left blank, the app will prompt the user
// to enter these in-app on first launch, and remember them on that device.
// You can also hard-code them here before building the APK so every
// teammate gets a pre-configured app with no setup step.
window.FTL_DEFAULT_CONFIG = {
  // One Google Cloud API key, enabled for BOTH "YouTube Data API v3" and
  // "Google Drive API" in the same project.
  API_KEY: "AIzaSyCMDcHfS8_SzT5apLCWSg9TapjFMDy6D0Y",

  // The ID from your YouTube playlist URL:
  // https://www.youtube.com/playlist?list=PLAYLIST_ID_IS_HERE
  // The playlist itself must be set to "Public" or "Unlisted" (not
  // "Private") so the API key can read it - individual videos inside can
  // still be Unlisted.
  YOUTUBE_PLAYLIST_ID: "PLchBX0JxM0ao",

  // The ID from your Google Drive notes folder's URL:
  // https://drive.google.com/drive/folders/FOLDER_ID_IS_HERE
  // This folder should contain only your meeting notes (HTML files, etc.),
  // shared as "Anyone with the link can view."
  DRIVE_FOLDER_ID: "1_kJghGJFs9pZsLu7goa6iiSJp5Q4x0Rg",
};
