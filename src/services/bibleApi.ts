import { localDB } from './db';
import { BIBLE_BOOKS, bookAliases } from '../data/bibleBooks';
import { CustomBible, ChapterData, VerseItem } from '../types';

export const TRANSLATION_OPTIONS = [
  { value: 'drb', name: 'Douay-Rheims Bible', short: 'DRV', baseUrl: 'https://exanx.github.io/bible-json/DRB-73-Books' },
  { value: 'cpdv', name: 'Catholic Public Domain Version', short: 'CPDV', baseUrl: 'https://exanx.github.io/bible-json/CPDV-73-Books' },
  { value: 'web', name: 'World English Bible: Catholic Edition', short: 'WEBC', baseUrl: null },
  { value: 'kjv', name: 'King James Version (Deuterocanon)', short: 'KJV/D', baseUrl: null }
];

const inMemoryBookCache: Record<string, any> = {};

export function getTranslationDetails(translationValue: string, customBibles: CustomBible[] = []) {
  const standard = TRANSLATION_OPTIONS.find(t => t.value === translationValue);
  if (standard) return standard;

  if (translationValue.startsWith('custom_')) {
    const customId = translationValue.replace('custom_', '');
    const cb = customBibles.find(b => b.id === customId);
    if (cb) {
      return {
        value: translationValue,
        name: cb.name,
        short: cb.name.slice(0, 4).toUpperCase(),
        baseUrl: cb.url
      };
    }
  }

  return TRANSLATION_OPTIONS[0];
}

