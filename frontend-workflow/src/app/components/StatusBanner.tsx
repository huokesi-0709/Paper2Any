import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type StatusType = 'error' | 'success' | 'warning' | 'info';

interface StatusBannerProps {
  type: StatusType;
  message: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function StatusBanner({ type, message, action, dismissible, onDismiss }: StatusBannerProps) {
  const icons = {
    error: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  };

  const styles = {
    error: 'status-error',
    success: 'status-success',
    warning: 'status-warning',
    info: 'bg-blue-500/10 border border-blue-500/30 text-blue-300',
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl ${styles[type]} text-sm`}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-2 text-xs font-medium underline hover:no-underline"
        >
          {action.label}
        </button>
      )}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
}
