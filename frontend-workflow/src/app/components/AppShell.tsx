import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useRuntimeBilling } from '../../hooks/useRuntimeBilling';
import { AuthProvider } from '../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

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

  return (
    <AuthProvider>
      <div className="isolate flex h-screen overflow-hidden bg-surface-base font-body text-lab-primary">
        {/* Background grid */}
        <div className="pointer-events-none fixed inset-0 bg-grid-dense opacity-55" />

        {/* Left sidebar — permanent, always visible inline */}
        <Sidebar />

        {/* Main content area */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <TopBar currentPath={currentPath} />

          {/* Scrollable content */}
          <main className="relative z-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="page-container">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="flex h-12 flex-shrink-0 items-center justify-center border-t border-slate-200/90 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
              <span>© {new Date().getFullYear()} FigureMind</span>
              <span className="w-1 h-1 bg-border-medium rounded-full" />
              <span>{t('app.workspace.footerVersion')}</span>
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
