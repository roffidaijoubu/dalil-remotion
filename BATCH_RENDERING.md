# Batch Rendering Arabic Book Highlights

This guide explains how to generate multiple Arabic book highlight videos from a CSV dataset.

## 📁 Files

- `data/books.csv` - Your dataset with book information
- `scripts/batch-render.mjs` - The batch rendering script
- `out/` - Output directory for rendered videos

## 📋 CSV Format

The CSV file should contain the following columns:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `filename` | string | Output video filename (without .mp4) | `sahih-bukhari-1` |
| `bookTitle` | string | Title of the book | `Sahih al-Bukhari` |
| `bookAuthor` | string | Author name | `Imam al-Bukhari` |
| `bookExtra` | string | Additional info (volume, page, etc.) | `Volume 1 - Page 12` |
| `bookCoverUrl` | URL | Book cover image URL | `https://example.com/cover.jpg` |
| `bookUrl` | URL | Link for QR code | `https://sunnah.com/bukhari/1` |
| `arabicText` | string | Arabic text with highlight tags | `النص <highlight color="#ff0000">المميز</highlight>` |
| `translationText` | string | Translation with highlight tags | `Text with <highlight color="#ff0000">highlight</highlight>` |
| `highlightDelaySeconds` | number | Delay between highlights | `0.7` |

### Highlight Tags

Use `<highlight color="#colorcode">text</highlight>` to mark text for highlighting:

```html
<!-- Basic highlight with color -->
<highlight color="#ff6b6b">highlighted text</highlight>

<!-- Multiple highlights -->
النص مع <highlight color="#e74c3c">التمييز الأول</highlight> و <highlight color="#3498db">التمييز الثاني</highlight>
```

## 🎨 Recommended Colors

### Islamic Theme
- `#2ecc71` - Islamic green
- `#f39c12` - Golden yellow  
- `#e74c3c` - Deep red
- `#3498db` - Blue
- `#9b59b6` - Purple

### Warm Theme
- `#ff6b6b` - Coral red
- `#4ecdc4` - Teal
- `#45b7d1` - Sky blue
- `#96ceb4` - Mint green
- `#feca57` - Warm yellow

## 🚀 Usage

1. **Prepare your data**: Edit `data/books.csv` with your book information

2. **Run batch rendering**:
   ```bash
   npm run batch-render
   ```

3. **Check output**: Videos will be saved in `out/` folder with your specified filenames

## ⚙️ Customization

### Video Duration
The script automatically calculates video duration based on:
- Number of highlights
- Highlight delay seconds
- Base animation time (2 seconds)
- Buffer time (1 second)

**Formula**: `(2 + highlights × delay + 1) × 30fps`

### Render Settings
Edit `scripts/batch-render.mjs` to customize:

```javascript
await renderMedia({
  // ... existing settings
  codec: 'h264',           // Video codec
  imageFormat: 'jpeg',     // Frame format
  jpegQuality: 90,         // Quality (1-100)
  // Add more settings as needed
});
```

## 📊 Example Data

The provided `data/books.csv` includes:
- Sahih al-Bukhari hadith
- Quran verse (Ayat al-Kursi)  
- Arabic grammar example
- Hadith an-Nawawi
- Islamic jurisprudence text

## 🔧 Troubleshooting

### Common Issues

1. **CSV not found**: Ensure `data/books.csv` exists
2. **Render fails**: Check that all URLs in CSV are valid
3. **Duration too short**: Increase `highlightDelaySeconds` or add buffer time

### Error Handling
The script continues rendering other videos if one fails, showing error messages for debugging.

### Logs
The script provides detailed logs showing:
- Bundle progress
- Number of entries found
- Current video being rendered
- Calculated duration and highlights
- Success/error status

## 📝 Tips

1. **Test with one video first**: Create a CSV with just one row to test
2. **Use consistent colors**: Stick to a theme for better visual consistency  
3. **Keep text concise**: Very long text may not fit well in the layout
4. **Match highlight counts**: Ensure Arabic and translation have same number of highlights
5. **Check URLs**: Verify all book cover URLs and book URLs are accessible

## 🎬 Output

Each video will be:
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 (landscape)
- **Frame rate**: 30 FPS
- **Features**: 
  - Left-to-right highlights for translation
  - Right-to-left highlights for Arabic
  - Book cover, author, and QR code
  - Smooth wipe animations 