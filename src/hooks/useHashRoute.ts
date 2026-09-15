import { useCallback, useEffect, useState } from 'react';
import type { Route } from '../types';
import { parseHash, routeToHash } from '../utils/route';

export interface HashRouter {
  route: Route;
  navigate: (route: Route, options?: { replace?: boolean }) => void;
}

/** location.hash と同期する Route 状態（ブラウザの戻る・進む・リロードに対応） */
export function useHashRoute(): HashRouter {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    const hash = routeToHash(next);
    if (options?.replace) {
      window.history.replaceState(null, '', hash);
      setRoute(parseHash(hash));
    } else if (window.location.hash !== hash) {
      // hashchange イベント経由で state が更新される
      window.location.hash = hash;
    } else {
      setRoute(parseHash(hash));
    }
  }, []);

  return { route, navigate };
}
