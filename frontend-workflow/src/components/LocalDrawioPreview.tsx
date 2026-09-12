import { useMemo } from 'react';
import { FileWarning } from 'lucide-react';

type StyleMap = Record<string, string>;

interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
  sourcePoint?: { x: number; y: number };
  targetPoint?: { x: number; y: number };
}

interface DiagramCell {
  id: string;
  parent?: string;
  source?: string;
  target?: string;
  value: string;
  vertex: boolean;
  edge: boolean;
  style: StyleMap;
  geometry?: Geometry;
}

interface DiagramModel {
  cells: DiagramCell[];
  byId: Map<string, DiagramCell>;
  viewBox: string;
}

interface LocalDrawioPreviewProps {
  xmlContent: string;
  errorTitle: string;
  errorDescription: string;
}

function number(value: string | null | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStyle(raw: string): StyleMap {
  const result: StyleMap = {};
  for (const part of raw.split(';')) {
    if (!part) continue;
    const separator = part.indexOf('=');
    if (separator < 0) result[part] = '1';
    else result[part.slice(0, separator)] = part.slice(separator + 1);
  }
  return result;
}

function directChild(element: Element, localName: string): Element | undefined {
  return Array.from(element.children).find((child) => child.localName === localName);
}

function parsePoint(element: Element | undefined): { x: number; y: number } | undefined {
  if (!element) return undefined;
  return { x: number(element.getAttribute('x')), y: number(element.getAttribute('y')) };
}

function parseGeometry(element: Element | undefined): Geometry | undefined {
  if (!element) return undefined;
  const pointsContainer = Array.from(element.children).find((child) => child.localName === 'Array' && child.getAttribute('as') === 'points');
  const points = pointsContainer
    ? Array.from(pointsContainer.children).filter((child) => child.localName === 'mxPoint').map((point) => ({
        x: number(point.getAttribute('x')),
        y: number(point.getAttribute('y')),
      }))
    : [];
  return {
    x: number(element.getAttribute('x')),
    y: number(element.getAttribute('y')),
    width: Math.max(1, number(element.getAttribute('width'), 1)),
    height: Math.max(1, number(element.getAttribute('height'), 1)),
    points,
    sourcePoint: parsePoint(Array.from(element.children).find((child) => child.localName === 'mxPoint' && child.getAttribute('as') === 'sourcePoint')),
    targetPoint: parsePoint(Array.from(element.children).find((child) => child.localName === 'mxPoint' && child.getAttribute('as') === 'targetPoint')),
  };
}

function plainLabel(value: string): string {
  if (!value) return '';
  const document = new DOMParser().parseFromString(`<div>${value.replace(/<br\s*\/?\s*>/gi, '\n')}</div>`, 'text/html');
  return (document.body.textContent || '').replace(/\u00a0/g, ' ').trim();
}

function safeColor(value: string | undefined, fallback: string): string {
  if (!value || value === 'none') return value === 'none' ? 'transparent' : fallback;
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value) ? value : fallback;
}

function safeImageUrl(value: string | undefined): string {
  if (!value) return '';
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value.replace(/%3B/gi, ';');
  }
  return /^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(decoded) ? decoded : '';
}

function absoluteGeometry(cell: DiagramCell, byId: Map<string, DiagramCell>, seen = new Set<string>()): Geometry | undefined {
  if (!cell.geometry || seen.has(cell.id)) return cell.geometry;
  seen.add(cell.id);
  const parent = cell.parent ? byId.get(cell.parent) : undefined;
  if (!parent?.vertex || !parent.geometry) return cell.geometry;
  const parentGeometry = absoluteGeometry(parent, byId, seen);
  if (!parentGeometry) return cell.geometry;
  return {
    ...cell.geometry,
    x: parentGeometry.x + cell.geometry.x,
    y: parentGeometry.y + cell.geometry.y,
  };
}

