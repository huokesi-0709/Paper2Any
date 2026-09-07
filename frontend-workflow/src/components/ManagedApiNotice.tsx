import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useRuntimeBilling } from '../hooks/useRuntimeBilling';
import { resolvePointsPurchaseUrl } from '../utils/pointsMessaging';

interface ManagedApiNoticeProps {
  className?: string;
  title?: string;
  description?: string;
}

const ManagedApiNotice: React.FC<ManagedApiNoticeProps> = ({
  className = '',
  title,
  description,
}) => (
  <ManagedApiNoticeBody className={className} title={title} description={description} />
);

const ManagedApiNoticeBody: React.FC<ManagedApiNoticeProps> = ({
  className = '',
  title,
  description,
}) => {
  const { t } = useTranslation('common');
  const { runtimeConfig } = useRuntimeBilling();
  const purchaseUrl = runtimeConfig.billing_mode === 'free'
    ? resolvePointsPurchaseUrl(runtimeConfig)
    : '';
  const resolvedTitle = title || t('app.managedApiNotice.title');
  const resolvedDescription = description || t(
    purchaseUrl
      ? 'app.managedApiNotice.descriptionWithPurchase'
      : 'app.managedApiNotice.descriptionWithoutPurchase',
  );

  return (
    <div className={`rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">{resolvedTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-700">{resolvedDescription}</p>
          {runtimeConfig.billing_mode === 'free' && purchaseUrl && (
            <a
              href={purchaseUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-900"
            >
              <span>{t('app.managedApiNotice.purchaseLink')}</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagedApiNotice;
