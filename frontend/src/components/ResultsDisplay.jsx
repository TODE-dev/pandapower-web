import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResultTable from './ResultTable';
import CalculationLog from './CalculationLog';
import {
  getMetricSeverity,
  SEVERITY_STYLES,
  METRIC_THRESHOLDS
} from '../constants/powerflow';

const RESULT_TABLES = [
  { key: 'res_bus', titleKey: 'bus', icon: 'M12 6v2M12 16v2M6 12h2M16 12h2' },
  { key: 'res_line', titleKey: 'line', icon: 'M4 12h16' },
  { key: 'res_trafo', titleKey: 'trafo', icon: 'M8 12a4 4 0 108 0 4 4 0 00-8 0M4 12h4M16 12h4' },
  { key: 'res_trafo3w', titleKey: 'trafo3w', icon: 'M8 12a4 4 0 108 0 4 4 0 00-8 0M4 12h4M16 12h4' },
  { key: 'res_load', titleKey: 'load', icon: 'M12 4v8M8 12l4 8 4-8H8z' },
  { key: 'res_gen', titleKey: 'gen', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'res_sgen', titleKey: 'sgen', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'res_ext_grid', titleKey: 'ext_grid', icon: 'M4 4h16v16H4z' },
  { key: 'res_shunt', titleKey: 'shunt', icon: 'M12 4v16M8 8h8M8 16h8' },
];

export default function ResultsDisplay({ results, onDownload, isDownloading }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('res_bus');

  const availableTables = RESULT_TABLES.filter(
    ({ key }) => results[key] && results[key].row_count > 0
  );

  const hasVoltageIssues =
    results.min_vm_pu != null && (
      results.min_vm_pu < METRIC_THRESHOLDS.voltageMin.critical ||
      results.max_vm_pu > METRIC_THRESHOLDS.voltageMax.critical
    );
  const hasOverloads =
    results.max_loading_percent != null &&
    results.max_loading_percent > METRIC_THRESHOLDS.loading.critical;

  const getStatusConfig = () => {
    if (!results.converged) {
      return {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        icon: 'text-rose-400',
        iconBg: 'bg-rose-500/20',
        title: 'text-rose-300',
        titleText: t('results.failed'),
      };
    }
    if (hasOverloads || hasVoltageIssues) {
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        icon: 'text-amber-400',
        iconBg: 'bg-amber-500/20',
        title: 'text-amber-300',
        titleText: t('results.convergedWarning'),
      };
    }
    return {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      title: 'text-emerald-300',
      titleText: t('results.converged'),
    };
  };

  const status = getStatusConfig();

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className={`p-6 ${status.bg} border-b ${status.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${status.iconBg} flex items-center justify-center`}>
              {results.converged ? (
                <svg className={`w-6 h-6 ${status.icon}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className={`w-6 h-6 ${status.icon}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${status.title}`}>{status.titleText}</h3>
              <p className="text-sm text-slate-400">{results.message}</p>
            </div>
          </div>

          {results.converged && (
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="btn-secondary flex items-center gap-2"
            >
              {isDownloading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span>{isDownloading ? t('results.downloading') : t('results.exportExcel')}</span>
            </button>
          )}
        </div>

        {results.converged && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {results.max_loading_percent != null && (() => {
              const severity = getMetricSeverity(results.max_loading_percent, 'loading');
              const styles = SEVERITY_STYLES[severity];
              return (
                <div className={`p-3 rounded-lg border ${styles.bg}`}>
                  <div className="text-xs text-slate-400 mb-1">{t('results.maxLoading')}</div>
                  <div className={`text-lg font-bold font-mono ${styles.text}`}>
                    {results.max_loading_percent.toFixed(1)}%
                  </div>
                </div>
              );
            })()}
            {results.min_vm_pu != null && (() => {
              const severity = getMetricSeverity(results.min_vm_pu, 'voltageMin');
              const styles = SEVERITY_STYLES[severity];
              return (
                <div className={`p-3 rounded-lg border ${styles.bg}`}>
                  <div className="text-xs text-slate-400 mb-1">{t('results.minVoltage')}</div>
                  <div className={`text-lg font-bold font-mono ${styles.text}`}>
                    {results.min_vm_pu.toFixed(4)} <span className="text-xs font-normal text-slate-500">p.u.</span>
                  </div>
                </div>
              );
            })()}
            {results.max_vm_pu != null && (() => {
              const severity = getMetricSeverity(results.max_vm_pu, 'voltageMax');
              const styles = SEVERITY_STYLES[severity];
              return (
                <div className={`p-3 rounded-lg border ${styles.bg}`}>
                  <div className="text-xs text-slate-400 mb-1">{t('results.maxVoltage')}</div>
                  <div className={`text-lg font-bold font-mono ${styles.text}`}>
                    {results.max_vm_pu.toFixed(4)} <span className="text-xs font-normal text-slate-500">p.u.</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {results.calculation_log && (
        <div className="p-6 pb-0">
          <CalculationLog log={results.calculation_log} />
        </div>
      )}

      {results.converged && availableTables.length > 0 && (
        <div className="p-6">
          <div className="flex gap-1 overflow-x-auto pb-4 mb-4 border-b border-slate-700/30">
            {availableTables.map(({ key, titleKey }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`tab-item whitespace-nowrap ${activeTab === key ? 'active' : ''}`}
              >
                {t(`components.${titleKey}`)}
                <span className="ml-1.5 text-xs opacity-60">
                  ({results[key].row_count})
                </span>
              </button>
            ))}
          </div>

          <div>
            {availableTables.map(({ key, titleKey }) => (
              <div key={key} className={activeTab === key ? '' : 'hidden'}>
                <ResultTable title={t(`components.${titleKey}`)} tableData={results[key]} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
