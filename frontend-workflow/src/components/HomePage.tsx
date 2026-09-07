import {
  ArrowRight,
  BrainCircuit,
  Flame,
  Image,
  Network,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { featuredHomeCards, homeFeatureSections, HomeFeatureCard, HomeNavigablePage } from '../config/homePageCatalog';

type ActivePage = 'home' | HomeNavigablePage;

interface HomePageProps {
  onNavigate: (page: ActivePage) => void;
}

const iconMap = {
  sparkles: Sparkles,
  brainCircuit: BrainCircuit,
  network: Network,
  flame: Flame,
  image: Image,
  wand2: Wand2,
} as const;

const stats = [
  { value: '14+', labelKey: 'app.home.stats.workflows' },
  { value: '4', labelKey: 'app.home.stats.stages' },
  { value: '16', labelKey: 'app.home.stats.batchImages' },
  { value: '1', labelKey: 'app.home.stats.console' },
] as const;

const modulePages: HomeNavigablePage[] = [
  'paper2figure-tech-exp',
  'paper2figure-model-drawio',
  'paper2drawio-ai',
  'image-playground',
  'image2drawio',
];

const highlightPages: HomeNavigablePage[] = [
  'image-playground',
  'paper2figure-model-drawio',
  'paper2figure-tech-exp',
];

function findCard(page: HomeNavigablePage): HomeFeatureCard | undefined {
  return [...featuredHomeCards, ...homeFeatureSections.flatMap((s) => s.cards)].find((c) => c.page === page);
}

/* ── Floating particles component ─────────────────────────────── */
function FloatingParticles() {
  const particles = [
    { size: 3, left: '8%', top: '15%', color: 'cyan', delay: '0s', duration: '7s' },
    { size: 2, left: '22%', top: '65%', color: 'purple', delay: '-2s', duration: '9s' },
    { size: 4, left: '75%', top: '20%', color: 'pink', delay: '-4s', duration: '8s' },
    { size: 2, left: '85%', top: '70%', color: 'cyan', delay: '-1s', duration: '6s' },
    { size: 3, left: '45%', top: '85%', color: 'purple', delay: '-3s', duration: '10s' },
    { size: 2, left: '60%', top: '40%', color: 'cyan', delay: '-5s', duration: '7.5s' },
    { size: 3, left: '15%', top: '45%', color: 'pink', delay: '-6s', duration: '8.5s' },
    { size: 2, left: '92%', top: '50%', color: 'purple', delay: '-2.5s', duration: '9s' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className={`float-particle float-particle-${p.color}`}
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animation: `floatY ${p.duration} ease-in-out infinite`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

/* ── Bento Grid Card ──────────────────────────────────────────── */
function BentoCard({
  card,
  onNavigate,
  size = 'sm',
  delay = 0,
}: {
  card: HomeFeatureCard;
  onNavigate: (page: ActivePage) => void;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}) {
  const { t } = useTranslation('common');
  const Icon = iconMap[card.icon as keyof typeof iconMap] || Sparkles;

  const sizeClasses = {
    sm: 'min-h-[200px]',
    md: 'min-h-[280px]',
    lg: 'min-h-[380px]',
  };

  return (
    <button
      type="button"
      onClick={() => onNavigate(card.page)}
      className={`group bento-card ${sizeClasses[size]} flex flex-col p-6 text-left`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between">
        <div className="flex size-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neon-cyan transition-all duration-300 group-hover:border-neon-cyan/20 group-hover:bg-neon-cyan-dim group-hover:shadow-neon-cyan">
          <Icon size={22} />
        </div>
        <span className="neon-badge">{t(card.badgeKey)}</span>
      </div>

      {/* Title */}
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-lab-primary transition-colors duration-200 group-hover:text-neon-cyan">
        {t(card.titleKey)}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-6 text-lab-secondary text-pretty">
        {t(card.descriptionKey)}
      </p>

      {/* Action link */}
      <div className="mt-auto flex items-center gap-2 pt-4 text-xs font-mono font-semibold uppercase tracking-wider text-neon-cyan opacity-60 transition-all duration-200 group-hover:opacity-100">
        <span>{t('app.home.cardAction')}</span>
        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
      </div>

      {/* Decorative corner glow */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-neon-cyan-dim blur-[60px] opacity-0 transition-opacity duration-500 group-hover:opacity-60" />
    </button>
  );
}

/* ── Hero Preview Card (large bento) ──────────────────────────── */
function HeroBentoCard({
  card,
  onNavigate,
  delay = 0,
}: {
  card: HomeFeatureCard;
  onNavigate: (page: ActivePage) => void;
  delay?: number;
}) {
  const { t } = useTranslation('common');
  const Icon = iconMap[card.icon as keyof typeof iconMap] || Sparkles;

  return (
    <button
      type="button"
      onClick={() => onNavigate(card.page)}
      className="group bento-card relative flex min-h-[200px] flex-col justify-end overflow-hidden p-6 text-left"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(0,212,255,0.04),rgba(168,85,247,0.03),transparent)]" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon-cyan-dim blur-[80px] opacity-30 transition-opacity duration-500 group-hover:opacity-60" />

      {/* Content */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-neon-cyan" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-cyan">
            {t(card.badgeKey)}
          </span>
        </div>
        <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-white">
          {t(card.titleKey)}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-lab-secondary text-pretty">
          {t(card.descriptionKey)}
        </p>
      </div>
    </button>
  );
}

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({
  value,
  labelKey,
  delay = 0,
}: {
  value: string;
  labelKey: string;
  delay?: number;
}) {
  const { t } = useTranslation('common');

  return (
    <div
      className="glass rounded-bento-sm border border-white/[0.04] p-5 text-center transition-all duration-300 hover:border-neon-cyan/10 hover:bg-white/[0.03]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-number">{value}</div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-lab-muted">
        {t(labelKey)}
      </div>
    </div>
  );
}

/* ── Module Row ───────────────────────────────────────────────── */
function ModuleRow({
  page,
  onNavigate,
  delay = 0,
  index,
}: {
  page: HomeNavigablePage;
  onNavigate: (page: ActivePage) => void;
  delay?: number;
  index: number;
}) {
  const { t } = useTranslation('common');
  const card = findCard(page);
  if (!card) return null;

  const Icon = iconMap[card.icon as keyof typeof iconMap] || Sparkles;
  const colors = ['cyan', 'purple', 'pink', 'cyan', 'purple'] as const;
  const color = colors[index % colors.length];

  const colorClasses = {
    cyan: 'text-neon-cyan group-hover:bg-neon-cyan-dim group-hover:border-neon-cyan/20 group-hover:shadow-neon-cyan',
    purple: 'text-neon-purple group-hover:bg-neon-purple-dim group-hover:border-neon-purple/20 group-hover:shadow-neon-purple',
    pink: 'text-neon-pink group-hover:bg-neon-pink-dim group-hover:border-neon-pink/20 group-hover:shadow-neon-pink',
  };

  return (
    <button
      type="button"
      onClick={() => onNavigate(page)}
      className="group flex items-center gap-5 border-b border-white/[0.04] py-5 text-left transition-all duration-300 last:border-b-0 hover:pl-2"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 ${colorClasses[color]}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold tracking-tight text-lab-primary transition-colors duration-200 group-hover:text-white">
            {t(card.titleKey)}
          </h3>
          <ArrowRight
            size={14}
            className="shrink-0 text-lab-dim transition-all duration-200 group-hover:translate-x-1 group-hover:text-neon-cyan"
          />
        </div>
        <p className="mt-1 text-sm leading-6 text-lab-muted text-pretty">
          {t(card.descriptionKey)}
        </p>
      </div>
    </button>
  );
}

/* ── Pipeline Step ────────────────────────────────────────────── */
function PipelineStep({
  index,
  titleKey,
  detailKey,
  delay = 0,
}: {
  index: number;
  titleKey: string;
  detailKey: string;
  delay?: number;
}) {
  const { t } = useTranslation('common');

  return (
    <div
      className="glass rounded-bento-sm border border-white/[0.04] p-6 transition-all duration-300 hover:border-neon-cyan/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border border-neon-cyan/15 bg-neon-cyan-dim font-mono text-sm font-bold text-neon-cyan">
          {index + 1}
        </div>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(0,212,255,0.15),transparent)]" />
      </div>
      <h4 className="mt-5 font-display text-lg font-semibold tracking-tight text-lab-primary">
        {t(titleKey)}
      </h4>
      <p className="mt-2 text-sm leading-6 text-lab-muted">{t(detailKey)}</p>
    </div>
  );
}

/* ── Main HomePage ────────────────────────────────────────────── */
export function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useTranslation('common');
  const leadCard = findCard(highlightPages[0]);
  const supportCards = highlightPages.slice(1).map(findCard).filter(Boolean) as HomeFeatureCard[];

  return (
    <div className="relative h-full overflow-y-auto bg-surface-base">
      {/* Background grid */}
      <div className="bg-grid-dense animate-grid-pulse pointer-events-none absolute inset-0" />
      <FloatingParticles />

      <div className="relative">
        {/* ═══ HERO SECTION ═══ */}
        <section className="relative border-b border-white/[0.04]">
          <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 md:px-8 lg:px-10">
            <div className="grid gap-12 xl:grid-cols-[1fr_1.1fr] xl:items-center">
              {/* Left: Text */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-neon-cyan/15 bg-neon-cyan-dim px-3 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-cyan">
                    {t('app.home.kicker')}
                  </span>
                </div>

                <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tighter text-white md:text-7xl">
                  {t('app.home.title')}
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-lab-secondary text-pretty md:text-lg">
                  {t('app.home.description')}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onNavigate('paper2figure-tech-exp')}
                    className="btn-neon"
                  >
                    <span>{t('app.home.primaryCta')}</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('paper2figure-model-drawio')}
                    className="btn-neon-outline"
                  >
                    <Sparkles size={16} />
                    <span>{t('app.home.modelCta', '生成模型结构图')}</span>
                  </button>
                </div>

                {/* Stats row */}
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {stats.map((stat, i) => (
                    <StatCard key={stat.labelKey} value={stat.value} labelKey={stat.labelKey} delay={i * 80} />
                  ))}
                </div>
              </div>

              {/* Right: Bento preview cards */}
              <div className="grid grid-cols-2 gap-3">
                {leadCard && (
                  <div className="col-span-2">
                    <HeroBentoCard card={leadCard} onNavigate={onNavigate} delay={100} />
                  </div>
                )}
                {supportCards.map((card, i) => (
                  <HeroBentoCard key={card.page} card={card} onNavigate={onNavigate} delay={200 + i * 100} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PIPELINE SECTION ═══ */}
        <section className="border-b border-white/[0.04]">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:px-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-purple">
                  {t('app.home.workflowTitle')}
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tighter text-white md:text-5xl">
                  {t('app.home.workflowTitle')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-lab-muted text-pretty md:text-base">
                  {t('app.home.outputDescription')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('paper2drawio-ai')}
                className="btn-neon-outline shrink-0"
              >
                <span>{t('app.home.flowCta', '生成流程/架构图')}</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['app.home.pipelineStep1Title', 'app.home.pipelineStep1Detail'],
                ['app.home.pipelineStep2Title', 'app.home.pipelineStep2Detail'],
                ['app.home.pipelineStep3Title', 'app.home.pipelineStep3Detail'],
              ].map(([titleKey, detailKey], i) => (
                <PipelineStep key={titleKey} index={i} titleKey={titleKey} detailKey={detailKey} delay={i * 100} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ MODULES SECTION ═══ */}
        <section className="border-b border-white/[0.04]">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-pink">
                  {t('app.home.modulesTitle')}
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tighter text-white md:text-5xl">
                  {t('app.home.modulesTitle')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-lab-muted text-pretty md:text-base">
                  {t('app.home.modulesDescription')}
                </p>
              </div>
              <div className="rounded-bento border border-white/[0.04] bg-white/[0.015] px-6 py-2">
                {modulePages.map((page, i) => (
                  <ModuleRow key={page} page={page} onNavigate={onNavigate} delay={i * 60} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURE SECTIONS ═══ */}
        {homeFeatureSections.map((section, sIdx) => (
          <section key={section.titleKey} className="border-b border-white/[0.04] last:border-b-0">
            <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:px-10">
              <div className="max-w-2xl">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-cyan">
                  {t(section.titleKey)}
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tighter text-white md:text-4xl">
                  {t(section.titleKey)}
                </h2>
                <p className="mt-3 text-sm leading-7 text-lab-muted text-pretty md:text-base">
                  {t(section.descriptionKey)}
                </p>
              </div>

              {/* Bento Grid */}
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.cards.map((card, i) => (
                  <BentoCard
                    key={card.page}
                    card={card}
                    onNavigate={onNavigate}
                    size={i === 0 ? 'md' : 'sm'}
                    delay={sIdx * 100 + i * 80}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ═══ CTA SECTION ═══ */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-bento border border-white/[0.06] bg-[linear-gradient(135deg,rgba(0,212,255,0.06),rgba(168,85,247,0.05),rgba(236,72,153,0.04))] px-8 py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-neon-cyan-dim blur-[100px] opacity-40" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-neon-purple-dim blur-[100px] opacity-30" />

            <div className="relative">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-cyan">
                {t('app.home.ctaTitle')}
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tighter text-white md:text-4xl">
                {t('app.home.ctaTitle')}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-lab-muted text-pretty md:text-base">
                {t('app.home.ctaDescription')}
              </p>
            </div>
            <div className="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <button
                type="button"
                onClick={() => onNavigate('image-playground')}
                className="btn-neon"
              >
                {t('app.home.playgroundCta', '体验生图模型')}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('mindmap')}
                className="btn-neon-outline"
              >
                {t('app.home.mindmapCta', '创建思维导图')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
