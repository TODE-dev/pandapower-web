import { useTranslation } from 'react-i18next';

const COMPONENT_ICONS = {
  bus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
      <path strokeWidth="2" d="M12 5v2M12 17v2M5 12h2M17 12h2" />
    </svg>
  ),
  line: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" d="M4 12h16" />
      <circle cx="4" cy="12" r="2" fill="currentColor" />
      <circle cx="20" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  trafo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="8" cy="12" r="4" strokeWidth="2" />
      <circle cx="16" cy="12" r="4" strokeWidth="2" />
    </svg>
  ),
  load: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" d="M12 4v8M8 12l4 8 4-8H8z" />
    </svg>
  ),
  gen: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="6" strokeWidth="2" />
      <path strokeWidth="2" d="M12 6v2M12 16v2M6 12h2M16 12h2" />
      <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor">G</text>
    </svg>
  ),
  ext_grid: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
      <path strokeWidth="2" d="M6 10h12M6 14h12M10 6v12M14 6v12" />
    </svg>
  ),
  default: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" strokeWidth="2" />
    </svg>
  ),
};

export default function NetworkSummary({ summary, filename, fileFormat }) {
  const { t } = useTranslation();

  const items = [
    { key: 'bus', value: summary.n_bus, color: 'cyan' },
    { key: 'line', value: summary.n_line, color: 'emerald' },
    { key: 'trafo', value: summary.n_trafo, color: 'violet' },
    { key: 'trafo3w', value: summary.n_trafo3w, color: 'violet' },
    { key: 'load', value: summary.n_load, color: 'amber' },
    { key: 'gen', value: summary.n_gen, color: 'rose' },
    { key: 'sgen', value: summary.n_sgen, color: 'rose' },
    { key: 'ext_grid', value: summary.n_ext_grid, color: 'sky' },
    { key: 'shunt', value: summary.n_shunt, color: 'slate' },
    { key: 'switch', value: summary.n_switch, color: 'slate' },
  ].filter(item => item.value > 0);

  const getColorClasses = (color) => {
    const colors = {
      cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
      amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      rose: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
      sky: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
      slate: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    };
    return colors[color] || colors.slate;
  };

  const formatBadge = fileFormat.toUpperCase();
  const formatColor = {
    JSON: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    XLSX: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    XLS: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    PKL: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
    PICKLE: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
    SQLITE: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    DB: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  }[formatBadge] || 'text-slate-400 bg-slate-400/10 border-slate-400/30';

  // Map component key to icon key (trafo3w/sgen/shunt/switch share icons)
  const getIcon = (key) => {
    if (key === 'trafo3w') return COMPONENT_ICONS.trafo;
    if (key === 'sgen') return COMPONENT_ICONS.gen;
    return COMPONENT_ICONS[key] || COMPONENT_ICONS.default;
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{t('networkSummary.loaded')}</h3>
            <p className="text-sm text-slate-400 font-mono truncate max-w-md" title={filename}>
              {filename}
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border ${formatColor}`}>
          {formatBadge}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 stagger-children">
        {items.map(({ key, value, color }) => (
          <div
            key={key}
            className="metric-card group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`${getColorClasses(color).split(' ')[0]}`}>
                {getIcon(key)}
              </span>
              <span className={`text-2xl font-bold font-mono ${getColorClasses(color).split(' ')[0]}`}>
                {value}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{t(`components.${key}`)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/30 flex items-center justify-between">
        <span className="text-xs text-slate-500">{t('networkSummary.totalComponents')}</span>
        <span className="text-sm font-mono font-semibold text-slate-300">
          {items.reduce((sum, item) => sum + item.value, 0)}
        </span>
      </div>
    </div>
  );
}
