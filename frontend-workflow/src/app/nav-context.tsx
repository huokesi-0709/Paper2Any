import { createContext, useContext, ReactNode, useEffect, useState } from 'react';

interface NavContextValue {
  currentPath: string;
  navigate: (path: string) => void;
}

const NavContext = createContext<NavContextValue>({
  currentPath: '/',
  navigate: () => {},
});

export function useNav() {
  return useContext(NavContext);
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return (
    <NavContext.Provider value={{ currentPath, navigate }}>
      {children}
    </NavContext.Provider>
  );
}
