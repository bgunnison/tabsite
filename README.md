# Tab book

A small static guitar tab viewer for **https://virtualrobot.net/tabsite/**. Includes all 40 source tabs, an alphabetical table of contents, zoom, and adjustable auto-scroll. No server application, database, account, external fonts, analytics, or internet services are required by the viewer.

## Upload

1. Extract `tabsite-upload.zip`. It contains a folder named `tabsite`.
2. Upload that folder into the existing website's document root, alongside its home page. A typical location is `public_html/tabsite/`.
3. Check that `index.html`, `styles.css`, `app.js`, `library.js`, and the `media` folder are immediately inside `/tabsite/`. Avoid accidentally creating `/tabsite/tabsite/`.
4. Open **https://virtualrobot.net/tabsite/**. Click a title, press **Play scroll**, then adjust **Speed**.

Alternatively, upload the contents of `upload/tabsite/` into an existing `/tabsite/` directory. Include the hidden `.htaccess` file if your host uses Apache and permits it. Do not upload the original `tabs/` folder, build scripts, or this project directory.

The files use relative URLs and hash links, so no rewrite rules are needed. Links to individual tabs look like `/tabsite/#tab/althea` and work after refreshing. You can also double-click `upload/tabsite/index.html` to preview locally without running a server.

## Visibility and access

The page contains `noindex, nofollow, noarchive` metadata. The optional Apache `.htaccess` applies the same search-engine directive to all files and disables directory listings. Keep `/tabsite/` out of your public navigation and sitemap.

**An unlisted URL is not access control.** Anyone who obtains the address can read the tabs, including `library.js` and the diagrams. Search-engine directives are advisory. If you want access restricted to you, enable directory password protection for the entire `/tabsite/` folder in your hosting control panel, over HTTPS. Protecting only `index.html` would leave the tab data accessible. No password or fake browser-only login is included.

On Nginx, IIS, and other non-Apache hosts, `.htaccess` is ignored. Configure equivalent directory-listing and `X-Robots-Tag` settings with your provider if wanted. If Apache reports HTTP 500 because it disallows `.htaccess` directives, remove that optional file and configure those settings through the host. The page's noindex metadata remains active.

## Reading controls

- **↑ / ↓:** hide or show the controls. On desktop, hiding them removes the full-width toolbar and leaves floating play/pause, theme, and show-controls buttons in the corner. The sheet gains the toolbar's full height. Phones start with a slim collapsed bar. Hiding controls preserves your reading position and keeps auto-scroll running.
- **☀ / ☾:** switch between light and dark mode. Dark is the default. The button is available on the contents page and in the reader, even while controls are collapsed.
- **Full screen (four corners):** click the button beside the theme control to fill the screen with the app. Click it again, or press Esc, to exit. It stays available when the controls are collapsed. Browsers require a user click, so full screen never starts automatically. The button appears only when the browser supports and permits the Fullscreen API; availability on phones depends on the browser. Entering or leaving full screen pauses auto-scroll.
- **Zoom − / +:** resizes the music text and diagrams. **Fit** fits the widest line to the available width. Long lines never wrap, preserving chord positions and six-string tab alignment. At larger zoom levels, pan horizontally inside the music area. Fitting a wide tab onto a phone can make it small; landscape mode or a tablet is more comfortable.
- **Play scroll / Pause:** moves down the tab at the selected speed. This is scrolling, not audio playback.
- **Speed:** 2–80 pixels per second; the initial value is 20. Change it while scrolling. Zoom changes the amount of content on screen, so adjust the speed by feel. It is not synchronized to BPM.
- **Start:** pauses and returns to the top of the tab. It is disabled when you are already at the start and not scrolling. Scrolling stops at the end. The space below the final line lets it rise into the reading area.
- **Keyboard:** Space toggles scrolling; + and − zoom when focus is in the tab. Enter/Space activate focused buttons normally, and arrow keys operate the speed slider.
- Manual scrolling, zooming, resizing, or hiding the browser tab pauses auto-scroll. Press Play scroll to resume from your current position.
- Zoom, speed, theme, and whether the controls are collapsed are remembered on that browser when local storage is available. Playback never starts automatically.

## Update the collection

Keep the originals in `tabs/`. Add or replace `.docx` and `.txt` files there. Edit `metadata.json` to set clean display titles and artists; each key is the exact source filename. New files without metadata use their filename as the title.

Run from this project directory with Python 3:

```powershell
python scripts/build.py
```

The build uses only the Python standard library. It updates `upload/tabsite/` and `tabsite-upload.zip`. Upload the rebuilt files to replace the previous version. Edit the interface in `src/`, then rebuild; do not edit generated `library.js` directly.

Word layout tables are read down the left cell and then the right cell, preserving the reading order used by these source documents. The importer retains music text, manual line breaks, leading spaces, tab stops expanded to eight-character columns, and embedded PNG diagrams. It normalizes font, color, and excess blank paragraphs; original page breaks and Word styling are not reproduced. Each tab has one compact title and artist heading. Exact duplicate source headings are identified by the optional third object in each metadata entry (`sourceHeading`); dates and credits from those headings are kept in its `note`. The importer only removes a matching first non-empty text line, leaving lyrics and unrecognized headings untouched. This is a viewer, not a notation editor or automatic transposer.

## Proposed features

### Upload tabs through the browser (Bluehost)

Add a simple **Add tab** dialog or page so new tabs can be added from a PC or iPhone without rebuilding and uploading the whole site. This is a proposed feature, not currently implemented.

- Protect the upload page with Bluehost's directory password protection.
- Accept `.docx` and `.txt` files, preview the converted tab, and let the user confirm its title and artist before saving.
- Save the converted tab and any diagrams on Bluehost, then update the alphabetical table of contents so the new tab is available on every device.
- Use a small PHP backend and file-based storage; no database is needed. Validate uploads and preserve the existing reader's formatting and controls.

This would require one-time hosting setup for the protected upload directory and writable storage. The current static viewer and Python build remain the initial version.

## Project files

- `tabs/`: original documents, preserved.
- `metadata.json`: editable titles and artists.
- `src/`: interface source.
- `scripts/build.py`: collection importer and upload packager.
- `upload/tabsite/`: ready-to-upload website.
- `tabsite-upload.zip`: the same website as an archive.
- `COMPETITIVE-ANALYSIS.md`: comparison and rationale for this first version.

For a local HTTP preview:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory upload
```

Then visit `http://127.0.0.1:8765/tabsite/`.
