import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const SLIDES = ['top', 'timeline', 'lab', 'propagation', 'analysis', 'resources'] as const;
export type SlideId = typeof SLIDES[number];
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One vertical gesture advances one screen. Overflowing screens remain readable. */
export function usePresentation(blocked: boolean) {
  const deck = useRef<HTMLElement>(null);
  const [active, setActive] = useState<SlideId>('top');
  const lock = useRef(0), gesture = useRef(0), lastWheel = useRef(0), gestureUsed = useRef(false);
  const go = useCallback((id: string, instant = false) => {
    const el = document.getElementById(id), root = deck.current;
    if (!el || !root || !SLIDES.includes(id as SlideId)) return;
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({ top, behavior: instant || reduced() ? 'instant' : 'smooth' });
    lock.current = performance.now() + (instant || reduced() ? 200 : 850);
  }, []);
  useEffect(() => {
    const root = deck.current;
    if (!root) return;
    let frame = 0;
    const track = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rootTop = root.getBoundingClientRect().top;
        let nearest: SlideId = 'top', distance = Infinity;
        SLIDES.forEach(id => { const el = document.getElementById(id); if (!el) return; const d = Math.abs(el.getBoundingClientRect().top - rootTop); if (d < distance) { nearest = id; distance = d; } });
        setActive(nearest);
        root.querySelectorAll<HTMLElement>('.slide').forEach(el => { el.classList.toggle('is-active', el.id === nearest); el.inert = el.id !== nearest; });
        if (location.hash !== `#${nearest}`) history.replaceState(null, '', `#${nearest}`);
      });
    };
    const wheel = (e: WheelEvent) => {
      if (blocked || document.fullscreenElement || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const target = e.target as HTMLElement;
      if (target.closest('dialog')) return;
      const rail=target.closest<HTMLElement>('[data-horizontal-scroll]');
      if(rail&&rail.scrollWidth>rail.clientWidth+2){e.preventDefault();rail.scrollLeft+=e.deltaY;return;}
      const slide = target.closest<HTMLElement>('.slide');
      const direction = Math.sign(e.deltaY);
      const inner = slide?.querySelector<HTMLElement>('.slide-body');
      // Never skip unread content on short screens or mobile devices.
      if (inner && inner.scrollHeight > inner.clientHeight + 2 && ((direction > 0 && inner.scrollTop + inner.clientHeight < inner.scrollHeight - 2) || (direction < 0 && inner.scrollTop > 2))) return;
      e.preventDefault();
      const now = performance.now(), idle = now - lastWheel.current;
      lastWheel.current = now;
      if (gestureUsed.current && idle < 180) return;
      if (idle >= 180) gestureUsed.current = false;
      if (now < lock.current) return;
      if (idle > 180 || Math.sign(gesture.current) !== direction) gesture.current = 0;
      gesture.current += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      if (Math.abs(gesture.current) < 36) return;
      const index = Math.round(root.scrollTop / root.clientHeight);
      go(SLIDES[Math.max(0, Math.min(SLIDES.length - 1, index + direction))]);
      gesture.current = 0;
      gestureUsed.current = true;
      lock.current = now + 850;
    };
    const key = (e: KeyboardEvent) => {
      if (blocked || document.fullscreenElement || (e.target as HTMLElement).closest('input,textarea,select,[role="tab"],dialog')) return;
      const index = Math.round(root.scrollTop / root.clientHeight);
      if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? SLIDES.length - 1 : index + (['PageDown', 'ArrowDown'].includes(e.key) ? 1 : -1);
        go(SLIDES[Math.max(0, Math.min(SLIDES.length - 1, next))]);
      }
    };
    const click = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (link && SLIDES.includes(link.hash.slice(1) as SlideId)) { e.preventDefault(); go(link.hash.slice(1)); }
    };
    const hash = () => go(location.hash.slice(1) || 'top');
    let touch: { x: number; y: number; id: SlideId; atTop: boolean; atBottom: boolean } | null = null;
    const touchStart = (e: TouchEvent) => {
      touch = null;
      if (blocked || document.fullscreenElement || e.touches.length !== 1) return;
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,dialog')) return;
      const slide = target.closest<HTMLElement>('.slide');
      if (!slide) return;
      const inner = slide.querySelector<HTMLElement>('.slide-body');
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, id: slide.id as SlideId, atTop: !inner || inner.scrollTop <= 2, atBottom: !inner || inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 2 };
    };
    const touchEnd = (e: TouchEvent) => {
      if (!touch || !e.changedTouches.length || e.touches.length) return;
      const delta = touch.y - e.changedTouches[0].clientY, dx = touch.x - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 65 && Math.abs(delta) > Math.abs(dx) * 1.25 && (delta > 0 ? touch.atBottom : touch.atTop)) {
        const index = SLIDES.indexOf(touch.id);
        go(SLIDES[Math.max(0, Math.min(SLIDES.length - 1, index + Math.sign(delta)))]);
      }
      touch = null;
    };
    const resize = () => go(location.hash.slice(1) || 'top', true);
    root.addEventListener('scroll', track, { passive: true }); root.addEventListener('wheel', wheel, { passive: false });
    root.addEventListener('touchstart', touchStart, { passive: true }); root.addEventListener('touchend', touchEnd, { passive: true });
    document.addEventListener('keydown', key); document.addEventListener('click', click); window.addEventListener('hashchange', hash); window.addEventListener('resize', resize);
    go(location.hash.slice(1) || 'top', true); track();
    return () => { cancelAnimationFrame(frame); root.removeEventListener('scroll', track); root.removeEventListener('wheel', wheel); root.removeEventListener('touchstart', touchStart); root.removeEventListener('touchend', touchEnd); document.removeEventListener('keydown', key); document.removeEventListener('click', click); window.removeEventListener('hashchange', hash); window.removeEventListener('resize', resize); };
  }, [blocked, go]);
  return { deck, active, go };
}

/** Exit old content first, then introduce new children at individual delays. */
export function SceneSwap<T>({ value, children, className = '' }: { value: T; children: (shown: T) => ReactNode; className?: string }) {
  const [shown, setShown] = useState(value), [exiting, setExiting] = useState(false);
  const previous = useRef(value), content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    if (reduced()) { setShown(value); setExiting(false); return; }
    setExiting(true);
    const timer = window.setTimeout(() => { setShown(value); setExiting(false); }, 340);
    return () => clearTimeout(timer);
  }, [value]);
  useLayoutEffect(() => {
    if (reduced() || !content.current) return;
    const animations = Array.from(content.current.children).map((el, i) => el.animate([{ opacity: 0, transform: 'translateY(15px)', filter: 'blur(3px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 920, delay: i * 110, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }));
    return () => animations.forEach(animation => animation.cancel());
  }, [shown]);
  return <div ref={content} className={`scene-swap ${exiting ? 'is-exiting' : ''} ${className}`}>{children(shown)}</div>;
}
