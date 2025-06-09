import React, { useMemo, useState, useEffect } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  delayRender,
  continueRender,
  OffthreadVideo,
  staticFile,
} from "remotion";
import { z } from "zod";
import QRCode from "qrcode";

export const arabicBookSchema = z.object({
  bookTitle: z.string(),
  bookAuthor: z.string().optional(),
  bookExtra: z.string().optional(),
  bookCoverUrl: z.string().url(),
  bookUrl: z.string().url(),
  arabicText: z.string(),
  translationText: z.string(),
  grading: z.string().optional(),
  highlightDelaySeconds: z.number().default(0.5),
});

export type ArabicBookProps = z.infer<typeof arabicBookSchema>;

interface HighlightSegment {
  text: string;
  color?: string;
  isHighlight: boolean;
}

// Helper function to convert CSS color to rgba with opacity
const colorToRgba = (color: string, opacity: number = 0.5): string => {
  // Handle hex colors
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Handle named colors
  const colorMap: { [key: string]: string } = {
    red: "rgba(255, 0, 0, " + opacity + ")",
    blue: "rgba(0, 0, 255, " + opacity + ")",
    green: "rgba(0, 128, 0, " + opacity + ")",
    yellow: "rgba(255, 255, 0, " + opacity + ")",
    orange: "rgba(255, 165, 0, " + opacity + ")",
    purple: "rgba(128, 0, 128, " + opacity + ")",
    pink: "rgba(255, 192, 203, " + opacity + ")",
    cyan: "rgba(0, 255, 255, " + opacity + ")",
    magenta: "rgba(255, 0, 255, " + opacity + ")",
    lime: "rgba(0, 255, 0, " + opacity + ")",
  };

  return colorMap[color.toLowerCase()] || `rgba(128, 128, 128, ${opacity})`;
};

const parseTextWithHighlights = (text: string): HighlightSegment[] => {
  const segments: HighlightSegment[] = [];
  const regex = /<highlight(?:\s+color="([^"]*)")?>([^<]*)<\/highlight>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before highlight
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        isHighlight: false,
      });
    }

    // Add highlight segment
    segments.push({
      text: match[2],
      color: match[1] || "#ff0000",
      isHighlight: true,
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isHighlight: false,
    });
  }

  return segments;
};

const HighlightedText: React.FC<{
  segments: HighlightSegment[];
  isArabic?: boolean;
  currentHighlightIndex: number;
  highlightProgress: number;
  highlightDirection?: "ltr" | "rtl";
}> = ({
  segments,
  isArabic = false,
  currentHighlightIndex,
  highlightProgress,
  highlightDirection = "ltr",
}) => {
  let highlightCount = -1;

  return (
    <div
      className={`${isArabic ? "text-5xl text-right font-bold" : "text-3xl text-left"} leading-relaxed`}
      style={{
        direction: isArabic ? "rtl" : "ltr",
        fontFamily: isArabic
          ? "Arial, 'Noto Sans Arabic', sans-serif"
          : "inherit",
      }}
    >
      {segments.map((segment, index) => {
        if (segment.isHighlight) {
          highlightCount++;
          const isCurrentHighlight = highlightCount === currentHighlightIndex;
          const isCompleted = highlightCount < currentHighlightIndex;

          const currentProgress = isCompleted
            ? 1
            : isCurrentHighlight
              ? highlightProgress
              : 0;

          return (
            <span
              key={index}
              className="relative"
              style={{
                // For completed highlights, show full background
                ...(isCompleted && {
                  backgroundColor: colorToRgba(segment.color || "#ff0000", 0.5),
                }),
                // For current highlight, use moving linear gradient
                ...(isCurrentHighlight && {
                  background:
                    highlightDirection === "rtl"
                      ? `linear-gradient(to left, ${colorToRgba(segment.color || "#ff0000", 0.5)} ${currentProgress * 100}%, transparent ${currentProgress * 100}%)`
                      : `linear-gradient(to right, ${colorToRgba(segment.color || "#ff0000", 0.5)} ${currentProgress * 100}%, transparent ${currentProgress * 100}%)`,
                }),
              }}
            >
              {segment.text}
            </span>
          );
        }

        return <span key={index}>{segment.text}</span>;
      })}
    </div>
  );
};

