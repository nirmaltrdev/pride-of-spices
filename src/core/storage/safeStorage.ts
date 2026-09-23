/**
 * SAFE STORAGE MODULE — The Pride of Spices
 *
 * Provides fault-tolerant, universal storage access that guarantees zero crashes
 * across all browser environments and privacy configurations:
 *
 * 1. Empty localStorage (first-time visitors)
 * 2. Missing 'pride_of_spices_muted' key
 * 3. 'pride_of_spices_muted' = "false"
 * 4. 'pride_of_spices_muted' = "true"
 * 5. Corrupt / invalid data (e.g. malformed JSON, arbitrary strings)
 * 6. localStorage unavailable, blocked, or throwing SecurityError / QuotaExceededError
 *    (e.g., Safari Private Browsing, Chrome Incognito with third-party storage blocked)
 *
 * Maintains a seamless in-memory fallback cache whenever window.localStorage fails.
 */

export const STORAGE_KEYS = {} as const;

// In-memory fallback map if window.localStorage is unreachable or throws
const memoryStorage = new Map<string, string>();

/**
 * Safely tests whether localStorage is available and writable in current context.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely tests whether localStorage is writable in current context.
 */
export function isLocalStorageWritable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__storage_probe_write__';
    window.localStorage.setItem(probe, '1');
    const read = window.localStorage.getItem(probe);
    window.localStorage.removeItem(probe);
    return read === '1';
  } catch {
    return false;
  }
}

export const safeStorage = {
  /**
   * Safely reads an item from storage. Falls back to in-memory store.
   */
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback
    }
    return memoryStorage.get(key) ?? null;
  },

  /**
   * Safely writes an item to storage. Falls back to in-memory store.
   */
  setItem(key: string, value: string): boolean {
    let success = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        success = true;
      }
    } catch {
      // Fallback
    }
    memoryStorage.set(key, value);
    return success;
  },

  /**
   * Safely removes an item from storage.
   */
  removeItem(key: string): boolean {
    let success = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        success = true;
      }
    } catch {
      // Fallback
    }
    memoryStorage.delete(key);
    return success;
  },

  /**
   * Safe boolean getter. Returns `defaultValue` if key is missing, null,
   * undefined, or not a parseable boolean string.
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    try {
      const raw = this.getItem(key);
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      const clean = String(raw).trim().toLowerCase();
      if (clean === 'true' || clean === '1') return true;
      if (clean === 'false' || clean === '0') return false;
      return defaultValue;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Safe boolean setter.
   */
  setBoolean(key: string, value: boolean): boolean {
    return this.setItem(key, String(value));
  },

  /**
   * Verifies safe storage access without throwing.
   */
  initStorage(): void {
    try {
      this.getItem('__init_probe__');
    } catch (err) {
      console.warn('[SafeStorage] Storage check handled safely:', err);
    }
  },

  /**
   * Diagnostic snapshot of storage state for DebugOverlay and telemetry.
   */
  getDiagnostics(): {
    isAvailable: boolean;
    isWritable: boolean;
    storageBackend: 'localStorage' | 'memory';
  } {
    const isAvail = isLocalStorageAvailable();
    const isWrit = isLocalStorageWritable();
    return {
      isAvailable: isAvail,
      isWritable: isWrit,
      storageBackend: isAvail && isWrit ? 'localStorage' : 'memory',
    };
  }
};
