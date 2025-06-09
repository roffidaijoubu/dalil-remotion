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
  bookAuthor: z.string(),
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

  // Count total highlights
  const totalHighlights = Math.min(
    arabicSegments.filter((s) => s.isHighlight).length,
    translationSegments.filter((s) => s.isHighlight).length,
  );

  const delayFrames = highlightDelaySeconds * fps;
  const initialDelayFrames = 1 * fps; // 1 second breathing room before first highlight
  const highlightDurationFrames = Math.max(30, delayFrames); // Minimum 1 second per highlight

  // Calculate current highlight index and progress (accounting for initial delay)
  const frameAfterInitialDelay = Math.max(0, frame - initialDelayFrames);
  const currentHighlightIndex = Math.floor(frameAfterInitialDelay / delayFrames);
  const highlightStartFrame = currentHighlightIndex * delayFrames;
  const progressInCurrentHighlight = frameAfterInitialDelay - highlightStartFrame;

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
        <div className="flex-1 flex flex-col space-y-6">
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
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">{bookAuthor}</p>
            {bookExtra && (
              <p className="text-sm text-gray-500 mt-1">{bookExtra}</p>
            )}
          </div>
          {/* Book Cover */}
          <div className="bg-gray-200 rounded-lg shadow-xl w-full relative" style={{ aspectRatio: "3/4" }}>
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
                <img src={qrCodeDataUrl} alt="QR Code" className="w-32 h-32" />
              </div>
            )}
          </div>
        </div>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
