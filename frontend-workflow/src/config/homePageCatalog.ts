export type HomeNavigablePage =
  | 'paper2figure-tech-exp'
  | 'paper2figure-model-drawio'
  | 'paper2drawio-ai'
  | 'image-playground'
  | 'mindmap'
  | 'image2drawio'
  | 'files';

export type HomePreviewKind = 'image' | 'gif' | 'video';

export type HomeIconKey =
  | 'sparkles'
  | 'presentation'
  | 'video'
  | 'gitBranch'
  | 'brainCircuit'
  | 'network'
  | 'layoutTemplate'
  | 'fileStack'
  | 'fileImage'
  | 'fileSearch'
  | 'messageSquare'
  | 'bookOpen'
  | 'folderKanban'
  | 'flame';

export interface HomePreviewAsset {
  kind: HomePreviewKind;
  src: string;
  poster?: string;
}

export interface HomeFeatureCard {
  page: HomeNavigablePage;
  titleKey: string;
  descriptionKey: string;
  badgeKey: string;
  icon: HomeIconKey;
  accent: string;
  preview?: HomePreviewAsset;
}

export interface HomeFeatureSection {
  titleKey: string;
  descriptionKey: string;
  cards: HomeFeatureCard[];
}

export const featuredHomeCards: HomeFeatureCard[] = [
  {
    page: 'image-playground',
    titleKey: 'app.home.cards.imagePlayground.title',
    descriptionKey: 'app.home.cards.imagePlayground.description',
    badgeKey: 'app.home.cards.imagePlayground.badge',
    icon: 'flame',
    accent: 'from-orange-500/80 via-rose-400/70 to-pink-300/70',
    preview: {
      kind: 'image',
      src: '/home-previews/paper2figure-tech-exp.png',
    },
  },
  {
    page: 'paper2figure-model-drawio',
    titleKey: 'app.home.cards.paper2figureModel.title',
    descriptionKey: 'app.home.cards.paper2figureModel.description',
    badgeKey: 'app.home.cards.paper2figureModel.badge',
    icon: 'gitBranch',
    accent: 'from-sky-500/80 via-cyan-400/70 to-teal-300/70',
    preview: {
      kind: 'image',
      src: '/home-previews/paper2figure-model.png',
    },
  },
  {
    page: 'paper2figure-tech-exp',
    titleKey: 'app.home.cards.paper2figureTechExp.title',
    descriptionKey: 'app.home.cards.paper2figureTechExp.description',
    badgeKey: 'app.home.cards.paper2figureTechExp.badge',
    icon: 'sparkles',
    accent: 'from-emerald-500/75 via-teal-400/65 to-cyan-300/60',
    preview: {
      kind: 'image',
      src: '/home-previews/paper2figure-tech-route-alt.png',
    },
  },
  {
    page: 'paper2drawio-ai',
    titleKey: 'app.home.cards.paper2drawioAi.title',
    descriptionKey: 'app.home.cards.paper2drawioAi.description',
    badgeKey: 'app.home.cards.paper2drawioAi.badge',
    icon: 'network',
    accent: 'from-violet-500/75 via-fuchsia-400/65 to-pink-300/60',
    preview: {
      kind: 'gif',
      src: '/home-previews/paper2drawio-ai.gif',
    },
  },
];

export const homeFeatureSections: HomeFeatureSection[] = [
  {
    titleKey: 'app.home.sections.creation.title',
    descriptionKey: 'app.home.sections.creation.description',
    cards: [
      {
        page: 'paper2figure-tech-exp',
        titleKey: 'app.home.cards.paper2figureTechExp.title',
        descriptionKey: 'app.home.cards.paper2figureTechExp.description',
        badgeKey: 'app.home.cards.paper2figureTechExp.badge',
        icon: 'sparkles',
        accent: 'from-emerald-500/75 via-teal-400/65 to-cyan-300/60',
        preview: {
          kind: 'image',
          src: '/home-previews/paper2figure-tech-route-alt.png',
        },
      },
      {
        page: 'paper2figure-model-drawio',
        titleKey: 'app.home.cards.paper2figureModel.title',
        descriptionKey: 'app.home.cards.paper2figureModel.description',
        badgeKey: 'app.home.cards.paper2figureModel.badge',
        icon: 'gitBranch',
        accent: 'from-sky-500/75 via-cyan-400/65 to-teal-300/60',
        preview: {
          kind: 'image',
          src: '/home-previews/paper2figure-model.png',
        },
      },
      {
        page: 'paper2drawio-ai',
        titleKey: 'app.home.cards.paper2drawioAi.title',
        descriptionKey: 'app.home.cards.paper2drawioAi.description',
        badgeKey: 'app.home.cards.paper2drawioAi.badge',
        icon: 'network',
        accent: 'from-violet-500/75 via-fuchsia-400/65 to-pink-300/60',
        preview: {
          kind: 'gif',
          src: '/home-previews/paper2drawio-ai.gif',
        },
      },
      {
        page: 'mindmap',
        titleKey: 'app.home.cards.mindmap.title',
        descriptionKey: 'app.home.cards.mindmap.description',
        badgeKey: 'app.home.cards.mindmap.badge',
        icon: 'brainCircuit',
        accent: 'from-cyan-500/75 via-sky-400/65 to-indigo-300/60',
        preview: {
          kind: 'image',
          src: '/home-previews/mindmap-home.png',
        },
      },
      {
        page: 'image-playground',
        titleKey: 'app.home.cards.imagePlayground.title',
        descriptionKey: 'app.home.cards.imagePlayground.description',
        badgeKey: 'app.home.cards.imagePlayground.badge',
        icon: 'flame',
        accent: 'from-orange-500/75 via-amber-400/65 to-yellow-300/60',
        preview: {
          kind: 'image',
          src: '/home-previews/paper2figure-tech-exp.png',
        },
      },
      {
        page: 'image2drawio',
        titleKey: 'app.home.cards.image2drawio.title',
        descriptionKey: 'app.home.cards.image2drawio.description',
        badgeKey: 'app.home.cards.image2drawio.badge',
        icon: 'network',
        accent: 'from-lime-500/75 via-emerald-400/65 to-teal-300/60',
        preview: {
          kind: 'image',
          src: '/home-previews/image2drawio.png',
        },
      },
    ],
  },
  {
    titleKey: 'app.home.sections.research.title',
    descriptionKey: 'app.home.sections.research.description',
    cards: [
      {
        page: 'files',
        titleKey: 'app.home.cards.files.title',
        descriptionKey: 'app.home.cards.files.description',
        badgeKey: 'app.home.cards.files.badge',
        icon: 'folderKanban',
        accent: 'from-emerald-500/75 via-green-400/65 to-lime-300/60',
      },
    ],
  },
];
