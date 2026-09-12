import { useTranslation } from 'react-i18next';
import Header from './paper2graph/Header';
import BilingualHint from './BilingualHint';
import Paper2DrawioPage from './paper2drawio';
import CasesSection from './CasesSection';

const PROJECT_URL = 'https://github.com/huokesi-0709/FigureMind';

const Paper2DrawioAiPage = () => {
  const { t } = useTranslation('paper2drawio');

  return (
    <Paper2DrawioPage
      initialMode="ai"
      lockMode
      showModePanel={false}
      showHeader={false}
      showBanner={false}
      intro={
        <div className="w-full max-w-6xl mx-auto">
          <Header
            badge={t('subpages.ai.badge')}
            title={t('subpages.ai.title')}
            subtitle={t('subpages.ai.subtitle')}
          />
          <details className="workspace-help">
            <summary>{t('subpages.ai.hintTitle')}</summary>
            <BilingualHint
              title={t('subpages.ai.hintTitle')}
              zh={t('subpages.ai.hintZh')}
              en={t('subpages.ai.hintEn')}
              tone="violet"
            />
          </details>
        </div>
      }
      extraSection={
        <CasesSection
          title={t('cases.title')}
          subtitle={t('cases.subtitle')}
          projectLabel={t('cases.project')}
          projectUrl={PROJECT_URL}
          tone="sky"
          cases={[
            {
              title: t('cases.items.case1Title'),
              description: t('cases.items.case1Desc'),
              image: '/drawIO/流程图demo1.gif',
            },
            {
              title: t('cases.items.case2Title'),
              description: t('cases.items.case2Desc'),
              image: '/drawIO/架构图demo1.gif',
            },
          ]}
        />
      }
    />
  );
};

export default Paper2DrawioAiPage;
