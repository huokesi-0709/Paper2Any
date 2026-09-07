import { useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { checkQuota, recordUsage, QuotaInfo } from '../../services/quotaService';
import { useRuntimeBilling } from '../../hooks/useRuntimeBilling';
import { buildInsufficientPointsMessage, isInsufficientPointsError } from '../../utils/pointsMessaging';

export interface UseQuotaGuardReturn {
  check: (cost: number, action: string) => Promise<QuotaInfo | null>;
  consume: (workflowType: string, amount?: number) => Promise<boolean>;
  quota: QuotaInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook that wraps quota checking + consumption logic.
 * Returns a structured API for components to validate before running workflows.
 */
export function useQuotaGuard(): UseQuotaGuardReturn {
  const { user } = useAuthStore();
  const { runtimeConfig } = useRuntimeBilling();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  const refresh = useCallback(async () => {
    const info = await checkQuota(user?.id || null);
    setQuota(info);
  }, [user?.id]);

  const check = useCallback(async (cost: number, action: string): Promise<QuotaInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const info = await checkQuota(user?.id || null);
      setQuota(info);
      if (info.remaining < cost) {
        const purchaseUrl = runtimeConfig.points_purchase_url;
        setError(buildInsufficientPointsMessage(cost, info.remaining, action, purchaseUrl));
        return null;
      }
      return info;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, runtimeConfig.points_purchase_url]);

  const consume = useCallback(async (workflowType: string, amount: number = 1): Promise<boolean> => {
    try {
      await recordUsage(user?.id || null, workflowType, { amount });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isInsufficientPointsError(msg)) {
        setError(msg);
      }
      return false;
    }
  }, [user?.id]);

  return { check, consume, quota, loading, error, refresh };
}
