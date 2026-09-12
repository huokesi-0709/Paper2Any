import { useMemo, useState } from 'react';
import { ArrowRight, Search, Workflow, ArrowUpRight, FolderClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '../hooks/useNavigate';
import { NAV_LINKS, NAV_GROUPS } from '../navigation';

export function AppHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const agents = useMemo(() => NAV_LINKS.filter((link) =>
    link.group !== 'home' && link.group !== 'data' &&
    (group === 'all' || link.group === group) &&
    `${t(link.labelKey)} ${t(link.descriptionKey)}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [query, group, t]);

  return (
    <div className="page-shell">
      <div className="page-container agent-directory">
        <header className="directory-heading">
          <div>
            <div className="workspace-eyebrow">FIGUREMIND / AGENT WORKSPACE</div>
            <h1>{t('enterprise.homeTitle')}</h1>
            <p>{t('enterprise.homeDescription')}</p>
          </div>
          <button type="button" className="btn-neon-outline" onClick={() => navigate('/files')}><FolderClock size={16} />{t('enterprise.openFiles')}<ArrowUpRight size={14} /></button>
        </header>

        <section className="workspace-start" aria-labelledby="start-title">
          <div className="start-icon"><Workflow size={27} /></div>
          <div className="min-w-0 flex-1">
            <span className="workspace-eyebrow">{t('enterprise.newTask')}</span>
            <h2 id="start-title">{t('enterprise.startTitle')}</h2>
            <p>{t('enterprise.startDescription')}</p>
          </div>
          <button type="button" onClick={() => navigate('/scientific-drawing/model')} className="btn-neon">{t('enterprise.startAction')}<ArrowRight size={16} /></button>
        </section>

        <section aria-labelledby="agents-title">
          <div className="directory-toolbar">
            <div><h2 id="agents-title">{t('enterprise.agents')}</h2><p>{t('enterprise.agentCount', { count: NAV_LINKS.filter((link) => ['drawing', 'tools'].includes(link.group)).length })}</p></div>
            <label className="workspace-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('enterprise.searchAgents')} aria-label={t('enterprise.searchAgents')} /></label>
          </div>
          <div className="directory-tabs" role="group" aria-label={t('enterprise.filter')}>
            {[{ key: 'all', labelKey: 'enterprise.all' }, ...NAV_GROUPS.filter((item) => ['drawing', 'tools'].includes(item.key))].map((item) =>
              <button type="button" key={item.key} aria-pressed={group === item.key} onClick={() => setGroup(item.key)} className={group === item.key ? 'is-active' : ''}>{t(item.labelKey)}</button>
            )}
          </div>
          <div className="agent-list">
            {agents.map((agent, index) => {
              const Icon = agent.icon;
              return <button type="button" key={agent.key} onClick={() => navigate(agent.path)} className="agent-row">
                <span className="agent-icon"><Icon size={22} /></span>
                <span className="agent-info"><strong>{t(agent.labelKey)}</strong><span>{t(agent.descriptionKey)}</span></span>
                <span className="agent-category">{t(NAV_GROUPS.find((item) => item.key === agent.group)!.labelKey)}</span>
                <span className="agent-index">{String(index + 1).padStart(2, '0')}</span>
                <ArrowUpRight size={18} className="agent-arrow" />
              </button>;
            })}
            {agents.length === 0 && <div className="empty-state"><Search size={26} /><p>{t('enterprise.noMatches')}</p></div>}
          </div>
        </section>
        <div className="workspace-guide">
          {['prepare', 'configure', 'review'].map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{t(`enterprise.steps.${step}.title`)}</h3><p>{t(`enterprise.steps.${step}.description`)}</p></div></div>)}
        </div>
      </div>
    </div>
  );
}
