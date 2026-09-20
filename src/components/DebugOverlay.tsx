import React, { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenisInstance } from '../core/lenisInstance';
import { safeStorage } from '../core/storage/safeStorage';

/**
 * DEBUG OVERLAY — Live Runtime Diagnostic Panel
 *
 * Activated via URL parameter: ?debug=1
 * Works on both localhost AND Vercel Preview (production) builds.
 * Does NOT check import.meta.env.DEV — always available when debug=1.
 */

interface SceneState {
  id: string;
  opacity: string;
  visibility: string;
  display: string;
  rectTop: number;
  rectHeight: number;
  inViewport: boolean;
}

interface StorageState {
  isAvailable: boolean;
  mutedValue: string | null;
  parsedMuted: boolean;
}

interface DebugState {
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  viewportScale: number;
  zoomEstimate: string;
  prefersReducedMotion: boolean;
  hardwareConcurrency: number;
  scrollY: number;
  docScrollHeight: number;
  bodyScrollHeight: number;
  lenisCurrent: number;
  lenisTarget: number;
  stProgress: number;
  stStart: number;
  stEnd: number;
  tlProgress: number;
  stickyOpacity: string;
  stickyVisibility: string;
  stickyRect: string;
  scenes: SceneState[];
  centerTag: string;
  centerId: string;
  centerClass: string;
  centerOpacity: string;
  centerVisibility: string;
  centerZIndex: string;
  storage: StorageState;
  isBlank: boolean;
  blankReason: string;
}

const SCENE_SELECTORS = [
  { id: 'S1', selector: '#scene-arrival' },
  { id: 'S2', selector: '#scene-forest' },
  { id: 'S3', selector: '#scene-discovery' },
  { id: 'S4', selector: '#scene-harvest' },
  { id: 'S4.5', selector: '#scene-honey' },
  { id: 'S5', selector: '#collection' },
];

function collectState(): DebugState {
  const vv = window.visualViewport;
  const vvScale = vv ? vv.scale : 1;
  const zoomEst = `${Math.round((window.outerWidth / window.innerWidth) * 100)}%`;
  const pRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const st = ScrollTrigger.getById('master-scroll-trigger');
  const lenis = getLenisInstance();

  const stProgress = st ? parseFloat(st.progress.toFixed(4)) : 0;
  const stStart = st ? Math.round(st.start) : 0;
  const stEnd = st ? Math.round(st.end) : 0;
  const tlProgress = st && st.animation ? parseFloat((st.animation as gsap.core.Timeline).progress().toFixed(4)) : 0;

  const lenisCurrent = lenis ? parseFloat(lenis.scroll.toFixed(1)) : window.scrollY;
  const lenisTarget: number = lenis && 'targetScroll' in lenis
    ? parseFloat(String((lenis as unknown as { targetScroll: number }).targetScroll))
    : window.scrollY;

  const stickyEl = document.querySelector<HTMLElement>('.experience-shell > div > div');
  const stickyCs = stickyEl ? window.getComputedStyle(stickyEl) : null;
  const stickyRct = stickyEl ? stickyEl.getBoundingClientRect() : null;
  const stickyOp = stickyCs ? parseFloat(stickyCs.opacity) : 1;

  const scenes: SceneState[] = SCENE_SELECTORS.map(({ id, selector }) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return { id, opacity: '?', visibility: 'hidden', display: 'none', rectTop: 0, rectHeight: 0, inViewport: false };
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      id,
      opacity: parseFloat(cs.opacity).toFixed(2),
      visibility: cs.visibility,
      display: cs.display === 'none' ? 'none' : 'block',
      rectTop: Math.round(rect.top),
      rectHeight: Math.round(rect.height),
      inViewport: rect.bottom > 0 && rect.top < window.innerHeight,
    };
  });

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const centerEl = document.elementFromPoint(cx, cy) as HTMLElement | null;
  const centerCs = centerEl ? window.getComputedStyle(centerEl) : null;

  let isBlank = false;
  let blankReason = 'OK';

  if (tlProgress < 0.95) {
    const stickyOk = stickyOp > 0.05 && stickyCs?.visibility !== 'hidden';
    const activeScene = scenes.find(s => s.id !== 'S5' && s.inViewport && parseFloat(s.opacity) > 0.05 && s.visibility !== 'hidden');
    if (!stickyOk) { isBlank = true; blankReason = `Sticky opacity=${stickyOp.toFixed(2)}`; }
    else if (!activeScene) { isBlank = true; blankReason = 'No active scene visible in viewport'; }
  } else {
    const honey = scenes.find(s => s.id === 'S4.5');
    const col = scenes.find(s => s.id === 'S5');
    const honeyOk = honey && honey.inViewport && parseFloat(honey.opacity) > 0.05 && stickyOp > 0.05;
    const colOk = col && col.inViewport && parseFloat(col.opacity) > 0.05;
    if (!honeyOk && !colOk) {
      isBlank = true;
      blankReason = `HoneyOp=${honey?.opacity} ColOp=${col?.opacity} StickyOp=${stickyOp.toFixed(2)}`;
    }
  }

  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    viewportScale: vvScale,
    zoomEstimate: zoomEst,
    prefersReducedMotion: pRM,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    scrollY: Math.round(window.scrollY),
    docScrollHeight: document.documentElement.scrollHeight,
    bodyScrollHeight: document.body.scrollHeight,
    lenisCurrent,
    lenisTarget,
    stProgress,
    stStart,
    stEnd,
    tlProgress,
    stickyOpacity: stickyOp.toFixed(2),
    stickyVisibility: stickyCs?.visibility ?? 'visible',
    stickyRect: stickyRct ? `top:${Math.round(stickyRct.top)} h:${Math.round(stickyRct.height)}` : '?',
    scenes,
    centerTag: centerEl?.tagName?.toLowerCase() ?? '?',
    centerId: centerEl?.id ?? '',
    centerClass: (centerEl?.className ?? '').substring(0, 60),
    centerOpacity: centerCs ? parseFloat(centerCs.opacity).toFixed(2) : '?',
    centerVisibility: centerCs?.visibility ?? '?',
    centerZIndex: centerCs?.zIndex ?? '?',
    storage: safeStorage.getDiagnostics(),
    isBlank,
    blankReason,
  };
}

