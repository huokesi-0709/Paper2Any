import { ReactNode } from 'react';
import { Brain, Cpu, Image, FileImage, FolderOpen, LayoutGrid, PenTool, BarChart3, Route, FlaskConical, Network, Boxes, GitBranch, Workflow, FileText, Package } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  accent: string;
  glow: string;
  onClick: () => void;
  badge?: string;
}

export function FeatureCard({ icon: Icon, title, description, accent, glow, onClick, badge }: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      className="bento-card cursor-pointer group transition-all duration-300 p-6 flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-surface-raised/60 border border-border-medium flex items-center justify-center ${accent} group-hover:scale-110 transition-transform`}>
          <Icon size={22} />
        </div>
        {badge && (
          <span className={`text-xs font-mono px-2 py-0.5 rounded-lg border ${badge.includes('Pro') ? 'border-neon-purple/30 text-neon-purple' : 'border-neon-cyan/30 text-neon-cyan'}`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-semibold text-lab-primary mb-2 group-hover:text-blue-700 transition-colors">{title}</h3>
      <p className="text-sm text-lab-secondary flex-1 leading-relaxed">{description}</p>
      <div className={`mt-4 h-1 w-0 group-hover:w-full ${glow} rounded-full transition-all`} />
    </div>
  );
}

interface FeatureGridProps {
  title: string;
  subtitle?: string;
  features: FeatureCardProps[];
  columns?: number;
}

export function FeatureSection({ title, subtitle, features, columns = 3 }: FeatureGridProps) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-lab-primary">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-lab-secondary max-w-2xl">{subtitle}</p>}
        </div>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${
        columns >= 3 ? 'lg:grid-cols-3' : columns === 2 ? 'lg:grid-cols-2' : ''
      }`}>
        {features.map((feature, idx) => (
          <div key={idx} className="animate-fade-in-up stagger-slow" style={{ animationDelay: `${idx * 0.05}s` }}>
            <FeatureCard {...feature} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Icon map for easy reference
export const ICON_MAP = {
  home: LayoutGrid,
  model_arch: Network,
  tech_route: Route,
  exp_data: BarChart3,
  flowchart: GitBranch,
  image_playground: Image,
  mindmap: Brain,
  image2drawio: FileImage,
  files: FolderOpen,
  paper: FileText,
  package: Package,
  layout: Boxes,
};
