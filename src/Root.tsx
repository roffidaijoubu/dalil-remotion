import React from "react";
import "./index.css";
import { Composition } from "remotion";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";
import { ArabicBookHighlight, arabicBookSchema } from "./ArabicBookHighlight";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render src/index.ts <id> out/video.mp4
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        schema={myCompSchema}
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema2}
        defaultProps={{
          logoColor1: "#91dAE2" as const,
          logoColor2: "#86A8E7" as const,
        }}
      />
      
      {/* Arabic Book Highlight Template */}
      <Composition
        id="ArabicBookHighlight"
        component={ArabicBookHighlight}
        durationInFrames={300} // 10 seconds at 30fps - adjust based on number of highlights
        fps={30}
        width={1920}
        height={1080}
        schema={arabicBookSchema}
        defaultProps={{
          bookTitle: "Kitab An-Nahw (Arabic Grammar Book)",
          bookAuthor: "Imam Sibawayh",
          bookExtra: "Volume 1 - Page 45",
          bookCoverUrl: "https://picsum.photos/300/400?random=1",
          bookUrl: "https://example.com/book-details",
          arabicText: "هذا النص العربي مع <highlight color=\"#ff6b6b\">التمييز الأول</highlight> و <highlight color=\"#4ecdc4\">التمييز الثاني</highlight> في المكان المناسب",
          translationText: "This is Arabic text with <highlight color=\"#ff6b6b\">first highlight</highlight> and <highlight color=\"#4ecdc4\">second highlight</highlight> in the right place",
          grading: "Sahih",
          highlightDelaySeconds: 0.5,
        }}
      />
    </>
  );
};