export function DebugOverlay() {
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState<DebugState | null>(null);
  const [blankLog, setBlankLog] = useState<string[]>([]);
  const blankActiveRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const s = collectState();
      setState(s);
      if (s.isBlank && !blankActiveRef.current) {
        blankActiveRef.current = true;
        const entry = `TL=${s.tlProgress} Y=${s.scrollY} | ${s.blankReason} | center=${s.centerTag}#${s.centerId} op=${s.centerOpacity}`;
        setBlankLog(prev => [...prev.slice(-9), entry]);
        console.error('[DebugOverlay BLANK]', s);
      } else if (!s.isBlank) {
        blankActiveRef.current = false;
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  if (!visible || !state) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed', bottom: 8, right: 8, zIndex: 99999,
          background: '#B33927', color: '#fff', border: 'none',
          padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
        }}
      >
        SHOW DEBUG
      </button>
    );
  }

  const R = ({ k, v, warn }: { k: string; v: string | number | boolean; warn?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 2, marginBottom: 2 }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, minWidth: 90 }}>{k}</span>
      <span style={{ color: warn ? '#F44336' : '#E8B44D', fontSize: 10, textAlign: 'right', wordBreak: 'break-all' }}>{String(v)}</span>
    </div>
  );

  const S: React.CSSProperties = { background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '4px 6px', marginBottom: 4 };
  const SL: React.CSSProperties = { fontSize: 9, color: '#018039', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 3, display: 'block' };

  return (
    <div style={{
      position: 'fixed', top: 8, right: 8, zIndex: 99999,
      width: 270, maxHeight: '96dvh', overflowY: 'auto',
      background: 'rgba(2,8,4,0.96)', borderRadius: 6,
      border: state.isBlank ? '2px solid #F44336' : '2px solid rgba(1,128,57,0.45)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.85)',
      fontFamily: 'monospace', padding: 8, scrollbarWidth: 'thin',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: state.isBlank ? '#F44336' : '#4CAF50', fontSize: 11, fontWeight: 700 }}>
          {state.isBlank ? '⚠ BLANK' : '✓ DEBUG'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(state, null, 2))}
            style={{ background: 'rgba(1,128,57,0.2)', border: '1px solid rgba(1,128,57,0.4)', color: '#ccc', borderRadius: 3, fontSize: 9, padding: '2px 6px', cursor: 'pointer' }}>
            copy
          </button>
          <button onClick={() => setVisible(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', padding: '0 2px' }}>
            ✕
          </button>
        </div>
      </div>

      {state.isBlank && (
        <div style={{ background: 'rgba(180,30,20,0.2)', border: '1px solid #F44336', borderRadius: 4, padding: 4, marginBottom: 6 }}>
          <span style={{ color: '#F44336', fontSize: 9 }}>BLANK: {state.blankReason}</span>
        </div>
      )}

      <div style={S}>
        <span style={SL}>Browser</span>
        <R k="viewport" v={`${state.innerWidth}×${state.innerHeight}`} />
        <R k="DPR" v={state.devicePixelRatio} />
        <R k="vp.scale" v={state.viewportScale} />
        <R k="zoom" v={state.zoomEstimate} />
        <R k="reducedMotion" v={state.prefersReducedMotion} warn={state.prefersReducedMotion} />
        <R k="hwConcurrency" v={state.hardwareConcurrency} />
      </div>

      <div style={S}>
        <span style={SL}>Storage & Mute</span>
        <R k="storage.status" v={state.storage.isAvailable ? 'available' : 'blocked (memory)'} warn={!state.storage.isAvailable} />
        <R k="muted.raw" v={state.storage.mutedValue !== null ? `"${state.storage.mutedValue}"` : 'null (empty)'} />
        <R k="muted.parsed" v={state.storage.parsedMuted ? 'true (muted)' : 'false (ready)'} />
      </div>

      <div style={S}>
        <span style={SL}>Document</span>
        <R k="scrollY" v={state.scrollY} />
        <R k="doc.scrollH" v={state.docScrollHeight} />
        <R k="body.scrollH" v={state.bodyScrollHeight} />
      </div>

      <div style={S}>
        <span style={SL}>Scroll / GSAP</span>
        <R k="lenis.cur" v={state.lenisCurrent} />
        <R k="lenis.target" v={state.lenisTarget} />
        <R k="ST.progress" v={state.stProgress} />
        <R k="ST.start" v={state.stStart} />
        <R k="ST.end" v={state.stEnd} />
        <R k="TL.progress" v={state.tlProgress} />
      </div>

      <div style={S}>
        <span style={SL}>Sticky Viewport</span>
        <R k="opacity" v={state.stickyOpacity} warn={parseFloat(state.stickyOpacity) < 0.1} />
        <R k="visibility" v={state.stickyVisibility} warn={state.stickyVisibility === 'hidden'} />
        <R k="rect" v={state.stickyRect} />
      </div>

      <div style={S}>
        <span style={SL}>Scenes (▸=in viewport)</span>
        {state.scenes.map(sc => {
          const bad = parseFloat(sc.opacity) < 0.05 && sc.inViewport;
          return (
            <div key={sc.id} style={{ marginBottom: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 2 }}>
              <span style={{ color: bad ? '#F44336' : sc.inViewport ? '#4CAF50' : 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                {sc.inViewport ? '▸' : '○'} {sc.id}
              </span>
              <span style={{ color: bad ? '#F44336' : '#E8B44D', fontSize: 9, marginLeft: 6 }}>op:{sc.opacity}</span>
              <span style={{ color: sc.visibility === 'hidden' ? '#F44336' : 'rgba(255,255,255,0.3)', fontSize: 9, marginLeft: 4 }}>vis:{sc.visibility}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, marginLeft: 4 }}>top:{sc.rectTop}</span>
            </div>
          );
        })}
      </div>

      <div style={S}>
        <span style={SL}>Center Element</span>
        <R k="tag#id" v={`${state.centerTag}${state.centerId ? '#' + state.centerId : ''}`} />
        <R k="opacity" v={state.centerOpacity} warn={parseFloat(state.centerOpacity) < 0.05} />
        <R k="visibility" v={state.centerVisibility} warn={state.centerVisibility === 'hidden'} />
        <R k="z-index" v={state.centerZIndex} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>class</span>
          <span style={{ color: '#888', fontSize: 8, textAlign: 'right', wordBreak: 'break-all', maxWidth: 160 }}>{state.centerClass}</span>
        </div>
      </div>

      {blankLog.length > 0 && (
        <div style={S}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={SL}>Blank Event Log</span>
            <button onClick={() => setBlankLog([])}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: 9, cursor: 'pointer', marginTop: -2 }}>
              clear
            </button>
          </div>
          {blankLog.map((entry, i) => (
            <div key={i} style={{ color: '#F44336', fontSize: 9, marginBottom: 2, wordBreak: 'break-all' }}>
              {i + 1}. {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
