/**
 * Safe storage utilities that handle browser storage limits
 */

// Maximum size for storage items (slightly under browser limits)
const MAX_ITEM_SIZE = 4 * 1024 * 1024; // 4MB

/**
 * Safely store data in localStorage with size checking
 */
export const safeLocalStorage = {
  setItem: (key, value) => {
    try {
      // For objects, stringify them
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      // Check size before storing
      if (valueToStore.length > MAX_ITEM_SIZE) {
        console.warn(`Storage item "${key}" exceeds size limit of ${MAX_ITEM_SIZE} bytes`);
        return false;
      }
      
      localStorage.setItem(key, valueToStore);
      return true;
    } catch (error) {
      console.error('Error storing data in localStorage:', error);
      return false;
    }
  },
  
  getItem: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      
      // Try to parse JSON, return as string if it fails
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Error retrieving data from localStorage:', error);
      return defaultValue;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};