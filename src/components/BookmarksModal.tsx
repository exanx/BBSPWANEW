import React, { useState } from 'react';
import { Bookmark, Search, Plus, Copy, Trash2, ArrowRight, X } from 'lucide-react';
import { BookmarkItem } from '../types';
import { BIBLE_BOOKS } from '../data/bibleBooks';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Record<string, BookmarkItem>;
  currentBook: string;
  currentChapter: string;
  onNavigateToRef: (ref: string) => void;
  onAddBookmark: (ref: string) => void;
  onDeleteBookmark: (ref: string) => void;
  onCopyAllBookmarks: () => void;
  onShowToast: (msg: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  currentBook,
  currentChapter,
  onNavigateToRef,
  onAddBookmark,
  onDeleteBookmark,
  onCopyAllBookmarks,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const activeBookmarks = Object.keys(bookmarks).filter(b => !bookmarks[b]?.deleted);

  const filtered = activeBookmarks.filter(ref => {
    if (!searchTerm.trim()) return true;
    return ref.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  filtered.sort((a, b) => (bookmarks[b]?.updatedAt || 0) - (bookmarks[a]?.updatedAt || 0));

  const currentChapterRef = `${currentBook} ${currentChapter}`;
  const isCurrentBookmarked = Boolean(bookmarks[currentChapterRef] && !bookmarks[currentChapterRef]?.deleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] glass-panel rounded-2xl flex flex-col shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Bookmarks</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeBookmarks.length}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Quick access to your saved passages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookmarks (e.g. Psalms, John 3)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-9 pr-3 py-2 text-xs rounded-xl"
              />
            </div>
            <button
              type="button"
              onClick={() => onAddBookmark(currentChapterRef)}
              disabled={isCurrentBookmarked}
              className={`text-xs font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                isCurrentBookmarked
                  ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 cursor-not-allowed'
                  : 'btn-primary shadow-sm'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCurrentBookmarked ? 'Bookmarked' : `Save ${currentChapterRef}`}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>{filtered.length} passage{filtered.length === 1 ? '' : 's'}</span>
            {activeBookmarks.length > 0 && (
              <button
                type="button"
                onClick={onCopyAllBookmarks}
                className="text-primary hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copy All Bookmarks
              </button>
            )}
          </div>
        </div>

        {/* List of Bookmarks */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                <Bookmark className="w-6 h-6 fill-current" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No bookmarks found</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                {searchTerm ? `No bookmarks match "${searchTerm}"` : 'Save chapters or verses for quick one-tap access.'}
              </p>
              {!searchTerm && !isCurrentBookmarked && (
                <button
                  type="button"
                  onClick={() => onAddBookmark(currentChapterRef)}
                  className="btn-primary text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bookmark {currentChapterRef}</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((ref) => {
              const bm = bookmarks[ref];
              const dateStr = bm?.updatedAt
                ? new Date(bm.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '';
              const parts = ref.match(/(.*?)\s+(\d+)(?::(\d+))?/);
              const bookName = parts ? parts[1] : ref;
              const isNT = Boolean(BIBLE_BOOKS["New Testament"] && BIBLE_BOOKS["New Testament"][bookName]);
              const testamentLabel = isNT ? 'NT' : 'OT';

              return (
                <div
                  key={ref}
                  className="glass-input p-3 rounded-xl flex items-center justify-between gap-3 group hover:border-primary/40 transition-all"
                >
                  <div
                    onClick={() => {
                      onNavigateToRef(ref);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Bookmark className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">
                          {ref}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 shrink-0">
                          {testamentLabel}
                        </span>
                      </div>
                      {dateStr && (
                        <span className="text-[10px] text-gray-400">Saved {dateStr}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(ref);
                        onShowToast(`Copied ${ref}`);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy Reference"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBookmark(ref);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToRef(ref);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors ml-0.5 cursor-pointer"
                      title="Read Chapter"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
