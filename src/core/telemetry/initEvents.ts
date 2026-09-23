/**
 * INITIALIZATION EVENTS TELEMETRY
 * Tracks exact lifecycle milestones during boot for root-cause diagnosis.
 */

export interface InitEvent {
  name: string;
  timestamp: number;
  elapsedMs: number;
  details?: Record<string, unknown>;
}

const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
const eventList: InitEvent[] = [];

export function recordInitEvent(name: string, details?: Record<string, unknown>): void {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedMs = Math.round((now - startTime) * 10) / 10;
  
  const event: InitEvent = {
    name,
    timestamp: Date.now(),
    elapsedMs,
    details,
  };
  
  eventList.push(event);

  if (typeof window !== 'undefined') {
    (window as unknown as { __PRIDE_INIT_EVENTS__?: InitEvent[] }).__PRIDE_INIT_EVENTS__ = eventList;
  }

  // Telemetry console log for development / debugging
  if (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('debug') || import.meta.env.DEV)) {
    console.log(
      `%c[BOOT TELEMETRY +${elapsedMs}ms]%c ${name}`,
      'color: #10B981; font-weight: bold;',
      'color: #E0E2DC;',
      details || ''
    );
  }
}

export function getInitEvents(): InitEvent[] {
  return [...eventList];
}
