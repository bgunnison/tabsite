# Tab book

A viewer for a personal collection of guitar tabs. Includes an alphabetical table of contents, zoom, and adjustable auto-scroll.

## Features and usage

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

## Proposed features

### Upload tabs through the browser

Add a simple **Add tab** dialog or page so new tabs can be added from a PC or iPhone without rebuilding and uploading the whole site. This is a proposed feature, not currently implemented.

## Project files

- `tabs/`: original documents, preserved.
- `metadata.json`: editable titles and artists.
- `src/`: interface source.
- `scripts/build.py`: collection importer and upload packager.
- `upload/tabsite/`: ready-to-upload website.
- `tabsite-upload.zip`: the same website as an archive.
- `COMPETITIVE-ANALYSIS.md`: comparison and rationale for this first version.
