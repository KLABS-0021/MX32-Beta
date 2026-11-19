# MX32 Patch Sheet (Beta): developer guide

Read this first when continuing work on the app. It explains where everything is and how to change, test and publish it.

## Links
- Live app: https://klabs-0021.github.io/MX32-Beta/
- Repo: https://github.com/KLABS-0021/MX32-Beta (branch `main`, GitHub Pages from root)
- Claude preview: private claude.ai artifact "MX32 Patch Sheet" (slug `4dc37aab-d8c4-4f23-b4b0-89192aae510a`)
- Claude project "MX32 Apps Project" holds a copy of the app plus `x32-m32-scn-format-notes.md` (scene file format) and `mx32-backlog.md` (to-do list and parked work)

## Files
| File | What it is |
|---|---|
| `index.html` | **The whole app**: HTML, CSS, JavaScript, the embedded logo and the built-in base scene. This file is the source of truth. |
| `manifest.webmanifest`, `icon-180/192/512.png` | Home-screen install (name, icons, standalone display) |
| `sw.js` | Offline cache (service worker). Saves the app, fonts, icons and PDF tool on the device after the first visit. |
| `fonts/` | IBM Plex Sans (400–700) and IBM Plex Mono (400–600), Latin, woff2, plus the OFL licence |
| `lib/jspdf.umd.min.js` | jsPDF 2.5.1 for PDF export, plus its licence |
| `README.md` | User-facing description |
| `.nojekyll` | Stops GitHub Pages from processing the site |

**Offline (since 18 Nov 2026):** fonts and jsPDF are stored in the repo, and `sw.js` caches every file. After one visit with internet, the app opens and exports PDF, SCN and CSV with no signal. The app page itself is fetched from the internet first (3 s timeout) so updates arrive, then falls back to the saved copy. Online fallbacks remain for the Claude preview, where the local files don't exist: fonts from jsDelivr (fontsource), jsPDF from cdnjs.

## Design rules (agreed with the user)
- **Space Grey** look (since 18 Nov 2026): dark space grey `#1c1e22` with a fine brushed-metal texture and grain, warm off-white text `#ecebe7`, silver-grey secondary text `#a3a8b0`, soft red accent `#ec5b52`. Silver gradient titles, brushed-silver divider bars, metal-plate buttons (New event, PDF/SCN/CSV). Dark only. Layout follows the "Patch Paper" design: table-style events list, underline tabs, rows of number + colour dot + label + source.
- Fonts: **IBM Plex Sans** (UI) and **IBM Plex Mono** (numbers, sources, small labels).
- **Logo:** silver "M32 / X32" with a red line on a brushed graphite tile (option 2 "Minimal"). Shown in the header and used for the app icons (`icon-180/192/512.png`). Sources: `logo-main.svg` style, drawn as vector paths.
- **Footer on every page:** "Made by Kirin™" and "© year Kirin · All rights reserved". The PDF footer also says "Made by Kirin™".
- Keep the **Beta** badge.
- No tape strip preview on the Inputs tab; the user removed it.
- Colour pickers close by themselves after a colour is picked. Inverted colours show as a coloured ring.
- Delete needs a second tap on a small red "Confirm delete" button (resets after 4 s).
- Tabs: Inputs (channels 1–32 only) · Aux & FX · Outputs (outputs 1–16 with colour) · Export.
- Export: PDF, SCN and CSV as three matching buttons side by side, then input routing, previous events (Open / Duplicate) and this event (Duplicate / Delete).
- Home page: only the "+ New event" button, no import.
- Layout: phone = one column; ≥720 px (iPad) = wider rows with notes inline, details in one row; ≥1100 px (desktop, iPad landscape) = sidebar with details and tabs.
- PDF stays white for printing (black rule, red accents).

## Data model (localStorage)
- Key `mx32pro`: `{v:2, events:[…], migrated:1}`. Older single-event key `mx32beta` is migrated in once.
- Key `mx32venues`: list of venue names.
- Event: `{id, ev (name), dt (YYYY-MM-DD), vn (venue), con ("M32"|"X32"|""), c[32], a[8], f[8], ol[16] (output labels), os[16] (output feeds), ok[16] (output colours), bl, ml, xl (bus/main/matrix labels, no UI now), created, upd}`
- Channel / aux / FX: `{l: label, s: source code, p: 48V 0/1, n: notes, k: colour 0–15 or -1}`
- Source codes: `L1–L32` local, `A1–A48` AES50 A, `B1–B48` AES50 B; aux `X1–X6`, `UL`, `UR`; FX `F1–F8`. Output feeds: `B1–B16` bus, `ML`, `MR`, `MC`, `X1–X6` matrix.
- Colours 0–15: `OFF RD GN YE BL MG CY WH` then inverted `OFFi … WHi` (same names as the console).

## Code map (inside `index.html` `<script>`)
- `F48` flag at the top stays `false`: the user decided 48V controls are not needed. The leftover 48V code can be removed in a clean-up; scenes always leave phantom power off.
- Data: `blank()`, `norm()`, `used()`, `filled()`; storage `load()`, `save()`, `touch()`.
- Screens: `renderHome()`, `renderEdit()`, `renderTab()`; rows `row()` (channel/aux/FX), `oout()` (outputs).
- Events: one click / input / change listener on `#app` using `data-act`, `data-c`, `data-o`, `data-os`, `data-k` (colour), `data-n` (open picker), `data-t` (tab).
- Saving files: `saveFile()` uses Claude's `downloads` capability inside the Claude preview, otherwise a normal browser download.
- CSV: `toCSV()`, `fromCSV()` (import code kept, no button).
- PDF: `loadPDF()`, `buildPDF()` (A4, dark header, tables with colour swatches).
- Blank fields use the M32/X32 factory defaults in the scene: channel N takes console input N (routing Local 1–32 unless a group of 8 is needed for the stage box), names stay empty, and outputs left blank use Out 1–14 = Mix Bus 1–14, Out 15–16 = Main L/R. Labels are trimmed and cut to 12 characters.
- Scene: `DEF_TPL` (built-in neutral base scene), `planRouting()` (groups of 8 inputs, max 4), `buildScene()` (rewrites only names, colours, sources, routing, output feeds and, if `F48`, headamps), `scnPanel()` (routing preview), `zip1()` (wraps the .scn in a .zip for the Claude preview, whose downloads refuse `.scn`).

## How to make a change
1. Edit `index.html` (it is plain HTML/CSS/JS, nothing to build).
2. Test in a browser at 390 px, 820 px and 1440 px widths: create an event, fill channels, pick colours, save PDF / SCN / CSV, duplicate and delete.
3. If you changed or added any file, raise `VERSION` in `sw.js` (and add new files to its `FILES` list), so installed copies refresh.
4. Push to `main`; GitHub Pages updates in 1–2 minutes. Phones get the new version the next time the app is opened with internet.
5. Update the Claude preview artifact and the project copy (`claude/mx32-patch-sheet-v2.html`) so all three match.

## Working with the user
- Explain in simple, non-technical English.
- When they ask "tell me first", give the plan and wait for a go-ahead.
- They test on a real M32/X32; a new .scn should be loaded into a spare scene slot first.
