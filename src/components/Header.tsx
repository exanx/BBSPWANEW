import React from 'react';
import {
  Menu,
  ChevronDown,
  Volume2,
  Bookmark,
  Highlighter,
  Settings,
  Sun,
  Moon,
  Image as ImageIcon
} from 'lucide-react';

interface HeaderProps {
  currentBook: string;
  currentChapter: string;
  translationName: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenGridModal: () => void;
  onOpenMobileMenu: () => void;
  onOpenBookmarks: () => void;
  onOpenHighlights: () => void;
  onOpenSettings: () => void;
  onOpenQuote: () => void;
  onStartListen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentBook,
  currentChapter,
  translationName,
  isDark,
  onToggleTheme,
  onOpenGridModal,
  onOpenMobileMenu,
  onOpenBookmarks,
  onOpenHighlights,
  onOpenSettings,
  onOpenQuote,
  onStartListen
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 glass-nav px-3 sm:px-6 py-2.5 flex items-center justify-between transition-colors">
      {/* Left: Mobile Menu Toggle & Quote Studio */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer lg:hidden"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenQuote}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Quote Studio"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Brand Title (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 pl-2">
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">
            Biblia Sacra
          </span>
          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">
            {translationName}
          </span>
        </div>
      </div>

      {/* Center: Book & Chapter Selector Modal Trigger */}
      <button
        type="button"
        onClick={onOpenGridModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group"
      >
        <span className="font-bold text-sm sm:text-base tracking-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">
          {currentBook} {currentChapter}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
      </button>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={onStartListen}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Listen with Voice Reader"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenBookmarks}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer hidden sm:flex"
          title="Bookmarks"
        >
          <Bookmark className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenHighlights}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer hidden sm:flex"
          title="Notes & Highlights"
        >
          <Highlighter className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
