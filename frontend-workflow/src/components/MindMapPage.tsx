import { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, type ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  BrainCircuit,
  Copy,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Split,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ManagedApiNotice from './ManagedApiNotice';
import MindMapNodeCard from './mindmap/MindMapNodeCard';
import { DEFAULT_LLM_API_URL } from '../config/api';
import { useRuntimeBilling } from '../hooks/useRuntimeBilling';
import { appendManagedApiConfig, appendManagedModel } from '../utils/runtimeBillingForm';
import { useAuthStore } from '../stores/authStore';
import { getApiSettings, saveApiSettings } from '../services/apiSettingsService';
import { backendFetch, normalizeBackendAssetUrl } from '../services/backendClient';
import { verifyLlmConnection } from '../services/llmService';
import { checkQuota } from '../services/quotaService';
import {
  addChildToNode,
  addSiblingToNode,
  buildMindMapFlow,
  buildMindMapMarkdown,
  buildMindMapSvg,
  countTreeNodes,
  estimateMindMapPoints,
  findNodeById,
  getTreeDepth,
  normalizeMindMapTree,
  removeNodeById,
  updateNodeById,
  type MindMapTreeNode,
} from '../utils/mindmapTree';

const MINDMAP_MODELS = ['gpt-5.4', 'gpt-5.2'] as const;

type InputMode = 'files' | 'text';
type MindMapStyle = 'default' | 'flowchart' | 'tree';
type OutputLanguage = 'zh' | 'en';

const nodeTypes = { mindMapNode: MindMapNodeCard };

export default function MindMapPage() {
  const { t, i18n } = useTranslation('mindmap');
  const { user } = useAuthStore();
  const { runtimeConfig, userApiConfigRequired } = useRuntimeBilling();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('files');
  const [files, setFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_LLM_API_URL);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string>(MINDMAP_MODELS[0]);
  const [mindmapStyle, setMindmapStyle] = useState<MindMapStyle>('default');
  const [maxDepth, setMaxDepth] = useState(3);
  const [language, setLanguage] = useState<OutputLanguage>(i18n.language.startsWith('zh') ? 'zh' : 'en');
  const [tree, setTree] = useState<MindMapTreeNode | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [mindmapFileUrl, setMindmapFileUrl] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [chargeInfo, setChargeInfo] = useState<{
    nodeCount: number;
    depth: number;
    points: number;
    basePoints: number;
    depthBonus: number;
    tierLabel: string;
    rule: { threshold: number; perLevel: number; maxBonus: number };
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState<'svg' | 'png' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const settings = getApiSettings(user?.id || null);
    if (!settings) return;
    setApiUrl(settings.apiUrl || DEFAULT_LLM_API_URL);
    setApiKey(settings.apiKey === '__managed_by_backend__' ? '' : settings.apiKey || '');
  }, [user?.id]);

  const hasInput = useMemo(() => files.length > 0 || textContent.trim().length > 0, [files.length, textContent]);
  const flow = useMemo(() => (tree ? buildMindMapFlow(tree) : { nodes: [], edges: [] }), [tree]);
  const selectedNode = useMemo(() => findNodeById(tree, selectedNodeId || ''), [selectedNodeId, tree]);
  const treeMarkdown = useMemo(() => (tree ? buildMindMapMarkdown(tree) : ''), [tree]);
  const sourceCount = useMemo(() => Math.max(files.length + (textContent.trim() ? 1 : 0), 0), [files.length, textContent]);
  const estimatedPoints = useMemo(() => estimateMindMapPoints(Math.max(1, sourceCount), maxDepth), [sourceCount, maxDepth]);
  const metrics = useMemo(
    () =>
      tree
        ? {
            nodes: countTreeNodes(tree),
            depth: getTreeDepth(tree),
            branches: tree.children.length,
          }
        : { nodes: 0, depth: 0, branches: 0 },
    [tree],
  );

  useEffect(() => {
    if (!flow.nodes.length || !reactFlowRef.current) return;
    window.setTimeout(() => reactFlowRef.current?.fitView({ padding: 0.18, duration: 300 }), 50);
  }, [flow.nodes.length, tree]);

  const appendFiles = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setFiles((prev) => {
      const existing = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const merged = [...prev];
      Array.from(picked).forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existing.has(key)) {
          existing.add(key);
          merged.push(file);
        }
      });
      return merged;
    });
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setError(null);
    setStatus(null);
    setChargeInfo(null);

    if (!hasInput) {
      setError(t('errors.missingInput'));
      return;
    }

    const quota = await checkQuota(user?.id || null, user?.is_anonymous || false);
    if (quota.remaining < estimatedPoints) {
      setError(t('errors.quota', { points: estimatedPoints }));
      return;
    }

    if (userApiConfigRequired) {
      if (!apiUrl.trim() || !apiKey.trim()) {
        setError(t('errors.missingApi'));
        return;
      }
      try {
        await verifyLlmConnection(apiUrl.trim(), apiKey.trim(), model);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.server'));
        return;
      }
    }

    setIsGenerating(true);
    setStatus(t('status.generating', { points: estimatedPoints }));
    try {
      if (userApiConfigRequired) {
        saveApiSettings(user?.id || null, { apiUrl: apiUrl.trim(), apiKey: apiKey.trim() });
      }

      const formData = new FormData();
      appendManagedModel(formData, userApiConfigRequired, 'model', model);
      formData.append('mindmap_style', mindmapStyle);
      formData.append('max_depth', String(maxDepth));
      formData.append('language', language);
      appendManagedApiConfig(formData, userApiConfigRequired, apiUrl, apiKey);
      if (textContent.trim()) {
        formData.append('text', textContent.trim());
      }
      files.forEach((file) => formData.append('files', file));

      const response = await backendFetch('/api/v1/mindmap/generate', {
        method: 'POST',
        headers: {
          'X-Workflow-Amount': String(estimatedPoints),
        },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.detail || data?.error || t('errors.server'));
      }

      const normalizedTree = normalizeMindMapTree(data.tree);
      setTree(normalizedTree);
      setSelectedNodeId(normalizedTree.id);
      setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
      setMindmapFileUrl(normalizeBackendAssetUrl(data.mindmap_path || ''));
      const billing = data.billing && typeof data.billing === 'object' ? data.billing : null;
      if (billing) {
        setChargeInfo({
          nodeCount: Number((billing as Record<string, unknown>).node_count || countTreeNodes(normalizedTree)),
          depth: Number((billing as Record<string, unknown>).depth || getTreeDepth(normalizedTree)),
          points: Number((billing as Record<string, unknown>).points || estimatedPoints),
          basePoints: Number((billing as Record<string, unknown>).base_points || estimatedPoints),
          depthBonus: Number((billing as Record<string, unknown>).depth_bonus || 0),
          tierLabel: String((billing as Record<string, unknown>).tier_label || ''),
          rule: {
            threshold: Number(((billing as Record<string, unknown>).rule as Record<string, unknown> | undefined)?.threshold || 4),
            perLevel: Number(((billing as Record<string, unknown>).rule as Record<string, unknown> | undefined)?.per_level || 1),
            maxBonus: Number(((billing as Record<string, unknown>).rule as Record<string, unknown> | undefined)?.max_bonus || 2),
          },
        });
      }
      setStatus(t('status.generated', { points: Number(data.estimated_points || estimatedPoints) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.server'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (isSaving || !mindmapFileUrl || !tree) return;
    setError(null);
    setStatus(null);
    setIsSaving(true);
    try {
      const response = await backendFetch('/api/v1/mindmap/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_url: mindmapFileUrl,
          tree,
          highlights,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.detail || data?.error || t('errors.server'));
      }
      if (data.mindmap_path) {
        setMindmapFileUrl(normalizeBackendAssetUrl(data.mindmap_path));
      }
      if (data.tree) {
        setTree(normalizeMindMapTree(data.tree));
      }
      setHighlights(Array.isArray(data.highlights) ? data.highlights : highlights);
      setStatus(t('status.saved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.server'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyOutline = async () => {
    if (!treeMarkdown) return;
    try {
      await navigator.clipboard.writeText(treeMarkdown);
      setStatus(t('status.copied'));
    } catch {
      setError(t('errors.server'));
    }
  };

  const handleDownloadJson = () => {
    if (!tree) return;
    const blob = new Blob([JSON.stringify({ root: tree, highlights }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const svgToPngBlob = async (svgMarkup: string): Promise<Blob> => {
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    try {
      const image = new Image();
      const widthMatch = svgMarkup.match(/width="(\d+(?:\.\d+)?)"/i);
      const heightMatch = svgMarkup.match(/height="(\d+(?:\.\d+)?)"/i);
      const width = Math.max(1200, Math.round(Number(widthMatch?.[1] || 1400)));
      const height = Math.max(900, Math.round(Number(heightMatch?.[1] || 980)));
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('mindmap svg rasterize failed'));
        image.src = svgUrl;
      });
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('canvas context unavailable');
      }
      ctx.scale(ratio, ratio);
      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((output) => {
          if (!output) {
            reject(new Error('png blob unavailable'));
            return;
          }
          resolve(output);
        }, 'image/png');
      });
      return pngBlob;
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const handleDownloadSvg = () => {
    if (!tree || isExporting) return;
    try {
      setError(null);
      setIsExporting('svg');
      const svgMarkup = buildMindMapSvg(tree, {
        title: tree.label,
        subtitle: tree.summary || t('hero.description'),
        highlights,
      });
      triggerDownload(new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' }), `mindmap_${Date.now()}.svg`);
      setStatus(t('status.exportedSvg'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.exportFailed'));
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadPng = async () => {
    if (!tree || isExporting) return;
    setError(null);
    setIsExporting('png');
    try {
      const svgMarkup = buildMindMapSvg(tree, {
        title: tree.label,
        subtitle: tree.summary || t('hero.description'),
        highlights,
      });
      const pngBlob = await svgToPngBlob(svgMarkup);
      triggerDownload(pngBlob, `mindmap_${Date.now()}.png`);
      setStatus(t('status.exportedPng'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.exportFailed'));
    } finally {
      setIsExporting(null);
    }
  };

  const updateSelectedNode = (patch: Partial<Pick<MindMapTreeNode, 'label' | 'summary'>>) => {
    if (!tree || !selectedNodeId) return;
    setTree(updateNodeById(tree, selectedNodeId, patch));
  };

  const handleAddChild = () => {
    if (!tree || !selectedNodeId) return;
    setTree(addChildToNode(tree, selectedNodeId));
  };

  const handleAddSibling = () => {
    if (!tree || !selectedNodeId) return;
    setTree(addSiblingToNode(tree, selectedNodeId));
  };

  const handleDeleteNode = () => {
    if (!tree || !selectedNodeId || selectedNodeId === tree.id) return;
    setTree(removeNodeById(tree, selectedNodeId));
    setSelectedNodeId(tree.id);
  };

  return (
    <div className="page-shell overflow-y-auto overflow-x-hidden">
      <div className="page-container flex flex-col gap-6 pb-12 pt-6">
        {/* Hero Section */}
        <section className="bento-card scan-line p-6 md:p-8">
          <div className="relative grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-neon-cyan/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-neon-cyan">
                <BrainCircuit size={14} />
                <span>{t('hero.badge')}</span>
              </div>
              <div className="space-y-3">
                <h1 className="font-display text-4xl font-extrabold tracking-[-0.035em] text-lab-primary md:text-5xl">{t('hero.title')}</h1>
                <p className="max-w-3xl text-base leading-7 text-lab-secondary md:text-lg">{t('hero.description')}</p>
              </div>
              {/* Pricing info */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-slate-700">
                <div className="text-sm font-semibold text-emerald-900">{t('pricing.title')}</div>
                <div className="mt-1 text-xs leading-6 text-slate-700">{t('pricing.description')}</div>
                <div className="mt-1 text-xs font-medium leading-6 text-emerald-800">
                  {t('pricing.preview', { points: estimatedPoints })}
                </div>
                <div className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
                  <span>{t('pricing.tierSummary')}</span>
                  <span>{t('pricing.depthSummary')}</span>
                  <span>{t('pricing.previewNote', { points: estimatedPoints })}</span>
                </div>
                {chargeInfo ? (
                  <div className="mt-3 rounded-2xl border border-emerald-800 bg-emerald-900 px-3 py-2 text-xs leading-6 text-emerald-50">
                    {t('pricing.actual', {
                      nodes: chargeInfo.nodeCount,
                      depth: chargeInfo.depth,
                      points: chargeInfo.points,
                    })}
                  </div>
                ) : null}
                {runtimeConfig.points_purchase_url ? (
                  <>
                    {' '}
                    <a href={runtimeConfig.points_purchase_url} target="_blank" rel="noreferrer" className="font-semibold text-emerald-800 underline decoration-emerald-600/70 underline-offset-4 hover:text-emerald-950">
                      {runtimeConfig.points_purchase_url}
                    </a>
                  </>
                ) : null}
              </div>
              {status ? (
                <div className="status-success flex items-center gap-2 text-sm">{status}</div>
              ) : null}
              {error ? (
                <div className="status-error flex items-center gap-2 text-sm">{error}</div>
              ) : null}
            </div>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bento-card scan-line p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('stats.nodes')}</div>
                <div className="mt-3 text-3xl font-display font-bold text-white">{metrics.nodes}</div>
              </div>
              <div className="bento-card scan-line p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('stats.depth')}</div>
                <div className="mt-3 text-3xl font-display font-bold text-white">{metrics.depth}</div>
              </div>
              <div className="bento-card scan-line p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('stats.branches')}</div>
                <div className="mt-3 text-3xl font-display font-bold text-white">{metrics.branches}</div>
              </div>
              <div className="sm:col-span-3 bento-card scan-line p-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span className="neon-chip">React Flow</span>
                  <span className="neon-chip">{t('editor.techRoute')}</span>
                  <span className="neon-chip">{t('editor.treeJson')}</span>
                  <span className="neon-chip">{t('editor.costBadge', { points: estimatedPoints })}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Layout: Input | Editor | Details */}
        <section className="grid gap-6 2xl:grid-cols-[420px_minmax(0,1fr)_360px]">
          {/* Input Panel */}
          <div className="bento-card scan-line p-5 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode('files')}
                className={`neon-tab ${inputMode === 'files' ? 'neon-tab-active' : ''}`}
              >
                {t('input.filesTab')}
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`neon-tab ${inputMode === 'text' ? 'neon-tab-active' : ''}`}
              >
                {t('input.textTab')}
              </button>
            </div>

            {inputMode === 'files' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="empty-state flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border-medium bg-surface-base/30 px-6 py-8 text-center transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/5"
                >
                  <UploadCloud className="text-neon-cyan" size={30} />
                  <div className="space-y-2">
                    <div className="text-base font-medium text-white">{t('input.dropzone')}</div>
                    <div className="text-sm text-slate-400">{t('input.subtitle')}</div>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                  onChange={(event) => appendFiles(event.target.files)}
                />
                {files.length > 0 ? (
                  <div className="rounded-2xl border border-border-medium bg-surface-base/30 px-4 py-3 text-sm text-slate-300">
                    <div>{t('input.picked', { count: files.length })}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {files.map((file) => (
                        <span key={`${file.name}-${file.size}-${file.lastModified}`} className="neon-chip text-xs">
                          {file.name}
                        </span>
                      ))}
                    </div>
                    <button type="button" className="mt-3 text-xs font-medium text-neon-cyan hover:text-neon-cyan/80" onClick={() => setFiles([])}>
                      {t('input.clear')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <textarea
                value={textContent}
                onChange={(event) => setTextContent(event.target.value)}
                placeholder={t('input.textPlaceholder')}
                className="neon-textarea min-h-[240px] w-full"
              />
            )}

            {/* Settings */}
            <div className="space-y-4 rounded-2xl border border-border-medium bg-surface-base/30 p-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('settings.model')}</div>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  disabled={!userApiConfigRequired}
                  className="neon-select w-full"
                >
                  {MINDMAP_MODELS.map((item) => (
                    <option key={item} value={item} className="bg-[#060914]">
                      {item}
                    </option>
                  ))}
                </select>
                {!userApiConfigRequired ? (
                  <p className="mt-2 text-[11px] leading-5 text-emerald-200/70">Free 模式下由后端统一选择思维导图模型。</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('settings.style')}</div>
                  <select
                    value={mindmapStyle}
                    onChange={(event) => setMindmapStyle(event.target.value as MindMapStyle)}
                    className="neon-select w-full"
                  >
                    <option value="default" className="bg-[#060914]">{t('settings.styleDefault')}</option>
                    <option value="flowchart" className="bg-[#060914]">{t('settings.styleFlowchart')}</option>
                    <option value="tree" className="bg-[#060914]">{t('settings.styleTree')}</option>
                  </select>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('settings.language')}</div>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as OutputLanguage)}
                    className="neon-select w-full"
                  >
                    <option value="zh" className="bg-[#060914]">中文</option>
                    <option value="en" className="bg-[#060914]">English</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <span>{t('settings.depth')}</span>
                  <span className="text-neon-cyan">{maxDepth}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={maxDepth}
                  onChange={(event) => setMaxDepth(Number(event.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {userApiConfigRequired ? (
                <div className="space-y-3">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('settings.apiUrl')}</div>
                    <input
                      value={apiUrl}
                      onChange={(event) => setApiUrl(event.target.value)}
                      className="neon-input w-full"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('settings.apiKey')}</div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      className="neon-input w-full"
                    />
                  </div>
                </div>
              ) : (
                <ManagedApiNotice />
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-neon glow w-full py-3"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                <span>{isGenerating ? t('actions.generating') : t('actions.generate')}</span>
              </button>
              <div className="text-xs leading-6 text-slate-400">
                {t('pricing.ruleSummary')}
              </div>
            </div>
          </div>

          {/* Editor Panel */}
          <div className="bento-card scan-line p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-display font-bold text-white">{t('editor.title')}</div>
                <div className="text-sm text-slate-400">{t('editor.subtitle')}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => reactFlowRef.current?.fitView({ padding: 0.18, duration: 300 })} className="toolbar-btn toolbar-btn-label text-xs">
                  {t('actions.fitView')}
                </button>
                <button type="button" onClick={handleCopyOutline} disabled={!tree} className="toolbar-btn toolbar-btn-label text-xs disabled:opacity-40">
                  <Copy size={14} />
                  {t('actions.copyOutline')}
                </button>
                <button type="button" onClick={handleDownloadJson} disabled={!tree} className="toolbar-btn toolbar-btn-label text-xs disabled:opacity-40">
                  <Download size={14} />
                  {t('actions.downloadJson')}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  disabled={!tree || isExporting !== null}
                  className="toolbar-btn toolbar-btn-label text-xs disabled:opacity-40"
                >
                  <Download size={14} />
                  {isExporting === 'svg' ? t('actions.exportingSvg') : t('actions.downloadSvg')}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!tree || isExporting !== null}
                  className="toolbar-btn toolbar-btn-label text-xs disabled:opacity-40"
                >
                  <Download size={14} />
                  {isExporting === 'png' ? t('actions.exportingPng') : t('actions.downloadPng')}
                </button>
              </div>
            </div>

            {tree ? (
              <div className="h-[760px] overflow-hidden rounded-2xl border border-border-medium bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%),linear-gradient(180deg,rgba(6,9,20,0.98),rgba(15,23,42,0.92))]">
                <ReactFlow
                  nodes={flow.nodes}
                  edges={flow.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  onInit={(instance) => {
                    reactFlowRef.current = instance;
                  }}
                  onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                  panOnScroll
                  zoomOnScroll
                  nodesDraggable={false}
                  elementsSelectable
                  proOptions={{ hideAttribution: true }}
                >
                  <MiniMap nodeColor="#22d3ee" maskColor="rgba(6,9,20,0.45)" />
                  <Controls />
                  <Background gap={22} size={1} color="rgba(148,163,184,0.18)" />
                </ReactFlow>
              </div>
            ) : (
              <div className="empty-state h-[760px] flex flex-col">
                <FileText size={34} className="text-neon-cyan/50" />
                <div className="mt-5 text-lg font-display font-bold text-white">{t('editor.emptyTitle')}</div>
                <div className="mt-2 max-w-lg text-sm leading-7 text-slate-400">{t('editor.emptyDesc')}</div>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="bento-card scan-line p-5 space-y-5">
            <div>
              <div className="text-lg font-display font-bold text-white">{t('details.title')}</div>
              <div className="text-sm text-slate-400">{t('details.subtitle')}</div>
            </div>

            {/* Node Editor */}
            <div className="space-y-3 rounded-2xl border border-border-medium bg-surface-base/30 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">{t('details.selectedNode')}</div>
                {selectedNode && selectedNode.id !== tree?.id ? (
                  <button type="button" onClick={handleDeleteNode} className="rounded-full border border-neon-pink/20 bg-neon-pink/10 p-2 text-neon-pink hover:bg-neon-pink/20">
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
              {selectedNode ? (
                <div className="space-y-3">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('details.label')}</div>
                    <input
                      value={selectedNode.label}
                      onChange={(event) => updateSelectedNode({ label: event.target.value })}
                      className="neon-input w-full"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t('details.summary')}</div>
                    <textarea
                      value={selectedNode.summary || ''}
                      onChange={(event) => updateSelectedNode({ summary: event.target.value })}
                      className="neon-textarea min-h-[110px] w-full"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={handleAddChild} className="toolbar-btn toolbar-btn-label text-sm">
                      <Plus size={15} />
                      {t('actions.addChild')}
                    </button>
                    <button type="button" onClick={handleAddSibling} disabled={!selectedNodeId || selectedNodeId === tree?.id} className="toolbar-btn toolbar-btn-label text-sm disabled:opacity-40">
                      <Split size={15} />
                      {t('actions.addSibling')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm leading-6 text-slate-400">{t('details.empty')}</div>
              )}
            </div>

            {/* Highlights */}
            <div className="space-y-3 rounded-2xl border border-border-medium bg-surface-base/30 p-4">
              <div className="text-sm font-medium text-white">{t('details.highlights')}</div>
              {highlights.length > 0 ? (
                <div className="space-y-2">
                  {highlights.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-border-medium bg-surface-base/20 px-3 py-3 text-sm leading-6 text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm leading-6 text-slate-400">{t('details.highlightsEmpty')}</div>
              )}
            </div>

            {/* Source */}
            <div className="space-y-3 rounded-2xl border border-border-medium bg-surface-base/30 p-4">
              <div className="text-sm font-medium text-white">{t('details.source')}</div>
              <div className="rounded-2xl border border-border-medium bg-surface-base/20 px-3 py-3 text-xs leading-6 text-slate-400">
                {mindmapFileUrl || t('details.sourceEmpty')}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!tree || !mindmapFileUrl || isSaving}
                  className="btn-neon glow flex items-center justify-center gap-1 text-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {isSaving ? t('actions.saving') : t('actions.save')}
                </button>
                {mindmapFileUrl ? (
                  <a href={mindmapFileUrl} target="_blank" rel="noreferrer" className="toolbar-btn toolbar-btn-label text-center text-sm font-medium">
                    {t('actions.openFile')}
                  </a>
                ) : (
                  <div className="rounded-2xl border border-border-medium bg-surface-base/20 px-3 py-3 text-center text-sm font-medium text-slate-500">
                    {t('actions.openFile')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
