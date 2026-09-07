import React from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DemoCardProps {
  title: string;
  desc: string;
  inputImg?: string;
  outputImg?: string;
}

const DemoCard = ({ title, desc, inputImg, outputImg }: DemoCardProps) => {
  return (
    <div className="bento-card scan-line p-5">
      <div className="flex gap-3 mb-3">
        {/* 左侧：输入示例图片 */}
        <div className="flex-1 rounded-xl border border-border-medium bg-surface-base/30 flex items-center justify-center min-h-[120px] overflow-hidden">
          {inputImg ? (
            <img
              src={inputImg}
              alt="输入示例图"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-xs text-slate-500">输入示例图（待替换）</span>
          )}
        </div>
        {/* 右侧：输出 Drawio 示例图片 */}
        <div className="flex-1 rounded-xl border border-dashed border-neon-cyan/30 bg-neon-cyan/5 flex items-center justify-center min-h-[120px] overflow-hidden">
          {outputImg ? (
            <img
              src={outputImg}
              alt="Drawio 示例图"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-xs text-neon-cyan/60">Drawio 示例图（待替换）</span>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-white mb-1">{title}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

const ExamplesSection = () => {
  const { t } = useTranslation('paper2drawio');

  return (
    <div className="relative z-0 mt-8 pb-4">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-display font-bold text-white">{t('examples.sectionTitle')}</h3>
          <a
            href="https://wcny4qa9krto.feishu.cn/wiki/VXKiwYndwiWAVmkFU6kcqsTenWh"
            target="_blank"
            rel="noopener noreferrer"
            className="neon-chip inline-flex items-center gap-2 text-xs font-medium"
          >
            <Sparkles size={12} className="text-neon-cyan animate-pulse" />
            <span className="text-neon-cyan">{t('examples.feishuLink')}</span>
            <ExternalLink size={10} className="text-neon-cyan/50" />
          </a>
        </div>
        <span className="text-xs text-slate-400">
          {t('examples.sectionSubtitle')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DemoCard
          title={t('examples.cards.pdfToDiagramTitle')}
          desc={t('examples.cards.pdfToDiagramDesc')}
        />
        <DemoCard
          title={t('examples.cards.textToDiagramTitle')}
          desc={t('examples.cards.textToDiagramDesc')}
        />
      </div>
    </div>
  );
};

export default ExamplesSection;
