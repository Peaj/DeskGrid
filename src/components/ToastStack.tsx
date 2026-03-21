import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './icons';

interface ToastNotice {
  id: string;
  message: string;
}

interface ToastStackProps {
  notices: ToastNotice[];
  onDismiss: (id: string) => void;
}

const TOAST_LIFETIME_MS = 3200;
const TOAST_EXIT_MS = 220;

export function ToastStack({ notices, onDismiss }: ToastStackProps) {
  const [closingIds, setClosingIds] = useState<string[]>([]);
  const dismissTimersRef = useRef<Map<string, number>>(new Map());
  const removeTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const activeIds = new Set(notices.map((notice) => notice.id));

    for (const notice of notices) {
      if (dismissTimersRef.current.has(notice.id) || removeTimersRef.current.has(notice.id)) {
        continue;
      }
      const timeoutId = window.setTimeout(() => {
        beginDismiss(notice.id);
      }, TOAST_LIFETIME_MS);
      dismissTimersRef.current.set(notice.id, timeoutId);
    }

    for (const [id, timeoutId] of dismissTimersRef.current) {
      if (!activeIds.has(id)) {
        window.clearTimeout(timeoutId);
        dismissTimersRef.current.delete(id);
      }
    }

    for (const [id, timeoutId] of removeTimersRef.current) {
      if (!activeIds.has(id)) {
        window.clearTimeout(timeoutId);
        removeTimersRef.current.delete(id);
      }
    }

    setClosingIds((current) => current.filter((id) => activeIds.has(id)));
  }, [notices]);

  useEffect(() => {
    return () => {
      for (const timeoutId of dismissTimersRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      for (const timeoutId of removeTimersRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  function beginDismiss(id: string): void {
    if (removeTimersRef.current.has(id)) {
      return;
    }

    const dismissTimeoutId = dismissTimersRef.current.get(id);
    if (dismissTimeoutId !== undefined) {
      window.clearTimeout(dismissTimeoutId);
      dismissTimersRef.current.delete(id);
    }

    setClosingIds((current) => (current.includes(id) ? current : [...current, id]));

    const removeTimeoutId = window.setTimeout(() => {
      removeTimersRef.current.delete(id);
      onDismiss(id);
    }, TOAST_EXIT_MS);
    removeTimersRef.current.set(id, removeTimeoutId);
  }

  if (notices.length === 0) {
    return null;
  }

  return (
    <section className="toast-region" aria-live="polite" aria-relevant="additions text">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={`toast-card ${closingIds.includes(notice.id) ? 'is-exiting' : ''}`}
          role="status"
        >
          <span className="toast-message">{notice.message}</span>
          <button
            className="toast-dismiss"
            onClick={() => beginDismiss(notice.id)}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </section>
  );
}
