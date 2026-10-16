import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export interface ConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmModalProps {
  dialog: ConfirmDialogOptions | null;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ dialog }) => {
  if (!dialog) return null;

  const isWarning = dialog.type === 'warning';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl glass-panel p-5 shadow-2xl border border-gray-200 dark:border-white/10 modal-enter">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isWarning
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
            }`}
          >
            {isWarning ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {dialog.title || 'Confirm Action'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {dialog.message || 'Are you sure you want to proceed?'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={dialog.onCancel}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            {dialog.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={dialog.onConfirm}
            className={`font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer text-white ${
              isWarning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {dialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
