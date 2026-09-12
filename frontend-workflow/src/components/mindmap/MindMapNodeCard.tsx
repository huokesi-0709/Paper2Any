import { Handle, Position, type NodeProps } from 'reactflow';

import type { MindMapNodeData } from '../../utils/mindmapTree';

export default function MindMapNodeCard({ data, selected }: NodeProps<MindMapNodeData>) {
  const accent =
    data.branch === 'left'
      ? 'border-indigo-200'
      : data.branch === 'right'
        ? 'border-blue-200'
        : 'border-blue-400';

  const shadow = selected ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm';

  return (
    <div
      className={`relative min-w-[220px] max-w-[260px] rounded-xl border bg-white px-4 py-3 text-left text-slate-900 backdrop-blur-xl ${accent} ${shadow}`}
    >
      <Handle id="left-target" type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-0 !bg-violet-300/70" />
      <Handle id="right-target" type="target" position={Position.Right} className="!h-2.5 !w-2.5 !border-0 !bg-cyan-300/70" />
      <Handle id="left-source" type="source" position={Position.Left} className="!h-2.5 !w-2.5 !border-0 !bg-violet-200/90" />
      <Handle id="right-source" type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-0 !bg-cyan-200/90" />

      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {data.isRoot ? 'Root' : `Depth ${data.depth}`}
      </div>
      <div className="mt-2 text-sm font-semibold leading-5 text-slate-900">{data.label}</div>
      {data.summary ? (
        <div className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{data.summary}</div>
      ) : null}
    </div>
  );
}
