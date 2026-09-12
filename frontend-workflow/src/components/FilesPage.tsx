/**
 * FilesPage component showing user's generated files.
 * Redesigned with Neon Lab dark theme.
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { getFileRecords, deleteFileRecord, FileRecord } from "../services/fileService";
import { downloadSecureAsset } from "../services/secureAssetService";
import { getFileType, getWorkflowType, loadFilePreview, type PreviewKind } from "../services/filePreviewService";
import { FileText, Download, Trash2, RefreshCw, Loader2, FolderOpen, Search, Eye, X, FileQuestion } from "lucide-react";
import { LocalDrawioPreview } from "./LocalDrawioPreview";

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | undefined, locale: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FilesPage() {
  const { t, i18n } = useTranslation("common");
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [previewKind, setPreviewKind] = useState<PreviewKind>("unsupported");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [previewTruncated, setPreviewTruncated] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getFileRecords();
      setFiles(data);
    } catch (e) {
      console.error("Failed to load files:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (!previewFile) return;

    let cancelled = false;
    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError("");
      setPreviewUrl("");
      setPreviewContent("");
      setPreviewTruncated(false);

      try {
        const result = await loadFilePreview(previewFile);
        if (!cancelled) {
          setPreviewKind(result.kind);
          setPreviewUrl(result.url || "");
          setPreviewContent(result.content || "");
          setPreviewTruncated(Boolean(result.truncated));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to preview file:", error);
          setPreviewError(t("filesPage.preview.error"));
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [previewFile, t]);

  useEffect(() => {
    if (!previewFile) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewFile(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFile]);

  const handleDownload = async (file: FileRecord) => {
    if (!file.download_url) return;
    setDownloading(file.id || file.file_name);
    try {
      await downloadSecureAsset(file.download_url, file.file_name);
    } catch (e) {
      console.error("Failed to download file:", e);
      alert("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(t("filesPage.actions.confirmDelete", { fileName }))) return;
    setDeleting(id);
    try {
      const success = await deleteFileRecord(id);
      if (success) {
        setFiles(files.filter((f) => f.id !== id));
      } else {
        alert(t("filesPage.actions.deleteError"));
      }
    } catch (e) {
      console.error("Failed to delete file:", e);
      alert(t("filesPage.actions.deleteError"));
    } finally {
      setDeleting(null);
    }
  };

  const visibleFiles = files.filter((file) => file.file_name.toLowerCase().includes(query.trim().toLowerCase()) && (!typeFilter || getFileType(file.file_name) === typeFilter));
  const fileTypes = Array.from(new Set(files.map((file) => getFileType(file.file_name)))).sort();

  return (
    <div className="page-shell overflow-y-auto">
      <div className="bg-grid-dense pointer-events-none absolute inset-0 opacity-50" />
      <div className="page-container relative">
        {/* Header */}
        <div className="section-header flex-row items-center justify-between" style={{ flexDirection: "row" as const }}>
          <div>
            <div className="badge">
              <FolderOpen size={12} />
              {t("filesPage.title")}
            </div>
            <h1 className="title mt-2 font-display text-4xl font-extrabold tracking-[-0.035em] text-lab-primary">
              {t("filesPage.title")}
            </h1>
          </div>
          <button
            aria-label={t("enterprise.refresh")}
            title={t("enterprise.refresh")}
            onClick={loadFiles}
            disabled={loading}
            className="toolbar-btn"
            style={{ width: "2.5rem", height: "2.5rem" }}
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>

        <p className="text-sm text-slate-600">{t("enterprise.fileDescription")}</p>
        <div className="files-toolbar">
          <span>{t("enterprise.fileCount", { count: visibleFiles.length })}</span>
          <label className="workspace-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("enterprise.fileSearch")} aria-label={t("enterprise.fileSearch")} /></label>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label={t("enterprise.filter")} className="neon-select !w-auto">
            <option value="">{t("enterprise.fileTypes")}</option>
            {fileTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        {files.length > 0 && visibleFiles.length === 0 && <p className="empty-state text-slate-600">{t("enterprise.noMatches")}</p>}
        {/* Content */}
        {loading && files.length === 0 ? (
          <div className="empty-state" style={{ minHeight: "300px" }}>
            <Loader2 size={36} className="animate-spin text-neon-cyan" />
            <div className="title">{t("filesPage.loading")}</div>
          </div>
        ) : files.length === 0 ? (
          <div className="neon-panel p-8">
            <div className="empty-state">
              <FolderOpen size={48} className="icon text-neon-cyan" />
              <div className="title">{t("filesPage.empty.title")}</div>
              <div className="desc">{t("filesPage.empty.desc")}</div>
            </div>
          </div>
        ) : (
          <div className="neon-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="file-table">
                <thead>
                  <tr>
                    <th>{t("filesPage.table.fileName")}</th>
                    <th>{t("filesPage.table.size")}</th>
                    <th>{t("filesPage.table.date")}</th>
                    <th>{t("filesPage.table.type")}</th>
                    <th style={{ width: "9rem" }}>{t("filesPage.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFiles.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-neon-cyan shrink-0" />
                          <button className="file-name-button" onClick={() => setPreviewFile(file)} title={t("filesPage.actions.view")}>
                            {file.file_name}
                          </button>
                        </div>
                      </td>
                      <td className="text-lab-muted">{formatSize(file.file_size)}</td>
                      <td className="text-lab-muted">{formatDate(file.created_at, i18n.language)}</td>
                      <td>
                        <div className="file-type-cell">
                          <span className="neon-badge">{getFileType(file.file_name)}</span>
                          <span>{getWorkflowType(file)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="toolbar-btn"
                            title={t("filesPage.actions.view")}
                            aria-label={`${t("filesPage.actions.view")} ${file.file_name}`}
                          >
                            <Eye size={14} />
                          </button>
                          {file.download_url && (
                            <button
                              onClick={() => handleDownload(file)}
                              disabled={downloading === (file.id || file.file_name)}
                              className="toolbar-btn"
                              title={t("filesPage.actions.download")}
                            >
                              {downloading === (file.id || file.file_name) ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => file.id && handleDelete(file.id, file.file_name)}
                            disabled={!file.id || deleting === file.id}
                            className="toolbar-btn hover:!border-red-500 hover:!text-red-400"
                            title={t("filesPage.actions.delete")}
                          >
                            {deleting === file.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {previewFile && createPortal((
        <div className="file-preview-backdrop" onMouseDown={() => setPreviewFile(null)}>
          <section
            className="file-preview-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="file-preview-header">
              <div className="min-w-0">
                <div className="workspace-eyebrow">{t("filesPage.preview.eyebrow")}</div>
                <h2 id="file-preview-title">{previewFile.file_name}</h2>
              </div>
              <button className="toolbar-btn" onClick={() => setPreviewFile(null)} aria-label={t("filesPage.preview.close")} title={t("filesPage.preview.close")}>
                <X size={18} />
              </button>
            </header>

            <div className="file-preview-meta">
              <span><strong>{getFileType(previewFile.file_name)}</strong> {t("filesPage.preview.format")}</span>
              <span>{formatSize(previewFile.file_size)}</span>
              <span>{getWorkflowType(previewFile)}</span>
              <span>{formatDate(previewFile.created_at, i18n.language)}</span>
            </div>

            <div className="file-preview-body">
              {previewLoading ? (
                <div className="file-preview-state"><Loader2 size={28} className="animate-spin text-neon-cyan" /><span>{t("filesPage.preview.loading")}</span></div>
              ) : previewError ? (
                <div className="file-preview-state"><FileQuestion size={32} /><span>{previewError}</span></div>
              ) : previewKind === "image" ? (
                <img src={previewUrl} alt={previewFile.file_name} className="file-preview-image" />
              ) : previewKind === "pdf" ? (
                <iframe src={previewUrl} title={previewFile.file_name} className="file-preview-frame" />
              ) : previewKind === "html" ? (
                <iframe src={previewUrl} title={previewFile.file_name} className="file-preview-frame" sandbox="" />
              ) : previewKind === "video" ? (
                <video src={previewUrl} controls className="file-preview-video" />
              ) : previewKind === "audio" ? (
                <div className="file-preview-state"><audio src={previewUrl} controls className="w-full" /></div>
              ) : previewKind === "drawio" && previewContent ? (
                <LocalDrawioPreview
                  xmlContent={previewContent}
                  errorTitle={t("filesPage.preview.drawioErrorTitle")}
                  errorDescription={t("filesPage.preview.drawioErrorDesc")}
                />
              ) : previewKind === "unsupported" ? (
                <div className="file-preview-state"><FileQuestion size={36} /><strong>{t("filesPage.preview.unsupportedTitle")}</strong><span>{t("filesPage.preview.unsupportedDesc")}</span></div>
              ) : previewContent ? (
                <pre className="file-preview-text">{previewContent}</pre>
              ) : (
                <div className="file-preview-state"><FileText size={36} /><strong>{t("filesPage.preview.emptyTitle")}</strong><span>{t("filesPage.preview.emptyDesc")}</span></div>
              )}
            </div>

            {previewTruncated && <p className="file-preview-note">{t("filesPage.preview.truncated")}</p>}
            <footer className="file-preview-footer">
              <span>{t("filesPage.preview.readOnly")}</span>
              {previewFile.download_url && (
                <button className="btn-neon" onClick={() => handleDownload(previewFile)} disabled={downloading === (previewFile.id || previewFile.file_name)}>
                  {downloading === (previewFile.id || previewFile.file_name) ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  {t("filesPage.actions.download")}
                </button>
              )}
            </footer>
          </section>
        </div>
      ), document.body)}
    </div>
  );
}
