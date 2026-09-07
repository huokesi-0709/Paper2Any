/**
 * UserMenu dropdown component.
 *
 * Shows user identity with a dropdown menu containing account actions.
 * Hidden when Supabase is not configured (no auth mode).
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { isSupabaseConfigured } from "../lib/supabase";
import { DEFAULT_LLM_API_URL, getPurchaseUrl } from "../config/api";
import { useRuntimeBilling } from "../hooks/useRuntimeBilling";
import { LogOut, ChevronDown, Crown, FolderOpen, Settings, ExternalLink, Ticket } from "lucide-react";

interface UserMenuProps {
  onShowFiles?: () => void;
  onShowAccount?: () => void;
}

export function UserMenu({ onShowFiles, onShowAccount }: UserMenuProps = {}) {
  const { t } = useTranslation('common');
  const { user, signOut } = useAuthStore();
  const { runtimeConfig } = useRuntimeBilling();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Hide when Supabase is not configured or no user
  if (!isSupabaseConfigured() || !user) return null;

  const displayName = user.email?.split('@')[0] || user.phone?.slice(-4) || t('userMenu.user');
  const fullEmail = user.email || user.phone || "";
  const purchaseUrl =
    runtimeConfig.points_purchase_url?.trim()
    || getPurchaseUrl(runtimeConfig.managed_api_url || DEFAULT_LLM_API_URL);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <div ref={ref} className="relative z-50">
      <button
        onClick={() => setOpen(!open)}
        className={`group relative flex items-center gap-2 px-1 pl-1.5 pr-3 py-1 rounded-full border transition-all duration-300 ${
          open 
            ? "border-neon-cyan/40 bg-surface-base/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
            : "border-border-medium bg-surface-base/20 hover:border-neon-cyan/30 hover:shadow-[0_0_10px_rgba(34,211,238,0.15)]"
        }`}
      >
        {/* Avatar / Icon */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden border border-neon-purple/30 bg-neon-purple/10">
          <Crown size={16} className="text-neon-cyan" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="flex flex-col items-start mr-1">
           <span className="text-sm font-medium leading-none text-white group-hover:text-neon-cyan transition-colors">
             {displayName}
           </span>
           <span className="text-[10px] text-slate-400 leading-tight scale-90 origin-left font-mono">PRO MEMBER</span>
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-300 ${open ? "rotate-180 text-neon-cyan" : "group-hover:text-slate-200"}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute right-0 mt-3 w-64 origin-top-right transition-all duration-200 ease-out ${
          open 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bento-card scan-line overflow-hidden relative rounded-xl">
           {/* Decorative background gradients */}
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-neon-cyan/10 to-transparent pointer-events-none" />
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-purple/15 rounded-full blur-3xl pointer-events-none" />

           {/* Header Info */}
           <div className="p-4 border-b border-border-medium relative">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 font-mono">
                {t('userMenu.loggedIn')}
              </p>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-display font-bold shadow-lg border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan">
                    {displayName.charAt(0).toUpperCase()}
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[150px]">{fullEmail}</p>
                 </div>
              </div>

              {/* Status Badge */}
              <div className="mt-3 py-1.5 px-2.5 rounded-lg flex items-center gap-2 text-xs font-medium border border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan">
                 <>
                   <Crown size={12} className="text-neon-cyan" />
                   <span>{t('userMenu.pro')}</span>
                 </>
              </div>
           </div>

           {/* Actions */}
           <div className="p-2 space-y-1">
              {runtimeConfig.billing_mode === 'free' && purchaseUrl && (
                <a
                  href={purchaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-neon-cyan/10 transition-all duration-200 group"
                >
                  <div className="p-1.5 rounded-md bg-neon-cyan/10 text-neon-cyan group-hover:bg-neon-cyan/20">
                    <ExternalLink size={14} />
                  </div>
                  {t('userMenu.buyPoints')}
                </a>
              )}

              {runtimeConfig.points_redeem_enabled && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onShowAccount?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-surface-base/30 transition-all duration-200 group"
                >
                  <div className="p-1.5 rounded-md bg-surface-base/30 text-slate-300 group-hover:bg-surface-base/50">
                    <Ticket size={14} />
                  </div>
                  {t('userMenu.redeemPoints')}
                </button>
              )}

              <button
                onClick={() => {
                  setOpen(false);
                  onShowFiles?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-surface-base/30 transition-all duration-200 group"
              >
                <div className="p-1.5 rounded-md bg-surface-base/30 text-slate-300 group-hover:bg-surface-base/50">
                  <FolderOpen size={14} />
                </div>
                历史文件
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  onShowAccount?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-surface-base/30 transition-all duration-200 group"
              >
                <div className="p-1.5 rounded-md bg-surface-base/30 text-slate-300 group-hover:bg-surface-base/50">
                  <Settings size={14} />
                </div>
                账户设置
              </button>

              <div className="px-3 py-2 text-xs text-slate-500 text-center italic">
                 {t('userMenu.thanks')}
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-neon-pink hover:bg-neon-pink/10 transition-all duration-200 group"
              >
                <div className="p-1.5 rounded-md transition-colors bg-surface-base/30 text-slate-400 group-hover:bg-neon-pink/20 group-hover:text-neon-pink">
                   <LogOut size={14} />
                </div>
                {t('userMenu.signOut')}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
