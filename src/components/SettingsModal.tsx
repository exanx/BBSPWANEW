import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  Type,
  Palette,
  HardDrive,
  Cloud,
  RotateCcw,
  Plus,
  Trash2,
  X,
  Check,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { SettingsState, CustomBible, AccentColor } from '../types';
import { FULL_THEMES, LIVE_EFFECT_NAMES } from '../data/bibleBooks';
import {
  downloadFullTranslationOffline,
  getCachedBooksCount,
  clearCachedTranslation,
  TRANSLATION_OPTIONS
} from '../services/bibleApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  onUpdateSettings: (newSettings: Partial<SettingsState>) => void;
  onResetSettings: () => void;
  onResetApp: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLogin: () => void;
  userEmail: string | null;
  onLogout: () => void;
  onSyncCloudNow: () => Promise<void>;
  onShowToast: (msg: string) => void;
  onShowConfirm: (options: any) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  onResetApp,
  onExportData,
  onImportData,
  onOpenLogin,
  userEmail,
  onLogout,
  onSyncCloudNow,
  onShowToast,
  onShowConfirm
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'typography' | 'offline' | 'data'>('themes');
  const [themeCategory, setThemeCategory] = useState<'main' | 'light' | 'dark'>('main');

  // Custom font input
  const [newFontName, setNewFontName] = useState('');
  // Custom Bible input
  const [newBibleName, setNewBibleName] = useState('');
  const [newBibleUrl, setNewBibleUrl] = useState('');

  // Offline caching state
  const [offlineSelectedTrans, setOfflineSelectedTrans] = useState('drb');
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 73, book: '' });
  const [cancelDownload, setCancelDownload] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshCachedCount();
    }
  }, [isOpen, offlineSelectedTrans]);

  async function refreshCachedCount() {
    const count = await getCachedBooksCount(offlineSelectedTrans);
    setCachedCount(count);
  }

  if (!isOpen) return null;

  const themesList = Object.values(FULL_THEMES).filter(t => t.category === themeCategory);

  const handleApplyFullTheme = (themeId: string) => {
    const theme = FULL_THEMES[themeId];
    if (!theme) return;

    onUpdateSettings({
      activeThemeId: themeId,
      theme: theme.mode,
      fontFamily: theme.font,
      accentColor: theme.accent,
      customBg: theme.bg,
      customText: theme.text,
      liveEffect: theme.animated ? themeId : 'none'
    });
    onShowToast(`Theme "${theme.name}" applied`);
  };

  const handleAddCustomFont = () => {
    const name = newFontName.trim();
    if (!name) return;
    if (settings.customFonts.includes(name)) {
      onShowToast('Font already in list');
      return;
    }

    // Inject Google Font link dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, '+')}&display=swap`;
    document.head.appendChild(link);

    onUpdateSettings({
      customFonts: [...settings.customFonts, name],
      fontFamily: name
    });
    setNewFontName('');
    onShowToast(`Added font "${name}"`);
  };

  const handleRemoveCustomFont = async (font: string) => {
    const confirmed = await onShowConfirm({
      title: 'Remove Font?',
      message: `Are you sure you want to remove "${font}"?`,
      confirmText: 'Remove'
    });
    if (!confirmed) return;

    const updated = settings.customFonts.filter(f => f !== font);
    onUpdateSettings({
      customFonts: updated,
      fontFamily: settings.fontFamily === font ? 'Inter' : settings.fontFamily
    });
  };

  const handleAddCustomBible = () => {
    const name = newBibleName.trim();
    let url = newBibleUrl.trim();
    if (!name || !url) return;
    if (url.endsWith('/')) url = url.slice(0, -1);

    const newBible: CustomBible = {
      id: Date.now().toString(),
      name,
      url
    };

    onUpdateSettings({
      customBibles: [...settings.customBibles, newBible]
    });
    setNewBibleName('');
    setNewBibleUrl('');
    onShowToast(`Custom Bible "${name}" added`);
  };

  const handleRemoveCustomBible = async (id: string) => {
    const bible = settings.customBibles.find(b => b.id === id);
    const confirmed = await onShowConfirm({
      title: 'Delete Custom Bible?',
      message: `Delete "${bible?.name || 'Custom Bible'}"?`,
      confirmText: 'Delete'
    });
    if (!confirmed) return;

    const updated = settings.customBibles.filter(b => b.id !== id);
    onUpdateSettings({
      customBibles: updated,
      translation: settings.translation === `custom_${id}` ? 'drb' : settings.translation
    });
  };

  const handleStartOfflineDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setCancelDownload(false);

    try {
      await downloadFullTranslationOffline(
        offlineSelectedTrans,
        settings.customBibles,
        (current, total, book) => {
          setDownloadProgress({ current, total, book });
        },
        () => cancelDownload
      );
      onShowToast('Offline download complete!');
    } catch (err: any) {
      onShowToast(err.message || 'Download failed');
    } finally {
      setIsDownloading(false);
      refreshCachedCount();
    }
  };

  const handleClearOfflineCache = async () => {
    const confirmed = await onShowConfirm({
      title: 'Clear Offline Translation?',
      message: `Remove downloaded cache for this translation?`,
      confirmText: 'Clear Cache'
    });
    if (!confirmed) return;

    await clearCachedTranslation(offlineSelectedTrans);
    await refreshCachedCount();
    onShowToast('Offline cache cleared');
  };

  const handleManualSync = async () => {
    setIsSyncingCloud(true);
    try {
      await onSyncCloudNow();
      onShowToast('Synced with cloud!');
    } catch (e) {
      onShowToast('Cloud sync failed.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[92vh] glass-panel rounded-2xl flex flex-col shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Settings & Customization</h3>
              <p className="text-[11px] text-gray-500">Fine-tune themes, typography, layout, and offline storage</p>
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

        {/* Tab Bar */}
        <div className="flex border-b border-gray-200/50 dark:border-white/5 px-5 gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`py-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'themes'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Themes & Ambiance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`py-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'typography'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Typography & Width</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline')}
            className={`py-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'offline'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Offline Bible Storage</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'data'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Backup & Account</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* TAB 1: THEMES & AMBIANCE */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              {/* Category tabs */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Color Themes</h4>
                  <p className="text-[11px] text-gray-500">Pick from liturgical, OLED black, or illuminated scroll presets</p>
                </div>

                <div className="flex p-1 rounded-xl glass-input gap-1">
                  {(['main', 'light', 'dark'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setThemeCategory(cat)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        themeCategory === cat ? 'btn-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of full themes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themesList.map(t => {
                  const isCurrent = settings.activeThemeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleApplyFullTheme(t.id)}
                      className={`text-left p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-primary border-primary shadow-lg'
                          : 'border-gray-200 dark:border-white/10 hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: t.bg, color: t.text, minHeight: '92px' }}
                    >
                      <div className="flex items-start justify-between w-full mb-1">
                        <span className="text-xs font-bold tracking-tight truncate pr-1" style={{ fontFamily: t.font }}>
                          {t.name}
                        </span>
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 border border-black/10 dark:border-white/20 shadow-xs"
                          style={{ backgroundColor: t.accent.color }}
                        >
                          {isCurrent && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>

                      <div className="text-[11px] leading-snug opacity-90 truncate w-full my-1" style={{ fontFamily: t.font }}>
                        In the beginning was the Word
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-medium opacity-80 pt-1.5 border-t border-current/15 w-full mt-auto">
                        <span className="truncate" style={{ fontFamily: t.font }}>{t.font}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {t.animated && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                              Live
                            </span>
                          )}
                          <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-black/10 dark:bg-white/10">
                            {t.mode}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Atmospheric Effects */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Atmospheric Effects</h4>
                    <p className="text-[11px] text-gray-500">Gentle subtle ambient background movements and auroras</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {LIVE_EFFECT_NAMES[settings.liveEffect] || 'Theme Default'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {Object.keys(LIVE_EFFECT_NAMES).map(effectKey => {
                    const isCur = settings.liveEffect === effectKey;
                    return (
                      <button
                        key={effectKey}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ liveEffect: effectKey });
                          onShowToast(`Live effect "${LIVE_EFFECT_NAMES[effectKey]}" active`);
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold glass-input transition-all cursor-pointer ${
                          isCur
                            ? 'ring-2 ring-primary border-primary text-primary font-bold dark:bg-primary/10'
                            : 'hover:border-primary/40'
                        }`}
                      >
                        {LIVE_EFFECT_NAMES[effectKey]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY & WIDTH */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              {/* Live Typography Preview Box */}
              <div
                className="p-5 rounded-2xl glass-input transition-all shadow-md mx-auto"
                style={{
                  fontFamily: `"${settings.fontFamily}", sans-serif`,
                  fontWeight: settings.isBold ? '600' : '400',
                  lineHeight: settings.lineRatio,
                  width: `${settings.contentWidth}%`,
                  backgroundColor: settings.customBg || (settings.theme === 'dark' ? '#000000' : '#ffffff'),
                  color: settings.customText || (settings.theme === 'dark' ? '#e5e5e5' : '#111827')
                }}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-current/10">
                  <h5 className="font-bold text-sm">John 1:1–2</h5>
                  <span className="text-[10px] opacity-75">{settings.fontFamily} • {settings.contentWidth}% width</span>
                </div>
                <div className="space-y-1.5" style={{ fontSize: `${settings.fontSize * 0.95}rem` }}>
                  <p>
                    <sup className="text-[10px] opacity-50 mr-1 select-none font-bold">1</sup>
                    In the beginning was the Word, and the Word was with God, and the Word was God.
                  </p>
                  <p>
                    <sup className="text-[10px] opacity-50 mr-1 select-none font-bold">2</sup>
                    <span className="highlight-yellow px-1 py-0.5 rounded">
                      The same was in the beginning with God.
                    </span>
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Font Size & Line Spacing */}
                <div className="glass-input p-4 rounded-xl space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Font Size ({Math.round(settings.fontSize * 16)}px)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ fontSize: Math.max(0.75, settings.fontSize - 0.125) })}
                      className="btn-secondary flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      A- (Smaller)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ fontSize: Math.min(2.0, settings.fontSize + 0.125) })}
                      className="btn-secondary flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      A+ (Larger)
                    </button>
                  </div>

                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block pt-2">
                    Line Spacing
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1.5, 1.75, 2.0, 2.25].map(ratio => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => onUpdateSettings({ lineRatio: ratio })}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          settings.lineRatio === ratio
                            ? 'btn-primary text-white shadow-xs'
                            : 'btn-secondary text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold">Bold Text</span>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ isBold: !settings.isBold })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settings.isBold ? 'btn-primary text-white' : 'btn-secondary text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {settings.isBold ? 'Bold Active' : 'Regular'}
                    </button>
                  </div>
                </div>

                {/* Font Family & Custom Google Fonts */}
                <div className="glass-input p-4 rounded-xl space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Font Family
                  </label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
                    className="glass-input w-full p-2.5 rounded-xl text-xs font-semibold"
                  >
                    <optgroup label="Serif (Traditional & Liturgical)">
                      <option value="Crimson Pro">Crimson Pro</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Lora">Lora</option>
                      <option value="Merriweather">Merriweather</option>
                      <option value="Tinos">Tinos</option>
                    </optgroup>
                    <optgroup label="Sans-Serif (Modern & Clean)">
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Nunito">Nunito</option>
                      <option value="Quicksand">Quicksand</option>
                    </optgroup>
                    <optgroup label="Condensed & Bold">
                      <option value="Oswald">Oswald</option>
                    </optgroup>
                    {settings.customFonts.length > 0 && (
                      <optgroup label="Custom Google Fonts">
                        {settings.customFonts.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <div className="pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Add Custom Google Font
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Google Font name (e.g. Cinzel, Cormorant)"
                        value={newFontName}
                        onChange={(e) => setNewFontName(e.target.value)}
                        className="glass-input flex-1 px-3 py-1.5 text-xs rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomFont}
                        className="btn-primary px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {settings.customFonts.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {settings.customFonts.map(f => (
                        <div key={f} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-xs">
                          <span>{f}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomFont(f)}
                            className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reading Area Width */}
              <div className="glass-input p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Reading Canvas Width ({settings.contentWidth}%)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[60, 75, 85, 100].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => onUpdateSettings({ contentWidth: w })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          settings.contentWidth === w
                            ? 'btn-primary text-white shadow-xs'
                            : 'btn-secondary text-gray-500'
                        }`}
                      >
                        {w}%
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="range"
                  min="50"
                  max="100"
                  value={settings.contentWidth}
                  onChange={(e) => onUpdateSettings({ contentWidth: parseInt(e.target.value, 10) })}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Custom Colors & Accent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-input p-4 rounded-xl space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Custom Background & Text
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 dark:border-white/10">
                      <input
                        type="color"
                        value={settings.customBg || '#000000'}
                        onChange={(e) => onUpdateSettings({ customBg: e.target.value, activeThemeId: 'custom' })}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-medium truncate">Bg Color</span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 dark:border-white/10">
                      <input
                        type="color"
                        value={settings.customText || '#ffffff'}
                        onChange={(e) => onUpdateSettings({ customText: e.target.value, activeThemeId: 'custom' })}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-medium truncate">Text Color</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ customBg: null, customText: null })}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Reset to Theme Defaults
                  </button>
                </div>

                <div className="glass-input p-4 rounded-xl space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Theme Accent Color
                  </label>
                  <div className="flex items-center gap-2.5">
                    {[
                      { color: '#4f46e5', hover: '#4338ca', glow: 'rgba(79, 70, 229, 0.3)' },
                      { color: '#d97706', hover: '#b45309', glow: 'rgba(217, 119, 6, 0.35)' },
                      { color: '#059669', hover: '#047857', glow: 'rgba(5, 150, 105, 0.35)' },
                      { color: '#e11d48', hover: '#be123c', glow: 'rgba(225, 29, 72, 0.35)' },
                      { color: '#a855f7', hover: '#9333ea', glow: 'rgba(168, 85, 247, 0.35)' },
                      { color: '#0ea5e9', hover: '#0284c7', glow: 'rgba(14, 165, 233, 0.35)' }
                    ].map(acc => (
                      <button
                        key={acc.color}
                        type="button"
                        onClick={() => onUpdateSettings({ accentColor: acc })}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                          settings.accentColor.color === acc.color ? 'ring-2 ring-primary scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: acc.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OFFLINE STORAGE & CUSTOM BIBLES */}
          {activeTab === 'offline' && (
            <div className="space-y-6">
              {/* Offline Translation Cache Card */}
              <div className="glass-input p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Complete Catholic Canon (73 Books) Offline Cache
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Download full Old Testament, Deuterocanon, and New Testament for 100% offline access
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      cachedCount >= 73
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : cachedCount > 0
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                    }`}
                  >
                    {cachedCount >= 73
                      ? `✓ Cached (${cachedCount}/73)`
                      : cachedCount > 0
                      ? `Partial (${cachedCount}/73)`
                      : 'Not Cached'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={offlineSelectedTrans}
                    onChange={(e) => setOfflineSelectedTrans(e.target.value)}
                    className="glass-input p-2.5 rounded-xl text-xs font-semibold flex-1"
                  >
                    <option value="drb">Douay-Rheims Bible (73 Books)</option>
                    <option value="cpdv">Catholic Public Domain Version (73 Books)</option>
                    {settings.customBibles.map(cb => (
                      <option key={cb.id} value={`custom_${cb.id}`}>{cb.name} (Custom)</option>
                    ))}
                  </select>

                  {!isDownloading ? (
                    <button
                      type="button"
                      onClick={handleStartOfflineDownload}
                      className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{cachedCount >= 73 ? 'Re-download' : 'Download for Offline'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCancelDownload(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  {cachedCount > 0 && !isDownloading && (
                    <button
                      type="button"
                      onClick={handleClearOfflineCache}
                      className="btn-secondary px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      Clear Cache
                    </button>
                  )}
                </div>

                {isDownloading && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Caching {downloadProgress.book}...</span>
                      <span className="font-bold">{Math.round((downloadProgress.current / downloadProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Bibles Management */}
              <div className="glass-input p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Add Custom Bible Translation</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Connect any JSON repository that serves <code>/{'{Book}'}.json</code> files
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="Name (e.g. Vulgate)"
                    value={newBibleName}
                    onChange={(e) => setNewBibleName(e.target.value)}
                    className="sm:col-span-2 glass-input px-3 py-2 text-xs rounded-xl"
                  />
                  <input
                    type="url"
                    placeholder="Base URL (e.g. https://mycdn.com/bible)"
                    value={newBibleUrl}
                    onChange={(e) => setNewBibleUrl(e.target.value)}
                    className="sm:col-span-2 glass-input px-3 py-2 text-xs rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomBible}
                    className="btn-primary py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    Add Bible
                  </button>
                </div>

                {settings.customBibles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {settings.customBibles.map(cb => (
                      <div key={cb.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-xs">
                        <div>
                          <span className="font-bold">{cb.name}</span>
                          <span className="text-[10px] text-gray-400 block truncate max-w-xs">{cb.url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomBible(cb.id)}
                          className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & ACCOUNT */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Account Cloud Status */}
              <div className="glass-input p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Cloud Account & Sync</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {userEmail ? `Signed in as ${userEmail}` : 'Sign in to automatically sync highlights & bookmarks to cloud'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {userEmail ? (
                    <>
                      <button
                        type="button"
                        onClick={handleManualSync}
                        disabled={isSyncingCloud}
                        className="btn-secondary px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                        <span>Sync Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={onLogout}
                        className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-100 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLogin();
                      }}
                      className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                    >
                      Login / Sign Up
                    </button>
                  )}
                </div>
              </div>

              {/* JSON Backup & Restore */}
              <div className="glass-input p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Data Backup & Restore</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Save a full local copy of your highlights, bookmarks, and preferences as JSON
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onExportData}
                    className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span>Export JSON Backup</span>
                  </button>

                  <label className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <Cloud className="w-4 h-4 text-primary" />
                    <span>Import JSON Backup</span>
                    <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Reset Section */}
              <div className="p-5 rounded-2xl border border-red-200/50 dark:border-red-500/20 bg-red-50/50 dark:bg-red-950/10 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Danger Zone</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reset application settings or erase all stored study notes and cached databases
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onResetSettings}
                    className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Reset Settings to Default
                  </button>

                  <button
                    type="button"
                    onClick={onResetApp}
                    className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Factory Reset Everything
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