function parseModel(xmlContent: string): DiagramModel | null {
  const document = new DOMParser().parseFromString(xmlContent, 'application/xml');
  if (document.querySelector('parsererror')) return null;
  const graphModel = document.querySelector('mxGraphModel');
  if (!graphModel) return null;

  const cells: DiagramCell[] = Array.from(graphModel.querySelectorAll('mxCell')).map((element) => ({
    id: element.getAttribute('id') || crypto.randomUUID(),
    parent: element.getAttribute('parent') || undefined,
    source: element.getAttribute('source') || undefined,
    target: element.getAttribute('target') || undefined,
    value: plainLabel(element.getAttribute('value') || ''),
    vertex: element.getAttribute('vertex') === '1',
    edge: element.getAttribute('edge') === '1',
    style: parseStyle(element.getAttribute('style') || ''),
    geometry: parseGeometry(directChild(element, 'mxGeometry')),
  }));
  const byId = new Map(cells.map((cell) => [cell.id, cell]));

  const bounds = cells
    .filter((cell) => cell.vertex && cell.geometry)
    .map((cell) => absoluteGeometry(cell, byId))
    .filter((geometry): geometry is Geometry => Boolean(geometry));
  if (!bounds.length) return null;
  const minX = Math.min(...bounds.map((item) => item.x));
  const minY = Math.min(...bounds.map((item) => item.y));
  const maxX = Math.max(...bounds.map((item) => item.x + item.width));
  const maxY = Math.max(...bounds.map((item) => item.y + item.height));
  const padding = Math.max(24, Math.min(80, Math.max(maxX - minX, maxY - minY) * 0.05));
  return {
    cells,
    byId,
    viewBox: `${minX - padding} ${minY - padding} ${Math.max(1, maxX - minX + padding * 2)} ${Math.max(1, maxY - minY + padding * 2)}`,
  };
}

function connectionPoint(cell: DiagramCell | undefined, byId: Map<string, DiagramCell>, xKey: string, yKey: string): { x: number; y: number } | undefined {
  if (!cell) return undefined;
  const geometry = absoluteGeometry(cell, byId);
  if (!geometry) return undefined;
  return {
    x: geometry.x + geometry.width * number(cell.style[xKey], 0.5),
    y: geometry.y + geometry.height * number(cell.style[yKey], 0.5),
  };
}

