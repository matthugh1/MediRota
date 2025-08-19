import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ConfirmDialogType = 'danger' | 'warning' | 'info';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  type?: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmDialogContextType {
  showDialog: (options: ConfirmDialogOptions) => void;
  hideDialog: () => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
};

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const [dialog, setDialog] = useState<ConfirmDialogOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showDialog = useCallback((options: ConfirmDialogOptions) => {
    setDialog(options);
  }, []);

  const hideDialog = useCallback(() => {
    setDialog(null);
    setIsLoading(false);
  }, []);

  const handleConfirm = async () => {
    if (!dialog) return;
    
    setIsLoading(true);
    try {
      await dialog.onConfirm();
      hideDialog();
    } catch (error) {
      console.error('Confirm dialog error:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (dialog?.onCancel) {
      dialog.onCancel();
    }
    hideDialog();
  };

  return (
    <ConfirmDialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <AnimatePresence>
        {dialog && (
          <ConfirmDialogModal
            dialog={dialog}
            isLoading={isLoading}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
};

interface ConfirmDialogModalProps {
  dialog: ConfirmDialogOptions;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  dialog,
  isLoading,
  onConfirm: handleConfirm,
  onCancel: handleCancel,
}) => {
  const { title, message, type = 'info', confirmText, cancelText } = dialog;

  const iconMap = {
    danger: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colorMap = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      border: 'border-red-200',
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      border: 'border-yellow-200',
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      border: 'border-blue-200',
    },
  };

  const Icon = iconMap[type];
  const colors = colorMap[type];

  const defaultTexts = {
    danger: { confirm: 'Delete', cancel: 'Cancel' },
    warning: { confirm: 'Continue', cancel: 'Cancel' },
    info: { confirm: 'Confirm', cancel: 'Cancel' },
  };

  const texts = {
    confirm: confirmText || defaultTexts[type].confirm,
    cancel: cancelText || defaultTexts[type].cancel,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/25 backdrop-blur-sm"
          onClick={handleCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-${type === 'danger' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-100 sm:mx-0 sm:h-10 sm:w-10`}>
                <Icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {texts.confirm}
                </div>
              ) : (
                texts.confirm
              )}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCancel}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {texts.cancel}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Convenience hooks for different dialog types
export const useConfirmDelete = () => {
  const { showDialog } = useConfirmDialog();
  return useCallback((title: string, message: string, onConfirm: () => void | Promise<void>) => {
    showDialog({
      title,
      message,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm,
    });
  }, [showDialog]);
};

export const useConfirmWarning = () => {
  const { showDialog } = useConfirmDialog();
  return useCallback((title: string, message: string, onConfirm: () => void | Promise<void>) => {
    showDialog({
      title,
      message,
      type: 'warning',
      confirmText: 'Continue',
      onConfirm,
    });
  }, [showDialog]);
};

export const useConfirmInfo = () => {
  const { showDialog } = useConfirmDialog();
  return useCallback((title: string, message: string, onConfirm: () => void | Promise<void>) => {
    showDialog({
      title,
      message,
      type: 'info',
      confirmText: 'Confirm',
      onConfirm,
    });
  }, [showDialog]);
};
