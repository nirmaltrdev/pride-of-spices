import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user has requested a reduced data usage mode.
 * 
 * Uses the navigator.connection.saveData property if available.
 * Can be used to disable heavy background images, lazy load components
 * more aggressively, or reduce the resolution of loaded assets.
 * 
 * NOTE: This is Phase 2+ infrastructure. Currently implemented as a capability baseline.
 */
export function useSaveData(): boolean {
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    // @ts-expect-error - NetworkInformation API is not fully typed in all environments
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection && 'saveData' in connection) {
      setSaveData(connection.saveData === true);
      
      const handler = () => {
        setSaveData(connection.saveData === true);
      };
      
      connection.addEventListener('change', handler);
      return () => connection.removeEventListener('change', handler);
    }
  }, []);

  return saveData;
}
