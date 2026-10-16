import React, { useState } from 'react';
import { BIBLE_BOOKS } from '../data/bibleBooks';
import { ArrowLeft, X } from 'lucide-react';

interface GridModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: string;
  currentChapter: string;
  onSelectChapter: (book: string, chapter: string) => void;
}

export const GridModal: React.FC<GridModalProps> = ({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  onSelectChapter
}) => {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectBook = (book: string) => {
    setSelectedBook(book);
  };

  const handleBackToBooks = () => {
    setSelectedBook(null);
  };

  const handleSelectChap = (chapterNum: number) => {
    if (selectedBook) {
      onSelectChapter(selectedBook, chapterNum.toString());
      setSelectedBook(null);
      onClose();
    }
  };

  const getChapterCount = (book: string): number => {
    return BIBLE_BOOKS["Old Testament"][book] || BIBLE_BOOKS["New Testament"][book] || 1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] glass-panel rounded-2xl flex flex-col shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden modal-enter">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-2">
            {selectedBook && (
              <button
                type="button"
                onClick={handleBackToBooks}
                className="p-1.5 rounded-lg btn-secondary text-gray-500 hover:text-primary transition-colors cursor-pointer"
                title="Back to Books"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {selectedBook ? selectedBook : 'Select Book'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {!selectedBook ? (
            <div className="space-y-6">
              {/* Old Testament */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Old Testament (46 Books)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.keys(BIBLE_BOOKS["Old Testament"]).map((book) => {
                    const isCurrent = book === currentBook;
                    return (
                      <button
                        key={book}
                        type="button"
                        onClick={() => handleSelectBook(book)}
                        className={`glass-input p-2.5 rounded-xl font-medium text-xs text-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'ring-2 ring-primary border-primary text-primary font-bold dark:bg-primary/10'
                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/80 hover:border-primary/40'
                        }`}
                      >
                        {book}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* New Testament */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  New Testament (27 Books)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.keys(BIBLE_BOOKS["New Testament"]).map((book) => {
                    const isCurrent = book === currentBook;
                    return (
                      <button
                        key={book}
                        type="button"
                        onClick={() => handleSelectBook(book)}
                        className={`glass-input p-2.5 rounded-xl font-medium text-xs text-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'ring-2 ring-primary border-primary text-primary font-bold dark:bg-primary/10'
                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/80 hover:border-primary/40'
                        }`}
                      >
                        {book}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">
                Select a chapter in {selectedBook}:
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                {Array.from({ length: getChapterCount(selectedBook) }, (_, i) => i + 1).map((chap) => {
                  const isCurrent = selectedBook === currentBook && chap.toString() === currentChapter;
                  return (
                    <button
                      key={chap}
                      type="button"
                      onClick={() => handleSelectChap(chap)}
                      className={`py-3 rounded-xl font-bold text-sm text-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'btn-primary shadow-sm'
                          : 'glass-input hover:bg-gray-50 dark:hover:bg-zinc-800/80 hover:border-primary/40'
                      }`}
                    >
                      {chap}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
