import { NAV_GROUPS, NAV_LINKS, NavLink as NavLinkType } from '../navigation';
import { useNav } from '../nav-context';
import { Command, X, PanelLeftClose } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  /** Optional extra className for layout flexibility */
  className?: string;
  mobileOpen: boolean;
  onClose: () => void;
}

function SidebarItem({
  link,
  label,
  isActive,
  onClick,
}: {
  link: NavLinkType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = link.icon;

  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`
        group relative flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60
        ${isActive
          ? 'border-blue-100 bg-blue-50 text-blue-700'
          : 'border-transparent text-lab-secondary hover:border-slate-200 hover:bg-slate-50 hover:text-lab-primary'}
      `}
      title={label}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-current" />
      )}
      <Icon size={18} className="flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export function Sidebar({ className = '', mobileOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { currentPath, navigate } = useNav();
  const asideRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    asideRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const buttons = asideRef.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [mobileOpen, onClose]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
    {mobileOpen && <button type="button" className="navigation-backdrop" onClick={onClose} aria-label={t('enterprise.closeNavigation')} />}
    <aside
      ref={asideRef}
      id="workspace-navigation"
      aria-label={t('enterprise.navigation')}
      className={`
        workspace-sidebar ${mobileOpen ? 'is-open' : ''} relative z-30 flex flex-col
        w-60 shrink-0
        bg-white border-r border-slate-200
        h-full
        ${className}
      `}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 flex-shrink-0 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Command size={19} />
        </div>
        <span className="font-display font-bold text-lg text-text-primary">FigureMind</span>
        <button type="button" onClick={onClose} className="toolbar-btn ml-auto lg:hidden" aria-label={t('enterprise.closeNavigation')}><X size={16} /></button>
      </div>

      {/* Mobile hamburger (only visible on small screens) */}
      <div className="mx-3 mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="text-xs font-semibold text-slate-800">{t('enterprise.workspace')}</div>
        <div className="mt-1 text-[11px] text-slate-500">{t('enterprise.workspaceScope')}</div>
      </div>

      {/* Navigation — permanent, always fully visible, scrolls vertically */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
        {NAV_GROUPS.map((group) => {
          const groupLinks = NAV_LINKS.filter((l) => l.group === group.key);
          if (groupLinks.length === 0) return null;

          if (group.key === 'home' && groupLinks.length === 1) {
            const link = groupLinks[0];
            return (
              <SidebarItem
                key={group.key}
                link={link}
                label={t(link.labelKey)}
                isActive={currentPath === link.path}
                onClick={() => handleNavigate(link.path)}
              />
            );
          }

          return (
            <div key={group.key} className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">
                <group.icon size={14} className={group.accent} />
                <span>{t(group.labelKey)}</span>
              </div>
              {groupLinks.map((link) => (
                  <SidebarItem
                    key={link.key}
                    link={link}
                    label={t(link.labelKey)}
                  isActive={currentPath === link.path}
                  onClick={() => handleNavigate(link.path)}
                />
              ))}
            </div>
          );
        })}
      </nav>
      <div className="mx-4 mb-5 flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500"><PanelLeftClose size={15} className="mt-0.5 shrink-0" /><span>{t('enterprise.sidebarHint')}</span></div>
    </aside>
    </>
  );
}
