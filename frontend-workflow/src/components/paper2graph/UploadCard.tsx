import React, { ChangeEvent } from 'react';
import { FileText, Type, UploadCloud, Network, GitBranch, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UploadMode, GraphType, FileKind } from './types';
import { IMAGE_EXTENSIONS } from './constants';

interface UploadCardProps {
  graphType: GraphType;
  setGraphType: (type: GraphType) => void;
  allowedGraphTypes?: GraphType[];
  uploadMode: UploadMode;
  setUploadMode: (mode: UploadMode) => void;
  selectedFile: File | null;
  fileKind: FileKind;
  isDragOver: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  textContent: string;
  setTextContent: (text: string) => void;
}

const UploadCard: React.FC<UploadCardProps> = ({
  graphType,
  setGraphType,
  allowedGraphTypes,
  uploadMode,
  setUploadMode,
  selectedFile,
  fileKind,
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  textContent,
  setTextContent,
}) => {
  const { t } = useTranslation('paper2graph');

  const showFileHint = () => {
    if (!selectedFile) return t('upload.fileHint');
    if (fileKind === 'pdf') return `PDF: ${selectedFile.name}`;
    if (fileKind === 'image') return `Image: ${selectedFile.name}`;
    return `Unknown: ${selectedFile.name}`;
  };

  const graphTypeOptions: { value: GraphType; label: string; icon: React.ReactNode; accent: string }[] = [
    { value: 'model_arch', label: t('graphType.model_arch'), icon: <Network size={20} />, accent: 'cyan' },
    { value: 'tech_route', label: t('graphType.tech_route'), icon: <GitBranch size={20} />, accent: 'purple' },
    { value: 'exp_data', label: t('graphType.exp_data'), icon: <BarChart3 size={20} />, accent: 'pink' },
  ];
  const visibleGraphTypeOptions = allowedGraphTypes?.length
    ? graphTypeOptions.filter(option => allowedGraphTypes.includes(option.value))
    : graphTypeOptions;
  const gridColsClass =
    visibleGraphTypeOptions.length === 1
      ? 'md:grid-cols-1'
      : visibleGraphTypeOptions.length === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-3';

  const getAcceptTypes = () => {
    if (graphType === 'exp_data') {
      return '.pdf,' + IMAGE_EXTENSIONS.map(ext => '.' + ext).join(',');
    }
    return '.pdf';
  };

  const accentMap: Record<string, { active: string; icon: string }> = {
    cyan: {
      active: 'border-neon-cyan/40 bg-neon-cyan-dim text-neon-cyan',
      icon: 'text-neon-cyan',
    },
    purple: {
      active: 'border-neon-purple/40 bg-neon-purple-dim text-neon-purple',
      icon: 'text-neon-purple',
    },
    pink: {
      active: 'border-neon-pink/40 bg-neon-pink-dim text-neon-pink',
      icon: 'text-neon-pink',
    },
  };

  return (
    <div className="bento-card p-6 lg:p-7 scan-line">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />

      <div className="relative">
        {/* Graph Type Selector */}
        <div className="mb-6">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-2.5">
            {t('graphType.label')}
          </label>
          <div className={`grid grid-cols-1 ${gridColsClass} gap-2.5`}>
            {visibleGraphTypeOptions.map((option) => {
              const isActive = graphType === option.value;
              const accent = accentMap[option.accent] || accentMap.cyan;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGraphType(option.value)}
                  className={`relative group flex flex-col items-center justify-center gap-2 p-3.5 rounded-bento-sm border transition-all duration-300 overflow-hidden ${
                    isActive
                      ? `${accent.active} shadow-sm`
                      : 'border-border-subtle bg-surface-card text-lab-secondary hover:border-border-medium hover:bg-surface-card-hover hover:text-lab-primary'
                  }`}
                >
                  <div className={`transition-colors ${isActive ? accent.icon : 'text-lab-muted group-hover:text-neon-cyan'}`}>
                    {option.icon}
                  </div>
                  <span className="text-[11px] font-mono font-semibold tracking-wide text-center leading-tight">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Mode Tab */}
        <div className="mb-6">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted mb-2.5">
            {t('uploadTabs.label')}
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-base/60 rounded-bento-sm border border-border-subtle">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`relative group flex flex-col items-center justify-center gap-1 py-2.5 rounded-bento-sm transition-all duration-300 ${
                uploadMode === 'file'
                  ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-lab-muted hover:bg-slate-50 hover:text-lab-primary'
              }`}
            >
              <FileText size={18} className={uploadMode === 'file' ? 'text-neon-cyan' : ''} />
              <span className="text-xs font-mono font-semibold">{t('uploadTabs.file')}</span>
              <span className="text-[9px] uppercase tracking-wider text-lab-dim">{t('uploadTabs.fileSub')}</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('text')}
              className={`relative group flex flex-col items-center justify-center gap-1 py-2.5 rounded-bento-sm transition-all duration-300 ${
                uploadMode === 'text'
                  ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-lab-muted hover:bg-slate-50 hover:text-lab-primary'
              }`}
            >
              <Type size={18} className={uploadMode === 'text' ? 'text-neon-purple' : ''} />
              <span className="text-xs font-mono font-semibold">{t('uploadTabs.text')}</span>
              <span className="text-[9px] uppercase tracking-wider text-lab-dim">{t('uploadTabs.textSub')}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {uploadMode === 'file' && (
          <div
            className={`border-2 border-dashed rounded-bento p-8 flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 h-[280px] ${
              isDragOver
                ? 'border-neon-cyan bg-neon-cyan-dim shadow-neon-cyan'
                : 'border-border-medium bg-surface-base/40 hover:border-neon-cyan/30 hover:bg-neon-cyan-dim/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-14 h-14 rounded-bento-sm bg-neon-cyan-dim flex items-center justify-center border border-neon-cyan/20">
              <UploadCloud size={28} className="text-neon-cyan" />
            </div>
            <div>
              <p className="text-sm font-mono font-medium text-lab-primary mb-1">
                {t('upload.fileDragTitleFile')}
              </p>
              <p className="text-[11px] text-neon-cyan/70 mb-1">
                {graphType === 'exp_data' ? t('upload.fileTypePdfImage') : t('upload.fileTypePdfOnly')}
              </p>
              <p className="text-xs text-lab-secondary">
                {showFileHint()}
              </p>
            </div>
            <label className="btn-neon-outline text-xs">
              {t('upload.selectFile')}
              <input
                type="file"
                accept={getAcceptTypes()}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {selectedFile && (
              <div className="px-4 py-1.5 bg-neon-cyan-dim border border-neon-cyan/30 rounded-bento-sm">
                <p className="text-xs text-neon-cyan font-mono">✓ {selectedFile.name}</p>
              </div>
            )}
          </div>
        )}

        {uploadMode === 'text' && (
          <div className="space-y-2 h-[280px] flex flex-col">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-lab-muted">
              {t('upload.textLabel')}
            </label>
            <textarea
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              placeholder={t('upload.textPlaceholder')}
              className="flex-1 w-full rounded-bento-sm border border-border-medium bg-surface-base/60 px-4 py-3 text-sm text-lab-primary outline-none focus:ring-1 focus:ring-neon-cyan/40 focus:border-neon-cyan/40 resize-none placeholder:text-lab-dim font-mono"
            />
            <p className="text-[10px] text-lab-dim text-right">
              {t('upload.textTip')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCard;
