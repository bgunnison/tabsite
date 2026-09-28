# Guitar tab reader comparison

Research checked September 27, 2026. This comparison focuses on reading personal tabs while playing. Features below come from the products' own documentation; the design recommendations are my assessment. Prices are intentionally omitted because this first version has no subscription or app dependency.

| Product | Relevant documented strengths | Lesson for this viewer |
| --- | --- | --- |
| [OnSong](https://onsongapp.com/docs/interface/livebar/autoscroll/) | A single toggle starts, stops, and resumes autoscroll. Supports linear scrolling over a duration and recorded non-linear timelines. Manual scrolling and zoom interact with autoscroll. | Keep one prominent play/pause control. Let the player position the sheet manually and resume. A speed slider is sufficient for the first version; duration and recorded timelines would add setup. |
| [Chordle](https://www.chordle.com/help/keyboard-and-pedal-shortcuts) | Keyboard and pedal shortcuts toggle scrolling, change speed, and move through songs. | Large accessible buttons and a Space shortcut make the essential action easy to reach. Native buttons remain operable by keyboard; configurable pedals can wait. |
| [Songsterr Plus](https://www.songsterr.com/plus) | Adjusts audio playback speed without changing pitch; loops selected measures; offers solo/mute and high-contrast printing. | Distinguish scroll speed from musical playback speed. This collection consists of Word/text sheets, so audio playback and measure-aware looping would require structured notation or new audio data. |

The closest fit is the personal chart-reader approach of OnSong and Chordle. Songsterr's synchronized audio tools solve a broader learning task. For this small collection, the useful common pattern is readable music with immediate performance controls.

## First-version decisions

- **Open the collection immediately.** One alphabetical list, grouped by initial letter, with visible artist names where supplied and a letter jump bar. Forty entries do not need a search interface yet.
- **Keep the sheet predictable.** One continuous column, a consistent monospace font, intact whitespace, and retained chord diagrams. Avoid wrapping tab lines because it would corrupt alignment.
- **Keep controls visible.** The toolbar stays above an independently scrolling sheet. Zoom, Fit, Speed, Play/Pause, and Return to start cover the requested practice flow.
- **Make stopping reliable.** Pause when the user manually scrolls or changes zoom, and when the browser tab is hidden. Resuming always requires an explicit action. The sheet stops at the end.
- **Make the smallest deployment practical.** Plain static files that can live under the existing site's `/tabsite/` folder. No third-party scripts, account creation, or uploads through a new service.
- **Describe privacy accurately.** Omit public navigation and request no indexing, while documenting that actual private access requires host-level protection of the full folder.

## Deliberately deferred

Search, favorites, set lists, transposition, audio, metronome, looping, automatic duration calculations, in-browser editing, and account management. Add these only after using the core reader. The most useful next enhancement would depend on what interrupts actual practice: finding songs, repeats, or reaching the controls.

This comparison reviews documented capabilities, not hands-on subscription testing of the competing apps. The local reader is tested separately with the supplied collection.
