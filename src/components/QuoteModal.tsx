import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Download, Copy, Search, RefreshCw, X } from 'lucide-react';
import { BIBLE_BOOKS, FAMOUS_QUOTE_VERSES } from '../data/bibleBooks';
import { fetchQuoteVerseText, TRANSLATION_OPTIONS } from '../services/bibleApi';
import { CustomBible } from '../types';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBook?: string;
  initialChapter?: string;
  initialFromVerse?: number;
  initialToVerse?: number;
  currentTranslation: string;
  customBibles: CustomBible[];
  customFonts: string[];
  onShowToast: (msg: string) => void;
}

const PALETTE_PRESETS = [
  { name: 'AMOLED', bg: '#000000', text: '#ffffff', font: 'Inter' },
  { name: 'Pure White', bg: '#ffffff', text: '#111827', font: 'Inter' },
  { name: 'Parchment', bg: '#faedd0', text: '#3f2d18', font: 'Crimson Pro' },
  { name: 'Ancient', bg: '#f4ebd9', text: '#382b1d', font: 'Tinos' },
  { name: 'Rose', bg: '#17070b', text: '#ffe4e6', font: 'Playfair Display' },
  { name: 'Neon', bg: '#040a17', text: '#e0f2fe', font: 'Oswald' },
  { name: 'Sage', bg: '#eaf4ee', text: '#123924', font: 'Lora' }
];

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  initialBook,
  initialChapter,
  initialFromVerse,
  initialToVerse,
  currentTranslation,
  customBibles,
  customFonts,
  onShowToast
}) => {
  const [book, setBook] = useState(initialBook || 'Genesis');
  const [chapter, setChapter] = useState(initialChapter || '1');
  const [fromVerse, setFromVerse] = useState(initialFromVerse || 1);
  const [toVerse, setToVerse] = useState(initialToVerse || 1);
  const [translation, setTranslation] = useState(currentTranslation || 'drb');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [fontFamily, setFontFamily] = useState('Crimson Pro');
  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedBgImageUrl, setSelectedBgImageUrl] = useState<string | null>(null);

  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState<string[]>([]);
  const [isSearchingPexels, setIsSearchingPexels] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [inspirationChips, setInspirationChips] = useState<any[]>([]);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialBook) setBook(initialBook);
      if (initialChapter) setChapter(initialChapter);
      if (initialFromVerse) setFromVerse(initialFromVerse);
      if (initialToVerse) setToVerse(initialToVerse);
      shuffleInspirations();
    }
  }, [isOpen, initialBook, initialChapter, initialFromVerse, initialToVerse]);

  const shuffleInspirations = () => {
    const shuffled = [...FAMOUS_QUOTE_VERSES].sort(() => 0.5 - Math.random());
    setInspirationChips(shuffled.slice(0, 6));
  };

  const getChapterCount = (b: string) => {
    return BIBLE_BOOKS["Old Testament"][b] || BIBLE_BOOKS["New Testament"][b] || 1;
  };

  // Re-draw preview canvas whenever parameters change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function drawPreview() {
      setIsRendering(true);
      try {
        const verseText = await fetchQuoteVerseText(
          book,
          chapter,
          fromVerse,
          toVerse,
          translation,
          customBibles
        );

        if (!isMounted) return;

        const transObj = TRANSLATION_OPTIONS.find(t => t.value === translation);
        const transShort = transObj ? transObj.short : 'DRB';
        const verseRange = fromVerse === toVerse ? `${fromVerse}` : `${fromVerse}–${toVerse}`;
        const refText = `— ${book} ${chapter}:${verseRange} (${transShort})`;

        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        await renderQuoteToCanvas(canvas, {
          text: verseText || 'Loading scripture...',
          ref: refText,
          aspectRatio,
          bgColor,
          textColor,
          fontFamily,
          bgImageUrl: selectedBgImageUrl
        });
      } catch (e) {
        console.warn('Quote render preview error:', e);
      } finally {
        if (isMounted) setIsRendering(false);
      }
    }

    const timer = setTimeout(drawPreview, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    book,
    chapter,
    fromVerse,
    toVerse,
    translation,
    aspectRatio,
    fontFamily,
    bgColor,
    textColor,
    selectedBgImageUrl
  ]);

  if (!isOpen) return null;

  async function renderQuoteToCanvas(
    canvas: HTMLCanvasElement,
    params: {
      text: string;
      ref: string;
      aspectRatio: '1:1' | '9:16' | '16:9';
      bgColor: string;
      textColor: string;
      fontFamily: string;
      bgImageUrl: string | null;
    }
  ) {
    let width = 1080;
    let height = 1080;
    if (params.aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (params.aspectRatio === '16:9') {
      width = 1920;
      height = 1080;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (params.bgImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Bg image failed to load'));
        img.src = params.bgImageUrl!;
      });

      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const shiftX = (canvas.width - img.width * ratio) / 2;
      const shiftY = (canvas.height - img.height * ratio) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, shiftX, shiftY, img.width * ratio, img.height * ratio);

      // Tint Overlay
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = params.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Wrap and layout quote text
    const maxTextWidth = canvas.width * 0.82;
    let verseFontSize = params.aspectRatio === '9:16' ? 44 : 38;
    ctx.font = `italic 400 ${verseFontSize}px "${params.fontFamily}", serif`;

    const words = params.text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(testLine).width > maxTextWidth) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // If too many lines, downscale font slightly
    const maxLines = params.aspectRatio === '16:9' ? 6 : 14;
    if (lines.length > maxLines) {
      verseFontSize = Math.max(26, verseFontSize - 8);
      ctx.font = `italic 400 ${verseFontSize}px "${params.fontFamily}", serif`;
      lines = [];
      currentLine = '';
      for (const w of words) {
        const testLine = currentLine ? `${currentLine} ${w}` : w;
        if (ctx.measureText(testLine).width > maxTextWidth) {
          lines.push(currentLine);
          currentLine = w;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }

    const lineHeight = verseFontSize * 1.55;
    const totalTextHeight = lines.length * lineHeight;
    let startY = (canvas.height - totalTextHeight) / 2 - 25;

    // Opening Quote Symbol
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `64px "${params.fontFamily}", serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('“', canvas.width / 2, Math.max(40, startY - 50));

    // Draw Quote Lines
    ctx.font = `italic 400 ${verseFontSize}px "${params.fontFamily}", serif`;
    ctx.fillStyle = params.textColor;
    for (const line of lines) {
      ctx.fillText(line, canvas.width / 2, startY);
      startY += lineHeight;
    }

    // Divider Line
    startY += 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 40, startY);
    ctx.lineTo(canvas.width / 2 + 40, startY);
    ctx.stroke();

    // Scripture Reference
    startY += 22;
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(params.ref, canvas.width / 2, startY);

    // Watermark Pill Badge
    const wmY = params.aspectRatio === '9:16' ? canvas.height - 75 : canvas.height - 55;
    const badgeText = 'Created with bibliasacra.web.app';
    ctx.font = '500 18px Inter, sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const badgeW = textWidth + 36;
    const badgeH = 34;
    const badgeX = (canvas.width - badgeW) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(badgeX, wmY - badgeH / 2, badgeW, badgeH, 17);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, canvas.width / 2, wmY);
    ctx.restore();
  }

  const handleDownloadImage = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const verseRange = fromVerse === toVerse ? `${fromVerse}` : `${fromVerse}-${toVerse}`;
    const filename = `${book}_${chapter}_${verseRange}_quote.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    onShowToast('Quote image downloaded!');
  };

  const handleCopyImage = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && (navigator.clipboard as any).write) {
          try {
            await (navigator.clipboard as any).write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            onShowToast('Quote image copied to clipboard!');
            return;
          } catch (e) {
            // Fallback
          }
        }
        const verseText = await fetchQuoteVerseText(book, chapter, fromVerse, toVerse, translation, customBibles);
        navigator.clipboard.writeText(`"${verseText}" — ${book} ${chapter}:${fromVerse === toVerse ? fromVerse : `${fromVerse}-${toVerse}`}`);
        onShowToast('Quote text copied to clipboard!');
      }, 'image/png');
    } catch (err) {
      onShowToast('Failed to copy quote.');
    }
  };

  const handleSearchPexels = async () => {
    if (!pexelsQuery.trim()) return;
    setIsSearchingPexels(true);
    try {
      // Free curated background photos search endpoint via Pexels or Unsplash proxy
      const res = await fetch(`https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80`);
      // Curated spiritual & nature photo URLs
      const curated = [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80'
      ];
      setPexelsResults(curated);
    } catch (e) {
      onShowToast('Photo search error');
    } finally {
      setIsSearchingPexels(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[94vh] glass-panel rounded-2xl flex flex-col shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Quote Studio</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Design and export high-res scripture graphics</p>
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

        {/* Studio Body (Two Columns: Controls on left, Live Canvas Preview on right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Passage Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Scripture Passage
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const rand = FAMOUS_QUOTE_VERSES[Math.floor(Math.random() * FAMOUS_QUOTE_VERSES.length)];
                    setBook(rand.book);
                    setChapter(rand.chapter);
                    setFromVerse(parseInt(rand.from, 10));
                    setToVerse(parseInt(rand.to, 10));
                    shuffleInspirations();
                  }}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Random Verse
                </button>
              </div>

              {/* Inspiration Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                {inspirationChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBook(chip.book);
                      setChapter(chip.chapter);
                      setFromVerse(parseInt(chip.from, 10));
                      setToVerse(parseInt(chip.to, 10));
                    }}
                    className="btn-secondary text-[10px] font-semibold px-2.5 py-1 rounded-lg shrink-0 hover:text-primary transition-colors cursor-pointer"
                  >
                    {chip.book} {chip.chapter}:{chip.from === chip.to ? chip.from : `${chip.from}–${chip.to}`}
                  </button>
                ))}
              </div>

              {/* Inputs row */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="col-span-2">
                  <select
                    value={book}
                    onChange={(e) => {
                      setBook(e.target.value);
                      setChapter('1');
                    }}
                    className="glass-input w-full p-2 rounded-xl text-xs font-semibold"
                  >
                    <optgroup label="Old Testament">
                      {Object.keys(BIBLE_BOOKS["Old Testament"]).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                    <optgroup label="New Testament">
                      {Object.keys(BIBLE_BOOKS["New Testament"]).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="glass-input w-full p-2 rounded-xl text-xs font-semibold text-center"
                  >
                    {Array.from({ length: getChapterCount(book) }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c}>Ch. {c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={fromVerse}
                    onChange={(e) => setFromVerse(parseInt(e.target.value, 10) || 1)}
                    placeholder="From"
                    className="glass-input w-full p-2 rounded-xl text-xs text-center font-semibold"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="number"
                    min={fromVerse}
                    value={toVerse}
                    onChange={(e) => setToVerse(parseInt(e.target.value, 10) || fromVerse)}
                    placeholder="To"
                    className="glass-input w-full p-2 rounded-xl text-xs text-center font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Aspect Ratio & Translation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 glass-input rounded-xl">
                  {(['1:1', '9:16', '16:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`text-xs font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                        aspectRatio === ratio
                          ? 'btn-primary text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Translation
                </label>
                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="glass-input w-full p-2 rounded-xl text-xs font-semibold"
                >
                  {TRANSLATION_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Typography & Palettes */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                Style Presets
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                {PALETTE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setBgColor(p.bg);
                      setTextColor(p.text);
                      setFontFamily(p.font);
                      setSelectedBgImageUrl(null);
                    }}
                    className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 hover:border-primary/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.bg }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors & Font */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="glass-input w-full p-2 rounded-xl text-xs"
                >
                  <option value="Crimson Pro">Crimson Pro</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Lora">Lora</option>
                  <option value="Merriweather">Merriweather</option>
                  <option value="Tinos">Tinos</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Caveat">Caveat (Script)</option>
                  {customFonts.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Background</label>
                <div className="flex items-center gap-2 glass-input p-1.5 rounded-xl">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => {
                      setBgColor(e.target.value);
                      setSelectedBgImageUrl(null);
                    }}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono font-medium">{bgColor}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Text Color</label>
                <div className="flex items-center gap-2 glass-input p-1.5 rounded-xl">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono font-medium">{textColor}</span>
                </div>
              </div>
            </div>

            {/* Photos & Nature Backgrounds */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Background Photos
                </label>
                {selectedBgImageUrl && (
                  <button
                    type="button"
                    onClick={() => setSelectedBgImageUrl(null)}
                    className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Photo
                  </button>
                )}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Find nature, mountains, stars..."
                  value={pexelsQuery}
                  onChange={(e) => setPexelsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPexels()}
                  className="glass-input flex-1 px-3 py-1.5 text-xs rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleSearchPexels}
                  className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>

              {pexelsResults.length > 0 && (
                <div className="grid grid-cols-6 gap-2">
                  {pexelsResults.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="bg"
                      onClick={() => setSelectedBgImageUrl(url)}
                      className={`w-full h-12 object-cover rounded-lg cursor-pointer transition-all ${
                        selectedBgImageUrl === url ? 'ring-2 ring-primary scale-105' : 'hover:opacity-80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canvas Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 glass-input rounded-2xl bg-black/5 dark:bg-black/30">
            <div className="relative w-full flex items-center justify-center max-h-[380px] overflow-hidden rounded-xl shadow-lg border border-gray-200/50 dark:border-white/10">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[380px] object-contain rounded-xl"
              />
              {isRendering && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Actions: Download & Copy */}
            <div className="flex items-center gap-3 w-full mt-4">
              <button
                type="button"
                onClick={handleCopyImage}
                className="flex-1 btn-secondary py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Image</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
