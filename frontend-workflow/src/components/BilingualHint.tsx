import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type HintTone = 'sky' | 'violet' | 'emerald';

// Light theme tones used by the functional-page guidance panel.
const toneMap: Record<HintTone, { accent: string; glow: string; badge: string; icon: string }> = {
  sky: {
    accent: 'border-cyan-200',
    glow: 'from-cyan-50 via-white/30 to-transparent',
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    icon: 'text-cyan-700',
  },
  violet: {
    accent: 'border-blue-200',
    glow: 'from-blue-50 via-white/30 to-transparent',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: 'text-blue-700',
  },
  emerald: {
    accent: 'border-emerald-200',
    glow: 'from-emerald-50 via-white/30 to-transparent',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: 'text-emerald-700',
  },
};

interface BilingualHintProps {
  title: string;
  zh: string;
  en: string;
  tone?: HintTone;
  className?: string;
}


const BilingualHint: React.FC<BilingualHintProps> = ({ title, zh, en, tone = 'sky', className }) => {
  const { i18n } = useTranslation();
  const styles = toneMap[tone] || toneMap.sky;
  const activeDescription = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh') ? zh : en;

  return (
    <aside className={`relative overflow-hidden rounded-2xl border ${styles.accent} bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,39,71,0.05)] ${className || ''}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.glow}`} />
      <div className="relative flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border ${styles.badge}`}>
          <Info size={16} className={styles.icon} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-display text-sm font-semibold text-lab-primary">{title}</p>
          <p className="text-sm leading-6 text-lab-secondary">{activeDescription}</p>
        </div>
      </div>
    </aside>
  );
};

export default BilingualHint;
