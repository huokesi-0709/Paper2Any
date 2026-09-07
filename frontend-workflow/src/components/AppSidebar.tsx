import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Sparkles,
  Flame,
  Image,
  BrainCircuit,
  FolderOpen,
  Network,
  Wand2,
  ChevronDown,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  labelKey: string;
  tooltipKey: string;
  icon: any;
  color: string;
  hot?: boolean;
  children?: {
    id: string;
    labelKey: string;
    tooltipKey: string;
    icon: any;
    color: string;
  }[];
}

interface AppSidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

/**
 * 永久可见的左侧导航栏（内联布局，非抽屉）。
 * paper2figure 子项默认展开，整体随内容区一起滚动。
 */
export const AppSidebar = ({ activePage, onPageChange }: AppSidebarProps) => {
  const { t } = useTranslation('common');

  const paper2figureChildren = useMemo(() => ([
    {
      id: 'paper2figure-model-drawio',
      labelKey: t('app.navSub.paper2figureModelDrawio'),
      tooltipKey: t('app.navSubTooltip.paper2figureModelDrawio'),
      icon: Wand2,
      color: 'emerald',
    },
    {
      id: 'paper2figure-tech-exp',
      labelKey: t('app.navSub.paper2figureTechExp'),
      tooltipKey: t('app.navSubTooltip.paper2figureTechExp'),
      icon: Sparkles,
      color: 'cyan',
    },
    {
      id: 'paper2drawio-ai',
      labelKey: t('app.navSub.paper2drawioAi'),
      tooltipKey: t('app.navSubTooltip.paper2drawioAi'),
      icon: Network,
      color: 'purple',
    },
  ]), [t]);

  // 子项默认展开（若 paper2figure 任一子页激活，则强制展开）
  const paper2figureActive = paper2figureChildren.some(child => child.id === activePage);
  const [paper2figureExpanded, setPaper2figureExpanded] = useState<boolean>(true);

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      labelKey: t('app.nav.home'),
      tooltipKey: t('app.navTooltip.home'),
      icon: Home,
      color: 'slate',
    },
    {
      id: 'paper2figure',
      labelKey: t('app.nav.paper2figure'),
      tooltipKey: t('app.navTooltip.paper2figure'),
      icon: Sparkles,
      color: 'cyan',
      children: paper2figureChildren,
    },
    {
      id: 'image-playground',
      labelKey: t('app.nav.imagePlayground'),
      tooltipKey: t('app.navTooltip.imagePlayground'),
      icon: Flame,
      color: 'pink',
      hot: true,
    },
    {
      id: 'mindmap',
      labelKey: t('app.nav.mindmap'),
      tooltipKey: t('app.navTooltip.mindmap'),
      icon: BrainCircuit,
      color: 'purple',
    },
    {
      id: 'image2drawio',
      labelKey: t('app.nav.image2drawio'),
      tooltipKey: t('app.navTooltip.image2drawio'),
      icon: Image,
      color: 'amber',
    },
    {
      id: 'files',
      labelKey: t('app.nav.files'),
      tooltipKey: t('app.navTooltip.files'),
      icon: FolderOpen,
      color: 'emerald',
    },
  ];

  const handleNavigation = (pageId: string) => {
    onPageChange(pageId);
  };

  /* ── Active state styles per color ── */
  const getActiveStyle = (color: string) => {
    const map: Record<string, string> = {
      cyan: 'bg-[linear-gradient(135deg,rgba(0,212,255,0.25),rgba(0,212,255,0.1))] border-neon-cyan/25 text-neon-cyan shadow-[0_0_20px_rgba(0,212,255,0.1)]',
      purple: 'bg-[linear-gradient(135deg,rgba(168,85,247,0.25),rgba(168,85,247,0.1))] border-neon-purple/25 text-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.1)]',
      pink: 'bg-[linear-gradient(135deg,rgba(236,72,153,0.25),rgba(236,72,153,0.1))] border-neon-pink/25 text-neon-pink shadow-[0_0_20px_rgba(236,72,153,0.1)]',
      emerald: 'bg-[linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.08))] border-emerald-500/20 text-emerald-400',
      amber: 'bg-[linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.08))] border-amber-500/20 text-amber-400',
      slate: 'bg-[linear-gradient(135deg,rgba(148,163,184,0.15),rgba(148,163,184,0.05))] border-slate-500/15 text-slate-300',
    };
    return map[color] || map.slate;
  };

  const getInactiveStyle = () =>
    'text-lab-muted bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] hover:text-lab-primary';

  return (
    <aside className="h-full w-[280px] shrink-0 glass-strong border-r border-white/[0.06] flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.04]">
        <h2 className="font-display text-base font-bold tracking-tight text-white">
          {t('app.sidebar.navigation')}
        </h2>
      </div>

      {/* Navigation — 永久可见，超出则自身滚动 */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isGroup = !!item.children?.length;
          const isGroupActive = isGroup && item.children!.some(c => c.id === activePage);
          const expanded = isGroup ? paper2figureExpanded : false;

          const button = (
            <button
              onClick={() => {
                if (isGroup) {
                  setPaper2figureExpanded(v => !v);
                  return;
                }
                handleNavigation(item.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-expo-out active:scale-[0.98] ${
                (isGroup ? isGroupActive : activePage === item.id)
                  ? getActiveStyle(item.color)
                  : getInactiveStyle()
              }`}
            >
              <Icon size={19} className="shrink-0" />
              <span className="text-sm font-medium flex-1 text-left truncate">{item.labelKey}</span>
              {item.hot && (
                <span className="rounded-md bg-neon-pink/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-neon-pink border border-neon-pink/20">
                  HOT
                </span>
              )}
              {isGroup && (
                <ChevronDown
                  size={15}
                  className={`opacity-60 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
              )}
            </button>
          );

          return (
            <div key={item.id} className="mb-1.5">
              {button}

              {/* 子项内联展开 */}
              {isGroup && expanded && (
                <div className="mt-1.5 ml-3 pl-3 border-l border-white/[0.06] space-y-1.5">
                  {item.children!.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = activePage === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => handleNavigation(child.id)}
                        title={child.tooltipKey}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ease-expo-out active:scale-[0.98] ${
                          isChildActive
                            ? getActiveStyle(child.color)
                            : getInactiveStyle()
                        }`}
                      >
                        <ChildIcon size={16} className="shrink-0" />
                        <span className="text-[13px] font-medium truncate">{child.labelKey}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default AppSidebar;
