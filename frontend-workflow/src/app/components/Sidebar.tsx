import { NAV_GROUPS, NAV_LINKS, NavLink as NavLinkType } from '../navigation';
import { useNav } from '../nav-context';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  /** Optional extra className for layout flexibility */
  className?: string;
  /** Callback to open the mobile sidebar (optional — for mobile hamburger) */
  onMobileMenuClick?: () => void;
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
          ? `${link.accent} border-blue-200 bg-blue-50 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.02)]`
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

export function Sidebar({ className = '', onMobileMenuClick }: SidebarProps) {
  const { t } = useTranslation();
  const { currentPath, navigate } = useNav();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <aside
      className={`
        relative z-30 flex flex-col
        w-64 shrink-0
        bg-white/95 backdrop-blur-xl border-r border-slate-200/90
        h-full
        ${className}
      `}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-slate-200/90 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple shadow-[0_8px_24px_rgba(79,124,255,0.2)]">
          <span className="font-display font-bold text-sm text-white">P2A</span>
        </div>
        <span className="font-display font-bold text-lg text-text-primary">FigureMind</span>
      </div>

      {/* Mobile hamburger (only visible on small screens) */}
      {onMobileMenuClick && (
        <div className="lg:hidden p-2 border-b border-border-medium flex-shrink-0">
          <button
            onClick={onMobileMenuClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border-medium text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/40 transition-all"
            title={t('app.sidebar.toggle')}
          >
            <Menu size={18} />
            <span className="text-xs font-mono">{t('app.sidebar.toggle')}</span>
          </button>
        </div>
      )}

      {/* Navigation — permanent, always fully visible, scrolls vertically */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
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
    </aside>
  );
}
