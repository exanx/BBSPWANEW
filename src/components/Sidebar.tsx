import React, { useState } from 'react';
import {
  Search,
  Book,
  Bookmark,
  Highlighter,
  Volume2,
  Image as ImageIcon,
  BookOpen,
  Settings,
  User,
  X,
  ChevronRight
} from 'lucide-react';
import { TRANSLATION_OPTIONS } from '../services/bibleApi';
import { CustomBible } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTranslation: string;
  onChangeTranslation: (translation: string) => void;
  customBibles: CustomBible[];
  bookmarksCount: number;
  highlightsCount: number;
  userEmail: string | null;
  onDirectSearch: (query: string) => void;
  onOpenGridModal: () => void;
  onOpenBookmarks: () => void;
  onOpenHighlights: () => void;
  onStartListen: () => void;
  onOpenQuote: () => void;
  onOpenReference: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentTranslation,
  onChangeTranslation,
  customBibles,
  bookmarksCount,
  highlightsCount,
  userEmail,
  onDirectSearch,
  onOpenGridModal,
  onOpenBookmarks,
  onOpenHighlights,
  onStartListen,
  onOpenQuote,
  onOpenReference,
  onOpenSettings,
  onOpenLogin
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onDirectSearch(searchInput.trim());
      setSearchInput('');
      onClose();
    }
  };

  const content = (
    <div className="flex flex-col h-full space-y-5 p-5">
      {/* Top Header / Close */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Biblia Sacra</h2>
          <span className="text-[10px] text-gray-400 font-medium">Sacred Scripture Reader</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white lg:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Direct Verse Jump Search */}
      <form onSubmit={handleSearchSubmit} className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
          Direct Verse Jump
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. John 3:16, Ps 23, Gen 1"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="glass-input w-full pl-3 pr-9 py-2 text-xs rounded-xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform cursor-pointer"
            title="Search verse"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Translation Selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
          Bible Translation
        </label>
        <select
          value={currentTranslation}
          onChange={(e) => onChangeTranslation(e.target.value)}
          className="glass-input w-full p-2.5 rounded-xl text-xs font-semibold"
        >
          {TRANSLATION_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.name}</option>
          ))}
          {customBibles.length > 0 && (
            <optgroup label="Custom Bibles">
              {customBibles.map((cb) => (
                <option key={cb.id} value={`custom_${cb.id}`}>{cb.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Nav Menu Items */}
      <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenGridModal();
          }}
          className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Book className="w-4 h-4 text-primary" />
            <span>Select Book & Chapter</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenBookmarks();
          }}
          className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-primary" />
            <span>Saved Bookmarks</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {bookmarksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenHighlights();
          }}
          className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Highlighter className="w-4 h-4 text-primary" />
            <span>Notes & Highlights</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {highlightsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onStartListen();
          }}
          className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-primary" />
            <span>Voice Audio Reader</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenQuote();
          }}
          className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span>Quote Studio</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenReference();
          }}
          className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Reference Lookup</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="w-full text-left p-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-primary" />
            <span>Preferences & Themes</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Account Status / Login */}
      <div className="pt-3 border-t border-gray-100 dark:border-white/5">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenLogin();
          }}
          className="w-full p-2.5 rounded-xl btn-secondary text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-primary" />
          <span className="truncate">{userEmail ? userEmail : 'Sign In / Account'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 glass-nav shadow-2xl transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
};
