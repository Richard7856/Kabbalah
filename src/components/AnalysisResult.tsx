"use client";

import ReactMarkdown from "react-markdown";
import InlineImage from "./InlineImage";

interface Props {
  analysis: string;
  isStreaming: boolean;
  onReset: () => void;
}

// Claude can output image queries in several formats depending on how strictly it follows
// the prompt. This function normalises all of them into standard markdown image syntax
// before passing the text to ReactMarkdown, so the img renderer always gets a clean src.
//
// Patterns handled:
//   pexels: lion fire sunset dramatic          → ![img](pexels://lion+fire+sunset+dramatic)
//   `pexels: lion fire sunset`                 → same (code-wrapped)
//   ![anything](pexels://query)                → left unchanged (already correct)
function normalisePexelsMarkers(text: string): string {
  // 1. Already-correct markdown image: leave untouched
  //    ![...](pexels://...)  ← no change needed

  // 2. Code-wrapped: `pexels: query`
  text = text.replace(/`pexels:\s*([^`\n]+)`/gi, (_, q) => {
    const slug = q.trim().replace(/\s+/g, "+");
    return `![img](pexels://${slug})`;
  });

  // 3. Plain paragraph line: "pexels: query" (not already inside markdown image syntax)
  //    Uses a negative lookbehind to avoid double-processing correct syntax
  text = text.replace(
    /(?<!\]\()pexels:\s*([^\n)]+)/gi,
    (_, q) => {
      const slug = q.trim().replace(/\s+/g, "+");
      return `![img](pexels://${slug})`;
    }
  );

  return text;
}

export default function AnalysisResult({ analysis, isStreaming, onReset }: Props) {
  const processedAnalysis = normalisePexelsMarkers(analysis);

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-gold-400 text-xl tracking-wide">
          Análisis Cabalístico
        </h2>

        {!isStreaming && (
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="text-xs text-[#8a9bb8] hover:text-cream-300 border border-[#8a9bb8]/30
                         hover:border-gold-700/50 rounded px-3 py-1.5 transition-colors"
            >
              Imprimir
            </button>
            <button
              onClick={onReset}
              className="text-xs text-[#8a9bb8] hover:text-cream-300 border border-[#8a9bb8]/30
                         hover:border-gold-700/50 rounded px-3 py-1.5 transition-colors"
            >
              Nuevo análisis
            </button>
          </div>
        )}

        {isStreaming && (
          <span className="text-xs text-gold-500 animate-pulse-gold tracking-widest uppercase">
            Analizando...
          </span>
        )}
      </div>

      <div className="gold-rule" />

      <div className={`analysis-content mt-6 ${isStreaming ? "cursor-blink" : ""}`}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h2 className="font-serif text-xl text-gold-400 mt-8 mb-3 pb-2
                             border-b border-gold-700/30 tracking-wide">
                {children}
              </h2>
            ),
            // Any image whose src is pexels:// → fetch from Pexels and render inline
            img: ({ src, alt }) => {
              const srcStr = typeof src === "string" ? src : "";
              if (srcStr.startsWith("pexels://")) {
                const query = decodeURIComponent(
                  srcStr.replace("pexels://", "").replace(/\+/g, " ")
                );
                return <InlineImage query={query} />;
              }
              return (
                <img
                  src={srcStr}
                  alt={alt ?? ""}
                  className="w-full rounded-lg my-4 opacity-80"
                />
              );
            },
          }}
        >
          {processedAnalysis}
        </ReactMarkdown>
      </div>

      {!isStreaming && analysis.length > 0 && (
        <div className="mt-12 text-center">
          <div className="gold-rule max-w-xs mx-auto mb-6" />
          <button
            onClick={onReset}
            className="font-serif text-gold-500 hover:text-gold-400 text-sm tracking-widest
                       uppercase border border-gold-700/40 hover:border-gold-500/60
                       rounded px-6 py-2.5 transition-colors"
          >
            Nuevo análisis
          </button>
        </div>
      )}
    </div>
  );
}
