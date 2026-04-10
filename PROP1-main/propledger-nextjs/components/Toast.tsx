'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: 'bg-green-500/90',
      border: 'border-green-400',
      icon: '✓',
      iconBg: 'bg-green-600',
    },
    error: {
      bg: 'bg-red-500/90',
      border: 'border-red-400',
      icon: '✕',
      iconBg: 'bg-red-600',
    },
    warning: {
      bg: 'bg-yellow-500/90',
      border: 'border-yellow-400',
      icon: '⚠',
      iconBg: 'bg-yellow-600',
    },
    info: {
      bg: 'bg-blue-500/90',
      border: 'border-blue-400',
      icon: 'ℹ',
      iconBg: 'bg-blue-600',
    },
  };

  const style = styles[type];

  return (
    <div
      className={`fixed top-4 right-4 z-[100] max-w-md ${
        isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
    >
      <div
        className={`${style.bg} backdrop-blur-sm border ${style.border} rounded-lg shadow-2xl p-4 flex items-start gap-3`}
      >
        {/* Icon */}
        <div className={`${style.iconBg} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold">{style.icon}</span>
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-white font-medium">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  };
}
