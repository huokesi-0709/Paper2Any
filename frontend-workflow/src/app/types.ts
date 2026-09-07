/**
 * Types for the new Paper2Any UI.
 */

import type { LucideIcon } from 'lucide-react';

export type RouteKey =
  | 'home'
  | 'scientific-drawing'
  | 'scientific-drawing-model'
  | 'scientific-drawing-tech'
  | 'scientific-drawing-experiment'
  | 'scientific-drawing-flow'
  | 'image-playground'
  | 'mindmap'
  | 'image2drawio'
  | 'files';

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  section?: boolean;
  children?: NavItem[];
}

export interface RouteConfig {
  key: RouteKey;
  path: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

/** Graph types supported by the paper2figure backend */
export type GraphType = 'model_arch' | 'tech_route' | 'exp_data';

/** Input modes for file/text upload */
export type UploadMode = 'file' | 'text';

/** Supported languages */
export type Language = 'zh' | 'en';
