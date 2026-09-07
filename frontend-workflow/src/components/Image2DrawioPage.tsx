import { useState, useEffect, useRef, useCallback, ChangeEvent, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  FileImage,
  Loader2,
  AlertCircle,
  Download,
  Copy,
  Wand2,
  ExternalLink,
  Key,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { API_URL_OPTIONS, DEFAULT_LLM_API_URL, getPurchaseUrl } from '../config/api';
import QRCodeTooltip from './QRCodeTooltip';
import CasesSection from './CasesSection';
import ManagedApiNotice from './ManagedApiNotice';
import {
  DEFAULT_IMAGE2DRAWIO_GEN_FIG_MODEL,
  DEFAULT_IMAGE2DRAWIO_VLM_MODEL,
  IMAGE2DRAWIO_GEN_FIG_MODELS,
  withModelOptions,
} from '../config/models';
import { useAuthStore } from '../stores/authStore';
import { getApiSettings, saveApiSettings } from '../services/apiSettingsService';
import { checkQuota, recordUsage } from '../services/quotaService';
import { backendFetch } from '../services/backendClient';
import { useRuntimeBilling } from '../hooks/useRuntimeBilling';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const STORAGE_KEY = 'image2drawio_settings';
const DRAWIO_ORIGINS = new Set(['https://embed.diagrams.net', 'https://app.diagrams.net']);
const DRAWIO_EXPORT_TIMEOUT_MS = 5000;
const DRAWIO_ANIMATE_STEP_MS = 60;
const DRAWIO_ANIMATE_MAX_CELLS = 240;
const DRAWIO_ANIMATE_LARGE_BATCH = 5;
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const FEISHU_DOC_URL = 'https://wcny4qa9krto.feishu.cn/wiki/VXKiwYndwiWAVmkFU6kcqsTenWh';

const Image2DrawioPage = () => {
  const { t } = useTranslation(['image2drawio', 'common']);
  const { user, refreshQuota } = useAuthStore();
  const { userApiConfigRequired } = useRuntimeBilling();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [xmlContent, setXmlContent] = useState('');
  const [filePath, setFilePath] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [drawioReady, setDrawioReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'drawio' | 'png' | 'svg'>('drawio');
  const [exportFilename, setExportFilename] = useState('diagram');

  const [apiUrl, setApiUrl] = useState(DEFAULT_LLM_API_URL);
  const [apiKey, setApiKey] = useState('');
  const [genFigModel, setGenFigModel] = useState(DEFAULT_IMAGE2DRAWIO_GEN_FIG_MODEL);
  const [vlmModel, setVlmModel] = useState(DEFAULT_IMAGE2DRAWIO_VLM_MODEL);
  const genFigModelOptions = withModelOptions(IMAGE2DRAWIO_GEN_FIG_MODELS, genFigModel);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const generationRequestRef = useRef(false);
  const lastLoadedXmlRef = useRef('');
  const isAnimatingRef = useRef(false);
  const animationTokenRef = useRef(0);
  const pendingExportRef = useRef<{
    resolve: ((data: string) => void) | null;
    reject: ((error: Error) => void) | null;
    format: 'xml' | 'png' | 'svg' | null;
  }>({ resolve: null, reject: null, format: null });

  useEffect(() => {
    const userApiSettings = getApiSettings(user?.id || null);
    if (userApiSettings) {
      if (userApiSettings.apiUrl) setApiUrl(userApiSettings.apiUrl);
      if (userApiSettings.apiKey) setApiKey(userApiSettings.apiKey);
    }
  }, [user?.id, userApiConfigRequired]);

  useEffect(() => {
    if (!user?.id) return;
    if (apiUrl && apiKey) {
      saveApiSettings(user.id, { apiUrl, apiKey });
    }
  }, [apiUrl, apiKey, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        apiUrl: string;
        apiKey: string;
        genFigModel: string;
        vlmModel: string;
        xmlContent: string;
        exportFormat: 'drawio' | 'png' | 'svg';
        exportFilename: string;
      }>;
      if (saved.apiUrl) setApiUrl(saved.apiUrl);
      if (saved.apiKey) setApiKey(saved.apiKey);
      if (saved.genFigModel) setGenFigModel(saved.genFigModel);
      if (saved.vlmModel) setVlmModel(saved.vlmModel);
      if (saved.xmlContent) setXmlContent(saved.xmlContent);
      if (saved.exportFormat) setExportFormat(saved.exportFormat);
      if (saved.exportFilename) setExportFilename(saved.exportFilename);
    } catch (e) {
      console.warn('[image2drawio] restore settings failed:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      apiUrl,
      apiKey,
      genFigModel,
      vlmModel,
      xmlContent,
      exportFormat,
      exportFilename,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[image2drawio] persist settings failed:', e);
    }
  }, [apiUrl, apiKey, genFigModel, vlmModel, xmlContent, exportFormat, exportFilename]);

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError(t('errors.imgOnly'));
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(t('errors.sizeLimit'));
      return false;
    }
    return true;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImageFile(file)) return;
    setSelectedFile(file);
    setError(null);
    setStatusMessage('');
    setXmlContent('');
    setFilePath('');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !validateImageFile(file)) return;
    setSelectedFile(file);
    setError(null);
    setStatusMessage('');
    setXmlContent('');
    setFilePath('');
  };

  const postToDrawio = useCallback((payload: Record<string, unknown>) => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(JSON.stringify(payload), '*');
  }, []);

  const requestDrawioFit = useCallback(() => {
    postToDrawio({ action: 'zoom', zoom: 'fit' });
  }, [postToDrawio]);

  const handleGenerate = async () => {
    if (generationRequestRef.current) return;

    if (!selectedFile) {
      setError(t('errors.selectFile'));
      return;
    }

    generationRequestRef.current = true;
    setIsProcessing(true);
    setError(null);
    setStatusMessage(t('status.checkingQuota'));

    try {
      const quota = await checkQuota(user?.id || null, user?.is_anonymous || false);
      if (quota.remaining <= 0) {
        throw new Error(t('errors.quotaFull'));
      }

      setStatusMessage(t('status.uploading'));
      const formData = new FormData();
      formData.append('image_file', selectedFile);
      if (userApiConfigRequired) {
        formData.append('chat_api_url', apiUrl.trim());
        formData.append('api_key', apiKey.trim());
        formData.append('gen_fig_model', genFigModel);
        formData.append('vlm_model', vlmModel);
      }
      formData.append('email', user?.id || user?.email || '');

      setStatusMessage(t('status.processing'));
      const res = await backendFetch(`${API_BASE}/api/v1/image2drawio/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let msg = t('errors.apiFail');
        try {
          const errBody = await res.json();
          if (errBody?.error) msg = errBody.error;
        } catch { /* ignore parse error */ }
        throw new Error(msg);
      }

      const data = await res.json();

      if (!data?.success || !data?.xml_content) {
        throw new Error(data?.error || t('errors.apiFail'));
      }

      setXmlContent(data.xml_content);
      setFilePath(data.file_path || '');
      setStatusMessage(data.fallback_used ? t('status.fallback') : t('status.complete'));

      await recordUsage(user?.id || null, 'image2drawio', { isAnonymous: user?.is_anonymous || false });
      if (refreshQuota) refreshQuota();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.apiFail');
      setError(message);
    } finally {
      generationRequestRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleCopyXml = async () => {
    if (!xmlContent) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(xmlContent);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = xmlContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopySuccess(t('actions.copied'));
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('copy xml failed', err);
    }
  };

  const handleDownload = () => {
    if (!xmlContent) return;
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name?.split('.')[0] || 'diagram'}.drawio`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const requestDrawioExport = useCallback(
    (format: 'xml' | 'png' | 'svg') => {
      if (!drawioReady) {
        return Promise.reject(new Error('Draw.io not ready'));
      }

      return new Promise<string>((resolve, reject) => {
        pendingExportRef.current = { resolve, reject, format };
        postToDrawio({ action: 'export', format });
        window.setTimeout(() => {
          if (pendingExportRef.current.resolve === resolve) {
            pendingExportRef.current = { resolve: null, reject: null, format: null };
            reject(new Error('Export timeout'));
          }
        }, DRAWIO_EXPORT_TIMEOUT_MS);
      });
    },
    [drawioReady, postToDrawio],
  );

  const parseXmlForAnimation = useCallback((xml: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      if (doc.querySelector('parsererror')) return null;
      const root =
        doc.querySelector('mxGraphModel > root') ||
        doc.querySelector('root');
      if (!root) return null;

      const rootCells = Array.from(root.children).filter(
        node => node.nodeName === 'mxCell'
      ) as Element[];
      if (!rootCells.length) return null;

      const baseCells = rootCells.filter(cell => {
        const id = cell.getAttribute('id');
        return id === '0' || id === '1';
      });
      const normalCells = rootCells.filter(cell => {
        const id = cell.getAttribute('id');
        return id !== '0' && id !== '1';
      });
      const nonEdges = normalCells.filter(cell => cell.getAttribute('edge') !== '1');
      const edges = normalCells.filter(cell => cell.getAttribute('edge') === '1');
      const orderedCells = [...nonEdges, ...edges];

      return { doc, baseCells, orderedCells };
    } catch {
      return null;
    }
  }, []);

  const buildXmlWithCells = useCallback((sourceDoc: Document, cells: Element[]) => {
    const docClone = sourceDoc.cloneNode(true) as Document;
    const root =
      docClone.querySelector('mxGraphModel > root') ||
      docClone.querySelector('root');
    if (!root) return '';
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    for (const cell of cells) {
      root.appendChild(docClone.importNode(cell, true));
    }
    return new XMLSerializer().serializeToString(docClone);
  }, []);

  const animateDrawioLoad = useCallback(
    async (xml: string) => {
      const parsed = parseXmlForAnimation(xml);
      if (!parsed) {
        postToDrawio({ action: 'load', xml, autosave: 1 });
        lastLoadedXmlRef.current = xml;
        setTimeout(() => requestDrawioFit(), 120);
        return;
      }

      const { doc, baseCells, orderedCells } = parsed;
      const total = orderedCells.length;
      const batchSize =
        total > DRAWIO_ANIMATE_MAX_CELLS ? DRAWIO_ANIMATE_LARGE_BATCH : 1;
      const token = ++animationTokenRef.current;
      isAnimatingRef.current = true;

      for (let i = 0; i < total; i += batchSize) {
        if (animationTokenRef.current !== token) return;
        const subset = orderedCells.slice(0, Math.min(i + batchSize, total));
        const autosave = i + batchSize >= total ? 1 : 0;
        const partialXml = buildXmlWithCells(doc, [...baseCells, ...subset]);
        if (!partialXml) break;
        postToDrawio({ action: 'load', xml: partialXml, autosave });
        setTimeout(() => requestDrawioFit(), 80);
        await new Promise(resolve => setTimeout(resolve, DRAWIO_ANIMATE_STEP_MS));
      }

      if (animationTokenRef.current === token) {
        lastLoadedXmlRef.current = xml;
        isAnimatingRef.current = false;
        setTimeout(() => requestDrawioFit(), 120);
      }
    },
    [buildXmlWithCells, parseXmlForAnimation, postToDrawio, requestDrawioFit]
  );

  const downloadExportData = useCallback((data: string, format: 'png' | 'svg', filename: string) => {
    let url = '';
    let shouldRevoke = false;
    const trimmed = data.trim();

    if (trimmed.startsWith('data:')) {
      url = trimmed;
    } else if (format === 'png') {
      url = `data:image/png;base64,${trimmed}`;
    } else if (trimmed.startsWith('<svg')) {
      const blob = new Blob([trimmed], { type: 'image/svg+xml' });
      url = URL.createObjectURL(blob);
      shouldRevoke = true;
    } else {
      url = `data:image/svg+xml;base64,${trimmed}`;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (shouldRevoke) {
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!xmlContent || isExporting) return;
    setIsExporting(true);
    const safeName = exportFilename.trim() || 'diagram';

    if (exportFormat === 'drawio') {
      handleDownload();
      setIsExporting(false);
      return;
    }

    try {
      const exportData = await requestDrawioExport(exportFormat);
      if (exportData) {
        downloadExportData(exportData, exportFormat, `${safeName}.${exportFormat}`);
      }
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setIsExporting(false);
    }
  }, [
    xmlContent,
    isExporting,
    exportFormat,
    exportFilename,
    handleDownload,
    requestDrawioExport,
    downloadExportData,
  ]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!DRAWIO_ORIGINS.has(event.origin) || typeof event.data !== 'string') return;
      let message: { event?: string; xml?: string; data?: string } = {};
      try {
        message = JSON.parse(event.data) as { event?: string; xml?: string; data?: string };
      } catch {
        return;
      }

      if (message.event === 'init' || message.event === 'ready') {
        setDrawioReady(true);
        postToDrawio({
          action: 'configure',
          config: {
            sidebar: false,
            format: false,
            layers: false,
            menubar: false,
            toolbar: false,
            status: false,
          },
        });
        return;
      }

      if ((message.event === 'save' || message.event === 'autosave') && typeof message.xml === 'string') {
        if (isAnimatingRef.current) return;
        lastLoadedXmlRef.current = message.xml;
        setXmlContent(message.xml);
        return;
      }

      if (message.event === 'export' && pendingExportRef.current.resolve && typeof message.data === 'string') {
        const resolver = pendingExportRef.current.resolve;
        pendingExportRef.current = { resolve: null, reject: null, format: null };
        resolver(message.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!drawioReady || !xmlContent) return;
    if (xmlContent === lastLoadedXmlRef.current) return;
    animateDrawioLoad(xmlContent);
  }, [drawioReady, xmlContent, animateDrawioLoad]);

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-medium bg-white px-3 py-1 text-xs font-medium text-lab-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${drawioReady ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-500'}`} />
              {t('badge')}
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.035em] text-lab-primary">{t('title')}</h1>
            <p className="text-base leading-7 text-lab-secondary">{t('subtitle')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] mt-6" style={{ minHeight: '720px' }}>
          <div className="flex flex-col gap-4">
            {/* Upload Panel */}
            <div className="bento-card scan-line p-5">
              <h3 className="text-sm font-display font-bold text-lab-primary mb-3 flex items-center gap-2">
                <UploadCloud className="text-neon-cyan" size={18} />
                {t('upload.title')}
              </h3>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-6 text-center transition-all ${
                  isDragOver ? 'border-neon-cyan/60 bg-neon-cyan/10' : 'border-border-medium bg-surface-base/30'
                }`}
              >
                {selectedFile ? (
                  <>
                    <FileImage className="h-10 w-10 text-neon-cyan" />
                    <div className="text-sm text-lab-primary">{selectedFile.name}</div>
                    <div className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-neon-cyan hover:text-neon-cyan/80"
                    >
                      {t('actions.clear')}
                    </button>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 text-neon-cyan" />
                    <p className="text-sm text-lab-secondary">{t('upload.drag')}</p>
                    <label className="btn-neon glow text-xs cursor-pointer">
                      {t('upload.button')}
                      <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleFileChange} />
                    </label>
                    <p className="text-xs text-slate-500">{t('upload.hint')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Config Panel */}
            <div className="bento-card scan-line p-5">
              <h3 className="text-sm font-display font-bold text-lab-primary mb-3 flex items-center gap-2">
                <Sparkles className="text-neon-purple" size={18} />
                {t('config.title')}
              </h3>
              <div className="space-y-3">
                {userApiConfigRequired ? (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-slate-400">{t('config.apiUrl')}</label>
                      <QRCodeTooltip>
                        <a
                          href={getPurchaseUrl(apiUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whitespace-nowrap text-[10px] text-neon-cyan hover:text-neon-cyan/80 hover:underline px-1"
                        >
                          {t('config.buyLink')}
                        </a>
                      </QRCodeTooltip>
                    </div>
                    <select
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="neon-select w-full"
                    >
                      {API_URL_OPTIONS.map((url: string) => (
                        <option key={url} value={url}>{url}</option>
                      ))}
                    </select>

                    <label className="block text-xs text-slate-400 flex items-center gap-1">
                      <Key size={12} /> {t('config.apiKey')}
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="neon-input w-full"
                    />
                  </>
                ) : (
                  <ManagedApiNotice />
                )}

                <label className="block text-xs text-slate-400 flex items-center gap-1 mb-1">
                  <ImageIcon size={12} /> {t('config.genModel')}
                </label>
                <select
                  value={genFigModel}
                  onChange={(e) => setGenFigModel(e.target.value)}
                  disabled={!userApiConfigRequired}
                  className="neon-select w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {genFigModelOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {!userApiConfigRequired && (
                  <p className="mt-2 text-[11px] leading-5 text-emerald-700">Free 模式下由后端统一选择 DrawIO 转换使用的视觉模型。</p>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="status-error flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Status */}
            {statusMessage && !error && (
              <div className="status-warning flex items-center gap-2 text-sm">
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing}
              aria-busy={isProcessing}
              className="btn-neon glow w-full py-3"
            >
              {isProcessing && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              <span aria-live="polite">
                {isProcessing ? t('actions.processing') : t('actions.generate')}
              </span>
            </button>
          </div>

          {/* Right column: Preview + XML */}
          <div className="flex flex-col gap-4">
            {/* Preview Panel */}
            <div className="bento-card scan-line p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-display font-bold text-lab-primary flex items-center gap-2">
                  <Wand2 className="text-neon-purple" size={18} />
                  {t('preview.title')}
                </h3>
                {xmlContent && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Export format tabs */}
                    <div className="flex items-center gap-1 rounded-full border border-border-medium bg-surface-base/40 p-1">
                      {(['drawio', 'svg', 'png'] as const).map(format => (
                        <button
                          key={format}
                          onClick={() => setExportFormat(format)}
                          className={`px-3 py-1 text-xs rounded-full transition ${
                            exportFormat === format
                              ? 'bg-neon-cyan/20 text-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                              : 'text-lab-muted hover:text-blue-700'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {/* Filename input */}
                    <div className="flex items-center rounded-xl border border-border-medium bg-surface-base/40 px-3 py-2">
                      <input
                        type="text"
                        value={exportFilename}
                        onChange={e => setExportFilename(e.target.value)}
                        className="w-24 bg-transparent text-xs text-lab-primary placeholder-slate-400 outline-none"
                        placeholder="diagram"
                      />
                      <span className="ml-2 text-xs text-slate-400">.{exportFormat}</span>
                    </div>
                    {/* Export button */}
                    <button
                      onClick={handleExport}
                      disabled={isExporting || isProcessing}
                      className="toolbar-btn toolbar-btn-label"
                    >
                      {isExporting ? <div className="w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" /> : <Download size={14} />}
                      {t('actions.download')}
                    </button>
                    {filePath && (
                      <button
                        onClick={() => {
                          const relative = filePath.includes('outputs/')
                            ? filePath.split('outputs/')[1]
                            : filePath;
                          window.open(`${API_BASE}/outputs/${relative}`, '_blank');
                        }}
                        className="toolbar-btn toolbar-btn-label"
                      >
                        <ExternalLink size={14} />
                        {t('actions.open')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* DrawIO iframe area */}
              <div className={`mt-4 flex-1 bg-[#060914] rounded-2xl border border-border-medium min-h-[420px] lg:min-h-[720px] overflow-hidden ${xmlContent ? 'relative block' : 'flex items-center justify-center'}`}>
                {xmlContent ? (
                  <iframe
                    ref={iframeRef}
                    src="https://embed.diagrams.net/?embed=1&spin=1&proto=json&autosave=1&saveAndExit=0&noSaveBtn=1&noExitBtn=1&sidebar=0&layers=0&toolbar=0&menubar=0&status=0&format=0"
                    className="absolute inset-0 w-full h-full border-0"
                    title="draw.io editor"
                  />
                ) : (
                  <div className="empty-state">
                    <FileImage className="w-12 h-12 mx-auto text-neon-cyan/30 mb-3" />
                    <p className="text-sm text-slate-500">{t('preview.placeholder')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* XML Panel */}
            <div className="bento-card scan-line p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-display font-bold text-lab-primary flex items-center gap-2">
                  <Wand2 className="text-neon-purple" size={18} />
                  {t('xml.title')}
                </h3>
                <button
                  onClick={handleCopyXml}
                  disabled={!xmlContent}
                  className="toolbar-btn toolbar-btn-label text-xs"
                >
                  <Copy size={12} />
                  {copySuccess || t('actions.copy')}
                </button>
              </div>
              <textarea
                value={xmlContent}
                readOnly
                placeholder={t('xml.placeholder')}
                className="neon-textarea w-full h-48"
              />
            </div>
          </div>
        </div>

        <CasesSection
          title={t('cases.title')}
          subtitle={t('cases.subtitle')}
          feishuLabel={t('cases.feishu')}
          feishuUrl={FEISHU_DOC_URL}
          tone="amber"
          columns={1}
          cases={[
            {
              title: t('cases.items.case1Title'),
              description: t('cases.items.case1Desc'),
              image: '/drawIO/image2drawio1.png',
            },
            {
              title: t('cases.items.case2Title'),
              description: t('cases.items.case2Desc'),
              image: '/drawIO/image2drawio2.png',
            },
          ]}
        />
      </div>
    </div>
  );
};

export default Image2DrawioPage;
