import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string; // e.g. 'text-neon-cyan'
  actions?: ReactNode;
}

export function PageHeader({ badge, title, subtitle, icon: Icon, iconColor = 'text-neon-cyan', actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className={`w-12 h-12 rounded-xl bg-surface-raised/60 border border-border-medium flex items-center justify-center ${iconColor}`}>
              <Icon size={24} />
            </div>
          )}
          <div>
            {badge && (
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="neon-badge">{badge}</span>
              </div>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-1">{title}</h1>
            {subtitle && (
              <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      <div className="neon-divider mt-6" />
    </div>
  );
}
