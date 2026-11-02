let lockCount = 0;
let prevBodyOverflow = '';
let prevBodyPaddingRight = '';

/**
 * Locks document.body scroll while compensating for scrollbar width
 * to prevent layout shifts and flickering when modals open.
 */
export function lockScroll() {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    prevBodyOverflow = document.body.style.overflow;
    prevBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
  }
  lockCount++;
}

/**
 * Releases the scroll lock once all open modals have closed.
 */
export function unlockScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = prevBodyOverflow || '';
    document.body.style.paddingRight = prevBodyPaddingRight || '';
  }
}
