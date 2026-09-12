import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useRuntimeBilling } from '../../hooks/useRuntimeBilling';
import { AuthProvider } from '../../components/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AppShellProps {
  children: React.ReactNode;
  currentPath: string;
}

export function AppShell({
  children,
  currentPath,
}: AppShellProps) {
  const { t } = useTranslation();
  const { userApiConfigRequired } = useRuntimeBilling();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const closeNavigation = useCallback(() => setNavigationOpen(false), []);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setNavigationOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [currentPath]);

  return (
    <AuthProvider>
      <div className="enterprise-workspace isolate flex h-dvh overflow-hidden bg-surface-base font-body text-lab-primary">
        <a className="skip-workspace" href="#workspace-main">{t('enterprise.skip')}</a>

        {/* Left sidebar — permanent, always visible inline */}
        <Sidebar mobileOpen={navigationOpen} onClose={closeNavigation} />

        {/* Main content area */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <TopBar currentPath={currentPath} navigationOpen={navigationOpen} onToggleNavigation={() => setNavigationOpen((open) => !open)} />

          {/* Scrollable content */}
          <main id="workspace-main" tabIndex={-1} ref={mainRef} className="workspace-main relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="workspace-content">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="workspace-footer flex h-8 flex-shrink-0 items-center justify-center border-t border-slate-200/90 bg-white">
            <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
              <span>© {new Date().getFullYear()} FigureMind</span>
              <span className="w-1 h-1 bg-border-medium rounded-full" />
              <span>{t('enterprise.workspace')}</span>
              {!userApiConfigRequired && (
                <span className="text-neon-cyan">{t('app.workspace.managedBilling')}</span>
              )}
            </div>
          </footer>
        </div>
      </div>
    </AuthProvider>
  );
}
