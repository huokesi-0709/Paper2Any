/**
 * NewApp — completely redesigned frontend for FigureMind.
 *
 * Clean sidebar + top-bar layout.
 * Routes:
 *   /                              — 首页总览 (Home Overview)
 *   /scientific-drawing/model      — 模型结构图生成 (Model Architecture Diagram)
 *   /scientific-drawing/tech       — 技术路线图生成 (Technical Route Diagram)
 *   /scientific-drawing/experiment — 实验图生成 (Experiment Diagram)
 *   /scientific-drawing/flow       — 流程图/架构图生成 (Flowchart/Architecture Diagram)
 *   /image-playground              — 生图模型体验 (Image Generation Playground)
 *   /mindmap                       — 思维导图 (Mind Map)
 *   /image2drawio                  — 图片转DrawIO (Image to DrawIO)
 *   /files                         — 我的历史文件 (My History Files)
 */
import { ReactNode } from 'react';
import { NavProvider, useNav } from './app/nav-context';
import { AppShell } from './app/components/AppShell';
import {
  HomePage,
  ModelArchPage,
  TechExpPage,
  FlowArchPage,
  ImagePlaygroundPage,
  MindMapPage,
  ImageToDrawioPage,
  FilesPage,
} from './app/pages';

type RouteDef = {
  path: string;
  element: ReactNode;
};

const ROUTES: RouteDef[] = [
  { path: '/',              element: <HomePage /> },
  { path: '/scientific-drawing/model',      element: <ModelArchPage /> },
  { path: '/scientific-drawing/tech',       element: <TechExpPage graphType="tech_route" /> },
  { path: '/scientific-drawing/experiment', element: <TechExpPage graphType="exp_data" /> },
  { path: '/scientific-drawing/flow',       element: <FlowArchPage /> },
  { path: '/image-playground',  element: <ImagePlaygroundPage /> },
  { path: '/mindmap',           element: <MindMapPage /> },
  { path: '/image2drawio',      element: <ImageToDrawioPage /> },
  { path: '/files',             element: <FilesPage /> },
];

function AppContent() {
  const { currentPath } = useNav();

  const matchedRoute = ROUTES.find((r) => r.path === currentPath) || ROUTES[0];

  return (
    <AppShell currentPath={currentPath}>
      {matchedRoute.element}
    </AppShell>
  );
}

export default function NewApp() {
  return (
    <NavProvider>
      <AppContent />
    </NavProvider>
  );
}
