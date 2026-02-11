import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getExampleList, downloadExample } from '../api/powerflow';
import { logger } from '../utils/logger';

export default function ExampleCases() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState(null);
  const [categoryKeys, setCategoryKeys] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingCase, setDownloadingCase] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isZh = i18n.language?.startsWith('zh');

  useEffect(() => {
    let cancelled = false;
    getExampleList()
      .then((data) => {
        if (!cancelled) {
          const cats = data.categories || {};
          const keys = Object.keys(cats);
          setCategories(cats);
          setCategoryKeys(keys);
          if (keys.length > 0) {
            setSelectedCategory(keys[0]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error('Failed to load examples', { error: err.message });
          setError('loadFailed');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const handleDownload = async (caseName) => {
    setDownloadingCase(caseName);
    try {
      await downloadExample(caseName);
    } catch (err) {
      logger.error('Failed to download example', { caseName, error: err.message });
    } finally {
      setDownloadingCase(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <svg className="w-8 h-8 text-cyan-400 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !categories || categoryKeys.length === 0) {
    return null;
  }

  const currentCategory = categories[selectedCategory];
  const networks = currentCategory?.networks || [];
  const categoryName = isZh ? currentCategory?.name_zh : currentCategory?.name_en;

  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          {t('examples.title')}
        </h2>
        <p className="text-slate-400 text-sm">
          {t('examples.subtitle')}
        </p>
      </div>

      {/* Category dropdown selector */}
      <div className="mb-6 max-w-md mx-auto relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:border-cyan-500/30 transition-all text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">
                {categoryName}
              </div>
              <div className="text-xs text-slate-500">
                {t('examples.networkCount', { count: networks.length })}
              </div>
            </div>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div role="listbox" className="absolute z-20 mt-2 w-full rounded-xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-sm shadow-xl max-h-80 overflow-y-auto">
              {categoryKeys.map((key) => {
                const cat = categories[key];
                const name = isZh ? cat.name_zh : cat.name_en;
                const count = cat.networks?.length || 0;
                const isSelected = key === selectedCategory;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      isSelected
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'hover:bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium truncate">{name}</span>
                    <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                      {t('examples.networkCount', { count })}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Network cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {networks.map((ex) => (
          <div
            key={ex.case_name}
            className="metric-card group flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-200 truncate">
                {ex.display_name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">
                {isZh ? ex.description_zh : ex.description_en}
              </div>
              <div className="text-xs text-slate-600 font-mono mt-1">
                {t('examples.busCount', { count: ex.bus_count })}
              </div>
            </div>

            <button
              onClick={() => handleDownload(ex.case_name)}
              disabled={downloadingCase === ex.case_name}
              className="flex-shrink-0 p-2 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all disabled:opacity-50"
              title={t('examples.download')}
            >
              {downloadingCase === ex.case_name ? (
                <svg className="w-4 h-4 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
