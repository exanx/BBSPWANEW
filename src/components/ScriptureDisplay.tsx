import React, { useRef, useEffect, useState } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { ChapterData, HighlightItem, BookmarkItem } from '../types';

interface ScriptureDisplayProps {
  chapterData: ChapterData | null;
  isLoading: boolean;
  error: string | null;
  highlights: Record<string, HighlightItem>;
  bookmarks: Record<string, BookmarkItem>;
  activeReadingVerse: string | null;
  onVerseClick: (verseNum: number, verseText: string) => void;
  onListenChapter: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  canPrev: boolean;
  canNext: boolean;
  onTextSelectionLookup: (word: string) => void;
}

export const ScriptureDisplay: React.FC<ScriptureDisplayProps> = ({
  chapterData,
  isLoading,
  error,
  highlights,
  bookmarks,
  activeReadingVerse,
  onVerseClick,
  onListenChapter,
  onPrevChapter,
  onNextChapter,
  canPrev,
  canNext,
  onTextSelectionLookup
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({ visible: false, x: 0, y: 0, text: '' });

  // Handle text selection for dictionary/wiki lookup
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setTooltipState(prev => ({ ...prev, visible: false }));
        return;
      }

      const text = selection.toString().trim();
      if (text.length > 0 && text.length <= 80 && containerRef.current) {
        try {
          const range = selection.getRangeAt(0);
          if (containerRef.current.contains(range.commonAncestorContainer)) {
            const rect = range.getBoundingClientRect();
            setTooltipState({
              visible: true,
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              text
            });
            return;
          }
        } catch (e) {}
      }
      setTooltipState(prev => ({ ...prev, visible: false }));
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 px-4">
        <Loader2 className="w-9 h-9 text-primary animate-spin mb-3" />
        <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">Loading Sacred Text...</span>
      </div>
    );
  }

  if (error || !chapterData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 max-w-md text-red-500 text-xs leading-relaxed border border-red-200 dark:border-red-500/20">
          {error || 'Unable to load scripture chapter.'}
        </div>
      </div>
    );
  }

  const { book, chapter, verses, reference } = chapterData;

  // Process highlights and bookmarks for fast lookup
  const verseHighlights: Record<number, string> = {};
  const verseBookmarks: Record<number, boolean> = {};

  const prefix = `${book} ${chapter}:`;
  for (const ref in highlights) {
    const h = highlights[ref];
    if (h && !h.deleted && ref.startsWith(prefix)) {
      const range = ref.substring(prefix.length).split('-');
      const start = parseInt(range[0], 10);
      const end = range[1] ? parseInt(range[1], 10) : start;
      for (let i = start; i <= end; i++) {
        verseHighlights[i] = h.color;
      }
    }
  }

  for (const ref in bookmarks) {
    const b = bookmarks[ref];
    if (b && !b.deleted && ref.startsWith(prefix)) {
      const range = ref.substring(prefix.length).split('-');
      const start = parseInt(range[0], 10);
      const end = range[1] ? parseInt(range[1], 10) : start;
      for (let i = start; i <= end; i++) {
        verseBookmarks[i] = true;
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full pb-28 pt-14 sm:pt-16">
      {/* Floating Selection Tooltip */}
      {tooltipState.visible && (
        <button
          type="button"
          onClick={() => {
            onTextSelectionLookup(tooltipState.text);
            window.getSelection()?.removeAllRanges();
            setTooltipState(prev => ({ ...prev, visible: false }));
          }}
          style={{ left: `${tooltipState.x}px`, top: `${tooltipState.y}px` }}
          className="fixed z-50 glass-panel !bg-white dark:!bg-[#141416] rounded-xl shadow-2xl py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 cursor-pointer -translate-x-1/2 -translate-y-full flex items-center gap-1.5 hover:text-primary dark:hover:text-primary border border-gray-200 dark:border-white/10 animate-fade-in"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Lookup</span>
        </button>
      )}

      <div id="reading-container">
        {/* Chapter Header */}
        <div className="flex items-center justify-between mt-6 mb-6 pb-2 border-b border-gray-100 dark:border-white/5">
          <h2
            className="chapter-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
            data-book={book}
            data-chapter={chapter}
          >
            {reference}
          </h2>

          <button
            type="button"
            onClick={onListenChapter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-secondary text-xs font-semibold text-primary hover:bg-primary/10 transition-all cursor-pointer"
            title="Listen to this chapter"
          >
            <Volume2 className="w-4 h-4 text-primary" />
            <span>Listen</span>
          </button>
        </div>

        {/* Verses Paragraphs */}
        <div id="scripture-display" className="space-y-1">
          {verses.map((v) => {
            const verseNum = parseInt(v.verse, 10);
            const hlColor = verseHighlights[verseNum];
            const isBm = verseBookmarks[verseNum];
            const isTTSActive = activeReadingVerse === `${book} ${chapter}:${v.verse}`;

            return (
              <p
                key={v.verse}
                data-verse-ref={`${book} ${chapter}:${v.verse}`}
                className={`verse-paragraph transition-all ${
                  hlColor ? `highlight-${hlColor}` : ''
                } ${isBm ? 'bookmark-visual' : ''} ${
                  isTTSActive ? 'verse-reading-active' : ''
                }`}
              >
                <sup
                  className="verse-num"
                  title="Verse Actions"
                  onClick={() => onVerseClick(verseNum, v.text)}
                >
                  {v.verse}
                </sup>{' '}
                {v.text}
              </p>
            );
          })}
        </div>

        {/* Bottom Chapter Navigation Bar */}
        <div className="flex items-center justify-between pt-10 mt-8 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={onPrevChapter}
            disabled={!canPrev}
            className={`btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              !canPrev ? 'opacity-40 pointer-events-none' : 'hover:border-primary/40'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Chapter</span>
          </button>

          <button
            type="button"
            onClick={onNextChapter}
            disabled={!canNext}
            className={`btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              !canNext ? 'opacity-40 pointer-events-none' : 'hover:border-primary/40'
            }`}
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
