/**
 * 技术路线图 / 实验图生成 — Technical Route & Experiment Diagram page.
 * Uses the `graphType` prop to switch between tech_route and exp_data.
 */
import Paper2FigurePage from '../../../components/paper2graph';
import { useTranslation } from 'react-i18next';
import type { GraphType } from '../../../components/paper2graph/types';

interface TechExpPageProps {
  graphType?: GraphType;
}

export function TechExpPage({ graphType = 'tech_route' }: TechExpPageProps) {
  const { t } = useTranslation('paper2graph');

  const isExpData = graphType === 'exp_data';
  const subpageKey = isExpData ? 'expData' : 'techExp';

  return (
    <Paper2FigurePage
      allowedGraphTypes={['tech_route', 'exp_data']}
      defaultGraphType={graphType}
      header={{
        badge: t(`subpages.${subpageKey}.badge`),
        title: t(`subpages.${subpageKey}.title`),
        subtitle: t(`subpages.${subpageKey}.subtitle`),
      }}
      hint={{
        title: t(`subpages.${subpageKey}.hintTitle`),
        zh: t(`subpages.${subpageKey}.hintZh`),
        en: t(`subpages.${subpageKey}.hintEn`),
        tone: 'sky',
      }}
      exampleTypes={['tech_route', 'exp_data']}
      showBanner={false}
    />
  );
}
