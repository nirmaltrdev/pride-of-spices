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

export const STORAGE_KEYS = {
  MUTED: 'pride_of_spices_muted',
} as const;

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
   * Gets the 'pride_of_spices_muted' preference.
   * Default is false (unmuted / active audio context).
   */
  getMutedPreference(defaultValue: boolean = false): boolean {
    return this.getBoolean(STORAGE_KEYS.MUTED, defaultValue);
  },

  /**
   * Sets the 'pride_of_spices_muted' preference.
   */
  setMutedPreference(muted: boolean): boolean {
    return this.setBoolean(STORAGE_KEYS.MUTED, muted);
  },

  /**
   * Initializes default storage keys on first visit without throwing.
   * If 'pride_of_spices_muted' is missing or has invalid value, sets it to 'false'.
   * If already set to 'true' or 'false', preserves existing user preference.
   */
  initStorage(): void {
    try {
      const existing = this.getItem(STORAGE_KEYS.MUTED);
      if (existing === null || (existing !== 'true' && existing !== 'false')) {
        this.setItem(STORAGE_KEYS.MUTED, 'false');
      }
    } catch (err) {
      console.warn('[SafeStorage] Storage initialization error handled safely:', err);
    }
  },

  /**
   * Diagnostic snapshot of storage state for DebugOverlay.
   */
  getDiagnostics(): {
    isAvailable: boolean;
    mutedValue: string | null;
    parsedMuted: boolean;
  } {
    const isAvail = isLocalStorageAvailable();
    const rawVal = this.getItem(STORAGE_KEYS.MUTED);
    const parsed = this.getMutedPreference(false);
    return {
      isAvailable: isAvail,
      mutedValue: rawVal,
      parsedMuted: parsed,
    };
  }
};
