/**
 * 首页总览 — Neon Lab Bento Grid 重设计
 */
import { useNavigate } from '../hooks/useNavigate';
import { NAV_LINKS, NAV_GROUPS } from '../navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Boxes,
  Brain,
  FileImage,
  FlaskConical,
  FolderClock,
  ImagePlus,
  Route,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

// 功能卡片定义
const FEATURE_CARDS = [
  {
    key: 'scientific-drawing-model',
    title: '模型结构图生成',
    description: '从论文或文本自动生成神经网络模型结构图',
    translationKey: 'model',
    icon: 'Boxes',
    group: 'drawing',
    size: 'md',
    accent: 'neon-purple',
  },
  {
    key: 'scientific-drawing-tech',
    title: '技术路线图生成',
    description: '生成 SVG + PPT 技术路线图，支持 5 种配色模板',
    translationKey: 'tech',
    icon: 'Route',
    group: 'drawing',
    size: 'md',
    accent: 'neon-purple',
  },
  {
    key: 'scientific-drawing-experiment',
    title: '实验图生成',
    description: '从论文或文本生成实验结果可视化图',
    translationKey: 'experiment',
    icon: 'FlaskConical',
    group: 'drawing',
    size: 'sm',
    accent: 'neon-purple',
  },
  {
    key: 'scientific-drawing-flow',
    title: '流程图/架构图生成',
    description: '从文本或 PDF 生成 DrawIO 流程图与架构图',
    translationKey: 'flow',
    icon: 'Workflow',
    group: 'drawing',
    size: 'lg',
    accent: 'neon-purple',
  },
  {
    key: 'image-playground',
    title: '生图模型体验',
    description: '多模型批量图片生成，支持 16 张并行',
    translationKey: 'imagePlayground',
    icon: 'ImagePlus',
    group: 'tools',
    size: 'md',
    accent: 'neon-pink',
  },
  {
    key: 'mindmap',
    title: '思维导图',
    description: '从文本或论文生成交互式思维导图',
    translationKey: 'mindmap',
    icon: 'Brain',
    group: 'tools',
    size: 'md',
    accent: 'neon-pink',
  },
  {
    key: 'image2drawio',
    title: '图片转 DrawIO',
    description: '将图片智能转换为可编辑的 DrawIO 图表',
    translationKey: 'image2drawio',
    icon: 'ImageToDrawio',
    group: 'tools',
    size: 'sm',
    accent: 'neon-pink',
  },
  {
    key: 'files',
    title: '我的历史文件',
    description: '浏览、下载和管理历史生成的文件',
    translationKey: 'files',
    icon: 'FolderClock',
    group: 'data',
    size: 'sm',
    accent: 'amber-400',
  },
];

const iconMap: Record<string, LucideIcon> = {
  Boxes,
  Route,
  FlaskConical,
  Workflow,
  ImagePlus,
  Brain,
  ImageToDrawio: FileImage,
  FolderClock,
};

const groupColorMap: Record<string, { bg: string; text: string; border: string }> = {
  home: {
    bg: 'bg-neon-cyan/10',
    text: 'text-neon-cyan',
    border: 'border-neon-cyan/30',
  },
  drawing: {
    bg: 'bg-neon-purple/10',
    text: 'text-neon-purple',
    border: 'border-neon-purple/30',
  },
  tools: {
    bg: 'bg-neon-pink/10',
    text: 'text-neon-pink',
    border: 'border-neon-pink/30',
  },
  data: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
};

