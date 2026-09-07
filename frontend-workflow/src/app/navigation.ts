import {
  LayoutGrid,
  PenTool,
  Boxes,
  Route,
  FlaskConical,
  Workflow,
  ImagePlus,
  Brain,
  FileImage as ImageToDrawio,
  FolderClock,
  type LucideIcon,
} from 'lucide-react';

export interface NavGroup {
  key: string;
  label: string;
  labelKey: string;
  icon: LucideIcon;
  accent: string; // tailwind text color
  glow: string; // tailwind shadow color
}

export interface NavLink {
  key: string;
  path: string;
  label: string;
  description: string;
  labelKey: string;
  descriptionKey: string;
  group: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
}

export const NAV_GROUPS: NavGroup[] = [
  { key: 'home', label: '首页', labelKey: 'app.workspace.groups.home', icon: LayoutGrid, accent: 'text-neon-cyan', glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]' },
  { key: 'drawing', label: '科研绘图', labelKey: 'app.workspace.groups.drawing', icon: PenTool, accent: 'text-neon-cyan', glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]' },
  { key: 'tools', label: '工具箱', labelKey: 'app.workspace.groups.tools', icon: Workflow, accent: 'text-neon-cyan', glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]' },
  { key: 'data', label: '数据', labelKey: 'app.workspace.groups.data', icon: FolderClock, accent: 'text-neon-cyan', glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]' },
];

export const NAV_LINKS: NavLink[] = [
  {
    key: 'home',
    path: '/',
    label: '首页总览',
    description: '平台功能概览与快速入口',
    labelKey: 'app.workspace.nav.home.title',
    descriptionKey: 'app.workspace.nav.home.description',
    group: 'home',
    icon: LayoutGrid,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'scientific-drawing-model',
    path: '/scientific-drawing/model',
    label: '模型结构图生成',
    description: '从论文/文本自动生成模型结构图',
    labelKey: 'app.workspace.nav.model.title',
    descriptionKey: 'app.workspace.nav.model.description',
    group: 'drawing',
    icon: Boxes,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'scientific-drawing-tech',
    path: '/scientific-drawing/tech',
    label: '技术路线图生成',
    description: '生成 SVG + PPT 技术路线图',
    labelKey: 'app.workspace.nav.tech.title',
    descriptionKey: 'app.workspace.nav.tech.description',
    group: 'drawing',
    icon: Route,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'scientific-drawing-experiment',
    path: '/scientific-drawing/experiment',
    label: '实验图生成',
    description: '生成实验结果可视化图',
    labelKey: 'app.workspace.nav.experiment.title',
    descriptionKey: 'app.workspace.nav.experiment.description',
    group: 'drawing',
    icon: FlaskConical,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'scientific-drawing-flow',
    path: '/scientific-drawing/flow',
    label: '流程图/架构图生成',
    description: '从文本/PDF 生成 DrawIO 流程图',
    labelKey: 'app.workspace.nav.flow.title',
    descriptionKey: 'app.workspace.nav.flow.description',
    group: 'drawing',
    icon: Workflow,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'image-playground',
    path: '/image-playground',
    label: '生图模型体验',
    description: '多种 AI 模型批量图片生成',
    labelKey: 'app.workspace.nav.imagePlayground.title',
    descriptionKey: 'app.workspace.nav.imagePlayground.description',
    group: 'tools',
    icon: ImagePlus,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'mindmap',
    path: '/mindmap',
    label: '思维导图',
    description: '从文件/文本生成可交互思维导图',
    labelKey: 'app.workspace.nav.mindmap.title',
    descriptionKey: 'app.workspace.nav.mindmap.description',
    group: 'tools',
    icon: Brain,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'image2drawio',
    path: '/image2drawio',
    label: '图片转 DrawIO',
    description: '将图片智能转换为 DrawIO 图表',
    labelKey: 'app.workspace.nav.image2drawio.title',
    descriptionKey: 'app.workspace.nav.image2drawio.description',
    group: 'tools',
    icon: ImageToDrawio,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
  {
    key: 'files',
    path: '/files',
    label: '我的历史文件',
    description: '查看和管理生成的历史文件',
    labelKey: 'app.workspace.nav.files.title',
    descriptionKey: 'app.workspace.nav.files.description',
    group: 'data',
    icon: FolderClock,
    accent: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(94,231,228,0.18)]',
  },
];

export function getNavLinksByGroup(group: string): NavLink[] {
  return NAV_LINKS.filter((link) => link.group === group);
}

export function findNavLink(path: string): NavLink | undefined {
  return NAV_LINKS.find((link) => link.path === path);
}
