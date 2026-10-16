import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChapterData,
  HighlightItem,
  BookmarkItem,
  CategoryItem,
  LastReadPosition,
  SettingsState
} from './types';
import { FULL_THEMES, flatBible } from './data/bibleBooks';
import { localDB } from './services/db';
import {
  fetchChapter,
  parseVerseReference
} from './services/bibleApi';
import {
  subscribeToAuth,
  uploadUserData,
  downloadUserData,
  logoutUser
} from './services/firebase';
import { ttsService, TTSState } from './services/tts';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ScriptureDisplay } from './components/ScriptureDisplay';
import { VoicePlayerBar } from './components/VoicePlayerBar';
import { GridModal } from './components/GridModal';
import { HighlightPopup } from './components/HighlightPopup';
import { BookmarksModal } from './components/BookmarksModal';
import { HighlightsModal } from './components/HighlightsModal';
import { QuoteModal } from './components/QuoteModal';
import { ReferenceModal } from './components/ReferenceModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { ConfirmModal, ConfirmDialogOptions } from './components/ConfirmModal';
import { Toast } from './components/Toast';

const DEFAULT_SETTINGS: SettingsState = {
  translation: 'drb',
  fontSize: 1.125,
  lineRatio: 1.75,
  fontFamily: 'Inter',
  isBold: false,
  contentWidth: 100,
  accentColor: { color: '#4f46e5', hover: '#4338ca', glow: 'rgba(79, 70, 229, 0.3)' },
  theme: 'dark',
  activeThemeId: 'amoled_black',
  liveEffect: 'theme_default',
  customBibles: [],
  customFonts: [],
  customBg: null,
  customText: null,
  updatedAt: Date.now()
};