function edgePath(cell: DiagramCell, model: DiagramModel): { path: string; labelX: number; labelY: number } | null {
  const geometry = cell.geometry;
  const start = geometry?.sourcePoint || connectionPoint(model.byId.get(cell.source || ''), model.byId, 'exitX', 'exitY');
  const end = geometry?.targetPoint || connectionPoint(model.byId.get(cell.target || ''), model.byId, 'entryX', 'entryY');
  if (!start || !end) return null;
  const points = geometry?.points || [];
  let path = '';
  if (points.length) {
    path = `M ${start.x} ${start.y} ${points.map((point) => `L ${point.x} ${point.y}`).join(' ')} L ${end.x} ${end.y}`;
  } else if (cell.style.curved === '1') {
    path = `M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${Math.min(start.y, end.y) - Math.abs(end.x - start.x) * 0.12} ${end.x} ${end.y}`;
  } else if (cell.style.edgeStyle?.includes('orthogonal') || cell.style.orthogonalLoop === '1') {
    const middleX = (start.x + end.x) / 2;
    path = `M ${start.x} ${start.y} L ${middleX} ${start.y} L ${middleX} ${end.y} L ${end.x} ${end.y}`;
  } else {
    path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  return { path, labelX: (start.x + end.x) / 2, labelY: (start.y + end.y) / 2 };
}

function Shape({ cell, model }: { cell: DiagramCell; model: DiagramModel }) {
  const geometry = absoluteGeometry(cell, model.byId);
  if (!geometry) return null;
  const { x, y, width, height } = geometry;
  const style = cell.style;
  const fill = safeColor(style.fillColor, '#ffffff');
  const stroke = safeColor(style.strokeColor, '#64748b');
  const strokeWidth = Math.max(0.5, number(style.strokeWidth, 1.2));
  const imageUrl = style.shape === 'image' ? safeImageUrl(style.image) : '';
  const rotation = number(style.rotation);
  const transform = rotation ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})` : undefined;
  const common = { fill, stroke, strokeWidth, strokeDasharray: style.dashed === '1' ? '6 4' : undefined };
  const shapeName = style.shape || (style.ellipse === '1' ? 'ellipse' : style.rhombus === '1' ? 'rhombus' : 'rectangle');
  let visual: React.ReactNode;

  if (imageUrl) {
    visual = <image href={imageUrl} x={x} y={y} width={width} height={height} preserveAspectRatio={style.imageAspect === '0' ? 'none' : 'xMidYMid meet'} />;
  } else if (shapeName === 'ellipse' || shapeName === 'cloud') {
    visual = <ellipse cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} {...common} />;
  } else if (shapeName === 'rhombus') {
    visual = <polygon points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`} {...common} />;
  } else if (shapeName === 'triangle') {
    visual = <polygon points={`${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}`} {...common} />;
  } else if (shapeName === 'hexagon') {
    visual = <polygon points={`${x + width * 0.25},${y} ${x + width * 0.75},${y} ${x + width},${y + height / 2} ${x + width * 0.75},${y + height} ${x + width * 0.25},${y + height} ${x},${y + height / 2}`} {...common} />;
  } else if (shapeName === 'parallelogram') {
    visual = <polygon points={`${x + width * 0.16},${y} ${x + width},${y} ${x + width * 0.84},${y + height} ${x},${y + height}`} {...common} />;
  } else if (shapeName.includes('cylinder')) {
    visual = <path d={`M ${x} ${y + height * 0.12} Q ${x + width / 2} ${y - height * 0.04} ${x + width} ${y + height * 0.12} L ${x + width} ${y + height * 0.88} Q ${x + width / 2} ${y + height * 1.04} ${x} ${y + height * 0.88} Z M ${x} ${y + height * 0.12} Q ${x + width / 2} ${y + height * 0.28} ${x + width} ${y + height * 0.12}`} {...common} />;
  } else {
    visual = <rect x={x} y={y} width={width} height={height} rx={style.rounded === '1' ? Math.min(14, height * 0.18) : 0} {...common} />;
  }

  const fontSize = Math.max(8, number(style.fontSize, 14));
  const fontColor = safeColor(style.fontColor, '#111827');
  const align = style.align === 'left' ? 'flex-start' : style.align === 'right' ? 'flex-end' : 'center';
  return (
    <g transform={transform} opacity={number(style.opacity, 100) / 100}>
      {visual}
      {cell.value && !imageUrl && (
        <foreignObject x={x + 4} y={y + 3} width={Math.max(1, width - 8)} height={Math.max(1, height - 6)} pointerEvents="none">
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: style.verticalAlign === 'top' ? 'flex-start' : style.verticalAlign === 'bottom' ? 'flex-end' : 'center', justifyContent: align, color: fontColor, fontFamily: style.fontFamily || 'Arial, sans-serif', fontSize, fontWeight: number(style.fontStyle) & 1 ? 700 : 400, fontStyle: number(style.fontStyle) & 2 ? 'italic' : 'normal', lineHeight: 1.25, textAlign: style.align === 'left' ? 'left' : style.align === 'right' ? 'right' : 'center', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {cell.value}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

function Edge({ cell, model, index }: { cell: DiagramCell; model: DiagramModel; index: number }) {
  const route = edgePath(cell, model);
  if (!route) return null;
  const stroke = safeColor(cell.style.strokeColor, '#64748b');
  const markerId = `drawio-arrow-${index}`;
  const hasEndArrow = !['none', '0'].includes(cell.style.endArrow || 'classic');
  return (
    <g opacity={number(cell.style.opacity, 100) / 100}>
      {hasEndArrow && <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} /></marker></defs>}
      <path d={route.path} fill="none" stroke={stroke} strokeWidth={Math.max(0.7, number(cell.style.strokeWidth, 1.4))} strokeDasharray={cell.style.dashed === '1' ? '6 4' : undefined} markerEnd={hasEndArrow ? `url(#${markerId})` : undefined} />
      {cell.value && <text x={route.labelX} y={route.labelY - 5} textAnchor="middle" fill={safeColor(cell.style.fontColor, '#334155')} fontSize={number(cell.style.fontSize, 12)}>{cell.value}</text>}
    </g>
  );
}

export function LocalDrawioPreview({ xmlContent, errorTitle, errorDescription }: LocalDrawioPreviewProps) {
  const model = useMemo(() => parseModel(xmlContent), [xmlContent]);
  if (!model) {
    return <div className="drawio-preview-fallback"><FileWarning size={32} /><strong>{errorTitle}</strong><span>{errorDescription}</span></div>;
  }
  const edges = model.cells.filter((cell) => cell.edge);
  const vertices = model.cells.filter((cell) => cell.vertex && cell.geometry);
  return (
    <div className="local-drawio-preview">
      <svg viewBox={model.viewBox} role="img" aria-label="DrawIO diagram preview" preserveAspectRatio="xMidYMid meet">
        <rect x="-100000" y="-100000" width="200000" height="200000" fill="#ffffff" />
        {edges.map((cell, index) => <Edge key={cell.id} cell={cell} model={model} index={index} />)}
        {vertices.map((cell) => <Shape key={cell.id} cell={cell} model={model} />)}
      </svg>
    </div>
  );
}