export async function fetchChapter(
  book: string,
  chapter: string,
  translationValue: string,
  customBibles: CustomBible[] = []
): Promise<ChapterData> {
  const transDetails = getTranslationDetails(translationValue, customBibles);
  const baseUrl = transDetails.baseUrl;

  if (baseUrl) {
    const bookUrl = `${baseUrl}/${encodeURIComponent(book)}.json`;
    const cacheKey = `cached_bible_${translationValue}_${book}`;

    let bookData = inMemoryBookCache[bookUrl];
    if (!bookData) {
      // 1. Check offline IndexedDB cache
      try {
        const cached = await localDB.get(cacheKey);
        if (cached) {
          bookData = cached;
          inMemoryBookCache[bookUrl] = cached;
        }
      } catch (e) {
        console.warn('Local cache read error:', e);
      }

      // 2. Fetch from network
      if (!bookData) {
        try {
          const res = await fetch(bookUrl);
          if (!res.ok) throw new Error(`Could not load ${book}`);
          bookData = await res.json();
          inMemoryBookCache[bookUrl] = bookData;
          localDB.set(cacheKey, bookData).catch(console.warn);
        } catch (netErr: any) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error(`Offline Mode: "${book}" is not downloaded yet. Go to Settings > Offline Bible Storage to cache this translation.`);
          }
          throw netErr;
        }
      }
    }

    let verses: VerseItem[] = [];
    if (bookData.chapters && Array.isArray(bookData.chapters)) {
      const chapObj = bookData.chapters.find((c: any) => c.chapter.toString() === chapter.toString());
      if (!chapObj || !chapObj.verses) throw new Error(`Chapter ${chapter} missing in ${book}`);
      verses = chapObj.verses.map((v: any) => ({
        verse: v.verse.toString(),
        text: v.text.replace(/\n/g, ' ').trim()
      }));
    } else {
      if (!bookData[chapter]) throw new Error(`Chapter ${chapter} missing in ${book}`);
      verses = Object.keys(bookData[chapter])
        .filter(k => !isNaN(Number(k)))
        .sort((a, b) => Number(a) - Number(b))
        .map(k => ({
          verse: k,
          text: String(bookData[chapter][k]).replace(/\n/g, ' ').trim()
        }));
    }

    return {
      book,
      chapter,
      reference: `${book} ${chapter}`,
      translation_name: transDetails.name,
      verses
    };
  } else {
    // Standard bible-api.com endpoint
    const cacheKey = `cached_chapter_${translationValue}_${book}_${chapter}`;
    let chapterData: any = null;

    try {
      const cached = await localDB.get(cacheKey);
      if (cached) chapterData = cached;
    } catch (e) {
      console.warn('Local chapter cache read error:', e);
    }

    if (!chapterData) {
      try {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translationValue}`);
        if (!res.ok) throw new Error(`Failed to load ${book} ${chapter}`);
        chapterData = await res.json();
        localDB.set(cacheKey, chapterData).catch(console.warn);
      } catch (netErr: any) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new Error(`Offline Mode: "${book} ${chapter}" is not cached yet.`);
        }
        throw netErr;
      }
    }

    const verses: VerseItem[] = (chapterData.verses || []).map((v: any) => ({
      verse: String(v.verse),
      text: String(v.text).replace(/\n/g, ' ').trim()
    }));

    return {
      book,
      chapter,
      reference: `${book} ${chapter}`,
      translation_name: chapterData.translation_name || transDetails.name,
      verses
    };
  }
}

export function parseVerseReference(inputString: string): { book: string; chapter: string; verse?: string } | null {
  if (!inputString) return null;
  const input = inputString.toLowerCase().trim().replace(/\s+/g, ' ');

  const fullNames = [
    ...Object.keys(BIBLE_BOOKS["Old Testament"]),
    ...Object.keys(BIBLE_BOOKS["New Testament"])
  ];

  const searchKeys = [
    ...fullNames.map(n => n.toLowerCase()),
    ...Object.keys(bookAliases)
  ].sort((a, b) => b.length - a.length);

  let foundBook: string | null = null;
  let remainingString = '';

  for (const key of searchKeys) {
    if (input.startsWith(key)) {
      const nextChar = input.charAt(key.length);
      if (!nextChar || nextChar === ' ' || !isNaN(Number(nextChar))) {
        foundBook = bookAliases[key] || fullNames.find(n => n.toLowerCase() === key) || null;
        remainingString = input.substring(key.length).trim();
        break;
      }
    }
  }

  if (!foundBook) return null;

  let chapter = '1';
  let verse: string | undefined;

  if (remainingString) {
    const parts = remainingString.match(/^(\d+)(?:[\s:.-]+(\d+))?/);
    if (parts) {
      chapter = parts[1];
      if (parts[2]) verse = parts[2];
    }
  }

  const maxChapters = BIBLE_BOOKS["Old Testament"][foundBook] || BIBLE_BOOKS["New Testament"][foundBook] || 1;
  const chapNum = parseInt(chapter, 10);
  if (chapNum < 1 || chapNum > maxChapters) return null;

  return { book: foundBook, chapter, verse };
}

export async function fetchQuoteVerseText(
  book: string,
  chapter: string,
  fromVerse: number | string,
  toVerse: number | string,
  translationValue: string,
  customBibles: CustomBible[] = []
): Promise<string> {
  const from = parseInt(String(fromVerse), 10);
  const to = parseInt(String(toVerse), 10);
  const data = await fetchChapter(book, chapter, translationValue, customBibles);

  const matched = data.verses.filter(v => {
    const num = parseInt(v.verse, 10);
    return num >= from && num <= to;
  });

  return matched.map(v => v.text).join(' ');
}

export async function downloadFullTranslationOffline(
  translationValue: string,
  customBibles: CustomBible[] = [],
  onProgress?: (current: number, total: number, book: string) => void,
  isCancelled?: () => boolean
): Promise<{ success: boolean; count: number }> {
  const trans = getTranslationDetails(translationValue, customBibles);
  if (!trans.baseUrl) {
    throw new Error('Offline bulk download is only supported for direct JSON editions (DRB/CPDV/Custom).');
  }

  const allBooks: string[] = [];
  Object.keys(BIBLE_BOOKS).forEach(testament => {
    Object.keys(BIBLE_BOOKS[testament]).forEach(book => allBooks.push(book));
  });

  let downloaded = 0;
  for (let i = 0; i < allBooks.length; i++) {
    if (isCancelled && isCancelled()) {
      return { success: false, count: downloaded };
    }
    const book = allBooks[i];
    if (onProgress) onProgress(i + 1, allBooks.length, book);

    const cacheKey = `cached_bible_${translationValue}_${book}`;
    const existing = await localDB.get(cacheKey);
    if (!existing) {
      try {
        const bookUrl = `${trans.baseUrl}/${encodeURIComponent(book)}.json`;
        const res = await fetch(bookUrl);
        if (res.ok) {
          const json = await res.json();
          await localDB.set(cacheKey, json);
        }
      } catch (e) {
        console.warn(`Error caching ${book}:`, e);
      }
    }
    downloaded++;
  }

  return { success: true, count: downloaded };
}

export async function getCachedBooksCount(translationValue: string): Promise<number> {
  try {
    const keys = await localDB.getAllKeys();
    const prefix = `cached_bible_${translationValue}_`;
    return keys.filter(k => typeof k === 'string' && k.startsWith(prefix)).length;
  } catch (e) {
    return 0;
  }
}

export async function clearCachedTranslation(translationValue: string): Promise<number> {
  const prefix = `cached_bible_${translationValue}_`;
  return await localDB.deletePrefix(prefix);
}
