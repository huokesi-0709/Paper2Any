import { Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_LLM_API_URL, getPurchaseUrl } from '../config/api';
import { useRuntimeBilling } from '../hooks/useRuntimeBilling';
import QRCodeTooltip from './QRCodeTooltip';

export function PurchaseEntry() {
  const { t } = useTranslation('common');
  const { runtimeConfig } = useRuntimeBilling();

  if (runtimeConfig.billing_mode !== 'free') {
    return null;
  }

  const purchaseUrl =
    runtimeConfig.points_purchase_url?.trim()
    || getPurchaseUrl(runtimeConfig.managed_api_url || DEFAULT_LLM_API_URL);

  if (!purchaseUrl) {
    return null;
  }

  return (
    <QRCodeTooltip>
      <a
        href={purchaseUrl}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-sm text-blue-700 transition-all duration-200 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 sm:px-3"
        title={t('app.purchaseMore')}
        aria-label={t('app.purchaseMore')}
      >
        <Coins size={16} className="text-blue-500 transition-transform duration-200 group-hover:scale-110" />
        <span className="hidden whitespace-nowrap sm:inline">{t('app.purchaseMore')}</span>
      </a>
    </QRCodeTooltip>
  );
}
