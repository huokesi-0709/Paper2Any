import React from 'react';
import { ImageIcon, Download } from 'lucide-react';
import { GraphType } from './types';
import { useTranslation } from 'react-i18next';

interface TechRoutePreviewSectionProps {
  graphType: GraphType;
  techRouteStep: 'input' | 'preview' | 'done';
  svgPreviewUrl: string | null;
  svgBwPath: string | null;
  svgColorPath: string | null;
}

const TechRoutePreviewSection: React.FC<TechRoutePreviewSectionProps> = ({
  graphType,
  techRouteStep,
  svgPreviewUrl,
  svgBwPath,
  svgColorPath,
}) => {
  const { t } = useTranslation('paper2graph');
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [svgPreviewUrl]);

  if (graphType !== 'tech_route' || techRouteStep === 'input' || !svgPreviewUrl) {
    return null;
  }

  const handleDownloadSvg = async (path: string, filename: string) => {
    try {
      const response = await fetch(path);
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('SVG download failed:', error);
      const a = document.createElement('a');
      a.href = path;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <div className="bento-card scan-line mb-6 p-6 animate-fade-in relative overflow-hidden">
      {/* Neon top accent */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />

      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-display font-bold text-lab-primary flex items-center gap-2">
          <ImageIcon size={20} className="text-neon-purple" style={{ filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.6))' }} />
          {t('techRoute.previewTitle')}
        </h3>

        <div className="flex gap-2">
          {svgBwPath && (
            <button
              type="button"
              onClick={() => handleDownloadSvg(svgBwPath, 'tech_route_bw.svg')}
              className="toolbar-btn toolbar-btn-label"
            >
              <Download size={14} />
              BW SVG
            </button>
          )}
          {svgColorPath && (
            <button
              type="button"
              onClick={() => handleDownloadSvg(svgColorPath, 'tech_route_color.svg')}
              className="px-3 py-1.5 rounded-lg bg-neon-pink/15 hover:bg-neon-pink/25 border border-neon-pink/40 text-xs text-neon-pink transition-colors font-mono flex items-center gap-2"
            >
              <Download size={14} />
              Color SVG
            </button>
          )}
        </div>
      </div>

      {/* SVG preview area */}
      <div className="neon-result w-full flex items-center justify-center overflow-hidden p-4 min-h-[300px]">
        {imgError ? (
          <div className="empty-state">
            <ImageIcon size={48} className="mb-4 text-neon-pink/60" />
            <p className="mb-2 font-mono text-sm text-lab-secondary">{t('techRoute.previewLoadFailed')}</p>
            <a
              href={svgPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 btn-neon-outline text-sm"
            >
              {t('techRoute.previewOpenNewTab')}
            </a>
          </div>
        ) : (
          <img
            src={svgPreviewUrl}
            alt={t('techRoute.previewTitle')}
            className="max-w-full h-auto object-contain max-h-[600px] rounded-lg shadow-2xl"
            onError={() => setImgError(true)}
          />
        )}
      </div>
    </div>
  );
};

export default TechRoutePreviewSection;
