import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

/**
 * Simple client-side router for Paper2Any.
 * Supports SPA navigation via history.pushState + popstate.
 */

export interface RouteRecord {
  path: string;
  element: ReactNode;
  label: string;
  icon?: React.ElementType;
}

interface RouterContextValue {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
}

interface RouterProviderProps {
  routes: RouteRecord[];
  fallbackPath?: string;
}

export function RouterProvider({ routes, fallbackPath = '/' }: RouterProviderProps) {
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const navigate = useCallback((path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, [currentPath]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const matchedRoute = routes.find((r) => r.path === currentPath) ||
    routes.find((r) => r.path === fallbackPath);

  const value: RouterContextValue = {
    currentPath,
    navigate,
  };

  return (
    <RouterContext.Provider value={value}>
      {matchedRoute ? matchedRoute.element : (
        <div className="p-8 text-center text-text-muted">
          页面未找到
        </div>
      )}
    </RouterContext.Provider>
  );
}

/** Hook for components that need the current path without navigation */
export function useLocation() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    return { currentPath: typeof window !== 'undefined' ? window.location.pathname : '/' };
  }
  return { currentPath: ctx.currentPath };
}
