/**
 * 模型结构图生成 — Model Architecture Diagram page.
 * Wraps Paper2FigurePage configured for model_arch diagrams.
 */
import Paper2FigurePage from '../../../components/paper2graph';
import { useTranslation } from 'react-i18next';

export function ModelArchPage() {
  const { t } = useTranslation('paper2graph');

  return (
    <Paper2FigurePage
      allowedGraphTypes={['model_arch']}
      defaultGraphType="model_arch"
      header={{
        badge: t('subpages.modelArch.badge'),
        title: t('subpages.modelArch.title'),
        subtitle: t('subpages.modelArch.subtitle'),
      }}
      hint={{
        title: t('subpages.modelArch.hintTitle'),
        zh: t('subpages.modelArch.hintZh'),
        en: t('subpages.modelArch.hintEn'),
        tone: 'violet',
      }}
      exampleTypes={['model_arch']}
      showBanner={false}
    />
  );
}
