import { selectComposition, renderMedia } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import { enableTailwind } from '@remotion/tailwind-v4';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const compositionId = 'ArabicBookHighlight';

// Function to read CSV and convert to JSON
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Convert highlightDelaySeconds to number
        data.highlightDelaySeconds = parseFloat(data.highlightDelaySeconds);
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', reject);
  });
};

async function main() {
  try {
    console.log('📚 Starting batch render for Arabic Book Highlights...');
    
    // Bundle the Remotion project
    console.log('📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: './src/index.ts',
      // Add Tailwind webpack override for proper CSS processing
      webpackOverride: enableTailwind,
    });
    console.log('✅ Bundle complete!');

    // Read the CSV data
    console.log('📖 Reading CSV data...');
    const csvPath = './data/books.csv';
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at ${csvPath}`);
    }
    
    const data = await readCSV(csvPath);
    console.log(`📋 Found ${data.length} book entries to render`);

    // Create output directory if it doesn't exist
    const outputDir = './out';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Render each video
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      const { filename, ...inputProps } = entry;
      
      console.log(`\n🎬 Rendering video ${i + 1}/${data.length}: ${filename}`);
      console.log(`📖 Book: ${inputProps.bookTitle} by ${inputProps.bookAuthor}`);
      
      try {
        // Get composition with the input props
        const composition = await selectComposition({
          serveUrl: bundleLocation,
          id: compositionId,
          inputProps,
        });

                 // Calculate video duration based on number of highlights and delay
         const arabicHighlights = (inputProps.arabicText?.match(/<highlight/g) || []).length;
         const translationHighlights = (inputProps.translationText?.match(/<highlight/g) || []).length;
         const totalHighlights = Math.min(arabicHighlights, translationHighlights);
         

        
        // Dynamic duration: start delay + base time + initial delay + (highlights * delay) + buffer + padding
        const startDelaySeconds = 1; // Delay before fade-in starts
        const baseDurationSeconds = 2; // Entry animation and final display
        const initialDelaySeconds = 1; // Breathing room before first highlight
        const highlightDurationSeconds = totalHighlights * inputProps.highlightDelaySeconds;
        const bufferSeconds = 1; // Extra time at the end
        const paddingSeconds = 3; // Additional breathing room to read
        const totalDurationSeconds = startDelaySeconds + baseDurationSeconds + initialDelaySeconds + highlightDurationSeconds + bufferSeconds + paddingSeconds;
        const durationInFrames = Math.ceil(totalDurationSeconds * 30); // 30 fps

        console.log(`⏱️  Calculated duration: ${totalDurationSeconds}s (${durationInFrames} frames) for ${totalHighlights} highlights`);

        // Render the video
        await renderMedia({
          composition: {
            ...composition,
            durationInFrames, // Override duration
          },
          serveUrl: bundleLocation,
          codec: 'h264',
          outputLocation: path.join(outputDir, `${filename}.mp4`),
          inputProps,
          // Optional: Add more render settings
          imageFormat: 'jpeg',
          jpegQuality: 90,
        });

        console.log(`✅ Successfully rendered: ${filename}.mp4`);
      } catch (error) {
        console.error(`❌ Error rendering ${filename}:`, error.message);
        // Continue with next video instead of stopping
        continue;
      }
    }

    console.log('\n🎉 Batch rendering complete!');
    console.log(`📁 Check the "${outputDir}" folder for your videos.`);

  } catch (error) {
    console.error('❌ Batch rendering failed:', error);
    process.exit(1);
  }
}

// Run the script
main(); 