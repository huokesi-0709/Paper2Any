import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Coins,
  LogIn,
  LogOut,
  RefreshCw,
  Settings,
  User,
  Menu,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useRuntimeBilling } from '../../hooks/useRuntimeBilling';
import { checkQuota, invalidateQuotaCache, type QuotaInfo } from '../../services/quotaService';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { PurchaseEntry } from '../../components/PurchaseEntry';
import { findNavLink } from '../navigation';
import { useNav } from '../nav-context';

interface TopBarProps {
  currentPath: string;
  navigationOpen: boolean;
  onToggleNavigation: () => void;
}

export function TopBar({ currentPath, navigationOpen, onToggleNavigation }: TopBarProps) {
  const { t } = useTranslation();
  const { navigate } = useNav();
  const { user, signOut, refreshQuota } = useAuthStore();
  const { runtimeConfig } = useRuntimeBilling();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const loadQuota = useCallback(async () => {
    const info = await checkQuota(user?.id || null);
    setQuotaInfo(info);
  }, [user?.id]);

  useEffect(() => {
    void loadQuota();
  }, [loadQuota]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleRefreshQuota = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      invalidateQuotaCache(user?.id || null);
      await Promise.all([refreshQuota(), loadQuota()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const breadcrumbs = getBreadcrumbs(currentPath);
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('app.workspace.guest');

  return (
    <header className="workspace-topbar relative z-50 isolate h-14 shrink-0 overflow-visible border-b border-slate-200 bg-white px-3 sm:px-6">
      <div className="flex h-full min-w-0 items-center justify-between gap-3">
        <button type="button" onClick={onToggleNavigation} aria-label={t('app.sidebar.toggle')} aria-expanded={navigationOpen} aria-controls="workspace-navigation" className="toolbar-btn lg:hidden"><Menu size={18} /></button>
        <nav className="hidden min-w-0 items-center gap-2 text-xs font-mono sm:flex" aria-label={t('app.workspace.breadcrumbLabel')}>
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.labelKey} className="flex min-w-0 items-center gap-2">
              {idx > 0 && <span className="text-slate-300">/</span>}
              {crumb.path ? (
                <button
                  type="button"
                  onClick={() => navigate(crumb.path!)}
                  className="truncate text-lab-muted transition-colors duration-200 hover:text-neon-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60"
                >
                  {t(crumb.labelKey)}
                </button>
              ) : (
                <span className="truncate text-lab-secondary">{t(crumb.labelKey)}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!runtimeConfig.user_api_config_required && quotaInfo !== null && (
            <button
              type="button"
              onClick={handleRefreshQuota}
              disabled={isRefreshing}
              className="group flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 text-cyan-700 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 disabled:cursor-wait disabled:opacity-70"
              title={t('app.workspace.refreshQuota')}
              aria-label={t('app.workspace.refreshQuota')}
            >
              <Coins size={15} aria-hidden="true" />
              <span className="text-xs font-semibold font-mono" aria-live="polite">
                {quotaInfo.isUnlimited
                  ? t('app.workspace.quotaUnlimited')
                  : t('app.workspace.quotaPoints', { count: quotaInfo.remaining })}
              </span>
              <RefreshCw
                size={13}
                aria-hidden="true"
                className={`text-cyan-500 transition-all duration-200 group-hover:text-cyan-700 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          )}

          <LanguageSwitcher />

          {runtimeConfig.points_purchase_url && <PurchaseEntry />}

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60 ${
                isUserMenuOpen
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-lab-primary hover:border-blue-200 hover:bg-blue-50/60'
              }`}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-label={t('app.workspace.userMenuLabel')}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neon-cyan/12">
                <User size={13} className="text-neon-cyan" aria-hidden="true" />
              </span>
              <span className="hidden max-w-32 truncate text-sm font-medium lg:block">{displayName}</span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.625rem)] z-50 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white/98 shadow-[0_22px_60px_rgba(15,39,71,0.16)] backdrop-blur-2xl animate-fade-in"
              >
                <div className="border-b border-slate-200 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neon-cyan/20 bg-neon-cyan/10">
                      <User size={16} className="text-neon-cyan" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-lab-primary">{displayName}</p>
                      <p className="truncate text-xs text-lab-muted">{user?.email || t('app.workspace.guestDescription')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-1.5">
                  {user ? (
                    <>
                      <a
                        href="/account"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-lab-secondary transition-colors duration-200 hover:bg-neon-cyan/10 hover:text-lab-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60"
                      >
                        <Settings size={16} className="text-lab-muted" aria-hidden="true" />
                        {t('app.workspace.accountSettings')}
                      </a>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await signOut();
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-lab-secondary transition-colors duration-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                      >
                        <LogOut size={16} aria-hidden="true" />
                        {t('app.workspace.signOut')}
                      </button>
                    </>
                  ) : (
                    <a
                      href="/login"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-lab-secondary transition-colors duration-200 hover:bg-neon-cyan/10 hover:text-lab-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60"
                    >
                      <LogIn size={16} aria-hidden="true" />
                      {t('app.workspace.signIn')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getBreadcrumbs(path: string): { labelKey: string; path?: string }[] {
  const navLink = findNavLink(path);
  if (path === '/') {
    return [{ labelKey: 'app.workspace.nav.home.title' }];
  }

  const breadcrumbs: { labelKey: string; path?: string }[] = [
    { labelKey: 'app.workspace.nav.home.title', path: '/' },
  ];
  breadcrumbs.push({ labelKey: navLink?.labelKey || 'app.workspace.featurePage' });
  return breadcrumbs;
}
