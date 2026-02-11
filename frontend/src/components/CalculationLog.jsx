import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CalculationLog({ log }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!log) return null;

  const hasWarnings = log.warnings && log.warnings.length > 0;
  const algorithmName = t(`algorithms.${log.algorithm}.label`);
  const initMethodName = t(`initMethods.${log.init_method}`);

  const summaryParts = [];
  if (log.calculation_time_ms != null) {
    summaryParts.push(`${log.calculation_time_ms.toFixed(1)} ms`);
  }
  if (log.iterations != null) {
    summaryParts.push(t('calculationLog.iterations', { count: log.iterations }));
  }
  summaryParts.push(algorithmName);
  if (hasWarnings) {
    summaryParts.push(t('calculationLog.warnings', { count: log.warnings.length }));
  }

  return (
    <div className="rounded-xl border border-slate-700/30 overflow-hidden bg-slate-800/30 backdrop-blur-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <div className="text-left">
            <div className="text-sm font-semibold text-slate-200">{t('calculationLog.title')}</div>
            <div className="text-xs text-slate-500 font-mono">
              {summaryParts.join(' · ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasWarnings && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {t('calculationLog.warningBadge', { count: log.warnings.length })}
            </span>
          )}

          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700/30 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">{t('calculationLog.algorithm')}</div>
              <div className="text-sm text-slate-200 font-medium">{algorithmName}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">{t('calculationLog.initMethod')}</div>
              <div className="text-sm text-slate-200 font-medium">{initMethodName}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">{t('calculationLog.tolerance')}</div>
              <div className="text-sm text-slate-200 font-mono">
                {log.tolerance_mva.toExponential(0)}
                <span className="text-xs text-slate-500 ml-1">MVA</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">{t('calculationLog.maxIteration')}</div>
              <div className="text-sm text-slate-200 font-mono">{log.max_iteration}</div>
            </div>

            {log.calculation_time_ms != null && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="text-xs text-slate-500 mb-1">{t('calculationLog.calcTime')}</div>
                <div className="text-sm text-cyan-400 font-mono font-medium">
                  {log.calculation_time_ms.toFixed(2)}
                  <span className="text-xs text-slate-500 ml-1">ms</span>
                </div>
              </div>
            )}

            {log.iterations != null && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="text-xs text-slate-500 mb-1">{t('calculationLog.actualIterations')}</div>
                <div className="text-sm text-cyan-400 font-mono font-medium">
                  {log.iterations}
                </div>
              </div>
            )}

            {log.slack_p_mw != null && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="text-xs text-slate-500 mb-1">{t('calculationLog.slackActivePower')}</div>
                <div className="text-sm text-slate-200 font-mono">
                  {log.slack_p_mw.toFixed(4)}
                  <span className="text-xs text-slate-500 ml-1">MW</span>
                </div>
              </div>
            )}

            {log.slack_q_mvar != null && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="text-xs text-slate-500 mb-1">{t('calculationLog.slackReactivePower')}</div>
                <div className="text-sm text-slate-200 font-mono">
                  {log.slack_q_mvar.toFixed(4)}
                  <span className="text-xs text-slate-500 ml-1">Mvar</span>
                </div>
              </div>
            )}
          </div>

          {hasWarnings && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  {t('calculationLog.warningTitle')}
                </span>
              </div>
              <ul className="space-y-1.5">
                {log.warnings.map((warning, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-amber-300/90 font-mono pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
