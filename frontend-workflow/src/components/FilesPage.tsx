/**
 * FilesPage component showing user's generated files.
 * Redesigned with Neon Lab dark theme.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getFileRecords, deleteFileRecord, FileRecord } from "../services/fileService";
import { downloadSecureAsset } from "../services/secureAssetService";
import { FileText, Download, Trash2, RefreshCw, Loader2, FolderOpen } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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
                    <th style={{ width: "6rem" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-neon-cyan" />
                          <span className="text-white truncate" style={{ maxWidth: "200px" }}>
                            {file.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="text-lab-muted">{formatSize(file.file_size)}</td>
                      <td className="text-lab-muted">{formatDate(file.created_at, i18n.language)}</td>
                      <td>
                        {file.workflow_type && (
                          <span className="neon-badge">{file.workflow_type}</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
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
    </div>
  );
}
