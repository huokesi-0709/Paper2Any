import type { FileRecord } from './fileService';
import type JSZipArchive from 'jszip';
import { getFileContentPreview } from './fileService';
import { getSecureAssetBlob, getSecureAssetUrl } from './secureAssetService';

export type PreviewKind =
  | 'image'
  | 'pdf'
  | 'html'
  | 'video'
  | 'audio'
  | 'text'
  | 'presentation'
  | 'document'
  | 'spreadsheet'
  | 'archive'
  | 'diagram'
  | 'drawio'
  | 'unsupported';

export interface LoadedFilePreview {
  kind: PreviewKind;
  url?: string;
  content?: string;
  truncated?: boolean;
}

const PREVIEW_MAX_CHARS = 120_000;
const IMAGE_TYPES = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg']);
const VIDEO_TYPES = new Set(['mp4', 'webm', 'mov', 'm4v']);
const AUDIO_TYPES = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);
const DIRECT_TEXT_TYPES = new Set(['txt', 'md', 'json', 'csv', 'xml', 'drawio', 'log', 'yaml', 'yml']);
const ARCHIVE_DOCUMENT_TYPES = new Set(['pptx', 'docx', 'xlsx', 'zip']);

export function getFileType(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) return 'file';
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function getWorkflowType(file: FileRecord): string {
  return (file.workflow_type || 'unknown').toLowerCase();
}

function bounded(content: string): Pick<LoadedFilePreview, 'content' | 'truncated'> {
  if (content.length <= PREVIEW_MAX_CHARS) return { content, truncated: false };
  return { content: content.slice(0, PREVIEW_MAX_CHARS), truncated: true };
}

function parseXml(xml: string): Document | null {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  return document.querySelector('parsererror') ? null : document;
}

function allByLocalName(root: Document | Element, localName: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', localName));
}

function formatTextContent(raw: string, fileType: string): string {
  if (fileType === 'json') {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  if (fileType === 'drawio') {
    const document = parseXml(raw);
    if (!document) return raw;
    const labels = Array.from(document.querySelectorAll('[value]'))
      .map((node) => node.getAttribute('value') || '')
      .map((value) => {
        const wrapper = new DOMParser().parseFromString(`<div>${value}</div>`, 'text/html');
        return (wrapper.body.textContent || '').replace(/\s+/g, ' ').trim();
      })
      .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);
    return labels.length ? labels.map((label) => `• ${label}`).join('\n') : raw;
  }

  return raw;
}

async function extractPptx(zip: JSZipArchive): Promise<string> {
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((left, right) => Number(left.match(/\d+/)?.[0] || 0) - Number(right.match(/\d+/)?.[0] || 0));
  const slides = await Promise.all(slideNames.map(async (name, index) => {
    const xml = await zip.file(name)?.async('text') || '';
    const document = parseXml(xml);
    const text = document ? allByLocalName(document, 't').map((node) => node.textContent?.trim() || '').filter(Boolean) : [];
    return [`[Slide ${index + 1}]`, ...text].join('\n');
  }));
  return slides.join('\n\n');
}

async function extractDocx(zip: JSZipArchive): Promise<string> {
  const xml = await zip.file('word/document.xml')?.async('text') || '';
  const document = parseXml(xml);
  if (!document) return '';
  return allByLocalName(document, 'p')
    .map((paragraph) => allByLocalName(paragraph, 't').map((node) => node.textContent || '').join('').trim())
    .filter(Boolean)
    .join('\n');
}

async function extractXlsx(zip: JSZipArchive): Promise<string> {
  const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('text') || '';
  const sharedDocument = parseXml(sharedXml);
  const sharedStrings = sharedDocument
    ? allByLocalName(sharedDocument, 'si').map((item) => allByLocalName(item, 't').map((node) => node.textContent || '').join(''))
    : [];
  const sheetNames = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((left, right) => Number(left.match(/\d+/)?.[0] || 0) - Number(right.match(/\d+/)?.[0] || 0));

  const sheets = await Promise.all(sheetNames.map(async (name, index) => {
    const xml = await zip.file(name)?.async('text') || '';
    const document = parseXml(xml);
    if (!document) return `[Sheet ${index + 1}]`;
    const rows = allByLocalName(document, 'row').slice(0, 200).map((row) => {
      return allByLocalName(row, 'c').map((cell) => {
        const rawValue = allByLocalName(cell, 'v')[0]?.textContent || '';
        return cell.getAttribute('t') === 's' ? (sharedStrings[Number(rawValue)] || '') : rawValue;
      }).join('\t');
    }).filter(Boolean);
    return [`[Sheet ${index + 1}]`, ...rows].join('\n');
  }));
  return sheets.join('\n\n');
}

async function extractArchiveDocument(blob: Blob, fileType: string): Promise<LoadedFilePreview> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  if (fileType === 'pptx') return { kind: 'presentation', ...bounded(await extractPptx(zip)) };
  if (fileType === 'docx') return { kind: 'document', ...bounded(await extractDocx(zip)) };
  if (fileType === 'xlsx') return { kind: 'spreadsheet', ...bounded(await extractXlsx(zip)) };
  return { kind: 'archive', ...bounded(Object.keys(zip.files).join('\n')) };
}

async function serverPreviewFallback(pathOrUrl: string): Promise<LoadedFilePreview> {
  const result = await getFileContentPreview(pathOrUrl);
  return {
    kind: result.kind,
    content: result.content || '',
    truncated: Boolean(result.truncated),
  };
}

export async function loadFilePreview(file: FileRecord): Promise<LoadedFilePreview> {
  const pathOrUrl = file.download_url;
  const fileType = getFileType(file.file_name);
  if (!pathOrUrl) return { kind: 'unsupported' };

  if (IMAGE_TYPES.has(fileType)) return { kind: 'image', url: await getSecureAssetUrl(pathOrUrl) };
  if (fileType === 'pdf') return { kind: 'pdf', url: await getSecureAssetUrl(pathOrUrl) };
  if (fileType === 'html' || fileType === 'htm') return { kind: 'html', url: await getSecureAssetUrl(pathOrUrl) };
  if (VIDEO_TYPES.has(fileType)) return { kind: 'video', url: await getSecureAssetUrl(pathOrUrl) };
  if (AUDIO_TYPES.has(fileType)) return { kind: 'audio', url: await getSecureAssetUrl(pathOrUrl) };

  if (DIRECT_TEXT_TYPES.has(fileType)) {
    const raw = await (await getSecureAssetBlob(pathOrUrl)).text();
    if (fileType === 'drawio') {
      return { kind: 'drawio', content: raw, truncated: false };
    }
    return {
      kind: 'text',
      ...bounded(formatTextContent(raw, fileType)),
    };
  }

  if (ARCHIVE_DOCUMENT_TYPES.has(fileType)) {
    try {
      return await extractArchiveDocument(await getSecureAssetBlob(pathOrUrl), fileType);
    } catch (clientError) {
      console.warn('[filePreview] Browser extraction failed, trying server preview:', clientError);
      return serverPreviewFallback(pathOrUrl);
    }
  }

  return serverPreviewFallback(pathOrUrl);
}
