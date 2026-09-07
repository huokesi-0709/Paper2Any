/**
 * PointsDisplay component showing user's points balance or remaining quota.
 *
 * Displays:
 * - Points balance for authenticated users
 * - "∞" if Supabase is not configured (unlimited local usage)
 */

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { Coins, Loader2 } from "lucide-react";

export function PointsDisplay() {
  const { user, quota, refreshQuota } = useAuthStore();
  
  useEffect(() => {
    // Initial fetch
    refreshQuota();

    // Refresh every 60 seconds
    const interval = setInterval(refreshQuota, 60000);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshQuota();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshQuota]);

  // Show loading state if quota hasn't been fetched yet
  if (!quota) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border-medium bg-surface-base/20 px-2 py-1.5 sm:px-3">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-xs text-slate-400 sm:text-sm font-mono">...</span>
      </div>
    );
  }

  const isUnlimited = quota.isUnlimited;
  const isAuthenticatedUser = Boolean(user);
  const balanceLabel = "点";
  const title = isUnlimited
    ? (quota.billingExempt ? '管理员 / 开发者账号，无限积分且不扣点' : quota.billingMode === 'paid' ? '当前为付费模式，平台不扣点' : '当前为无限用量')
    : (isAuthenticatedUser ? '剩余点数' : '当前点数');

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-medium bg-surface-base/20 px-2 py-1.5 sm:px-3 hover:border-neon-cyan/30 transition-colors" title={title}>
      <Coins size={16} className="text-neon-cyan" />
      <span className="text-xs text-white sm:text-sm font-mono font-medium">
        {isUnlimited ? "∞" : `${quota.remaining} ${balanceLabel}`}
      </span>
    </div>
  );
}
