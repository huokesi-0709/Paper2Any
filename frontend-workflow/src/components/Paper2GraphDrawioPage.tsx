import { useTranslation } from 'react-i18next';
import Paper2GraphPage from './paper2graph';
import CasesSection from './CasesSection';

const PROJECT_URL = 'https://github.com/huokesi-0709/FigureMind';

const Paper2GraphDrawioPage = () => {
  const { t } = useTranslation('paper2graph');

  return (
    <Paper2GraphPage
      allowedGraphTypes={['model_arch']}
      defaultGraphType="model_arch"
      enableDrawio
      drawioLabel={t('subpages.modelDrawio.drawioButton')}
      showDrawioEmpty
      header={{
        badge: t('subpages.modelDrawio.badge'),
        title: t('subpages.modelDrawio.title'),
        subtitle: t('subpages.modelDrawio.subtitle'),
      }}
      hint={{
        title: t('subpages.modelDrawio.hintTitle'),
        zh: t('subpages.modelDrawio.hintZh'),
        en: t('subpages.modelDrawio.hintEn'),
        tone: 'emerald',
      }}
      showExamples={false}
      showBanner={false}
      extraSection={
        <CasesSection
          title={t('cases.title')}
          subtitle={t('cases.subtitle')}
          projectLabel={t('cases.project')}
          projectUrl={PROJECT_URL}
          tone="emerald"
          cases={[
            {
              title: t('cases.items.case1Title'),
              description: t('cases.items.case1Desc'),
              image: '/drawIO/模型架构图1.png',
            },
            {
              title: t('cases.items.case2Title'),
              description: t('cases.items.case2Desc'),
              image: '/drawIO/模型架构图2.png',
            },
          ]}
        />
      }
    />
  );
};

export default Paper2GraphDrawioPage;
