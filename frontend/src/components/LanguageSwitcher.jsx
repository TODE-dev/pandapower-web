import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const isZh = i18n.language?.startsWith('zh');

  const toggle = () => {
    i18n.changeLanguage(isZh ? 'en' : 'zh');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all text-sm text-slate-300 hover:text-slate-200"
      title={isZh ? 'Switch to English' : '切换到中文'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
      <span className="font-medium">{isZh ? 'EN' : '中文'}</span>
    </button>
  );
}
