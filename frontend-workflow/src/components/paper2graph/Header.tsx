import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  align?: 'center' | 'left';
}

const Header: React.FC<HeaderProps> = ({ badge, title, subtitle, align = 'center' }) => {
  const { t } = useTranslation('paper2graph');

  const resolvedBadge = badge ?? t('hero.badge');
  const resolvedTitle = title ?? t('hero.title');
  const resolvedSubtitle = subtitle ?? t('hero.subtitle');
  const alignClass = align === 'left' ? 'text-left items-start' : 'text-center items-center';

  return (
    <div className={`mb-8 flex flex-col gap-3 ${alignClass}`}>
      <div className="inline-flex items-center gap-2 neon-badge neon-badge-purple">
        <Sparkles size={12} className="text-glow-purple" />
        <span>{resolvedBadge}</span>
      </div>
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.035em] text-lab-primary md:text-5xl">
        {resolvedTitle}
      </h1>
      <div className="h-1 w-16 rounded-full bg-blue-600" />
      <p className="max-w-2xl text-base leading-7 text-lab-secondary">
        {resolvedSubtitle}
      </p>
    </div>
  );
};

export default Header;
