export interface VerseItem {
  verse: string;
  text: string;
}

export interface ChapterData {
  book: string;
  chapter: string;
  reference: string;
  translation_name: string;
  verses: VerseItem[];
}

export interface HighlightItem {
  color: string;
  note?: string;
  category?: string;
  verseText?: string;
  updatedAt?: number;
  deleted?: boolean;
}

export interface BookmarkItem {
  updatedAt?: number;
  deleted?: boolean;
}

export interface CategoryItem {
  updatedAt?: number;
  deleted?: boolean;
}

export interface LastReadPosition {
  book: string;
  chapter: string;
  verse: string;
  timestamp: number;
}

export interface CustomBible {
  id: string;
  name: string;
  url: string;
}

export interface AccentColor {
  color: string;
  hover: string;
  glow: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  category: 'main' | 'light' | 'dark';
  mode: 'dark' | 'light';
  bg: string;
  text: string;
  font: string;
  accent: AccentColor;
  desc: string;
  animated?: boolean;
}

export interface SettingsState {
  translation: string;
  fontSize: number;
  lineRatio: number;
  fontFamily: string;
  isBold: boolean;
  contentWidth: number;
  accentColor: AccentColor;
  theme: 'dark' | 'light';
  activeThemeId: string;
  liveEffect: string;
  customBibles: CustomBible[];
  customFonts: string[];
  customBg: string | null;
  customText: string | null;
  updatedAt: number;
}
