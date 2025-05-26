import { useCallback } from 'react';

const KEY = 'moviePickCount';

export function usePickCounter() {
  const inc = useCallback(() => {
    const n = Number(localStorage.getItem(KEY) ?? 0) + 1;
    localStorage.setItem(KEY, n.toString());
    return n;
  }, []);

  const reset = useCallback(() => {
    localStorage.setItem(KEY, '0');
  }, []);

  const current = useCallback(() => {
    return Number(localStorage.getItem(KEY) ?? 0);
  }, []);

  return { inc, reset, current };
}