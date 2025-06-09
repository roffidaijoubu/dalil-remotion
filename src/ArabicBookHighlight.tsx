import React, { useMemo, useState, useEffect } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import QRCode from "qrcode";

export const arabicBookSchema = z.object({
  bookTitle: z.string(),
  bookAuthor: z.string(),
  bookExtra: z.string().optional(),
  bookCoverUrl: z.string().url(),
  bookUrl: z.string().url(),
  arabicText: z.string(),
  translationText: z.string(),
  highlightDelaySeconds: z.number().default(0.5),
});

export type ArabicBookProps = z.infer<typeof arabicBookSchema>;

interface HighlightSegment {
  text: string;
  color?: string;
  isHighlight: boolean;
}

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
      className={`text-5xl leading-relaxed ${
        isArabic ? "text-right font-arabic" : "text-left"
      }`}
      style={{
        direction: isArabic ? "rtl" : "ltr",
        fontFamily: isArabic
          ? "Arial, 'Noto Sans Arabic', sans-serif"
          : "inherit",
        fontWeight: isArabic ? 'bold':'normal',
        fontSize: isArabic? '4em' : '3em',
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
            <span key={index} className="relative inline-block">
              {/* Original text color (e.g., black), always underneath */}
              {segment.text}

              {/* Overlay that wipes in, containing the highlight background and the white text */}
              <span
                className="absolute top-0 bottom-0 h-full" // Base class for overlay
                style={{
                  width: `${currentProgress * 100}%`,
                  overflow: "hidden", // Clips the content to create the wipe effect
                  ...(highlightDirection === "rtl"
                    ? { right: 0, left: "auto" }
                    : { left: 0, right: "auto" }),
                }}
              >
                {/* Background color of the highlight */}
                <span
                  className="absolute inset-0"
                  style={{
                    backgroundColor: segment.color,
                  }}
                />
                {/* Text in 'highlighted' color (e.g., white), on top of the highlight background */}
                <span
                  // This span now explicitly fills its parent (the wiping overlay)
                  // and aligns its text content based on isArabic.
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    color: "white", // Highlighted text color
                    whiteSpace: "nowrap", // Prevents text reflow during animation
                    textAlign: isArabic ? "right" : "left", // Align text within this span
                  }}
                >
                  {segment.text}
                </span>
              </span>
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
  highlightDelaySeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Generate QR code
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
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
      })
      .catch((error) => {
        console.error("Error generating QR code:", error);
        setQrCodeDataUrl(null);
      });
  }, [bookUrl]);

  const arabicSegments = parseTextWithHighlights(arabicText);
  const translationSegments = parseTextWithHighlights(translationText);

  // Count total highlights
  const totalHighlights = Math.min(
    arabicSegments.filter((s) => s.isHighlight).length,
    translationSegments.filter((s) => s.isHighlight).length,
  );

  const delayFrames = highlightDelaySeconds * fps;
  const highlightDurationFrames = Math.max(30, delayFrames); // Minimum 1 second per highlight

  // Calculate current highlight index and progress
  const currentHighlightIndex = Math.floor(frame / delayFrames);
  const highlightStartFrame = currentHighlightIndex * delayFrames;
  const progressInCurrentHighlight = frame - highlightStartFrame;

  const highlightProgress =
    currentHighlightIndex < totalHighlights
      ? spring({
          frame: progressInCurrentHighlight,
          fps,
          config: {
            damping: 200,
            stiffness: 100,
          },
        })
      : 1;

  // Entry animation for the whole layout
  const entryProgress = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
    },
  });

  const slideIn = interpolate(entryProgress, [0, 1], [-50, 0]);
  const fadeIn = interpolate(entryProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill className="bg-white flex items-center justify-center">
      {/* Centering Container */}
      <div
        className="flex px-32 py-16 gap-8 w-full items-center" // Wider container for larger texts
        style={{
          opacity: fadeIn,
          // transform: `translateX(${slideIn}px)`, // Keep slide-in if desired, or remove for pure centering
        }}
      >
        {/* Left Column - Text Content */}
        <div className="w-full flex flex-col space-y-4">
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
        </div>

        {/* Right Column - Book Cover and Details */}
        <div className="shrink-0 min-w-[300px] flex flex-col items-center justify-center space-y-4">
          {/* Book Title */}
          <div className="bg-blue-700 text-white px-4 py-3 text-xl font-semibold self-start">
            <h1>{bookTitle}</h1>
          </div>
          {/* Author */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">{bookAuthor}</p>
            {bookExtra && (
              <p className="text-sm text-gray-500 mt-1">{bookExtra}</p>
            )}
          </div>
          {/* Book Cover */}
          <div
            className="bg-gray-200 rounded-lg shadow-xl w-full h-auto relative"
            style={{
              aspectRatio: "3/4", // Maintain aspect ratio
              backgroundImage: `url(${bookCoverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Fallback if image doesn't load or if no URL */}
            {!bookCoverUrl && (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-center p-4">
                [Book Cover Image]
              </div>
            )}
            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="bg-white p-3 rounded-lg shadow-md h-fit w-fit absolute bottom-0 right-0">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-32 h-32" />
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
