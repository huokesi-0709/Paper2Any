import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GraphType } from './types';

interface DemoCardProps {
  title: string;
  desc: string;
  inputImg?: string;
  outputImg?: string;
}

const DemoCard = ({ title, desc, inputImg, outputImg }: DemoCardProps) => {
  return (
    <div className="bento-card p-4 flex flex-col gap-3 hover:border-neon-cyan/40 transition-all duration-300 group">
      <div className="flex gap-2">
        {/* Input */}
        <div className="flex-1 rounded-lg bg-surface-base/60 border border-dashed border-neon-cyan/20 flex items-center justify-center overflow-hidden min-h-[80px]">
          {inputImg ? (
            <img src={inputImg} alt="输入示例图" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-500 font-mono">输入示例图（待替换）</span>
          )}
        </div>
        {/* Output */}
        <div className="flex-1 rounded-lg bg-neon-purple/5 border border-dashed border-neon-purple/20 flex items-center justify-center overflow-hidden min-h-[80px]">
          {outputImg ? (
            <img src={outputImg} alt="PPTX 示例图" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-neon-purple/60 font-mono">PPTX 示例图（待替换）</span>
          )}
        </div>
      </div>
      <div>
        <p className="text-[13px] text-white font-medium mb-1 font-mono">{title}</p>
        <p className="text-[11px] text-slate-400 leading-snug">{desc}</p>
      </div>
    </div>
  );
};

interface ExamplesSectionProps {
  visibleTypes?: GraphType[];
}

const ExamplesSection: React.FC<ExamplesSectionProps> = ({ visibleTypes }) => {
  const { t } = useTranslation('paper2graph');
  const allowed = visibleTypes && visibleTypes.length ? new Set(visibleTypes) : null;
  const examples = [
    {
      type: 'model_arch' as GraphType,
      title: t('examples.cards.paperPdfToFigureTitle'),
      desc: t('examples.cards.paperPdfToFigureDesc'),
      inputImg: '/p2f_paper_pdf_img.png',
      outputImg: '/p2f_paper_pdf_img_2.png',
    },
    {
      type: 'model_arch' as GraphType,
      title: t('examples.cards.figureScreenshotToPptTitle'),
      desc: t('examples.cards.figureScreenshotToPptDesc'),
      inputImg: '/p2f_paper_model_img.png',
      outputImg: '/p2f_paper_modle_img_2.png',
    },
    {
      type: 'model_arch' as GraphType,
      title: t('examples.cards.abstractTextToPptTitle'),
      desc: t('examples.cards.abstractTextToPptDesc'),
      inputImg: '/p2f_paper_content.png',
      outputImg: '/p2f_paper_content_2.png',
    },
    {
      type: 'tech_route' as GraphType,
      title: t('examples.cards.pdfToTechRouteTitle'),
      desc: t('examples.cards.pdfToTechRouteDesc'),
      inputImg: '/p2t_paper_img.png',
      outputImg: '/p2t_paper_img_2.png',
    },
    {
      type: 'tech_route' as GraphType,
      title: t('examples.cards.textToTechRouteTitle'),
      desc: t('examples.cards.textToTechRouteDesc'),
      inputImg: '/p2t_paper_text.png',
      outputImg: '/p2t_paper_text_2.png',
    },
    {
      type: 'exp_data' as GraphType,
      title: t('examples.cards.pdfToExpDataTitle'),
      desc: t('examples.cards.pdfToExpDataDesc'),
      inputImg: '/p2e_paper_1.png',
      outputImg: '/p2e_paper_2.png',
    },
    {
      type: 'exp_data' as GraphType,
      title: t('examples.cards.tableTextToExpDataTitle'),
      desc: t('examples.cards.tableTextToExpDataDesc'),
      inputImg: '/p2f_exp_content_1.png',
      outputImg: '/p2f_exp_content_2.png',
    },
  ];

  const visibleExamples = allowed ? examples.filter(example => allowed.has(example.type)) : examples;

  return (
    <div className="space-y-4 mb-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="section-header text-base">{t('examples.sectionTitle')}</h3>
          <a
            href="https://wcny4qa9krto.feishu.cn/wiki/VXKiwYndwiWAVmkFU6kcqsTenWh"
            target="_blank"
            rel="noopener noreferrer"
            className="neon-chip group"
          >
            <Sparkles size={12} className="text-neon-pink animate-pulse" />
            <span className="text-glow-cyan group-hover:text-glow-purple transition-all">
              {t('examples.feishuLink')}
            </span>
          </a>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {t('examples.sectionSubtitle')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {visibleExamples.map((example) => (
          <DemoCard
            key={`${example.type}-${example.title}`}
            title={example.title}
            desc={example.desc}
            inputImg={example.inputImg}
            outputImg={example.outputImg}
          />
        ))}
      </div>
    </div>
  );
};

export default ExamplesSection;