export const ArabicBookHighlight: React.FC<ArabicBookProps> = ({
  bookTitle,
  bookAuthor,
  bookExtra,
  bookCoverUrl,
  bookUrl,
  arabicText,
  translationText,
  grading,
  highlightDelaySeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Generate QR code
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Delay render until QR code is generated
    const handle = delayRender("Generating QR code");

    QRCode.toDataURL(bookUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => {
        setQrCodeDataUrl(url);
        continueRender(handle);
      })
      .catch((error) => {
        console.error("Error generating QR code:", error);
        setQrCodeDataUrl(null);
        continueRender(handle);
      });
  }, [bookUrl]);

  useEffect(() => {
    // Delay render until book cover image is preloaded
    if (!bookCoverUrl) {
      setImageLoaded(true);
      return;
    }

    const handle = delayRender("Loading book cover image");
    const img = new Image();

    img.onload = () => {
      setImageLoaded(true);
      continueRender(handle);
    };

    img.onerror = () => {
      console.error("Failed to load book cover image:", bookCoverUrl);
      setImageLoaded(true);
      continueRender(handle);
    };

    img.src = bookCoverUrl;
  }, [bookCoverUrl]);

  const arabicSegments = parseTextWithHighlights(arabicText);
  const translationSegments = parseTextWithHighlights(translationText);

  // Count total highlights and calculate individual durations based on text length
  const arabicHighlights = arabicSegments.filter((s) => s.isHighlight);
  const translationHighlights = translationSegments.filter(
    (s) => s.isHighlight,
  );
  const totalHighlights = Math.min(
    arabicHighlights.length,
    translationHighlights.length,
  );

  // Calculate duration for each highlight based on text length
  const highlightDurations = [];
  const baseDelayFrames = highlightDelaySeconds * fps;
  const minDurationFrames = Math.max(30, baseDelayFrames); // Minimum 1 second

  for (let i = 0; i < totalHighlights; i++) {
    const arabicText = arabicHighlights[i]?.text || "";
    const translationText = translationHighlights[i]?.text || "";

    // Use the longer text to calculate duration (character count)
    const maxLength = Math.max(arabicText.length, translationText.length);

    // Base duration + extra time for longer text (roughly 0.05 seconds per character)
    const extraTime = Math.max(0, (maxLength - 20) * 0.05); // Extra time for text longer than 20 chars
    const durationSeconds = highlightDelaySeconds + extraTime;
    const durationFrames = Math.max(minDurationFrames, durationSeconds * fps);

    highlightDurations.push(durationFrames);
  }

  // Calculate cumulative timing for each highlight
  const initialDelayFrames = 1 * fps; // 1 second breathing room before first highlight
  const cumulativeTimings = [initialDelayFrames]; // Start with initial delay

  for (let i = 0; i < highlightDurations.length; i++) {
    const lastTiming = cumulativeTimings[cumulativeTimings.length - 1];
    cumulativeTimings.push(lastTiming + highlightDurations[i]);
  }

  // Find current highlight index and progress
  // Highlights should start after: startDelay (1s) + entryAnimation (2s) + initialDelay (1s) = 4s total
  const totalDelayBeforeHighlights = (1 + 1) * fps; // 2 seconds total delay
  const frameAfterAllDelays = Math.max(0, frame - totalDelayBeforeHighlights);
  let currentHighlightIndex = -1;
  let progressInCurrentHighlight = 0;

  for (let i = 0; i < totalHighlights; i++) {
    const startFrame = cumulativeTimings[i] - initialDelayFrames;
    const endFrame = cumulativeTimings[i + 1] - initialDelayFrames;

    if (frameAfterAllDelays >= startFrame && frameAfterAllDelays < endFrame) {
      currentHighlightIndex = i;
      progressInCurrentHighlight = frameAfterAllDelays - startFrame;
      break;
    }
  }

  // If we're past all highlights, set to the last one as completed
  if (
    currentHighlightIndex === -1 &&
    frameAfterAllDelays >=
      cumulativeTimings[totalHighlights] - initialDelayFrames
  ) {
    currentHighlightIndex = totalHighlights; // This will make all highlights appear as completed
  }

  const highlightProgress =
    currentHighlightIndex >= 0 && currentHighlightIndex < totalHighlights
      ? spring({
          frame: progressInCurrentHighlight,
          fps,
          config: {
            damping: 200,
            stiffness: 100,
          },
        })
      : currentHighlightIndex >= totalHighlights
        ? 1
        : 0;

  // Entry animation for the whole layout (delayed by 1 second)
  const startDelayFrames = 1 * fps; // 1 second delay before fade-in starts
  const entryProgress = spring({
    frame: frame - startDelayFrames,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
    },
  });

  const slideIn = interpolate(entryProgress, [0, 1], [-50, 0]);
  const fadeIn = interpolate(entryProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill>
      {/* White Background Layer */}
      <AbsoluteFill style={{ backgroundColor: "white" }} />

      {/* Semi-transparent Background Video Layer */}
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile("background/default.mp4")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.2,
          }}
          volume={0}
          loop
        />
      </AbsoluteFill>

      {/* Content Layer - on top of background video */}
      <AbsoluteFill className="flex items-center justify-center min-h-screen">
        {/* Centering Container - 80% screen width */}
        <div
          className="flex px-16 py-8 gap-8 items-center justify-center"
          style={{
            opacity: fadeIn,
            width: "80%",
          }}
        >
          {/* Left Column - Text Content */}
          <div className="flex-1 flex flex-col space-y-6 -mb-16">
            {/* Arabic Text */}
            <div>
              <HighlightedText
                segments={arabicSegments}
                isArabic={true}
                currentHighlightIndex={currentHighlightIndex}
                highlightProgress={highlightProgress}
                highlightDirection="rtl"
              />
            </div>

            {/* Translation Text */}
            <div>
              <HighlightedText
                segments={translationSegments}
                isArabic={false}
                currentHighlightIndex={currentHighlightIndex}
                highlightProgress={highlightProgress}
                highlightDirection="ltr"
              />
            </div>

            {/* Grading - below translation text */}
            {grading && (
              <div className="bg-green-600 text-white px-4 py-2 text-lg font-semibold w-fit rounded">
                {grading}
              </div>
            )}
          </div>

          {/* Right Column - Book Cover and Details */}
          <div className="shrink-0 min-w-[300px] flex flex-col items-center justify-center space-y-4">
            {/* Book Title - Centered */}
            <div className="bg-blue-700 text-white px-4 py-3 text-xl font-semibold w-full text-center">
              <h1>{bookTitle}</h1>
            </div>
            {/* Author */}
            <div className="text-center flex items-center justify-between w-full">
              {bookExtra && (
                <p className="text-base font-semibold">{bookExtra}</p>
              )}
              {bookAuthor && (
                <p className="text-sm italic text-gray-700">
                  {bookAuthor}
                </p>
              )}
            </div>
            {/* Book Cover */}
            <div
              className="bg-gray-200 rounded-lg shadow-xl w-full relative"
              style={{ aspectRatio: "3/4" }}
            >
              {/* Use Remotion's Img component to prevent flickering */}
              {bookCoverUrl ? (
                <Img
                  src={bookCoverUrl}
                  className="w-full h-full object-cover rounded-lg"
                  alt="Book Cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-center p-4">
                  [Book Cover Image]
                </div>
              )}
              {/* QR Code */}
              {qrCodeDataUrl && (
                <div className="bg-white p-3 rounded-lg shadow-md h-fit w-fit absolute bottom-0 right-0">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
