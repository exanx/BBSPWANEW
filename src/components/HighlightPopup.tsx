import React, { useState, useEffect } from 'react';
import { Bookmark, Volume2, Image as ImageIcon, Copy, Share2, Trash2, X, Plus } from 'lucide-react';
import { HighlightItem } from '../types';

interface HighlightPopupProps {
  isOpen: boolean;
  onClose: () => void;
  book: string;
  chapter: string;
  initialFromVerse: number;
  initialToVerse: number;
  existingHighlight?: HighlightItem;
  isBookmarked: boolean;
  categories: string[];
  maxVerses: number;
  verseText: string;
  onSaveHighlight: (data: {
    fromVerse: number;
    toVerse: number;
    color: string;
    note: string;
    category: string;
  }) => void;
  onRemoveHighlight: (ref: string) => void;
  onToggleBookmark: (ref: string) => void;
  onListenVerse: (book: string, chapter: string, fromVerse: number) => void;
  onOpenQuote: (book: string, chapter: string, fromVerse: number, toVerse: number) => void;
  onCopyVerse: (text: string, ref: string) => void;
  onShareVerse: (text: string, ref: string) => void;
  onAddCategory: (category: string) => void;
}

const COLOR_OPTIONS = ['yellow', 'green', 'blue', 'pink', 'purple'];

export const HighlightPopup: React.FC<HighlightPopupProps> = ({
  isOpen,
  onClose,
  book,
  chapter,
  initialFromVerse,
  initialToVerse,
  existingHighlight,
  isBookmarked,
  categories,
  maxVerses,
  verseText,
  onSaveHighlight,
  onRemoveHighlight,
  onToggleBookmark,
  onListenVerse,
  onOpenQuote,
  onCopyVerse,
  onShareVerse,
  onAddCategory
}) => {
  const [fromVerse, setFromVerse] = useState<number>(initialFromVerse);
  const [toVerse, setToVerse] = useState<number>(initialToVerse);
  const [selectedColor, setSelectedColor] = useState<string>('yellow');
  const [note, setNote] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [newCatInput, setNewCatInput] = useState<string>('');
  const [showAddCat, setShowAddCat] = useState<boolean>(false);

  useEffect(() => {
    setFromVerse(initialFromVerse);
    setToVerse(initialToVerse);
    setSelectedColor(existingHighlight?.color || 'yellow');
    setNote(existingHighlight?.note || '');
    setCategory(existingHighlight?.category || '');
  }, [isOpen, initialFromVerse, initialToVerse, existingHighlight]);

  if (!isOpen) return null;

  const currentRef = `${book} ${chapter}:${fromVerse === toVerse ? fromVerse : `${fromVerse}-${toVerse}`}`;

  const handleSave = () => {
    onSaveHighlight({
      fromVerse,
      toVerse,
      color: selectedColor,
      note,
      category
    });
    onClose();
  };

  const handleCreateCategory = () => {
    const trimmed = newCatInput.trim();
    if (trimmed) {
      onAddCategory(trimmed);
      setCategory(trimmed);
      setNewCatInput('');
      setShowAddCat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl glass-panel p-5 shadow-2xl border border-gray-200 dark:border-white/10 modal-enter max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-white/5 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Scripture Action</span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {currentRef}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verse Range Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">From Verse</label>
            <input
              type="number"
              min={1}
              max={maxVerses || 150}
              value={fromVerse}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 1;
                setFromVerse(val);
                if (val > toVerse) setToVerse(val);
              }}
              className="glass-input w-full px-3 py-1.5 rounded-lg text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">To Verse</label>
            <input
              type="number"
              min={fromVerse}
              max={maxVerses || 150}
              value={toVerse}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || fromVerse;
                setToVerse(Math.max(val, fromVerse));
              }}
              className="glass-input w-full px-3 py-1.5 rounded-lg text-xs font-semibold"
            />
          </div>
        </div>

        {/* Color Highlighting */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Highlight Color</label>
          <div className="flex items-center gap-3">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`w-7 h-7 rounded-full color-swatch cursor-pointer ${
                  c === 'yellow' ? 'bg-yellow-400' :
                  c === 'green' ? 'bg-green-400' :
                  c === 'blue' ? 'bg-blue-400' :
                  c === 'pink' ? 'bg-pink-400' : 'bg-purple-400'
                } ${selectedColor === c ? 'selected ring-2 ring-primary scale-110' : ''}`}
                title={`Highlight with ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Category Tagging */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">Category Tag</label>
            <button
              type="button"
              onClick={() => setShowAddCat(!showAddCat)}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New Tag
            </button>
          </div>

          {showAddCat && (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Tag name (e.g., Hope, Prayer)"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                className="glass-input flex-1 px-2.5 py-1 text-xs rounded-lg"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="btn-primary px-3 py-1 text-xs rounded-lg font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
          )}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Note / Reflection input */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Personal Reflection / Study Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write notes, thoughts, cross-references... (Markdown supported)"
            rows={3}
            className="glass-input w-full p-2.5 rounded-xl text-xs resize-none"
          />
        </div>

        {/* Quick Verse Actions Toolbar */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <button
            type="button"
            onClick={() => onToggleBookmark(currentRef)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-primary text-white shadow-sm'
                : 'btn-secondary text-gray-600 dark:text-gray-300 hover:text-primary'
            }`}
          >
            <Bookmark className="w-4 h-4 mb-1" />
            <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onListenVerse(book, chapter, fromVerse);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl btn-secondary text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4 mb-1" />
            <span>Listen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenQuote(book, chapter, fromVerse, toVerse);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl btn-secondary text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 mb-1" />
            <span>Quote Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onCopyVerse(verseText, currentRef)}
            className="flex flex-col items-center justify-center p-2 rounded-xl btn-secondary text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4 mb-1" />
            <span>Copy</span>
          </button>
        </div>

        {/* Save & Remove Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
          {existingHighlight ? (
            <button
              type="button"
              onClick={() => {
                onRemoveHighlight(currentRef);
                onClose();
              }}
              className="text-red-500 hover:text-red-600 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
            >
              Save Highlight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
