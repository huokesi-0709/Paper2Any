import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type LanguageCode = 'zh' | 'en';

const languages: { code: LanguageCode; label: string; ariaLabel: string }[] = [
  { code: 'zh', label: '中文', ariaLabel: '切换为中文' },
  { code: 'en', label: 'EN', ariaLabel: 'Switch to English' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [pendingLanguage, setPendingLanguage] = useState<LanguageCode | null>(null);
  const currentCode: LanguageCode = i18n.resolvedLanguage?.startsWith('zh') || i18n.language?.startsWith('zh')
    ? 'zh'
    : 'en';

  useEffect(() => {
    document.documentElement.lang = currentCode === 'zh' ? 'zh-CN' : 'en';
  }, [currentCode]);

  const changeLanguage = async (language: LanguageCode) => {
    if (language === currentCode || pendingLanguage) return;
    setPendingLanguage(language);
    try {
      await i18n.changeLanguage(language);
      window.localStorage.setItem('i18nextLng', language);
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    } finally {
      setPendingLanguage(null);
    }
  };

  return (
    <div
      className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 p-1"
      role="group"
      aria-label="Language / 语言"
    >
      {languages.map((language) => {
        const isActive = currentCode === language.code;
        const isPending = pendingLanguage === language.code;

        return (
          <button
            type="button"
            key={language.code}
            onClick={() => void changeLanguage(language.code)}
            disabled={Boolean(pendingLanguage)}
            aria-pressed={isActive}
            aria-label={language.ariaLabel}
            title={language.ariaLabel}
            className={`h-7 min-w-10 cursor-pointer rounded-md px-2 text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60 disabled:cursor-wait ${
              isActive
                ? 'bg-white text-blue-700 shadow-[0_3px_10px_rgba(15,39,71,0.1)]'
                : 'text-lab-muted hover:bg-white/70 hover:text-lab-primary'
            } ${isPending ? 'animate-pulse' : ''}`}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
