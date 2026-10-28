import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

export type SheetProps = {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Native modal dialogs provide keyboard containment and make the background inert. */
export function Sheet({
  title,
  eyebrow,
  onClose,
  children,
  footer,
}: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const originalOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = originalOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      className="sheet"
      ref={dialog}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"]',
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(":disabled") &&
            !element.closest("[hidden], [inert]") &&
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== "hidden",
        );
        const first = controls[0];
        const last = controls.at(-1);
        const active = document.activeElement;
        if (!first || !last) {
          event.preventDefault();
          event.currentTarget.focus();
        } else if (
          !event.currentTarget.contains(active) ||
          active === event.currentTarget ||
          (event.shiftKey && active === first) ||
          (!event.shiftKey && active === last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        close.current();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          close.current();
      }}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <header className="sheet-header">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
          autoFocus
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="sheet-content">{children}</div>
      {footer && <footer className="sheet-footer">{footer}</footer>}
    </dialog>
  );
}

export default Sheet;
