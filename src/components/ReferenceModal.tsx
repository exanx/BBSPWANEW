import React, { useState, useEffect } from 'react';
import { BookOpen, Globe, Search, ExternalLink, X, Loader2 } from 'lucide-react';

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
  initialMode?: 'dict' | 'wiki';
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({
  isOpen,
  onClose,
  initialWord = '',
  initialMode = 'dict'
}) => {
  const [mode, setMode] = useState<'dict' | 'wiki'>(initialMode);
  const [searchWord, setSearchWord] = useState(initialWord);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSearchWord(initialWord);
      if (initialWord) {
        doLookup(initialWord, initialMode);
      }
    }
  }, [isOpen, initialWord, initialMode]);

  if (!isOpen) return null;

  async function doLookup(word: string, currentMode: 'dict' | 'wiki') {
    const clean = word.replace(/[^a-zA-Z\s\-']/g, '').trim().toLowerCase();
    if (!clean) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      if (currentMode === 'dict') {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setResult({ type: 'dict', data: data[0] });
      } else {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (data.type === 'disambiguation' || !data.extract) {
          throw new Error('Not found');
        }
        setResult({ type: 'wiki', data });
      }
    } catch (e) {
      setErrorMsg(`No definition found for "${clean}".`);
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = (newMode: 'dict' | 'wiki') => {
    setMode(newMode);
    if (searchWord.trim()) {
      doLookup(searchWord, newMode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[85vh] glass-panel rounded-2xl flex flex-col shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Scripture Reference Lookup</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-3">
          <div className="flex p-1 rounded-xl glass-input gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('dict')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'dict' ? 'btn-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Dictionary</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('wiki')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'wiki' ? 'btn-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Wikipedia</span>
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search word, character, theology..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doLookup(searchWord, mode)}
                className="glass-input w-full pl-9 pr-3 py-2 text-xs rounded-xl"
              />
            </div>
            <button
              type="button"
              onClick={() => doLookup(searchWord, mode)}
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <span className="text-xs text-gray-400 font-medium">Looking up reference...</span>
            </div>
          ) : errorMsg ? (
            <div className="text-center py-10 text-gray-400 text-xs">{errorMsg}</div>
          ) : result ? (
            result.type === 'dict' ? (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {result.data.word}
                </h4>
                {result.data.meanings?.slice(0, 3).map((m: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {m.partOfSpeech}
                    </span>
                    <ul className="list-disc pl-5 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                      {m.definitions?.slice(0, 3).map((d: any, dIdx: number) => (
                        <li key={dIdx}>{d.definition}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {result.data.title}
                </h4>
                {result.data.thumbnail && (
                  <img
                    src={result.data.thumbnail.source}
                    alt={result.data.title}
                    className="w-full max-h-48 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                  />
                )}
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {result.data.extract}
                </p>
                {result.data.content_urls?.desktop?.page && (
                  <a
                    href={result.data.content_urls.desktop.page}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs pt-2"
                  >
                    <span>Read complete article on Wikipedia</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-400 text-xs">
              Select or type any word to inspect biblical or historical definitions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
