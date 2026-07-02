<p align="center">
  <samp><b>dalils</b> &middot; Automated Arabic Book Highlight Video Generator</samp>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/dalils-22_entries-2ecc71?style=flat-square" alt="Dalils Corpus">
  <img src="https://img.shields.io/badge/engine-remotion_v4-3498db?style=flat-square" alt="Remotion Engine">
  <img src="https://img.shields.io/badge/format-1080p_landscape-f39c12?style=flat-square" alt="Video Format">
  <img src="https://img.shields.io/badge/license-private-e74c3c?style=flat-square" alt="License">
</p>

# dalils

<p align="center">
  <b>Generate beautiful, synchronized Arabic-translation highlight videos automatically.</b>
  <br>
  Built on top of Remotion, dalils parses book datasets and renders high-quality landscape MP4s.
</p>

---

```text
┌────────────────────────────────────────────────────────────────────────┐
│  dalils - Automated Arabic Book Highlight Video Generator              │
├────────────────────────────────────────────────────────────────────────┤
│  $ npm run batch-render                                                │
│                                                                        │
│  📚 Starting batch render for Arabic Book Highlights...                │
│  📦 Bundling Remotion project...                                       │
│  ✅ Bundle complete!                                                   │
│  📖 Reading CSV data...                                                │
│  📋 Found 22 book entries in data/books.csv to render                  │
│                                                                        │
│  [1/22] 🎬 Rendering betis-allah.mp4                                   │
│         ├── Title: Sahih al-Bukhari (No. 7439)                         │
│         ├── Highlights: 2 detected (Delay: 0.6s)                       │
│         └── Status: ██████████████─ 100% (Completed in 4.2s)           │
│                                                                        │
│  [2/22] 🎬 Rendering rasul-tersihir.mp4                                 │
│         ├── Title: Sahih al-Bukhari (No. 5765)                         │
│         ├── Highlights: 2 detected (Delay: 0.5s)                       │
│         └── Status: ██████████████─ 100% (Completed in 3.8s)           │
│                                                                        │
│  ✓ Batch rendering complete!                                          │
│  → Check the "./out" folder for your videos.                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Why automate highlights instead of manual video editing?

✓ **Effortless Wipes**: Manual video editing takes hours to align right-to-left Arabic text with left-to-right translations. `dalils` does it programmatically using CSS linear gradients.  
✓ **Dynamic QR Codes**: Generates unique vector QR codes per book entry, embedding the source URL directly in the layout.  
✓ **Symmetric Sync**: Highlights between translation and Arabic are perfectly locked in time based on computed word timings.

## Performance & Productivity Comparison

<p align="center">

| Metric | dalils (Automated) | Manual Editing (After Effects) |
| :--- | :--- | :--- |
| **Time per 10 videos** | ~2 minutes | ~2.5 hours |
| **Layout Symmetry** | Automatic Flexbox | Manual pixel alignment |
| **QR Code Export** | Generated on-the-fly | Manual export & import |
| **Duration Calculation** | Automatic based on text length | Manual timeline cutting |

</p>

## Minimum Viable Knowledge

✓ **Tagging**: Wrap highlighted terms inside `<highlight color="#hex">text</highlight>`.  
✓ **Symmetry**: Maintain matching counts of `<highlight>` tags in both Arabic and Translation fields.  
✓ **Formula**: Video length is computed as `(2 + highlight_count × delay + 1) × 30` frames.  
✓ **Output**: Landscape video outputs are exported directly into the `/out` directory in 1080p MP4.

## Quick Start

```bash
# Clone and install dependencies
git clone https://github.com/PramaAditya/dalils.git
cd dalils
npm install

# Start Remotion Studio for live editing and previewing
npm run dev

# Batch render all book entries defined in data/books.csv
npm run batch-render
```

## Project Panorama

```text
                                 ┌────────────────────────┐
                                 │     data/books.csv     │
                                 └───────────┬────────────┘
                                             │ (reads dataset)
                                             ▼
┌────────────────────────┐       ┌────────────────────────┐
│  public/background/    ├──────►│  scripts/batch-render  │
│  (looping backgrounds) │       └───────────┬────────────┘
└────────────────────────┘                   │ (bundles and orchestrates)
                                             ▼
┌────────────────────────┐       ┌────────────────────────┐
│  qrcode Generator      ├──────►│  remotion (React root) │
│  (dynamic per-item QR) │       └───────────┬────────────┘
└────────────────────────┘                   │ (sequential highlights)
                                             ▼
                                 ┌────────────────────────┐
                                 │     out/*.mp4 Videos   │
                                 └────────────────────────┘
```

---

<p align="center">
  <a href="https://www.remotion.dev/docs">Remotion Docs</a> &middot; <a href="https://github.com/PramaAditya/dalils/issues">Report Issues</a>
</p>

<p align="center">
  <sub>UNLICENSED &copy; PramaAditya</sub>
</p>
