import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl glass-panel !bg-gray-900/90 text-white dark:!bg-white/90 dark:text-gray-900 border border-white/20 dark:border-black/20 flex items-center gap-2 pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      <span>{message}</span>
    </div>
  );
};
