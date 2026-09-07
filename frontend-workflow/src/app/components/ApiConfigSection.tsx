import { useState, useEffect } from 'react';
import { Key, Link2, Cpu, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { DEFAULT_LLM_API_URL, API_URL_OPTIONS, getPurchaseUrl } from '../../config/api';
import { getApiSettings, saveApiSettings, MANAGED_API_KEY_PLACEHOLDER } from '../../services/apiSettingsService';
import { verifyLlmConnection } from '../../services/llmService';
import { useAuthStore } from '../../stores/authStore';
import { useRuntimeBilling } from '../../hooks/useRuntimeBilling';

interface ApiConfigSectionProps {
  model: string;
  onModelChange: (model: string) => void;
  modelOptions: string[];
  modelLabel?: string;
  apiUrlKey?: string;
  apiKeyKey?: string;
  storageKey?: string;
  showModel?: boolean;
  showVerifyButton?: boolean;
}

export function ApiConfigSection({
  model,
  onModelChange,
  modelOptions,
  modelLabel = '模型',
  storageKey,
  showModel = true,
  showVerifyButton = true,
}: ApiConfigSectionProps) {
  const { user } = useAuthStore();
  const { userApiConfigRequired } = useRuntimeBilling();
  const [apiUrl, setApiUrl] = useState(DEFAULT_LLM_API_URL);
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load settings
  useEffect(() => {
    const settings = getApiSettings(user?.id || null);
    if (settings) {
      setApiUrl(settings.apiUrl || DEFAULT_LLM_API_URL);
      setApiKey(settings.apiKey === MANAGED_API_KEY_PLACEHOLDER ? '' : settings.apiKey);
    }
  }, [user?.id]);

  // Persist settings
  useEffect(() => {
    if (!user?.id || !userApiConfigRequired) return;
    if (apiUrl && apiKey) {
      saveApiSettings(user.id, { apiUrl, apiKey });
    }
  }, [apiUrl, apiKey, user?.id, userApiConfigRequired]);

  // Persist extra state to localStorage
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const payload = { model };
      const existing = localStorage.getItem(storageKey);
      const merged = existing ? { ...JSON.parse(existing), ...payload } : payload;
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }, [model, storageKey]);

  const handleVerify = async () => {
    if (isValidating) return;
    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);
    try {
      await verifyLlmConnection(apiUrl, apiKey, model);
      setValidationSuccess(true);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsValidating(false);
    }
  };

  // Managed mode - show notice, no manual config
  if (!userApiConfigRequired) {
    return (
      <div className="neon-panel p-4">
        <div className="flex items-center gap-3 mb-3">
          <Cpu size={16} className="text-neon-cyan" />
          <span className="text-sm font-mono font-semibold text-text-secondary uppercase tracking-wider">
            模型配置
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-cyan/8 border border-neon-cyan/20 text-xs text-neon-cyan mb-3">
          <CheckCircle2 size={14} />
          <span>平台托管模式 — 无需手动配置 API</span>
        </div>
        {showModel && (
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5">{modelLabel}</label>
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="neon-select"
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="neon-panel p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Key size={16} className="text-neon-cyan" />
        <span className="text-sm font-mono font-semibold text-text-secondary uppercase tracking-wider">
          API 配置
        </span>
      </div>

      {/* API URL */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-mono text-text-muted mb-1.5">
          <Link2 size={12} /> API URL
        </label>
        <select
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="neon-select"
        >
          {API_URL_OPTIONS.map((url: string) => (
            <option key={url} value={url}>{url}</option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-mono text-text-muted mb-1.5">
          <Key size={12} /> API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="neon-input pr-10"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-neon-cyan transition-colors"
            type="button"
          >
            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Model selector */}
      {showModel && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-mono text-text-muted mb-1.5">
            <Cpu size={12} /> {modelLabel}
          </label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="neon-select"
          >
            {modelOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Verify button */}
      {showVerifyButton && (
        <div className="pt-1">
          <button
            onClick={handleVerify}
            disabled={isValidating || !apiKey}
            className="btn-neon-outline w-full text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isValidating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                验证中...
              </>
            ) : validationSuccess ? (
              <>
                <CheckCircle2 size={14} />
                验证成功
              </>
            ) : (
              '验证 API 连接'
            )}
          </button>
          {validationError && (
            <div className="mt-2 text-xs text-red-400 font-mono">{validationError}</div>
          )}
        </div>
      )}

      {/* Purchase link */}
      <a
        href={getPurchaseUrl(apiUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-text-muted hover:text-neon-cyan text-center pt-1"
      >
        没有 API Key？获取 →
      </a>
    </div>
  );
}
