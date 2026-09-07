import React from 'react';
import { ImageIcon, MessageSquare, Loader2, RotateCcw, Download, ExternalLink } from 'lucide-react';
import { GraphType, FigureComplex, Language } from './types';
import { backendFetch, normalizeBackendAssetUrl } from '../../services/backendClient';
import { JSON_API } from './constants';

interface PreviewSectionProps {
  graphType: GraphType;
  graphStep: 'input' | 'preview';
  previewImgUrl: string | null;
  setPreviewImgUrl: (url: string | null) => void;
  setGraphStep: (step: 'input' | 'preview') => void;
  editPrompt: string;
  setEditPrompt: (prompt: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  model: string;
  llmApiUrl: string;
  apiKey: string;
  email: string;
  figureComplex: FigureComplex;
  language: Language;
  showDrawioButton?: boolean;
  drawioLoading?: boolean;
  onConvertToDrawio?: () => void;
  drawioLabel?: string;
  onReset?: () => void;
  userApiConfigRequired: boolean;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({
  graphType,
  graphStep,
  previewImgUrl,
  setPreviewImgUrl,
  setGraphStep,
  editPrompt,
  setEditPrompt,
  isLoading,
  setIsLoading,
  setError,
  model,
  llmApiUrl,
  apiKey,
  email,
  figureComplex,
  language,
  showDrawioButton,
  drawioLoading,
  onConvertToDrawio,
  drawioLabel,
  onReset,
  userApiConfigRequired,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const previewActionGuardRef = React.useRef(false);
  const [isPreviewActionLocked, setIsPreviewActionLocked] = React.useState(false);
  const normalizedPreviewImgUrl = previewImgUrl ? normalizeBackendAssetUrl(previewImgUrl) : null;
  const previewImgSourceForBackend = normalizedPreviewImgUrl ? normalizedPreviewImgUrl.split('?')[0] : null;

  const lockPreviewAction = () => {
    if (previewActionGuardRef.current) {
      return false;
    }
    previewActionGuardRef.current = true;
    setIsPreviewActionLocked(true);
    return true;
  };

  const unlockPreviewAction = () => {
    previewActionGuardRef.current = false;
    setIsPreviewActionLocked(false);
  };

  React.useEffect(() => {
    setImgError(false);
  }, [normalizedPreviewImgUrl]);

  if (graphType !== 'model_arch' || graphStep === 'input' || !previewImgUrl) return null;
  return (
    <div className="bento-card scan-line mb-6 p-6 animate-fade-in relative overflow-hidden">
      {/* Neon top accent */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />

      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-display font-bold text-lab-primary flex items-center gap-2">
          <ImageIcon size={20} className="text-neon-cyan" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.6))' }} />
          模型结构图预览
        </h3>

        <button
          type="button"
          onClick={async () => {
            if (!normalizedPreviewImgUrl) return;
            try {
              const response = await fetch(normalizedPreviewImgUrl);
              if (!response.ok) throw new Error('下载失败');
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = `model_arch_preview_${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(blobUrl);
            } catch (downloadError) {
              console.error('Image download failed:', downloadError);
              window.open(normalizedPreviewImgUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          disabled={!normalizedPreviewImgUrl}
          className="toolbar-btn toolbar-btn-label"
        >
          <Download size={14} />
          下载图片
        </button>
      </div>

      {/* Preview image area */}
      <div className="neon-result w-full flex items-center justify-center overflow-hidden mb-6 p-4 min-h-[300px]">
        {imgError ? (
          <div className="empty-state">
            <ImageIcon size={48} className="mb-4 text-neon-pink/60" />
            <p className="mb-2 font-mono text-sm text-lab-secondary">图片加载失败</p>
            <p className="text-xs text-slate-500 text-center max-w-md break-all font-mono">{normalizedPreviewImgUrl}</p>
            <a
              href={normalizedPreviewImgUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 btn-neon-outline text-sm"
            >
              尝试在新标签页打开
            </a>
          </div>
        ) : (
          <img
            src={normalizedPreviewImgUrl || undefined}
            alt="模型结构图预览"
            className="max-w-full h-auto object-contain max-h-[600px] rounded-lg shadow-2xl"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Edit prompt + actions */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <MessageSquare size={14} className="text-neon-purple" />
            不满意？输入提示词微调重绘
          </label>
          <div className="relative">
            <input
              type="text"
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              placeholder="例如：把背景改成深色，增加一些连接线..."
              className="neon-input w-full pr-24"
            />
            <button
              type="button"
              onClick={async () => {
                if (!editPrompt.trim() || !previewImgSourceForBackend || isLoading) return;
                if (!lockPreviewAction()) return;

                try {
                  setIsLoading(true);
                  setError(null);

                  const formData = new FormData();
                  if (userApiConfigRequired) {
                    formData.append('img_gen_model_name', model);
                  }
                  if (userApiConfigRequired) {
                    formData.append('chat_api_url', llmApiUrl.trim());
                    formData.append('api_key', apiKey.trim());
                  }
                  formData.append('input_type', 'FIGURE');
                  formData.append('email', email);
                  formData.append('graph_type', 'model_arch');
                  formData.append('figure_complex', figureComplex);
                  formData.append('language', language);
                  formData.append('text', previewImgSourceForBackend);
                  formData.append('edit_prompt', editPrompt.trim());

                  const res = await backendFetch(JSON_API, {
                    method: 'POST',
                    body: formData,
                  });

                  if (!res.ok) throw new Error('重绘失败');

                  const data = await res.json();
                  if (!data.success) throw new Error('重绘失败');

                  let newImg = null;
                  const files = data.all_output_files ?? [];
                  const figPngs = files.filter((f: string) => /fig_/i.test(f) && /\.(png|jpg)$/i.test(f));
                  if (figPngs.length > 0) {
                    newImg = figPngs[0];
                  } else {
                    const pngs = files.filter((f: string) => /\.(png|jpg)$/i.test(f));
                    if (pngs.length > 0) newImg = pngs[0];
                  }

                  if (newImg) {
                    setPreviewImgUrl(normalizeBackendAssetUrl(newImg));
                    setEditPrompt('');
                  } else {
                    throw new Error('未获取到新生成的图片');
                  }

                } catch (e) {
                  const msg = e instanceof Error ? e.message : '重绘失败';
                  setError(msg);
                } finally {
                  setIsLoading(false);
                  unlockPreviewAction();
                }
              }}
              disabled={isLoading || isPreviewActionLocked || !editPrompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/40 text-xs text-neon-purple transition-colors disabled:opacity-50 font-mono"
            >
              {(isLoading || isPreviewActionLocked) ? <Loader2 size={12} className="animate-spin" /> : '重新生成'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setGraphStep('input');
              setPreviewImgUrl(null);
              setEditPrompt('');
              onReset?.();
            }}
            className="btn-neon-outline"
          >
            <RotateCcw size={16} />
            放弃
          </button>
          {showDrawioButton && (
            <button
              type="button"
              onClick={onConvertToDrawio}
              disabled={drawioLoading || isLoading || isPreviewActionLocked}
              className="btn-neon glow min-w-[200px]"
            >
              {drawioLoading ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
              {drawioLabel || '转成 DrawIO 在线编辑'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewSection;
