import { useEffect, useRef, useCallback } from 'preact/hooks';
import { fetchStatus } from '../api/client.js';

export function useRobotStatus(wsConnected) {
  const statusRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const listenersRef = useRef(new Set());

  const subscribe = useCallback((callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  const notifyListeners = useCallback((status) => {
    listenersRef.current.forEach(cb => cb(status));
  }, []);

  const fetch = useCallback(async () => {
    try {
      const data = await fetchStatus();
      statusRef.current = data;
      notifyListeners(data);
    } catch (err) {
      console.error('Failed to fetch robot status:', err);
    }
  }, [notifyListeners]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, wsConnected ? 2000 : 1000);
    return () => clearInterval(interval);
  }, [fetch, wsConnected]);

  return {
    status: statusRef.current,
    subscribe,
    refresh: fetch,
  };
}
