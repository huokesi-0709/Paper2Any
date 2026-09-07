import React from 'react';
import { Github, Star, ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BannerProps {
  show: boolean;
  onClose: () => void;
  stars: {
    dataflow: number | null;
    agent: number | null;
    dataflex: number | null;
  };
}

const Banner: React.FC<BannerProps> = ({ show, onClose, stars }) => {
  const { t } = useTranslation('common');
  if (!show) return null;

  const projects = [
    {
      name: 'DataFlow',
      href: 'https://github.com/OpenDCAI/DataFlow',
      stars: stars.dataflow,
      tag: 'HOT',
      tagColor: 'text-neon-pink shadow-[0_0_10px_rgba(236,73,153,0.6)] bg-neon-pink/10',
    },
    {
      name: 'Paper2Any',
      href: 'https://github.com/OpenDCAI/Paper2Any',
      stars: stars.agent,
      tag: 'NEW',
      tagColor: 'text-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.6)] bg-neon-cyan/10',
    },
    {
      name: 'DataFlex',
      href: 'https://github.com/OpenDCAI/DataFlex',
      stars: stars.dataflex,
      tag: 'NEW',
      tagColor: 'text-neon-purple shadow-[0_0_10px_rgba(167,139,250,0.6)] bg-neon-purple/10',
    },
  ];

  return (
    <div className="w-full relative overflow-hidden bg-surface-base/90 border-b border-border-medium">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.06),transparent_48%),radial-gradient(circle_at_100%_50%,rgba(167,139,250,0.05),transparent_48%)]" />

      <div className="relative max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <a
            href="https://github.com/OpenDCAI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border-medium bg-surface-base/60 px-3 py-1 text-xs font-medium text-white hover:border-neon-cyan/40 transition-colors"
          >
            <Star size={14} className="text-neon-cyan fill-neon-cyan animate-pulse" />
            <span>{t('app.githubProject')}</span>
            <ExternalLink size={10} className="text-neon-cyan/60" />
          </a>

          <span className="text-sm font-medium text-slate-300">
            {t('app.exploreMore')}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-medium bg-surface-base/60 text-xs font-medium text-white hover:border-neon-cyan/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
            >
              <Github size={14} className="text-neon-cyan/70" />
              <span>{project.name}</span>
              <span className="inline-flex items-center gap-0.5 rounded-full border border-border-medium bg-black/30 px-1.5 py-0.5 text-[10px] text-slate-300">
                <Star size={8} fill="currentColor" className="text-neon-cyan" />
                {project.stars || 'Star'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${project.tagColor}`}>
                {project.tag}
              </span>
            </a>
          ))}

          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-base/80 rounded-full transition-colors text-slate-400 hover:text-white"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;
