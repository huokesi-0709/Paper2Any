import { useEffect, useState } from 'react';
import { Flame, Sparkles, Copy, Download, Loader2, Cpu, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ManagedApiNotice from './ManagedApiNotice';
import { DEFAULT_LLM_API_URL } from '../config/api';
import { DEFAULT_IMAGE_PLAYGROUND_MODEL, IMAGE_PLAYGROUND_MODELS } from '../config/models';
import { useAuthStore } from '../stores/authStore';
import { backendFetch, normalizeBackendAssetUrl } from '../services/backendClient';
import { getApiSettings, saveApiSettings } from '../services/apiSettingsService';
import { checkQuota } from '../services/quotaService';
import { useRuntimeBilling } from '../hooks/useRuntimeBilling';
import { buildInsufficientPointsMessage, buildQuotaExhaustedMessage } from '../utils/pointsMessaging';

type TemplateKey = 'research' | 'cs' | 'bio';
type ChipKey = 'method' | 'model' | 'pipeline' | 'result' | 'cover';
type ImageTextLanguage = 'en' | 'zh';
type ImageAspectRatio =
  | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4'
  | '9:16' | '16:9' | '21:9' | '1:4' | '4:1' | '1:8' | '8:1';
type ImageResolution = '1K' | '2K' | '4K';
type GptImageSize = '1024x1024' | '1536x1024' | '1024x1536' | '2048x2048' | '2048x1152' | '1152x2048';
type GptImageQuality = 'auto' | 'low' | 'medium' | 'high';
type BatchCount = 1 | 2 | 4 | 8 | 16;

type GeneratedImageResult = {
  index: number;
  imageUrl: string;
  previewUrl: string;
  fileName: string;
  previewFileName: string;
  variantLabel: string;
};

const STORAGE_KEY = 'image_playground_settings';
const GEMINI_FLASH_ASPECT_RATIOS: ImageAspectRatio[] = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', '1:4', '4:1', '1:8', '8:1'];
const GEMINI_PRO_ASPECT_RATIOS: ImageAspectRatio[] = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const GEMINI_RESOLUTIONS: ImageResolution[] = ['1K', '2K', '4K'];
const QWEN_RESOLUTIONS: ImageResolution[] = ['1K', '2K'];
const GPT_IMAGE_SIZES: GptImageSize[] = ['1024x1024', '1536x1024', '1024x1536', '2048x2048', '2048x1152', '1152x2048'];
const GPT_IMAGE_QUALITIES: GptImageQuality[] = ['auto', 'low', 'medium', 'high'];
const BATCH_COUNT_OPTIONS: BatchCount[] = [1, 2, 4, 8, 16];

const MODEL_META: Record<string, { titleKey: string; descKey: string; accent: string; glow: string }> = {
  'qwen-image-3.0-pro': {
    titleKey: 'models.qwenImage3Pro',
    descKey: 'models.qwenImage3ProDesc',
    accent: 'from-sky-500/20 to-emerald-500/20',
    glow: 'group-hover:shadow-[0_0_30px_rgba(14,165,233,0.15)]',
  },
  'gemini-3.1-flash-image-preview': {
    titleKey: 'models.gemini31',
    descKey: 'models.gemini31Desc',
    accent: 'from-cyan-500/20 to-sky-500/20',
    glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
  },
  'gemini-3-pro-image-preview': {
    titleKey: 'models.geminiPro',
    descKey: 'models.geminiProDesc',
    accent: 'from-fuchsia-500/20 to-rose-500/20',
    glow: 'group-hover:shadow-[0_0_30px_rgba(217,70,239,0.15)]',
  },
  'gpt-image-2': {
    titleKey: 'models.gptImage2',
    descKey: 'models.gptImage2Desc',
    accent: 'from-amber-500/20 to-orange-500/20',
    glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  },
  'gpt-image-2-all': {
    titleKey: 'models.gptImage2All',
    descKey: 'models.gptImage2AllDesc',
    accent: 'from-emerald-500/20 to-lime-500/20',
    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  },
};

const TEMPLATE_CARD_KEYS: TemplateKey[] = ['research', 'cs', 'bio'];
const CHIP_KEYS: ChipKey[] = ['method', 'model', 'pipeline', 'result', 'cover'];

function buildTemplatePrompt(templateKey: TemplateKey): string {
  if (templateKey === 'cs') {
    return 'Create a clean computer-science research figure. Emphasize architecture blocks, data flow, concise labels, balanced whitespace, and presentation-ready composition.';
  }
  if (templateKey === 'bio') {
    return 'Create a polished biology or medical research figure. Emphasize mechanism clarity, experimental stages, scientific annotation, legible callouts, and a calm professional palette.';
  }
  return 'Create a polished academic research illustration or infographic. Keep hierarchy clear, labels concise, composition strong, and visual style presentation-ready.';
}

function buildChipPrompt(chipKey: ChipKey): string {
  if (chipKey === 'model') return 'Prefer a model architecture style with clear module grouping and directional relations.';
  if (chipKey === 'pipeline') return 'Prefer a pipeline-style composition with explicit stages and transitions.';
  if (chipKey === 'result') return 'Prefer an infographic that highlights findings, comparisons, and takeaways.';
  if (chipKey === 'cover') return 'Prefer a bold hero-style paper cover visual with strong visual atmosphere and minimal text.';
  return 'Prefer a method overview composition that summarizes the core workflow at a glance.';
}

function buildLanguagePrompt(textLanguage: ImageTextLanguage): string {
  if (textLanguage === 'zh') {
    return 'All visible text inside the generated image must be in simplified Chinese. Do not mix English labels unless the user explicitly asks for bilingual output.';
  }
  return 'All visible text inside the generated image must be in English. Do not mix Chinese labels unless the user explicitly asks for bilingual output.';
}

function buildPrompt(
  templateKey: TemplateKey,
  selectedChips: ChipKey[],
  paperContent: string,
  extraInstructions: string,
  textLanguage: ImageTextLanguage,
): string {
  const sections = [
    buildTemplatePrompt(templateKey),
    paperContent.trim() ? `Paper content or topic:\n${paperContent.trim()}` : '',
    selectedChips.length > 0 ? `Preferred direction:\n${selectedChips.map((chip) => `- ${buildChipPrompt(chip)}`).join('\n')}` : '',
    `Text language requirement:\n${buildLanguagePrompt(textLanguage)}`,
    extraInstructions.trim() ? `Extra instructions:\n${extraInstructions.trim()}` : '',
    'Output a single high-quality research visual. Avoid watermarks, broken typography, and cluttered composition.',
  ];
  return sections.filter(Boolean).join('\n\n');
}

function normalizeBatchCount(value: unknown): BatchCount {
  const parsed = Number(value);
  return BATCH_COUNT_OPTIONS.includes(parsed as BatchCount) ? (parsed as BatchCount) : 1;
}

function normalizeResultImages(data: any): GeneratedImageResult[] {
  const rawImages = Array.isArray(data?.images) ? data.images : [];
  if (rawImages.length === 0 && data?.image_url) {
    return [{
      index: 1,
      imageUrl: normalizeBackendAssetUrl(data.image_url || ''),
      previewUrl: normalizeBackendAssetUrl(data.preview_url || data.image_url || ''),
      fileName: data.file_name || 'generated.png',
      previewFileName: data.preview_file_name || data.file_name || 'generated.png',
      variantLabel: data.variant_label || 'Variant 1',
    }];
  }
  return rawImages.map((item: any, index: number) => ({
    index: Number(item?.index) || index + 1,
    imageUrl: normalizeBackendAssetUrl(item?.image_url || ''),
    previewUrl: normalizeBackendAssetUrl(item?.preview_url || item?.image_url || ''),
    fileName: item?.file_name || `generated_${index + 1}.png`,
    previewFileName: item?.preview_file_name || item?.file_name || `generated_${index + 1}.jpg`,
    variantLabel: item?.variant_label || `Variant ${index + 1}`,
  }));
}

export default function ImagePlaygroundPage() {
  const { t } = useTranslation('imagePlayground');
  const { user, refreshQuota } = useAuthStore();
  const { runtimeConfig, userApiConfigRequired } = useRuntimeBilling();

  const [selectedModel, setSelectedModel] = useState(DEFAULT_IMAGE_PLAYGROUND_MODEL);
  const [templateKey, setTemplateKey] = useState<TemplateKey>('research');
  const [selectedChips, setSelectedChips] = useState<ChipKey[]>(['method']);
  const [paperContent, setPaperContent] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [textLanguage, setTextLanguage] = useState<ImageTextLanguage>('en');
  const [batchCount, setBatchCount] = useState<BatchCount>(1);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('16:9');
  const [resolution, setResolution] = useState<ImageResolution>('2K');
  const [gptSize, setGptSize] = useState<GptImageSize>('2048x1152');
  const [gptQuality, setGptQuality] = useState<GptImageQuality>('medium');
  const [apiUrl, setApiUrl] = useState(DEFAULT_LLM_API_URL);
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingWarning, setBillingWarning] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<GeneratedImageResult[]>([]);
  const [resultZipUrl, setResultZipUrl] = useState('');
  const [resultZipFileName, setResultZipFileName] = useState('image-playground-batch.zip');
  const [resultSuccessCount, setResultSuccessCount] = useState(0);
  const [resultBatchCount, setResultBatchCount] = useState(0);
  const [lastPrompt, setLastPrompt] = useState('');

  const imageCost = Math.max(1, Number(runtimeConfig.workflow_costs?.image_playground || 2));
  const totalCost = imageCost * batchCount;
  const promptPreview = buildPrompt(templateKey, selectedChips, paperContent, extraInstructions, textLanguage);
  const supportsQwenControls = selectedModel.startsWith('qwen-image');
  const supportsAspectControls = supportsQwenControls || selectedModel === 'gemini-3.1-flash-image-preview' || selectedModel === 'gemini-3-pro-image-preview';
  const supportsGptImage2Controls = selectedModel === 'gpt-image-2';
  const aspectRatioOptions = supportsQwenControls || selectedModel === 'gemini-3.1-flash-image-preview' ? GEMINI_FLASH_ASPECT_RATIOS : GEMINI_PRO_ASPECT_RATIOS;
  const resolutionOptions = supportsQwenControls ? QWEN_RESOLUTIONS : GEMINI_RESOLUTIONS;
  const hasResults = resultImages.length > 0;
  const resultFailedCount = Math.max(0, resultBatchCount - resultSuccessCount);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.selectedModel) setSelectedModel(saved.selectedModel);
        if (saved.templateKey) setTemplateKey(saved.templateKey);
        if (Array.isArray(saved.selectedChips)) setSelectedChips(saved.selectedChips);
        if (saved.paperContent) setPaperContent(saved.paperContent);
        if (saved.extraInstructions) setExtraInstructions(saved.extraInstructions);
        if (saved.textLanguage) setTextLanguage(saved.textLanguage);
        if (saved.batchCount) setBatchCount(normalizeBatchCount(saved.batchCount));
        if (saved.aspectRatio) setAspectRatio(saved.aspectRatio);
        if (saved.resolution) setResolution(saved.resolution);
        if (saved.gptSize) setGptSize(saved.gptSize);
        if (saved.gptQuality) setGptQuality(saved.gptQuality);
        if (saved.apiUrl) setApiUrl(saved.apiUrl);
        if (saved.apiKey) setApiKey(saved.apiKey);
      }
      const userApi = getApiSettings(user?.id || null);
      if (userApi) {
        if (userApi.apiUrl) setApiUrl(userApi.apiUrl);
        if (userApi.apiKey) setApiKey(userApi.apiKey);
      }
    } catch (err) {
      console.error('Failed to restore image playground settings', err);
    }
  }, [user?.id, userApiConfigRequired]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const data = { selectedModel, templateKey, selectedChips, paperContent, extraInstructions, textLanguage, batchCount, aspectRatio, resolution, gptSize, gptQuality, apiUrl, apiKey };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (user?.id && apiUrl && apiKey) saveApiSettings(user.id, { apiUrl, apiKey });
    } catch (err) {
      console.error('Failed to persist image playground settings', err);
    }
  }, [selectedModel, templateKey, selectedChips, paperContent, extraInstructions, textLanguage, batchCount, aspectRatio, resolution, gptSize, gptQuality, apiUrl, apiKey, user?.id]);

  useEffect(() => {
    if (selectedModel === 'gemini-3-pro-image-preview' && !GEMINI_PRO_ASPECT_RATIOS.includes(aspectRatio)) setAspectRatio('16:9');
    if (selectedModel.startsWith('qwen-image') && !QWEN_RESOLUTIONS.includes(resolution)) setResolution('2K');
    else if (!GEMINI_RESOLUTIONS.includes(resolution)) setResolution('2K');
    if (!GPT_IMAGE_SIZES.includes(gptSize)) setGptSize('2048x1152');
    if (!GPT_IMAGE_QUALITIES.includes(gptQuality)) setGptQuality('medium');
  }, [selectedModel, aspectRatio, resolution, gptSize, gptQuality]);

  const toggleChip = (chipKey: ChipKey) => {
    setSelectedChips((current) => current.includes(chipKey) ? current.filter((item) => item !== chipKey) : [...current, chipKey]);
  };

  const handleGenerate = async () => {
    setError(null);
    setBillingWarning(null);
    setResultImages([]);
    setResultZipUrl('');
    setResultZipFileName('image-playground-batch.zip');
    setResultSuccessCount(0);
    setResultBatchCount(0);
    if (!user) { setError(t('errors.loginRequired')); return; }
    if (!paperContent.trim()) { setError(t('errors.promptRequired')); return; }
    if (userApiConfigRequired && (!apiUrl.trim() || !apiKey.trim())) { setError(t('errors.apiRequired')); return; }
    const quota = await checkQuota(user.id || null);
    if (quota.remaining < totalCost) {
      setError(quota.isAuthenticated ? buildInsufficientPointsMessage(totalCost, quota.remaining, t('hero.title')) : buildQuotaExhaustedMessage(runtimeConfig.points_purchase_url));
      return;
    }
    setIsGenerating(true);
    try {
      const response = await backendFetch('/api/v1/image-playground/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Workflow-Amount': String(totalCost) },
        body: JSON.stringify({
          prompt: promptPreview, model: selectedModel, template_key: templateKey, domain_key: templateKey, batch_count: batchCount,
          ...(supportsAspectControls ? { aspect_ratio: aspectRatio, resolution } : {}),
          ...(supportsGptImage2Controls ? { size: gptSize, quality: gptQuality } : {}),
          ...(userApiConfigRequired ? { chat_api_url: apiUrl.trim(), api_key: apiKey.trim() } : {}),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) { setError(data?.detail || t('errors.requestFailed')); return; }
      const normalizedImages = normalizeResultImages(data);
      setResultImages(normalizedImages);
      setResultSuccessCount(Number(data?.success_count) || normalizedImages.length);
      setResultBatchCount(Number(data?.batch_count) || batchCount);
      setResultZipUrl(normalizeBackendAssetUrl(data?.zip_path || ''));
      setResultZipFileName(data?.zip_file_name || 'image-playground-batch.zip');
      setBillingWarning(data?.billing_warning || null);
      setLastPrompt(data?.prompt || promptPreview);
      void refreshQuota();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    try { await navigator.clipboard.writeText(lastPrompt || promptPreview); } catch { setError(t('errors.copyFailed')); }
  };

  return (
    <div className="page-shell overflow-y-auto overflow-x-hidden">
      <div className="bg-grid-dense pointer-events-none absolute inset-0 opacity-50" />
      <div className="page-container relative">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="mb-6 animate-fade-in">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <span className="neon-badge neon-badge-pink">
                <Flame size={12} />
                {t('hero.badge')}
              </span>
              <span className="neon-badge">
                <Sparkles size={12} />
                {t('meta.cost', { count: totalCost })}
              </span>
            </div>
            <h1 className="title font-display text-4xl font-extrabold tracking-[-0.035em] text-lab-primary md:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="subtitle">{t('hero.description')}</p>
          </div>
        </section>

        {!userApiConfigRequired && <ManagedApiNotice description={t('managedNotice')} />}

        <div className="image-studio">
          {/* ═══ LEFT: Config ═══ */}
          <div className="flex flex-col gap-5">
            {/* Model selection */}
            <details className="image-settings bento-card">
              <summary>{t('models.title')}</summary>
            <section className="neon-panel p-6 animate-fade-in-up stagger-1">
              <div className="flex items-center gap-2 mb-4">
                <Cpu size={18} className="text-neon-cyan" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-lab-secondary">
                  {t('models.title')}
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {IMAGE_PLAYGROUND_MODELS.map((model) => {
                  const meta = MODEL_META[model];
                  const active = selectedModel === model;
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setSelectedModel(model)}
                      className={`group relative rounded-2xl border p-4 text-left transition-all duration-300 ${meta.glow} ${
                        active
                          ? `border-neon-cyan/30 bg-gradient-to-br ${meta.accent}`
                          : 'border-slate-200 bg-white/[0.02] hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-lab-primary">{t(meta.titleKey)}</div>
                        {active && (
                          <span className="flex items-center gap-1 rounded-full bg-neon-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase text-neon-cyan">
                            <span className="h-1 w-1 rounded-full bg-neon-cyan animate-pulse" />
                            ON
                          </span>
                        )}
                      </div>
                      <div className={`mt-2 text-xs leading-6 ${active ? 'text-lab-secondary' : 'text-lab-muted'}`}>
                        {t(meta.descKey)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Controls row */}
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('controls.textLanguage')}</div>
                  <select value={textLanguage} onChange={(e) => setTextLanguage(e.target.value as ImageTextLanguage)} className="neon-select">
                    <option value="en" className="bg-slate-900 text-lab-primary">{t('controls.languageOptions.en')}</option>
                    <option value="zh" className="bg-slate-900 text-lab-primary">{t('controls.languageOptions.zh')}</option>
                  </select>
                </label>
                <label className="block">
                  <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('controls.batchCount')}</div>
                  <select value={batchCount} onChange={(e) => setBatchCount(normalizeBatchCount(e.target.value))} className="neon-select">
                    {BATCH_COUNT_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-slate-900 text-lab-primary">{t('controls.batchOption', { count: option })}</option>
                    ))}
                  </select>
                </label>
              </div>

              {(supportsAspectControls || supportsGptImage2Controls) && (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {supportsAspectControls && (
                    <>
                      <label className="block">
                        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('controls.aspectRatio')}</div>
                        <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as ImageAspectRatio)} className="neon-select">
                          {aspectRatioOptions.map((option) => <option key={option} value={option} className="bg-slate-900 text-lab-primary">{option}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('controls.resolution')}</div>
                        <select value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className="neon-select">
                          {resolutionOptions.map((option) => <option key={option} value={option} className="bg-slate-900 text-lab-primary">{option}</option>)}
                        </select>
                      </label>
                    </>
                  )}
                  {supportsGptImage2Controls && (
                    <>
                      <label className="block">
                        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('controls.size')}</div>
                        <select value={gptSize} onChange={(e) => setGptSize(e.target.value as GptImageSize)} className="neon-select">
                          {GPT_IMAGE_SIZES.map((option) => <option key={option} value={option} className="bg-slate-900 text-lab-primary">{option}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('controls.quality')}</div>
                        <select value={gptQuality} onChange={(e) => setGptQuality(e.target.value as GptImageQuality)} className="neon-select">
                          {GPT_IMAGE_QUALITIES.map((option) => <option key={option} value={option} className="bg-slate-900 text-lab-primary">{t(`controls.qualityOptions.${option}`)}</option>)}
                        </select>
                      </label>
                    </>
                  )}
                </div>
              )}
              {selectedModel === 'gpt-image-2-all' && (
                <div className="status-warning mt-5">{t('controls.gptImage2AllNotice')}</div>
              )}
            </section>

            </details>

            {/* Template + Chips */}
            <details className="image-settings bento-card">
              <summary>{t('templates.title')}</summary>
            <section className="neon-panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 size={18} className="text-neon-purple" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-lab-secondary">{t('templates.title')}</h3>
              </div>
              <div className="grid gap-3">
                {TEMPLATE_CARD_KEYS.map((key) => {
                  const active = templateKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTemplateKey(key)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                        active
                          ? 'border-neon-purple/30 bg-neon-purple-dim'
                          : 'border-slate-200 bg-white/[0.02] hover:border-blue-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-lab-primary">{t(`templates.${key}`)}</div>
                      <div className={`mt-2 text-xs leading-6 ${active ? 'text-lab-secondary' : 'text-lab-muted'}`}>{t(`templates.${key}Desc`)}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5">
                <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('chips.title')}</div>
                <div className="flex flex-wrap gap-2">
                  {CHIP_KEYS.map((chipKey) => {
                    const active = selectedChips.includes(chipKey);
                    return (
                      <button
                        key={chipKey}
                        type="button"
                        onClick={() => toggleChip(chipKey)}
                        className={`neon-chip ${active ? 'neon-chip-active' : ''}`}
                      >
                        {t(`chips.${chipKey}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            </details>

            {/* Prompt input */}
            <section className="neon-panel p-6 animate-fade-in-up stagger-3">
              {userApiConfigRequired && (
                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('inputs.apiUrl')}</div>
                    <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="neon-input" />
                  </label>
                  <label className="block">
                    <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('inputs.apiKey')}</div>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="neon-input" />
                  </label>
                </div>
              )}
              <label className="block">
                <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('inputs.paperContent')}</div>
                <textarea
                  value={paperContent}
                  onChange={(e) => setPaperContent(e.target.value)}
                  placeholder={t('inputs.paperPlaceholder')}
                  rows={6}
                  className="neon-textarea"
                />
              </label>
              <label className="mt-4 block">
                <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('inputs.extra')}</div>
                <textarea
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder={t('inputs.extraPlaceholder')}
                  rows={3}
                  className="neon-textarea"
                />
              </label>
              <div className="mt-4">
                <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-lab-muted">{t('inputs.preview')}</div>
                <pre className="neon-result max-h-[240px] overflow-auto p-4 text-xs leading-6 text-lab-secondary whitespace-pre-wrap">{promptPreview}</pre>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-neon disabled:opacity-60"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
                  <span>
                    {isGenerating
                      ? t('actions.generating', { count: batchCount })
                      : batchCount > 1
                        ? t('actions.generateBatch', { count: totalCost, images: batchCount })
                        : t('actions.generate', { count: totalCost })}
                  </span>
                </button>
                {error && <div className="status-error flex-1">{error}</div>}
              </div>
            </section>
          </div>

          {/* ═══ RIGHT: Results ═══ */}
          <div className="image-results flex flex-col gap-5">
            <section className="neon-panel p-6 animate-fade-in-up stagger-2">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-neon-cyan" />
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-lab-secondary">{t('result.title')}</h3>
                </div>
                {hasResults && (
                  <span className="neon-badge neon-badge-gold">
                    {t('meta.saved')}
                  </span>
                )}
              </div>
              {hasResults && (
                <p className="mb-4 text-xs text-lab-muted">
                  {t('result.summary', { success: resultSuccessCount, total: resultBatchCount })}
                </p>
              )}

              <div className="neon-result">
                {isGenerating ? (
                  <div className="empty-state">
                    <Loader2 size={36} className="animate-spin text-neon-cyan" />
                    <div className="title">{t('result.loadingTitle', { count: batchCount })}</div>
                    <div className="desc">{t('result.loadingDesc', { count: totalCost })}</div>
                  </div>
                ) : hasResults ? (
                  <div className="w-full p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {resultImages.map((item) => (
                        <article key={`${item.index}-${item.fileName}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/[0.02]">
                          <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                            <img src={item.previewUrl || item.imageUrl} alt={`generated-${item.index}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                          </div>
                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-lab-primary">{item.variantLabel}</div>
                              <div className="text-xs text-lab-muted">{item.fileName}</div>
                            </div>
                            <a href={item.imageUrl} download={item.fileName} className="toolbar-btn">
                              <Download size={14} />
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Sparkles size={48} className="icon text-neon-cyan" />
                    <div className="title">{t('result.empty')}</div>
                  </div>
                )}
              </div>

              {hasResults && resultFailedCount > 0 && (
                <div className="status-warning mt-4">{t('result.partial', { success: resultSuccessCount, failed: resultFailedCount })}</div>
              )}
              {billingWarning && <div className="status-warning mt-4">{billingWarning}</div>}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={handleCopyPrompt} className="btn-neon-outline">
                  <Copy size={14} />
                  <span>{t('actions.copyPrompt')}</span>
                </button>
                {resultZipUrl && (
                  <a href={resultZipUrl} download={resultZipFileName} className="btn-neon-outline">
                    <Download size={14} />
                    <span>{t('actions.downloadAll')}</span>
                  </a>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