function HomePageCard({ card }: { card: (typeof FEATURE_CARDS)[number] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groupInfo = groupColorMap[card.group] || groupColorMap.home;
  const Icon = iconMap[card.icon] || iconMap.Boxes;

  return (
    <button
      onClick={() => navigate(card.key === 'files' ? '/files' : `/${card.key === 'scientific-drawing-model' ? 'scientific-drawing/model' : card.key === 'scientific-drawing-tech' ? 'scientific-drawing/tech' : card.key === 'scientific-drawing-experiment' ? 'scientific-drawing/experiment' : card.key === 'scientific-drawing-flow' ? 'scientific-drawing/flow' : card.key}`)}
      className={`
        relative group w-full text-left
        cursor-pointer overflow-hidden rounded-2xl border bg-white p-6
        text-left transition-all duration-200
        hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40
        hover:shadow-[0_16px_36px_rgba(37,99,235,0.1)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60
        ${groupInfo.border} ${groupInfo.bg}
      `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`
            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
            ${groupInfo.bg} ${groupInfo.text}
            border border-current/10 group-hover:scale-105 transition-transform duration-200
          `}
        >
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-lab-primary mb-1 group-hover:text-blue-700 transition-colors">
            {t(`app.workspace.nav.${card.translationKey}.title`, { defaultValue: card.title })}
          </h3>
          <p className="text-sm text-lab-secondary line-clamp-2">
            {t(`app.workspace.nav.${card.translationKey}.description`, { defaultValue: card.description })}
          </p>
        </div>
      </div>

      <div className={`absolute bottom-4 right-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${groupInfo.text}`}>
        <ArrowUpRight size={16} aria-hidden="true" />
      </div>
    </button>
  );
}

function QuickStats() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,39,71,0.05)] md:grid-cols-4 md:divide-x md:divide-slate-200">
      <div className="border-b border-r border-slate-200 p-5 text-center md:border-b-0">
        <div className="text-2xl font-display font-bold text-neon-cyan mb-1">14+</div>
        <div className="text-xs font-mono text-lab-muted">{t('app.workspace.home.stats.workflows')}</div>
      </div>
      <div className="border-b border-slate-200 p-5 text-center md:border-b-0 md:border-r-0">
        <div className="text-2xl font-display font-bold text-neon-purple mb-1">4</div>
        <div className="text-xs font-mono text-lab-muted">{t('app.workspace.home.stats.stages')}</div>
      </div>
      <div className="border-r border-slate-200 p-5 text-center md:border-r-0">
        <div className="text-2xl font-display font-bold text-neon-pink mb-1">16</div>
        <div className="text-xs font-mono text-lab-muted">{t('app.workspace.home.stats.batch')}</div>
      </div>
      <div className="p-5 text-center">
        <div className="text-2xl font-display font-bold text-cyan-700 mb-1">1</div>
        <div className="text-xs font-mono text-lab-muted">{t('app.workspace.home.stats.agent')}</div>
      </div>
    </div>
  );
}

export function AppHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="page-shell pb-12">
      <div className="bg-grid-dense pointer-events-none absolute inset-0 opacity-25" />

      <div className="page-container relative">
        {/* Hero Section */}
        <section className="max-w-3xl py-10 md:py-14">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/[0.07] px-3 py-1 text-xs font-mono text-neon-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              {t('app.workspace.home.badge')}
            </span>
          </div>
          <h1 className="mb-3 font-display text-4xl font-bold tracking-[-0.035em] text-lab-primary md:text-5xl">
            {t('app.workspace.home.title')}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-lab-secondary md:text-lg">
            {t('app.workspace.home.subtitle')}
          </p>
        </section>

        {/* Quick Stats */}
        <section className="mb-12">
          <QuickStats />
        </section>

        {/* Feature Cards — Bento Grid */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold text-lab-primary mb-6 flex items-center gap-3">
            <span className="w-6 h-px bg-neon-cyan" />
            {t('app.workspace.home.allFeatures')}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {FEATURE_CARDS.map((card) => (
              <HomePageCard key={card.key} card={card} />
            ))}
          </div>
        </section>

        {/* Navigation Groups */}
        <section>
          <h2 className="font-display text-xl font-semibold text-lab-primary mb-6 flex items-center gap-3">
            <span className="w-6 h-px bg-neon-purple" />
            {t('app.workspace.home.navigation')}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NAV_GROUPS.map((group) => {
              const links = NAV_LINKS.filter((l) => l.group === group.key);
              if (links.length === 0) return null;

              return (
                <div key={group.key} className="bento-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`
                        w-8 h-8 rounded-lg flex items-center justify-center
                        ${groupColorMap[group.key]?.bg || 'bg-neon-cyan/10'}
                      `}
                    >
                      <group.icon size={16} className={groupColorMap[group.key]?.text || 'text-neon-cyan'} />
                    </div>
                    <h3 className="font-display font-semibold text-lab-primary">{t(group.labelKey)}</h3>
                  </div>
                  <div className="space-y-2">
                    {links.map((link) => (
                      <button
                        key={link.key}
                        onClick={() => navigate(link.path)}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 rounded-lg
                          text-sm text-lab-secondary hover:text-lab-primary
                          hover:bg-surface-raised transition-all
                        `}
                      >
                        <link.icon size={14} />
                        <span>{t(link.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
