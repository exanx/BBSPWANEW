import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Volume2, Mic } from 'lucide-react';
import { TTSState } from '../services/tts';

interface VoicePlayerBarProps {
  ttsState: TTSState;
  translationName: string;
  onTogglePlayPause: () => void;
  onPrevVerse: () => void;
  onNextVerse: () => void;
  onCycleSpeed: () => void;
  onSelectVoice: (voiceURI: string) => void;
  onStop: () => void;
}

export const VoicePlayerBar: React.FC<VoicePlayerBarProps> = ({
  ttsState,
  translationName,
  onTogglePlayPause,
  onPrevVerse,
  onNextVerse,
  onCycleSpeed,
  onSelectVoice,
  onStop
}) => {
  const [showVoicePopover, setShowVoicePopover] = useState(false);

  if (!ttsState.isPlaying) return null;

  const progressPercent = ttsState.totalVerses > 0
    ? Math.round(((ttsState.verseIndex + 1) / ttsState.totalVerses) * 100)
    : 0;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg transition-all duration-300 transform translate-y-0 opacity-100">
      <div className="glass-panel !bg-white/95 dark:!bg-[#141417]/95 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-white/10 p-3 sm:p-3.5 relative overflow-hidden backdrop-blur-2xl">
        {/* Progress Bar Top/Bottom Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-white/5">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Info Section */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5 animate-pulse text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                  {ttsState.book} {ttsState.chapter}:{ttsState.verseNum}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                  {ttsState.verseIndex + 1}/{ttsState.totalVerses}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {translationName || 'Douay-Rheims'} • Voice Reader
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Speed Cycle */}
            <button
              type="button"
              onClick={onCycleSpeed}
              className="text-[11px] font-bold px-2 py-1 rounded-lg btn-secondary text-gray-700 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
              title="Change reading speed"
            >
              {ttsState.rate}x
            </button>

            {/* Voice Select Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVoicePopover(!showVoicePopover)}
                className="p-2 rounded-xl btn-secondary text-gray-600 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
                title="Voice options"
              >
                <Mic className="w-4 h-4" />
              </button>

              {showVoicePopover && (
                <div className="absolute bottom-12 right-0 w-64 glass-panel !bg-white/95 dark:!bg-[#18181b]/95 rounded-xl shadow-2xl p-2 border border-gray-200 dark:border-white/10 z-50 modal-enter max-h-56 overflow-y-auto custom-scrollbar">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
                    Select Voice
                  </div>
                  {ttsState.voices.length === 0 ? (
                    <div className="text-xs text-gray-400 p-2">System default voice</div>
                  ) : (
                    ttsState.voices.map((voice) => (
                      <button
                        key={voice.voiceURI}
                        type="button"
                        onClick={() => {
                          onSelectVoice(voice.voiceURI);
                          setShowVoicePopover(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors cursor-pointer ${
                          ttsState.voiceURI === voice.voiceURI
                            ? 'bg-primary text-white font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {voice.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Prev Verse */}
            <button
              type="button"
              onClick={onPrevVerse}
              className="p-2 rounded-xl btn-secondary text-gray-700 dark:text-gray-200 hover:text-primary transition-colors cursor-pointer"
              title="Previous verse"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={onTogglePlayPause}
              className="btn-primary w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={ttsState.isPaused ? 'Resume' : 'Pause'}
            >
              {ttsState.isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Next Verse */}
            <button
              type="button"
              onClick={onNextVerse}
              className="p-2 rounded-xl btn-secondary text-gray-700 dark:text-gray-200 hover:text-primary transition-colors cursor-pointer"
              title="Next verse"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Stop / Close */}
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors ml-0.5 cursor-pointer"
              title="Close Voice Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
