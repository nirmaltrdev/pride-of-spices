import { useEffect } from 'react';
import { safeStorage } from '../storage/safeStorage';

/**
 * AUDIO CONTROLLER — Fault-Tolerant Sound Management
 *
 * Ensures audio initialization and storage preferences are completely bulletproof.
 * Safely accesses 'pride_of_spices_muted' and handles:
 * - Empty localStorage
 * - Missing 'pride_of_spices_muted'
 * - 'pride_of_spices_muted' = "false"
 * - 'pride_of_spices_muted' = "true"
 * - Corrupt data
 * - Blocked / throwing localStorage
 */
export function AudioController() {
  useEffect(() => {
    // Safely initialize audio preference for first-time visitors
    safeStorage.initStorage();
  }, []);

  return null;
}
