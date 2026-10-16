import React, { useState } from 'react';
import { Highlighter, Search, Download, Upload, Copy, Trash2, Edit3, Plus, X, ChevronDown } from 'lucide-react';
import { marked } from 'marked';
import { HighlightItem } from '../types';
import { CANONICAL_BOOK_ORDER } from '../data/bibleBooks';

interface HighlightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Record<string, HighlightItem>;
  onNavigateToRef: (ref: string) => void;
  onUpdateNote: (ref: string, note: string) => void;
  onDeleteHighlight: (ref: string) => void;
  onImportMarkdown: (content: string) => number;
  onShowToast: (msg: string) => void;
}

export const HighlightsModal: React.FC<HighlightsModalProps> = ({
  isOpen,
  onClose,
  highlights,
  onNavigateToRef,
  onUpdateNote,
  onDeleteHighlight,
  onImportMarkdown,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notesOnly, setNotesOnly] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'scripture'>('newest');
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showMdDropdown, setShowMdDropdown] = useState(false);

  if (!isOpen) return null;

  const activeRefs = Object.keys(highlights).filter(r => !highlights[r]?.deleted);
  const allCategories = Array.from(
    new Set(activeRefs.map(r => highlights[r]?.category).filter(Boolean) as string[])
  ).sort();

  const notesCount = activeRefs.filter(r => highlights[r]?.note && highlights[r].note!.trim()).length;

  let filtered = activeRefs.filter(ref => {
    const item = highlights[ref];
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (notesOnly && (!item.note || !item.note.trim())) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const match = `${ref} ${item.note || ''} ${item.verseText || ''} ${item.category || ''}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  if (sortOption === 'newest') {
    filtered.sort((a, b) => (highlights[b]?.updatedAt || 0) - (highlights[a]?.updatedAt || 0));
  } else if (sortOption === 'oldest') {
    filtered.sort((a, b) => (highlights[a]?.updatedAt || 0) - (highlights[b]?.updatedAt || 0));
  } else if (sortOption === 'scripture') {
    filtered.sort((a, b) => {
      const aBook = a.substring(0, a.lastIndexOf(' '));
      const bBook = b.substring(0, b.lastIndexOf(' '));
      const aIdx = CANONICAL_BOOK_ORDER.indexOf(aBook);
      const bIdx = CANONICAL_BOOK_ORDER.indexOf(bBook);
      if (aIdx !== bIdx) return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      const aParts = a.match(/:(\d+)/);
      const bParts = b.match(/:(\d+)/);
      return (aParts ? parseInt(aParts[1], 10) : 0) - (bParts ? parseInt(bParts[1], 10) : 0);
    });
  }

  // Group by book
  const grouped: Record<string, string[]> = {};
  filtered.forEach(ref => {
    const book = ref.substring(0, ref.lastIndexOf(' '));
    if (!grouped[book]) grouped[book] = [];
    grouped[book].push(ref);
  });

  const exportMarkdown = () => {
    if (activeRefs.length === 0) {
      onShowToast('No highlights or notes to export.');
      return;
    }

    let md = `# Biblia Sacra — Notes & Highlights\n`;
    md += `*Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n`;
    md += `*Total items: ${activeRefs.length}*\n\n---\n\n`;

    const sorted = [...activeRefs].sort(
      (a, b) => (highlights[b]?.updatedAt || 0) - (highlights[a]?.updatedAt || 0)
    );

    sorted.forEach(ref => {
      const h = highlights[ref];
      const dateStr = h.updatedAt ? new Date(h.updatedAt).toLocaleDateString() : 'N/A';
      md += `## ${ref}\n`;
      md += `- **Color Tag**: ${h.color || 'yellow'}\n`;
      md += `- **Category**: ${h.category || 'General'}\n`;
      md += `- **Saved**: ${dateStr}\n\n`;
      if (h.verseText) {
        md += `> "${h.verseText}"\n\n`;
      }
      if (h.note && h.note.trim()) {
        md += `### Reflection / Note\n${h.note}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `biblia_sacra_notes_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Notes exported as Markdown file!');
  };

  const copyAllNotes = () => {
    if (activeRefs.length === 0) {
      onShowToast('No notes or highlights to copy.');
      return;
    }

    let text = `# Biblia Sacra Notes & Highlights\n\n`;
    activeRefs.forEach(ref => {
      const h = highlights[ref];
      text += `• ${ref} [${h.category || 'General'}]: "${h.verseText || ''}"\n`;
      if (h.note && h.note.trim()) {
        text += `  Reflection: ${h.note.trim()}\n`;
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      onShowToast('All notes copied to clipboard!');
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const count = onImportMarkdown(content);
        if (count > 0) {
          onShowToast(`Imported ${count} note${count === 1 ? '' : 's'} from Markdown!`);
        } else {
          onShowToast('No valid notes found in file.');
        }
      } catch (err) {
        onShowToast('Error reading Markdown file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStartEdit = (ref: string) => {
    setEditingRef(ref);
    setEditingText(highlights[ref]?.note || '');
  };

  const handleSaveEdit = (ref: string) => {
    onUpdateNote(ref, editingText);
    setEditingRef(null);
    onShowToast('Note saved');
  };

  const insertMdFormat = (prefix: string, suffix: string) => {
    setEditingText(prev => `${prev} ${prefix}text${suffix}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] glass-panel rounded-2xl flex flex-col shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Highlighter className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Highlights & Notes</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeRefs.length} ({notesCount} notes)
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Search, filter and organize scripture reflections</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Markdown Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMdDropdown(!showMdDropdown)}
                className="btn-secondary px-2.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showMdDropdown && (
                <div className="absolute right-0 top-10 w-48 glass-panel !bg-white/95 dark:!bg-[#18181b]/95 rounded-xl shadow-2xl p-1.5 border border-gray-200 dark:border-white/10 z-50 modal-enter">
                  <button
                    type="button"
                    onClick={() => {
                      exportMarkdown();
                      setShowMdDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" /> Export Markdown (.md)
                  </button>
                  <label className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-primary" /> Import Markdown (.md)
                    <input
                      type="file"
                      accept=".md,.txt"
                      className="hidden"
                      onChange={(e) => {
                        handleFileUpload(e);
                        setShowMdDropdown(false);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      copyAllNotes();
                      setShowMdDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" /> Copy All Notes
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search text, references, tags, or personal notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-9 pr-3 py-1.5 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNotesOnly(!notesOnly)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  notesOnly ? 'btn-primary text-white shadow-sm' : 'btn-secondary text-gray-600 dark:text-gray-300'
                }`}
              >
                Notes Only
              </button>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="glass-input px-2.5 py-1.5 text-xs rounded-xl"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="scripture">Scripture Order</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all cursor-pointer shrink-0 ${
                !selectedCategory ? 'btn-primary shadow-xs' : 'btn-secondary text-gray-600 dark:text-gray-400'
              }`}
            >
              All ({activeRefs.length})
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat ? 'btn-primary shadow-xs' : 'btn-secondary text-gray-600 dark:text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                <Highlighter className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No highlights found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm || selectedCategory || notesOnly
                  ? 'No items matched your current filter criteria.'
                  : 'Tap on verse numbers while reading to add highlights, colors, tags, and study reflections.'}
              </p>
            </div>
          ) : (
            Object.keys(grouped).map(book => (
              <div key={book} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">
                  {book}
                </h4>

                <div className="space-y-3">
                  {grouped[book].map(ref => {
                    const item = highlights[ref];
                    const isEditing = editingRef === ref;
                    const dateFormatted = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '';

                    return (
                      <div
                        key={ref}
                        className={`p-4 glass-input rounded-xl border-l-4 transition-all ${
                          item.color === 'yellow' ? 'border-yellow-400' :
                          item.color === 'green' ? 'border-green-400' :
                          item.color === 'blue' ? 'border-blue-400' :
                          item.color === 'pink' ? 'border-pink-400' : 'border-purple-400'
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              onClick={() => {
                                onNavigateToRef(ref);
                                onClose();
                              }}
                              className="text-xs font-bold text-gray-900 dark:text-white hover:text-primary transition-colors cursor-pointer truncate"
                            >
                              {ref}
                            </span>
                            {item.category && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 shrink-0">
                                {item.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {dateFormatted && (
                              <span className="text-[10px] text-gray-400 mr-1 hidden sm:inline">
                                {dateFormatted}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const fullText = `"${item.verseText || ''}" — ${ref}${item.note ? `\nReflection: ${item.note}` : ''}`;
                                navigator.clipboard.writeText(fullText);
                                onShowToast(`Copied ${ref}`);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-primary transition-colors cursor-pointer"
                              title="Copy verse & note"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteHighlight(ref)}
                              className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete highlight"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Verse Text */}
                        <p
                          onClick={() => {
                            onNavigateToRef(ref);
                            onClose();
                          }}
                          className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-3 leading-relaxed"
                        >
                          {item.verseText || 'Read chapter to view verse text.'}
                        </p>

                        {/* Note Section */}
                        <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                          {isEditing ? (
                            <div className="space-y-2">
                              {/* Quick MD toolbar */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => insertMdFormat('**', '**')}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 dark:bg-white/10 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                >
                                  Bold
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertMdFormat('*', '*')}
                                  className="px-2 py-0.5 rounded text-[10px] italic bg-gray-200 dark:bg-white/10 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                >
                                  Italic
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertMdFormat('> ', '')}
                                  className="px-2 py-0.5 rounded text-[10px] bg-gray-200 dark:bg-white/10 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                >
                                  Quote
                                </button>
                              </div>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={3}
                                className="glass-input w-full p-2.5 rounded-xl text-xs resize-none"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingRef(null)}
                                  className="btn-secondary px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(ref)}
                                  className="btn-primary px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>
                          ) : item.note ? (
                            <div className="group relative bg-gray-50/80 dark:bg-black/20 rounded-xl p-3 border border-gray-200/60 dark:border-white/5">
                              <div
                                className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: marked.parse(item.note) as string }}
                              />
                              <button
                                type="button"
                                onClick={() => handleStartEdit(ref)}
                                className="absolute top-2 right-2 p-1.5 bg-white dark:bg-zinc-800 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-primary border border-gray-200 dark:border-white/10 cursor-pointer"
                                title="Edit Note"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(ref)}
                              className="text-xs font-medium text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Personal Reflection / Note
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