export function App() {
  // Settings & Reading Configuration
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  // Scripture Content State
  const [currentBook, setCurrentBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState('1');
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);

  // User Data State
  const [highlights, setHighlights] = useState<Record<string, HighlightItem>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkItem>>({});
  const [categories, setCategories] = useState<Record<string, CategoryItem>>({});
  const [lastRead, setLastRead] = useState<LastReadPosition>({
    book: 'Genesis',
    chapter: '1',
    verse: '1',
    timestamp: Date.now()
  });

  // User Auth
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modals Visibility
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteInitialParams, setQuoteInitialParams] = useState<any>({});
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [referenceWord, setReferenceWord] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Highlight Popup State
  const [highlightPopup, setHighlightPopup] = useState<{
    isOpen: boolean;
    book: string;
    chapter: string;
    fromVerse: number;
    toVerse: number;
    verseText: string;
    existing?: HighlightItem;
  }>({
    isOpen: false,
    book: 'Genesis',
    chapter: '1',
    fromVerse: 1,
    toVerse: 1,
    verseText: ''
  });

  // Confirm dialog & Toast
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Voice Reader TTS State
  const [ttsState, setTtsState] = useState<TTSState>(ttsService.getState());

  // Connectivity
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const showConfirm = (options: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...options,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  };

  // 1. Initial Local Data Load
  useEffect(() => {
    async function initData() {
      try {
        await localDB.init();
        const saved = await localDB.get('bible_data');
        if (saved) {
          if (saved.settings) {
            setSettings(prev => ({ ...prev, ...saved.settings }));
          }
          if (saved.highlights) setHighlights(saved.highlights);
          if (saved.bookmarks) setBookmarks(saved.bookmarks);
          if (saved.categories) setCategories(saved.categories);
          if (saved.lastRead) {
            setLastRead(saved.lastRead);
            setCurrentBook(saved.lastRead.book || 'Genesis');
            setCurrentChapter(saved.lastRead.chapter || '1');
          }
        }
      } catch (e) {
        console.warn('Local data load failed:', e);
      }
    }
    initData();
  }, []);

  // 2. Auth Subscription & Cloud Sync
  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudData = await downloadUserData(user.uid);
          if (cloudData) {
            // Smart merge cloud data
            if (cloudData.highlights) {
              setHighlights(prev => ({ ...prev, ...cloudData.highlights }));
            }
            if (cloudData.bookmarks) {
              setBookmarks(prev => ({ ...prev, ...cloudData.bookmarks }));
            }
            if (cloudData.categories) {
              setCategories(prev => ({ ...prev, ...cloudData.categories }));
            }
            if (cloudData.settings && (cloudData.settings.updatedAt || 0) > settings.updatedAt) {
              setSettings(prev => ({ ...prev, ...cloudData.settings }));
            }
            if (cloudData.lastRead && (cloudData.lastRead.timestamp || 0) > lastRead.timestamp) {
              setLastRead(cloudData.lastRead);
              setCurrentBook(cloudData.lastRead.book);
              setCurrentChapter(cloudData.lastRead.chapter);
            }
          }
        } catch (e) {
          console.warn('Initial cloud pull failed:', e);
        }
      }
    });

    return () => unsub();
  }, [settings.updatedAt, lastRead.timestamp]);

  // 3. Online/offline listener
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      showToast('Back online — all features connected');
    };
    const onOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode — Reading from cache');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // 4. Save to IndexedDB & Debounced Cloud Sync
  const persistTimeoutRef = useRef<any>(null);

  const persistData = useCallback(
    (
      newSettings = settings,
      newHighlights = highlights,
      newBookmarks = bookmarks,
      newCategories = categories,
      newLastRead = lastRead
    ) => {
      // Local DB save
      const payload = {
        settings: newSettings,
        highlights: newHighlights,
        bookmarks: newBookmarks,
        categories: newCategories,
        lastRead: newLastRead
      };
      localDB.set('bible_data', payload).catch(console.warn);

      // Cloud Firestore save (debounced)
      if (currentUser?.uid) {
        if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = setTimeout(() => {
          uploadUserData(currentUser.uid, payload).catch(console.warn);
        }, 3000);
      }
    },
    [settings, highlights, bookmarks, categories, lastRead, currentUser]
  );

  // 5. Apply Theme, Fonts, and Styles to DOM
  useEffect(() => {
    const root = document.documentElement;

    // Dark / Light class
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // CSS variables
    root.style.setProperty('--font-size-base', `${settings.fontSize}rem`);
    root.style.setProperty('--line-height-ratio', `${settings.lineRatio}`);
    root.style.setProperty('--font-family-base', `"${settings.fontFamily}", sans-serif`);
    root.style.setProperty('--font-weight-base', settings.isBold ? '600' : '400');
    root.style.setProperty('--content-width', `${settings.contentWidth}`);
    root.style.setProperty('--color-primary', settings.accentColor.color);
    root.style.setProperty('--color-primary-hover', settings.accentColor.hover);
    root.style.setProperty('--color-primary-glow', settings.accentColor.glow);

    if (settings.customBg) {
      document.body.style.setProperty('--custom-bg', settings.customBg);
    } else {
      document.body.style.removeProperty('--custom-bg');
    }

    if (settings.customText) {
      document.body.style.setProperty('--custom-text', settings.customText);
    } else {
      document.body.style.removeProperty('--custom-text');
    }

    // Live effect & theme data attributes on body
    document.body.dataset.activeTheme = settings.activeThemeId;

    let resolvedEffect = settings.liveEffect;
    if (resolvedEffect === 'theme_default') {
      const activeDef = FULL_THEMES[settings.activeThemeId];
      resolvedEffect = activeDef && activeDef.animated ? activeDef.id : 'none';
    }
    document.body.dataset.liveEffect = resolvedEffect;
  }, [settings]);

  // 6. Load Scripture Chapter
  const loadChapterContent = useCallback(
    async (book: string, chapter: string, targetVerse?: string) => {
      setIsLoadingChapter(true);
      setChapterError(null);

      try {
        const data = await fetchChapter(book, chapter, settings.translation, settings.customBibles);
        setChapterData(data);
        setCurrentBook(book);
        setCurrentChapter(chapter);

        // Update last read position
        const updatedLastRead: LastReadPosition = {
          book,
          chapter,
          verse: targetVerse || '1',
          timestamp: Date.now()
        };
        setLastRead(updatedLastRead);
        persistData(settings, highlights, bookmarks, categories, updatedLastRead);

        // Scroll to verse if target provided, else top
        if (targetVerse) {
          setTimeout(() => {
            const el = document.querySelector(`[data-verse-ref="${book} ${chapter}:${targetVerse}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      } catch (err: any) {
        setChapterError(err.message || 'Failed to load chapter.');
      } finally {
        setIsLoadingChapter(false);
      }
    },
    [settings, highlights, bookmarks, categories, persistData]
  );

  useEffect(() => {
    loadChapterContent(currentBook, currentChapter);
  }, [currentBook, currentChapter, settings.translation]);

  // 7. Subscribe to Voice Reader TTS events
  useEffect(() => {
    const unsub = ttsService.subscribe((s) => {
      setTtsState(s);
    });

    ttsService.setNextChapterHandler((nextBook, nextChap, startVerse) => {
      showToast(`Continuing reading in ${nextBook} ${nextChap}...`);
      loadChapterContent(nextBook, nextChap, startVerse.toString()).then(() => {
        if (chapterData) {
          ttsService.startChapter(nextBook, nextChap, chapterData.verses, startVerse, chapterData.translation_name);
        }
      });
    });

    return () => unsub();
  }, [loadChapterContent, chapterData]);

  // Chapter Navigation bounds
  const currentFlatIndex = flatBible.findIndex(b => b.book === currentBook && b.chapter === currentChapter);
  const canPrev = currentFlatIndex > 0;
  const canNext = currentFlatIndex !== -1 && currentFlatIndex < flatBible.length - 1;

  const handlePrevChapter = () => {
    if (canPrev) {
      const prev = flatBible[currentFlatIndex - 1];
      loadChapterContent(prev.book, prev.chapter);
    }
  };

  const handleNextChapter = () => {
    if (canNext) {
      const next = flatBible[currentFlatIndex + 1];
      loadChapterContent(next.book, next.chapter);
    }
  };

  // Direct reference jump
  const handleDirectSearch = (input: string) => {
    const parsed = parseVerseReference(input);
    if (parsed) {
      loadChapterContent(parsed.book, parsed.chapter, parsed.verse);
      showToast(`Loaded ${parsed.book} ${parsed.chapter}${parsed.verse ? `:${parsed.verse}` : ''}`);
    } else {
      showToast('Book or chapter not found.');
    }
  };

  // Highlights & Notes Handlers
  const handleVerseClick = (verseNum: number, verseText: string) => {
    const prefix = `${currentBook} ${currentChapter}:`;
    let foundHl: HighlightItem | undefined;
    let from = verseNum;
    let to = verseNum;

    for (const ref in highlights) {
      const h = highlights[ref];
      if (h && !h.deleted && ref.startsWith(prefix)) {
        const range = ref.substring(prefix.length).split('-');
        const s = parseInt(range[0], 10);
        const e = range[1] ? parseInt(range[1], 10) : s;
        if (verseNum >= s && verseNum <= e) {
          foundHl = h;
          from = s;
          to = e;
          break;
        }
      }
    }

    setHighlightPopup({
      isOpen: true,
      book: currentBook,
      chapter: currentChapter,
      fromVerse: from,
      toVerse: to,
      verseText,
      existing: foundHl
    });
  };

  const handleSaveHighlight = (data: {
    fromVerse: number;
    toVerse: number;
    color: string;
    note: string;
    category: string;
  }) => {
    const ref = `${currentBook} ${currentChapter}:${data.fromVerse === data.toVerse ? data.fromVerse : `${data.fromVerse}-${data.toVerse}`}`;
    const updatedHighlights = {
      ...highlights,
      [ref]: {
        color: data.color,
        note: data.note,
        category: data.category,
        verseText: highlightPopup.verseText,
        updatedAt: Date.now()
      }
    };
    setHighlights(updatedHighlights);

    if (data.category && (!categories[data.category] || categories[data.category].deleted)) {
      const updatedCategories = {
        ...categories,
        [data.category]: { updatedAt: Date.now() }
      };
      setCategories(updatedCategories);
      persistData(settings, updatedHighlights, bookmarks, updatedCategories, lastRead);
    } else {
      persistData(settings, updatedHighlights, bookmarks, categories, lastRead);
    }

    showToast(`Highlight saved for ${ref}`);
  };

  const handleRemoveHighlight = async (ref: string) => {
    const updated = {
      ...highlights,
      [ref]: { ...highlights[ref], deleted: true, updatedAt: Date.now() }
    };
    setHighlights(updated);
    persistData(settings, updated, bookmarks, categories, lastRead);
    showToast(`Highlight removed`);
  };

  const handleToggleBookmark = (ref: string) => {
    const isSaved = Boolean(bookmarks[ref] && !bookmarks[ref]?.deleted);
    const updated = {
      ...bookmarks,
      [ref]: { deleted: isSaved, updatedAt: Date.now() }
    };
    setBookmarks(updated);
    persistData(settings, highlights, updated, categories, lastRead);
    showToast(isSaved ? `Removed bookmark for ${ref}` : `Bookmarked ${ref}!`);
  };

  const handleUpdateNote = (ref: string, noteText: string) => {
    const item = highlights[ref];
    if (item) {
      const updated = {
        ...highlights,
        [ref]: { ...item, note: noteText, updatedAt: Date.now() }
      };
      setHighlights(updated);
      persistData(settings, updated, bookmarks, categories, lastRead);
    }
  };

  const handleImportMarkdownNotes = (content: string): number => {
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let currentRef: string | null = null;
    let currentColor = 'yellow';
    let currentCategory = 'General';
    let currentVerseText = '';
    let currentNoteLines: string[] = [];
    let isReadingNote = false;
    let count = 0;

    const newHighlights = { ...highlights };
    const newCategories = { ...categories };

    const saveCurrent = () => {
      if (!currentRef) return;
      const ref = currentRef.trim();
      const validColors = ['yellow', 'green', 'blue', 'pink', 'purple'];
      const color = validColors.includes(currentColor.toLowerCase()) ? currentColor.toLowerCase() : 'yellow';
      const category = currentCategory.trim() || 'General';
      const note = currentNoteLines.join('\n').trim();

      newCategories[category] = { updatedAt: Date.now() };
      newHighlights[ref] = {
        color,
        category,
        note,
        verseText: currentVerseText.trim(),
        updatedAt: Date.now()
      };
      count++;

      currentRef = null;
      currentColor = 'yellow';
      currentCategory = 'General';
      currentVerseText = '';
      currentNoteLines = [];
      isReadingNote = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const headerMatch = trimmed.match(/^#{1,3}\s+([1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+(?::\d+(?:-\d+)?)?)\b/);
      if (headerMatch && !trimmed.toLowerCase().includes('reflection') && !trimmed.toLowerCase().includes('biblia sacra')) {
        saveCurrent();
        currentRef = headerMatch[1].trim();
        continue;
      }
      if (trimmed === '---') {
        saveCurrent();
        continue;
      }
      if (!currentRef) continue;

      const colMatch = trimmed.match(/^-\s*\*\*Color(?:\s+Tag)?\*\*:\s*([a-zA-Z]+)/i);
      if (colMatch) {
        currentColor = colMatch[1].toLowerCase();
        continue;
      }
      const catMatch = trimmed.match(/^-\s*\*\*Category\*\*:\s*(.+)/i);
      if (catMatch) {
        currentCategory = catMatch[1];
        continue;
      }
      if (trimmed.startsWith('>')) {
        const quoteContent = trimmed.replace(/^>\s*/, '').replace(/^["“](.*)["”]$/, '$1').trim();
        currentVerseText += (currentVerseText ? ' ' : '') + quoteContent;
        continue;
      }
      if (trimmed.match(/^#{1,4}\s*(Reflection|Note)/i)) {
        isReadingNote = true;
        continue;
      }
      if (isReadingNote || (trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('-'))) {
        currentNoteLines.push(lines[i]);
      }
    }
    saveCurrent();

    if (count > 0) {
      setHighlights(newHighlights);
      setCategories(newCategories);
      persistData(settings, newHighlights, bookmarks, newCategories, lastRead);
    }

    return count;
  };

  // TTS Voice Reader Trigger
  const handleStartListen = (fromVerseNum = 1) => {
    if (!chapterData || chapterData.verses.length === 0) return;
    ttsService.startChapter(
      chapterData.book,
      chapterData.chapter,
      chapterData.verses,
      fromVerseNum,
      chapterData.translation_name
    );
  };

  // Settings updates
  const handleUpdateSettings = (newSet: Partial<SettingsState>) => {
    const updated = {
      ...settings,
      ...newSet,
      updatedAt: Date.now()
    };
    setSettings(updated);
    persistData(updated, highlights, bookmarks, categories, lastRead);
  };

  const handleResetSettings = async () => {
    const confirmed = await showConfirm({
      title: 'Reset Settings to Default?',
      message: 'Restore layout, themes, and typography to default? Your highlights and bookmarks will remain intact.',
      confirmText: 'Reset Settings',
      type: 'warning'
    });
    if (!confirmed) return;

    setSettings(DEFAULT_SETTINGS);
    persistData(DEFAULT_SETTINGS, highlights, bookmarks, categories, lastRead);
    showToast('Settings reset to default');
  };

  const handleResetApp = async () => {
    const confirmed = await showConfirm({
      title: 'Factory Reset All Data?',
      message: 'This will permanently delete all highlights, notes, bookmarks, offline cached Bibles, and settings. This action is irreversible.',
      confirmText: 'Erase Everything',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      localStorage.clear();
      indexedDB.deleteDatabase('SanctaBibliaDB');
      indexedDB.deleteDatabase('firebaseLocalStorageDb');
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    const data = await localDB.get('bible_data') || {
      settings,
      highlights,
      bookmarks,
      categories,
      lastRead
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SanctaBiblia_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup data exported!');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.highlights) setHighlights(parsed.highlights);
        if (parsed.bookmarks) setBookmarks(parsed.bookmarks);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.lastRead) {
          setLastRead(parsed.lastRead);
          loadChapterContent(parsed.lastRead.book, parsed.lastRead.chapter);
        }
        persistData(
          parsed.settings || settings,
          parsed.highlights || highlights,
          parsed.bookmarks || bookmarks,
          parsed.categories || categories,
          parsed.lastRead || lastRead
        );
        showToast('Data backup restored!');
      } catch (err) {
        showToast('Invalid backup file.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleManualCloudSync = async () => {
    if (!currentUser?.uid) return;
    const payload = {
      settings,
      highlights,
      bookmarks,
      categories,
      lastRead
    };
    await uploadUserData(currentUser.uid, payload);
    const cloud = await downloadUserData(currentUser.uid);
    if (cloud) {
      if (cloud.highlights) setHighlights(prev => ({ ...prev, ...cloud.highlights }));
      if (cloud.bookmarks) setBookmarks(prev => ({ ...prev, ...cloud.bookmarks }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary/20">
      {/* Offline connectivity banner */}
      {!isOnline && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 rounded-full shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Offline Mode — Reading from device cache</span>
        </div>
      )}

      {/* Ambient background glow blobs */}
      <div className="ambient-blob bg-primary w-96 h-96 top-[-10%] left-[-10%]" />
      <div className="ambient-blob bg-purple-500 w-96 h-96 bottom-[-10%] right-[-10%]" />

      {/* Top Header */}
      <Header
        currentBook={currentBook}
        currentChapter={currentChapter}
        translationName={chapterData?.translation_name || 'Douay-Rheims'}
        isDark={settings.theme === 'dark'}
        onToggleTheme={() => handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        onOpenGridModal={() => setIsGridOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenHighlights={() => setIsHighlightsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenQuote={() => {
          setQuoteInitialParams({
            book: currentBook,
            chapter: currentChapter,
            fromVerse: 1,
            toVerse: 1
          });
          setIsQuoteOpen(true);
        }}
        onStartListen={() => handleStartListen(1)}
      />

      {/* Navigation Sidebar & Drawer */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentTranslation={settings.translation}
        onChangeTranslation={(t) => handleUpdateSettings({ translation: t })}
        customBibles={settings.customBibles}
        bookmarksCount={Object.keys(bookmarks).filter(b => !bookmarks[b]?.deleted).length}
        highlightsCount={Object.keys(highlights).filter(h => !highlights[h]?.deleted).length}
        userEmail={currentUser?.email || null}
        onDirectSearch={handleDirectSearch}
        onOpenGridModal={() => setIsGridOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenHighlights={() => setIsHighlightsOpen(true)}
        onStartListen={() => handleStartListen(1)}
        onOpenQuote={() => {
          setQuoteInitialParams({
            book: currentBook,
            chapter: currentChapter,
            fromVerse: 1,
            toVerse: 1
          });
          setIsQuoteOpen(true);
        }}
        onOpenReference={() => {
          setReferenceWord('');
          setIsReferenceOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Central Reading Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col">
        <ScriptureDisplay
          chapterData={chapterData}
          isLoading={isLoadingChapter}
          error={chapterError}
          highlights={highlights}
          bookmarks={bookmarks}
          activeReadingVerse={
            ttsState.isPlaying && !ttsState.isPaused
              ? `${ttsState.book} ${ttsState.chapter}:${ttsState.verseNum}`
              : null
          }
          onVerseClick={handleVerseClick}
          onListenChapter={() => handleStartListen(1)}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          canPrev={canPrev}
          canNext={canNext}
          onTextSelectionLookup={(word) => {
            setReferenceWord(word);
            setIsReferenceOpen(true);
          }}
        />
      </main>

      {/* Floating Audio Player Bar */}
      <VoicePlayerBar
        ttsState={ttsState}
        translationName={chapterData?.translation_name || 'Douay-Rheims'}
        onTogglePlayPause={() => ttsService.togglePlayPause()}
        onPrevVerse={() => ttsService.previousVerse()}
        onNextVerse={() => ttsService.nextVerse()}
        onCycleSpeed={() => ttsService.cycleSpeed()}
        onSelectVoice={(v) => ttsService.setVoice(v)}
        onStop={() => ttsService.stop()}
      />

      {/* Modals */}
      <GridModal
        isOpen={isGridOpen}
        onClose={() => setIsGridOpen(false)}
        currentBook={currentBook}
        currentChapter={currentChapter}
        onSelectChapter={(b, c) => loadChapterContent(b, c)}
      />

      <HighlightPopup
        isOpen={highlightPopup.isOpen}
        onClose={() => setHighlightPopup(prev => ({ ...prev, isOpen: false }))}
        book={highlightPopup.book}
        chapter={highlightPopup.chapter}
        initialFromVerse={highlightPopup.fromVerse}
        initialToVerse={highlightPopup.toVerse}
        existingHighlight={highlightPopup.existing}
        isBookmarked={Boolean(
          bookmarks[`${highlightPopup.book} ${highlightPopup.chapter}:${highlightPopup.fromVerse === highlightPopup.toVerse ? highlightPopup.fromVerse : `${highlightPopup.fromVerse}-${highlightPopup.toVerse}`}`] &&
          !bookmarks[`${highlightPopup.book} ${highlightPopup.chapter}:${highlightPopup.fromVerse === highlightPopup.toVerse ? highlightPopup.fromVerse : `${highlightPopup.fromVerse}-${highlightPopup.toVerse}`}`]?.deleted
        )}
        categories={Object.keys(categories).filter(c => !categories[c]?.deleted)}
        maxVerses={chapterData?.verses.length || 150}
        verseText={highlightPopup.verseText}
        onSaveHighlight={handleSaveHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onToggleBookmark={handleToggleBookmark}
        onListenVerse={(b, c, v) => handleStartListen(v)}
        onOpenQuote={(b, c, f, t) => {
          setQuoteInitialParams({ book: b, chapter: c, fromVerse: f, toVerse: t });
          setIsQuoteOpen(true);
        }}
        onCopyVerse={(text, ref) => {
          navigator.clipboard.writeText(`"${text}" — ${ref} (${chapterData?.translation_name || 'DRB'})`);
          showToast(`Copied ${ref}`);
        }}
        onShareVerse={(text, ref) => {
          if (navigator.share) {
            navigator.share({
              title: ref,
              text: `"${text}" — ${ref} (${chapterData?.translation_name || 'DRB'})`
            });
          }
        }}
        onAddCategory={(cat) => {
          const updated = { ...categories, [cat]: { updatedAt: Date.now() } };
          setCategories(updated);
          persistData(settings, highlights, bookmarks, updated, lastRead);
        }}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        currentBook={currentBook}
        currentChapter={currentChapter}
        onNavigateToRef={(ref) => {
          const parsed = parseVerseReference(ref);
          if (parsed) loadChapterContent(parsed.book, parsed.chapter, parsed.verse);
        }}
        onAddBookmark={(ref) => handleToggleBookmark(ref)}
        onDeleteBookmark={(ref) => handleToggleBookmark(ref)}
        onCopyAllBookmarks={() => {
          const active = Object.keys(bookmarks).filter(b => !bookmarks[b]?.deleted);
          navigator.clipboard.writeText(active.map(r => `• ${r}`).join('\n'));
          showToast('Copied all bookmarks to clipboard!');
        }}
        onShowToast={showToast}
      />

      <HighlightsModal
        isOpen={isHighlightsOpen}
        onClose={() => setIsHighlightsOpen(false)}
        highlights={highlights}
        onNavigateToRef={(ref) => {
          const parsed = parseVerseReference(ref);
          if (parsed) loadChapterContent(parsed.book, parsed.chapter, parsed.verse);
        }}
        onUpdateNote={handleUpdateNote}
        onDeleteHighlight={handleRemoveHighlight}
        onImportMarkdown={handleImportMarkdownNotes}
        onShowToast={showToast}
      />

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        initialBook={quoteInitialParams.book || currentBook}
        initialChapter={quoteInitialParams.chapter || currentChapter}
        initialFromVerse={quoteInitialParams.fromVerse || 1}
        initialToVerse={quoteInitialParams.toVerse || 1}
        currentTranslation={settings.translation}
        customBibles={settings.customBibles}
        customFonts={settings.customFonts}
        onShowToast={showToast}
      />

      <ReferenceModal
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
        initialWord={referenceWord}
        initialMode="dict"
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
        onResetApp={handleResetApp}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onOpenLogin={() => setIsLoginOpen(true)}
        userEmail={currentUser?.email || null}
        onLogout={async () => {
          const confirmed = await showConfirm({
            title: 'Sign Out?',
            message: 'Sign out of your account on this device?',
            confirmText: 'Sign Out'
          });
          if (confirmed) {
            await logoutUser();
            showToast('Signed out');
          }
        }}
        onSyncCloudNow={handleManualCloudSync}
        onShowToast={showToast}
        onShowConfirm={showConfirm}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onShowToast={showToast}
      />

      <ConfirmModal dialog={confirmDialog} />
      <Toast message={toastMessage} />
    </div>
  );
}
export default App;
