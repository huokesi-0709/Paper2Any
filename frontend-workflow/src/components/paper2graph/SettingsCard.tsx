import React, { useState, useRef, useEffect } from 'react';
import { Settings2, ChevronUp, ChevronDown, Loader2, Download, Info, CheckCircle2, AlertCircle, ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCodeTooltip from '../QRCodeTooltip';
import ManagedApiNotice from '../ManagedApiNotice';
import { GraphType, Language, StyleType, FigureComplex } from './types';
import { GENERATION_STAGES, TECH_ROUTE_PALETTES, TECH_ROUTE_TEMPLATES } from './constants';
import { API_URL_OPTIONS, getPurchaseUrl } from '../../config/api';
import {
  DEFAULT_PAPER2FIGURE_MODELS,
  PAPER2FIGURE_EXP_DATA_MODELS,
  PAPER2FIGURE_MODEL_ARCH_MODELS,
  PAPER2FIGURE_TECH_ROUTE_MODELS,
  withModelOptions,
} from '../../config/models';

interface SettingsCardProps {
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  llmApiUrl: string;
  setLlmApiUrl: (url: string) => void;
  setModel: (model: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  graphType: GraphType;
  figureComplex: FigureComplex;
  setFigureComplex: (complex: FigureComplex) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  style: StyleType;
  setStyle: (style: StyleType) => void;
  resolution: '2K' | '4K';
  setResolution: (resolution: '2K' | '4K') => void;
  isLoading: boolean;
  isSubmitLocked: boolean;
  handleSubmit: () => void;
  currentStage: number;
  stageProgress: number;
  downloadUrl: string | null;
  lastFilename: string;
  pptPath: string | null;
  svgPath: string | null;
  svgPreviewPath: string | null;
  svgBwPath: string | null;
  svgColorPath: string | null;
  techRoutePalette: string;
  setTechRoutePalette: (palette: string) => void;
  techRouteTemplate: string;
  setTechRouteTemplate: (templateId: string) => void;
  referenceImage: File | null;
  setReferenceImage: (file: File | null) => void;
  referenceImagePreview: string | null;
  setReferenceImagePreview: (url: string | null) => void;
  isValidating: boolean;
  error: string | null;
  successMessage: string | null;
  showApiConfig: boolean;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  showAdvanced,
  setShowAdvanced,
  llmApiUrl,
  setLlmApiUrl,
  setModel,
  apiKey,
  setApiKey,
  model,
  graphType,
  figureComplex,
  setFigureComplex,
  language,
  setLanguage,
  style,
  setStyle,
  resolution,
  setResolution,
  isLoading,
  isSubmitLocked,
  handleSubmit,
  currentStage,
  stageProgress,
  downloadUrl,
  lastFilename,
  pptPath,
  svgPath,
  svgPreviewPath,
  svgBwPath,
  svgColorPath,
  techRoutePalette,
  setTechRoutePalette,
  techRouteTemplate,
  setTechRouteTemplate,
  referenceImage,
  setReferenceImage,
  referenceImagePreview,
  setReferenceImagePreview,
  isValidating,
  error,
  successMessage,
  showApiConfig,
}) => {
  const { t } = useTranslation('paper2graph');
  const selectedPalette = TECH_ROUTE_PALETTES.find(p => p.id === techRoutePalette) || TECH_ROUTE_PALETTES[0];
  const defaultModelForType = DEFAULT_PAPER2FIGURE_MODELS[graphType] || DEFAULT_PAPER2FIGURE_MODELS.model_arch;
  const baseModelOptions = graphType === 'tech_route'
    ? PAPER2FIGURE_TECH_ROUTE_MODELS
    : graphType === 'exp_data'
      ? PAPER2FIGURE_EXP_DATA_MODELS
      : PAPER2FIGURE_MODEL_ARCH_MODELS;
  const modelOptions = withModelOptions(baseModelOptions, model);

  const [paletteDropdownOpen, setPaletteDropdownOpen] = useState(false);
  const paletteDropdownRef = useRef<HTMLDivElement>(null);
  const [templatePreview, setTemplatePreview] = useState<{ src: string; label: string } | null>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteDropdownRef.current && !paletteDropdownRef.current.contains(event.target as Node)) {
        setPaletteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAccentClass = () => {
    if (graphType === 'model_arch') return 'from-neon-cyan to-neon-purple';
    if (graphType === 'tech_route') return 'from-neon-purple to-neon-pink';
    return 'from-neon-pink to-neon-cyan';
  };

  return (
    <div className="bento-card p-5 scan-line">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />

      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center justify-between gap-2 mb-2 w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-neon-cyan" />
          <span className="font-mono text-sm font-semibold text-lab-primary">{t('advanced.title')}</span>
        </div>
        {showAdvanced ? (
          <ChevronUp size={16} className="text-lab-muted" />
        ) : (
          <ChevronDown size={16} className="text-lab-muted" />
        )}
      </button>

      {showAdvanced && (
        <div className="space-y-3">
          {showApiConfig ? (
            <>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                  {t('advanced.apiUrlLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={llmApiUrl}
                    onChange={e => setLlmApiUrl(e.target.value)}
                    className="flex-1 rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 font-mono"
                  >
                    {API_URL_OPTIONS.map((url: string) => (
                      <option key={url} value={url}>{url}</option>
                    ))}
                  </select>
                  <QRCodeTooltip>
                    <a
                      href={getPurchaseUrl(llmApiUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap text-[10px] text-neon-cyan hover:text-blue-800 hover:underline px-2 font-mono"
                    >
                      {t('advanced.buyLink')}
                    </a>
                  </QRCodeTooltip>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                  {t('advanced.apiKeyLabel')}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={t('advanced.apiKeyPlaceholder')}
                  className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 font-mono"
                />
              </div>
            </>
          ) : (
            <ManagedApiNotice />
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
              {t('advanced.modelLabel')}
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={!showApiConfig || llmApiUrl === 'http://123.129.219.111:3000/v1'}
              className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 disabled:opacity-50 font-mono"
            >
              {modelOptions.map((option) => (
                <option key={option} value={option}>
                  {option === defaultModelForType ? `${option} (Default)` : option}
                </option>
              ))}
            </select>
            {llmApiUrl === 'http://123.129.219.111:3000/v1' && (
              <p className="text-[10px] text-lab-dim mt-1 font-mono">{t('advanced.modelOnlyHint')}</p>
            )}
            {!showApiConfig && (
              <p className="text-[10px] text-lab-dim mt-1 font-mono">Free mode uses a backend-selected model.</p>
            )}
          </div>

          {graphType === 'model_arch' ? (
            <>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                  {t('advanced.figureComplexLabel')}
                </label>
                <select
                  value={figureComplex}
                  onChange={e => setFigureComplex(e.target.value as FigureComplex)}
                  className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 font-mono"
                >
                  <option value="easy">{t('advanced.figureComplex.easy')}</option>
                  <option value="mid">{t('advanced.figureComplex.mid')}</option>
                  <option value="hard">{t('advanced.figureComplex.hard')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                  {t('advanced.languageLabel')}
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as Language)}
                  className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 font-mono"
                >
                  <option value="zh">{t('advanced.language.zh')}</option>
                  <option value="en">{t('advanced.language.en')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                  {t('advanced.resolutionLabel')}
                </label>
                <select
                  value={resolution}
                  onChange={e => setResolution(e.target.value as '2K' | '4K')}
                  className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 font-mono"
                >
                  <option value="2K">{t('advanced.resolution.2k')}</option>
                  <option value="4K">{t('advanced.resolution.4k')}</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                {t('advanced.languageLabel')}
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as Language)}
                className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 font-mono"
              >
                <option value="zh">{t('advanced.language.zh')}</option>
                <option value="en">{t('advanced.language.en')}</option>
              </select>
            </div>
          )}

          {/* Style selector (not shown for tech_route) */}
          {graphType !== 'tech_route' && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                {t('advanced.styleLabel')}
              </label>
              <select
                value={style}
                onChange={e => setStyle(e.target.value as StyleType)}
                className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 font-mono"
              >
                <option value="cartoon">{t('advanced.style.cartoon')}</option>
                {graphType !== 'exp_data' && <option value="realistic">{t('advanced.style.realistic')}</option>}
                {graphType !== 'exp_data' && <option value="3d">{t('advanced.style.3d')}</option>}
                {graphType !== 'exp_data' && <option value="flat_2.5d">{t('advanced.style.flat_2.5d')}</option>}
                {graphType !== 'exp_data' && <option value="line_art">{t('advanced.style.line_art')}</option>}
                {graphType !== 'exp_data' && <option value="low_poly">{t('advanced.style.low_poly')}</option>}
                {graphType !== 'exp_data' && <option value="neon_glow">{t('advanced.style.neon_glow')}</option>}
                {graphType === 'exp_data' && <option value="Low Poly 3D">{t('advanced.style.lowPoly')}</option>}
                {graphType === 'exp_data' && <option value="blocky LEGO aesthetic">{t('advanced.style.lego')}</option>}
              </select>
            </div>
          )}

          {/* Tech Route template selector */}
          {graphType === 'tech_route' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted">
                {t('techRoute.templateLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TECH_ROUTE_TEMPLATES.map((tpl) => {
                  const isActive = techRouteTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id || 'auto'}
                      type="button"
                      onClick={() => setTechRouteTemplate(tpl.id)}
                      className={`rounded-bento-sm border text-left transition-all overflow-hidden ${
                        isActive
                          ? `border-neon-purple/40 bg-neon-purple-dim`
                          : 'border-border-subtle bg-surface-base/40 hover:bg-white/5'
                      }`}
                    >
                      <div className="p-2">
                        <div className="relative overflow-hidden rounded-bento-sm border border-border-subtle bg-surface-base/60 h-20 flex items-center justify-center group">
                          {tpl.preview ? (
                            <img
                              src={tpl.preview}
                              alt={t(tpl.labelKey)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-[10px] text-lab-dim px-2 text-center">
                              {t('techRoute.templateAuto')}
                            </div>
                          )}
                          {tpl.preview && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplatePreview({ src: tpl.preview, label: t(tpl.labelKey) });
                              }}
                              className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-surface-base/70 text-white border border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {t('techRoute.templateZoom')}
                            </button>
                          )}
                          {isActive && (
                            <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-neon-purple/70 text-white font-mono">
                              {t('techRoute.templateSelected')}
                            </span>
                          )}
                        </div>
                        <div className={`mt-1 text-[10px] ${isActive ? 'text-neon-purple font-medium' : 'text-lab-secondary'}`}>
                          {t(tpl.labelKey)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-lab-dim font-mono">{t('techRoute.templateHint')}</p>
            </div>
          )}

          {/* Tech Route color palette selector */}
          {graphType === 'tech_route' && (
            <div ref={paletteDropdownRef} className="relative">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                {t('techRoute.paletteLabel')}
              </label>
              <button
                type="button"
                onClick={() => setPaletteDropdownOpen(!paletteDropdownOpen)}
                className="w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-3 py-2 text-xs text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 flex items-center justify-between font-mono"
              >
                <div className="flex items-center gap-2">
                  <span>{selectedPalette.label}</span>
                  {selectedPalette.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {selectedPalette.colors.map(color => (
                        <span
                          key={color}
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <ChevronDown size={14} className={`transition-transform ${paletteDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {paletteDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 rounded-bento-sm border border-border-subtle bg-surface-card shadow-bento max-h-48 overflow-y-auto">
                  {TECH_ROUTE_PALETTES.map(palette => (
                    <button
                      key={palette.id || 'none'}
                      type="button"
                      onClick={() => {
                        setTechRoutePalette(palette.id);
                        setPaletteDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 transition-colors ${
                        techRoutePalette === palette.id ? 'bg-neon-cyan-dim text-neon-cyan' : 'text-lab-secondary'
                      }`}
                    >
                      <span className="flex-shrink-0">{palette.label}</span>
                      {palette.colors.length > 0 && (
                        <div className="flex items-center gap-1 ml-auto">
                          {palette.colors.map(color => (
                            <span
                              key={color}
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tech Route reference image upload */}
          {graphType === 'tech_route' && (
            <div className="mt-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-1">
                Reference Image (Optional)
              </label>
              <div className="border border-dashed border-border-medium rounded-bento-sm p-3">
                {referenceImagePreview ? (
                  <div className="relative">
                    <img
                      src={referenceImagePreview}
                      alt="Reference Preview"
                      className="max-h-32 rounded-bento-sm mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReferenceImage(null);
                        setReferenceImagePreview(null);
                      }}
                      className="absolute top-1 right-1 bg-neon-pink/80 hover:bg-neon-pink rounded-full p-1 transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer py-2">
                    <ImageIcon size={24} className="text-lab-dim mb-1" />
                    <span className="text-[11px] text-lab-dim font-mono">Upload reference image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                          if (!allowedTypes.includes(file.type)) {
                            alert('Only PNG, JPG, WebP images are supported. SVG is not allowed.');
                            e.target.value = '';
                            return;
                          }
                          setReferenceImage(file);
                          setReferenceImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-lab-dim mt-1 font-mono">
                Upload a reference image to guide the layout style of the generated diagram.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto space-y-3 pt-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || isValidating || isSubmitLocked}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-bento-sm bg-gradient-to-r ${getAccentClass()} text-white text-sm font-mono font-semibold py-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed glow`}
        >
          {(isLoading || isValidating || isSubmitLocked) ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>{(isLoading || isValidating || isSubmitLocked) ? t('submit.buttonLoading') : t('submit.buttonIdle')}</span>
        </button>

        <div className="flex items-start gap-2 text-xs text-lab-secondary bg-neon-cyan-dim border border-neon-cyan/20 rounded-bento-sm px-3 py-2">
          <Info size={14} className="mt-0.5 text-neon-cyan flex-shrink-0" />
          <p className="font-mono">{t('submit.hintText')}</p>
        </div>

        {/* Generation progress */}
        {isLoading && !error && !successMessage && (
          <div className="flex flex-col gap-3 mt-2 text-xs rounded-bento-sm border border-neon-cyan/30 bg-neon-cyan-dim px-3 py-3">
            <div className="flex items-center gap-2 text-neon-cyan">
              <Loader2 size={14} className="animate-spin" />
              <span className="font-medium font-mono">{GENERATION_STAGES[currentStage].message}</span>
            </div>

            <div className="flex gap-1">
              {GENERATION_STAGES.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    index < currentStage
                      ? 'bg-neon-cyan'
                      : index === currentStage
                      ? 'bg-gradient-neon opacity-60'
                      : 'bg-border-subtle'
                  }`}
                  style={{
                    width: index === currentStage ? `${stageProgress}%` : undefined,
                  }}
                />
              ))}
            </div>

            <div className="space-y-1.5 text-[11px] text-lab-secondary/80">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${currentStage >= 0 ? 'bg-neon-cyan animate-pulse' : 'bg-border-subtle'}`} />
                <span className={currentStage >= 0 ? 'text-neon-cyan font-medium' : ''} font-mono>
                  {t('progress.stage1')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${currentStage >= 1 ? 'bg-neon-cyan animate-pulse' : 'bg-border-subtle'}`} />
                <span className={currentStage >= 1 ? 'text-neon-cyan font-medium' : ''} font-mono>
                  {t('progress.stage2')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${currentStage >= 2 ? 'bg-neon-cyan animate-pulse' : 'bg-border-subtle'}`} />
                <span className={currentStage >= 2 ? 'text-neon-cyan font-medium' : ''} font-mono>
                  {t('progress.stage3')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${currentStage >= 3 ? 'bg-neon-cyan animate-pulse' : 'bg-border-subtle'}`} />
                <span className={currentStage >= 3 ? 'text-neon-cyan font-medium' : ''} font-mono>
                  {t('progress.stage4')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-lab-dim pt-1 border-t border-neon-cyan/10 font-mono">
              {t('progress.eta')}
            </p>
          </div>
        )}

        {downloadUrl && (
          <button
            type="button"
            onClick={() => {
              if (!downloadUrl) return;
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = lastFilename;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-bento-sm border border-emerald-400/40 text-emerald-300 text-xs py-2 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all font-mono"
          >
            <CheckCircle2 size={14} />
            <span>{t('download.reDownload', { filename: lastFilename })}</span>
          </button>
        )}

        {graphType === 'tech_route' && (pptPath || svgPath || svgPreviewPath || svgBwPath || svgColorPath) && (
          <div className="mt-2 space-y-2">
            {(svgBwPath || svgPath) && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    const bwPath = svgBwPath || svgPath;
                    if (!bwPath) return;
                    try {
                      const response = await fetch(bwPath);
                      const svgText = await response.text();
                      const blob = new Blob([svgText], { type: 'image/svg+xml' });
                      const blobUrl = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      a.download = bwPath.split('/').pop() || 'tech_route_bw.svg';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(blobUrl);
                    } catch {
                      window.open(bwPath, '_blank');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-bento-sm border border-neon-cyan/40 text-neon-cyan text-xs py-2 bg-neon-cyan-dim hover:bg-neon-cyan-dim/30 transition-all font-mono"
                >
                  <ImageIcon size={14} />
                  <span>BW SVG Download</span>
                </button>
                <div className="text-[11px] text-lab-secondary bg-surface-base/60 border border-border-subtle rounded-bento-sm px-2 py-1.5">
                  <div className="font-semibold text-lab-primary font-mono">BW SVG Link:</div>
                  <div className="mt-1 break-all text-neon-cyan select-all cursor-text font-mono text-[10px] leading-tight p-1 bg-surface-base/80 rounded">
                    {svgBwPath || svgPath}
                  </div>
                </div>
              </>
            )}

            {svgColorPath && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch(svgColorPath);
                      const svgText = await response.text();
                      const blob = new Blob([svgText], { type: 'image/svg+xml' });
                      const blobUrl = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      a.download = svgColorPath.split('/').pop() || 'tech_route_color.svg';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(blobUrl);
                    } catch {
                      window.open(svgColorPath, '_blank');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-bento-sm border border-neon-pink/40 text-neon-pink text-xs py-2 bg-neon-pink-dim hover:bg-neon-pink-dim/30 transition-all font-mono"
                >
                  <ImageIcon size={14} />
                  <span>Color SVG Download</span>
                </button>
                <div className="text-[11px] text-lab-secondary bg-surface-base/60 border border-border-subtle rounded-bento-sm px-2 py-1.5">
                  <div className="font-semibold text-lab-primary font-mono">Color SVG Link:</div>
                  <div className="mt-1 break-all text-neon-pink select-all cursor-text font-mono text-[10px] leading-tight p-1 bg-surface-base/80 rounded">
                    {svgColorPath}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isValidating && (
          <div className="flex items-start gap-2 text-xs text-neon-cyan bg-neon-cyan-dim border border-neon-cyan/30 rounded-bento-sm px-3 py-2 mt-1 animate-pulse">
            <Loader2 size={14} className="mt-0.5 animate-spin" />
            <p className="font-mono">{t('validating.apiKey')}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-neon-pink bg-neon-pink-dim border border-neon-pink/30 rounded-bento-sm px-3 py-2 mt-1">
            <AlertCircle size={14} className="mt-0.5" />
            <p className="font-mono">{error}</p>
          </div>
        )}

        {successMessage && !error && (
          <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-bento-sm px-3 py-2 mt-1">
            <CheckCircle2 size={14} className="mt-0.5" />
            <p className="font-mono">{successMessage}</p>
          </div>
        )}
      </div>

      {templatePreview && (
        <div
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setTemplatePreview(null)}
        >
          <div
            className="max-w-4xl w-full bg-surface-card border border-border-subtle rounded-bento-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-lab-primary font-mono">{templatePreview.label}</div>
              <button
                type="button"
                onClick={() => setTemplatePreview(null)}
                className="text-xs px-2 py-1 rounded-bento-sm bg-surface-base/60 hover:bg-white/5 text-lab-secondary"
              >
                {t('techRoute.templateClose')}
              </button>
            </div>
            <div className="w-full max-h-[70vh] overflow-auto rounded-bento-sm border border-border-subtle bg-surface-base/60">
              <img
                src={templatePreview.src}
                alt={templatePreview.label}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsCard;
