# Arabic Book Highlighting Template - Usage Guide

## Overview
This Remotion template creates landscape videos for highlighting text passages in Arabic books with synchronized translations.

## Features
- ✅ Landscape video format (1920x1080)
- ✅ Book cover display with title
- ✅ Arabic text with RTL support
- ✅ Translation text with LTR support
- ✅ Left-to-right wiping highlight animation
- ✅ Customizable highlight colors
- ✅ Configurable delay between highlights
- ✅ Synchronized highlighting between Arabic and translation

## Parameters

### Required Props
- `bookTitle`: String - The title of the book
- `bookCoverUrl`: String (URL) - Remote URL for the book cover image
- `arabicText`: String - Arabic text with highlight tags
- `translationText`: String - Translation text with highlight tags
- `highlightDelaySeconds`: Number - Delay between highlights (default: 0.5)

## Text Formatting

Use the `<highlight>` tag to mark text for highlighting:

### Basic Highlight (red by default)
```html
<highlight>النص المميز</highlight>
```

### Colored Highlight
```html
<highlight color="#ff6b6b">النص المميز بلون أحمر</highlight>
<highlight color="#4ecdc4">النص المميز بلون أزرق</highlight>
<highlight color="#45b7d1">النص المميز بلون أزرق فاتح</highlight>
```

## Example Usage

### Basic Example
```javascript
{
  bookTitle: "كتاب النحو العربي",
  bookCoverUrl: "https://example.com/book-cover.jpg",
  arabicText: "هذا النص العربي مع <highlight color=\"#ff6b6b\">التمييز الأول</highlight> و <highlight color=\"#4ecdc4\">التمييز الثاني</highlight> في المكان المناسب",
  translationText: "This is Arabic text with <highlight color=\"#ff6b6b\">first highlight</highlight> and <highlight color=\"#4ecdc4\">second highlight</highlight> in the right place",
  highlightDelaySeconds: 0.5
}
```

### Complex Example
```javascript
{
  bookTitle: "صحيح البخاري",
  bookCoverUrl: "https://example.com/bukhari-cover.jpg",
  arabicText: "عن أبي هريرة رضي الله عنه قال: قال رسول الله صلى الله عليه وسلم: <highlight color=\"#e74c3c\">المؤمن القوي</highlight> <highlight color=\"#3498db\">خير وأحب إلى الله</highlight> من <highlight color=\"#f39c12\">المؤمن الضعيف</highlight> وفي كل خير",
  translationText: "Abu Huraira reported: The Messenger of Allah said: <highlight color=\"#e74c3c\">The strong believer</highlight> is <highlight color=\"#3498db\">better and more beloved to Allah</highlight> than <highlight color=\"#f39c12\">the weak believer</highlight>, though there is good in both",
  highlightDelaySeconds: 0.7
}
```

## Color Suggestions

### Islamic/Arabic Theme Colors
- `#2ecc71` - Green (Islamic green)
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

## Video Duration Calculation

The video duration is automatically calculated based on:
- Number of highlights × `highlightDelaySeconds`
- Add extra time for entry animation and final display

**Formula**: `(numberOfHighlights × highlightDelaySeconds + 2) × fps`

Example: 
- 3 highlights with 0.5s delay = (3 × 0.5 + 2) × 30 = 105 frames (3.5 seconds)

## Rendering Commands

### Development
```bash
npm run dev
```

### Production Render
```bash
npx remotion render src/index.ts ArabicBookHighlight out/arabic-highlight.mp4
```

### With Custom Props
```bash
npx remotion render src/index.ts ArabicBookHighlight out/arabic-highlight.mp4 --props='{"bookTitle":"كتاب جديد","bookCoverUrl":"https://example.com/cover.jpg","arabicText":"النص العربي <highlight color=\"#ff0000\">مع التمييز</highlight>","translationText":"Arabic text <highlight color=\"#ff0000\">with highlight</highlight>","highlightDelaySeconds":0.8}'
```

## Tips

1. **Text Length**: Keep text concise to fit within the video dimensions
2. **Highlight Count**: Match the number of highlights between Arabic and translation
3. **Colors**: Use contrasting colors for better visibility
4. **Timing**: Adjust `highlightDelaySeconds` based on reading speed
5. **Book Covers**: Use high-quality images (min 300x400px) for book covers
6. **Arabic Fonts**: The template uses system Arabic fonts with fallbacks

## Troubleshooting

### Common Issues
1. **Missing highlights**: Ensure highlight tags are properly closed
2. **Mismatched highlights**: Make sure Arabic and translation have the same number of highlights
3. **Long text overflow**: Reduce text length or adjust font size in the component
4. **Book cover not loading**: Verify the URL is accessible and use HTTPS links 