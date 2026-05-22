'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface Props {
  before: string;
  after: string;
}

export default function ComparisonSlider({ before, after }: Props) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) updatePos(e.clientX);
  }, [dragging, updatePos]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (dragging) updatePos(e.touches[0].clientX);
  }, [dragging, updatePos]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', () => setDragging(false));
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', () => setDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', () => setDragging(false));
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', () => setDragging(false));
    };
  }, [dragging, onMouseMove, onTouchMove]);

  return (
    <div
      ref={containerRef}
      className="comparison-slider"
      onMouseDown={(e) => { setDragging(true); updatePos(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); updatePos(e.touches[0].clientX); }}
    >
      {/* Before */}
      <img src={before} alt="Before" className="img-base" draggable={false} />

      {/* After — clipped */}
      <div className="img-after-wrap" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={after} alt="After" className="img-base" draggable={false} />
      </div>

      {/* Divider */}
      <div className="divider-line" style={{ left: `${pos}%` }}>
        <div className="divider-handle">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 10L3 7M6 10L3 13M6 10H14M14 10L17 7M14 10L17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="label label-before">BEFORE</span>
      <span className="label label-after">AFTER</span>

      <style>{`
        .comparison-slider {
          position: relative;
          width: 100%;
          aspect-ratio: auto;
          cursor: col-resize;
          user-select: none;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .img-base {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #0b0b0b;
        }
        .img-after-wrap {
          position: absolute;
          inset: 0;
          transition: none;
        }
        .img-after-wrap .img-base {
          position: absolute;
          inset: 0;
        }
        .divider-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--accent);
          transform: translateX(-1px);
          pointer-events: none;
        }
        .divider-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: var(--accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          box-shadow: 0 0 20px rgba(232,148,58,0.5);
          pointer-events: auto;
          cursor: col-resize;
        }
        .label {
          position: absolute;
          bottom: 12px;
          font-family: var(--font-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          padding: 4px 8px;
          background: rgba(0,0,0,0.7);
          border-radius: 2px;
          pointer-events: none;
        }
        .label-before { left: 12px; color: var(--muted); }
        .label-after { right: 12px; color: var(--accent); }
      `}</style>
    </div>
  );
}
