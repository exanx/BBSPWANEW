import { flatBible } from '../data/bibleBooks';
import { VerseItem } from '../types';

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  book: string;
  chapter: string;
  verseNum: string;
  verseIndex: number;
  totalVerses: number;
  rate: number;
  voiceURI: string | null;
  voices: SpeechSynthesisVoice[];
}

type StateListener = (state: TTSState) => void;
type NextChapterCallback = (book: string, chapter: string, startVerse: number) => void;

class TTSService {
  private isPlaying = false;
  private isPaused = false;
  private verses: VerseItem[] = [];
  private currentVerseIndex = 0;
  private currentBook = '';
  private currentChapter = '';
  private rate = 1.0;
  private pitch = 1.0;
  private selectedVoiceURI: string | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private nextVerseTimeout: any = null;
  private consecutiveErrors = 0;
  private wakeLock: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private translationName = 'Biblia Sacra';

  private listeners: Set<StateListener> = new Set();
  private onNextChapter: NextChapterCallback | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.addEventListener('voiceschanged', () => {
        this.notifyState();
      });
      this.initSilentAudio();
    }
  }

  private initSilentAudio() {
    try {
      this.silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      this.silentAudio.loop = true;
    } catch (e) {
      // Ignore
    }
  }

  public setNextChapterHandler(handler: NextChapterCallback) {
    this.onNextChapter = handler;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): TTSState {
    const curVerse = this.verses[this.currentVerseIndex];
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      book: this.currentBook,
      chapter: this.currentChapter,
      verseNum: curVerse ? curVerse.verse : '1',
      verseIndex: this.currentVerseIndex,
      totalVerses: this.verses.length,
      rate: this.rate,
      voiceURI: this.selectedVoiceURI,
      voices: this.getVoices()
    };
  }

  private notifyState() {
    const s = this.getState();
    this.listeners.forEach(fn => fn(s));
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  }

  private getSelectedVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (this.selectedVoiceURI) {
      const match = voices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (match) return match;
    }
    // Prefer enhanced / natural voices
    const natural = voices.find(v => v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium'));
    return natural || voices[0] || null;
  }

  public setVoice(voiceURI: string) {
    this.selectedVoiceURI = voiceURI;
    this.notifyState();
  }

  public setRate(rate: number) {
    this.rate = rate;
    this.notifyState();
  }

  public cycleSpeed() {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    let idx = speeds.indexOf(this.rate);
    if (idx === -1) idx = 1;
    this.rate = speeds[(idx + 1) % speeds.length];
    this.notifyState();
  }

  private async acquireWakeLock() {
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (e) {
        // Ignored
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
        this.wakeLock = null;
      } catch (e) {
        // Ignored
      }
    }
  }

  public startChapter(book: string, chapter: string, verses: VerseItem[], startVerseNum: number = 1, translation: string = '') {
    if (verses.length === 0) return;
    this.currentBook = book;
    this.currentChapter = chapter;
    this.verses = verses;
    this.translationName = translation || 'Biblia Sacra';

    const idx = verses.findIndex(v => parseInt(v.verse, 10) === startVerseNum);
    this.currentVerseIndex = idx !== -1 ? idx : 0;

    if (this.silentAudio) {
      this.silentAudio.play().catch(() => {});
    }
    this.acquireWakeLock();

    this.isPlaying = true;
    this.isPaused = false;
    this.notifyState();
    this.speakCurrentVerse();
  }

  private speakCurrentVerse() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.nextVerseTimeout) {
      clearTimeout(this.nextVerseTimeout);
      this.nextVerseTimeout = null;
    }

    if (this.currentVerseIndex >= this.verses.length) {
      // Reached end of current chapter! Check next chapter in flatBible
      const currentFlatIndex = flatBible.findIndex(b => b.book === this.currentBook && b.chapter === this.currentChapter);
      if (currentFlatIndex !== -1 && currentFlatIndex < flatBible.length - 1) {
        const nextChapter = flatBible[currentFlatIndex + 1];
        if (this.onNextChapter) {
          this.onNextChapter(nextChapter.book, nextChapter.chapter, 1);
        }
      } else {
        this.stop();
      }
      return;
    }

    const verse = this.verses[this.currentVerseIndex];
    if (!verse) return;

    if (this.activeUtterance) {
      this.activeUtterance.onstart = null;
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.notifyState();

    // Scroll to verse in reading view
    const verseElement = document.querySelector(`[data-verse-ref="${this.currentBook} ${this.currentChapter}:${verse.verse}"]`);
    if (verseElement) {
      verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${this.currentBook} ${this.currentChapter}:${verse.verse}`,
        artist: `${this.translationName} • Voice Reader`,
        album: `${this.currentBook} (Holy Bible)`,
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '192x192', type: 'image/png' }
        ]
      });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('play', () => this.resume());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previousVerse());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.nextVerse());
    }

    let speakText = verse.text;
    if (this.currentVerseIndex === 0 && parseInt(verse.verse, 10) === 1) {
      speakText = `${this.currentBook}, chapter ${this.currentChapter}. ${verse.text}`;
    }

    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    const voice = this.getSelectedVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      this.consecutiveErrors = 0;
      if (this.isPlaying && !this.isPaused) {
        this.currentVerseIndex++;
        this.nextVerseTimeout = setTimeout(() => {
          this.speakCurrentVerse();
        }, 120);
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('SpeechSynthesis error:', e.error);
      this.consecutiveErrors = (this.consecutiveErrors || 0) + 1;
      if (this.consecutiveErrors >= 3) {
        this.stop();
        return;
      }
      if (this.isPlaying && !this.isPaused) {
        this.currentVerseIndex++;
        this.nextVerseTimeout = setTimeout(() => {
          this.speakCurrentVerse();
        }, 300);
      }
    };

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPaused = true;

    if (this.nextVerseTimeout) {
      clearTimeout(this.nextVerseTimeout);
      this.nextVerseTimeout = null;
    }

    if (this.activeUtterance) {
      this.activeUtterance.onstart = null;
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.silentAudio) {
      try { this.silentAudio.pause(); } catch (e) {}
    }
    this.releaseWakeLock();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    this.notifyState();
  }

  public resume() {
    if (!this.isPlaying) return;
    this.isPaused = false;
    if (this.silentAudio && this.silentAudio.paused) {
      this.silentAudio.play().catch(() => {});
    }
    this.acquireWakeLock();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
    this.notifyState();
    this.speakCurrentVerse();
  }

  public togglePlayPause() {
    if (!this.isPlaying) return;
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public previousVerse() {
    if (!this.isPlaying) return;
    if (this.currentVerseIndex > 0) {
      this.currentVerseIndex--;
      this.speakCurrentVerse();
    }
  }

  public nextVerse() {
    if (!this.isPlaying) return;
    if (this.currentVerseIndex < this.verses.length - 1) {
      this.currentVerseIndex++;
      this.speakCurrentVerse();
    }
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.consecutiveErrors = 0;

    if (this.nextVerseTimeout) {
      clearTimeout(this.nextVerseTimeout);
      this.nextVerseTimeout = null;
    }

    if (this.activeUtterance) {
      this.activeUtterance.onstart = null;
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.releaseWakeLock();
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
        this.silentAudio.currentTime = 0;
      } catch (e) {}
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    this.notifyState();
  }
}

export const ttsService = new TTSService();
