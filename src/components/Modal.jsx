import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './Icons.jsx';

/**
 * Accessible dialog shell: rendered in a portal, closes on Escape or backdrop
 * click, traps initial focus and locks background scrolling.
 */
export default function Modal({ open, title, subtitle, onClose, footer, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="modal__accent" aria-hidden="true" />

        <div className="modal__header">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle ? <p className="modal__subtitle">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--ghost"
            style={{ marginLeft: 'auto' }}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
