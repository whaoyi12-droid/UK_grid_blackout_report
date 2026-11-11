import { useLayoutEffect, useRef, useState } from 'react';

function Digit({ value, position }: { value: string; position: number }) {
  const [from, setFrom] = useState(value);
  const track = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (from === value) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setFrom(value); return; }
    const animation = track.current?.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-50%)' },
    ], { duration: 1000, easing: 'cubic-bezier(.22,.72,.2,1)', fill: 'forwards' });
    if (animation) animation.onfinish = () => setFrom(value);
    return () => { if (animation) { animation.onfinish = null; animation.cancel(); } };
  }, [value, from]);
  return <span className="clock-digit" data-position={position} data-value={value} data-rolling={from !== value}>
    <span className="digit-track" ref={track}><span>{from}</span>{from !== value && <span>{value}</span>}</span>
  </span>;
}

export const formatEventTime = (time: string) => time.length === 5 ? `${time}:00` : time;

/** The clock stays mounted while the narrative changes. Each position owns its reel. */
export default function RollingClock({ time }: { time: string }) {
  // Minute-resolution source events retain their precision; :00 is display padding.
  const displayTime = formatEventTime(time);
  return <div className="event-clock rolling-clock" role="timer" aria-label={displayTime} data-testid="event-clock" data-time={time} data-display-time={displayTime}>
    <span className="clock-face" aria-hidden="true">{[...displayTime].map((character, position) => character === ':'
      ? <span className="clock-colon" key={position}>:</span>
      : <Digit key={position} value={character} position={position}/>)}</span>
  </div>;
}
