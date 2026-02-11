import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALGORITHMS, INIT_METHODS } from '../constants/powerflow';

export default function CalculationForm({ onRun, isLoading }) {
  const { t } = useTranslation();
  const [params, setParams] = useState({
    algorithm: 'nr',
    max_iteration: null,
    enforce_q_lims: false,
    calculate_voltage_angles: true,
    init: 'auto',
    tolerance_mva: 1e-8,
  });
  const [useAutoIteration, setUseAutoIteration] = useState(true);

  const handleChange = (field, value) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handleAlgorithmChange = (algorithm) => {
    handleChange('algorithm', algorithm);
    if (useAutoIteration) {
      handleChange('max_iteration', null);
    }
  };

  const handleAutoIterationToggle = (isAuto) => {
    setUseAutoIteration(isAuto);
    if (isAuto) {
      handleChange('max_iteration', null);
    } else {
      const algo = ALGORITHMS.find(a => a.value === params.algorithm);
      handleChange('max_iteration', algo?.defaultIter || 30);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRun(params);
  };

  const selectedAlgo = ALGORITHMS.find(a => a.value === params.algorithm);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{t('calculationForm.title')}</h3>
          <p className="text-sm text-slate-400">{t('calculationForm.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            {t('calculationForm.algorithm')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {ALGORITHMS.map(({ value }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleAlgorithmChange(value)}
                disabled={isLoading}
                className={`
                  relative p-3 rounded-lg border text-left transition-all duration-200
                  ${params.algorithm === value
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-800/50'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className={`text-sm font-medium ${params.algorithm === value ? 'text-cyan-400' : 'text-slate-300'}`}>
                  {t(`algorithms.${value}.label`)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{t(`algorithms.${value}.desc`)}</div>
                {params.algorithm === value && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('calculationForm.initMethod')}
            </label>
            <select
              value={params.init}
              onChange={(e) => handleChange('init', e.target.value)}
              className="input-field"
              disabled={isLoading}
            >
              {INIT_METHODS.map(({ value }) => (
                <option key={value} value={value}>{t(`initMethods.${value}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('calculationForm.maxIteration')}
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAutoIterationToggle(true)}
                  disabled={isLoading}
                  className={`
                    px-3 py-1.5 text-xs rounded-md border transition-all
                    ${useAutoIteration
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600/50'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {t('calculationForm.auto')}
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoIterationToggle(false)}
                  disabled={isLoading}
                  className={`
                    px-3 py-1.5 text-xs rounded-md border transition-all
                    ${!useAutoIteration
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600/50'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {t('calculationForm.manual')}
                </button>
              </div>
              {useAutoIteration ? (
                <div className="text-xs text-slate-500">
                  {t('calculationForm.autoDefault', { count: selectedAlgo?.defaultIter || 30 })}
                </div>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={params.max_iteration || ''}
                  onChange={(e) => handleChange('max_iteration', parseInt(e.target.value) || 1)}
                  className="input-field"
                  disabled={isLoading}
                  placeholder={t('calculationForm.defaultPlaceholder', { count: selectedAlgo?.defaultIter || 30 })}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('calculationForm.tolerance')}
            </label>
            <input
              type="text"
              value={params.tolerance_mva}
              onChange={(e) => handleChange('tolerance_mva', parseFloat(e.target.value) || 1e-8)}
              className="input-field"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className={`
            flex items-center gap-3 cursor-pointer group
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}>
            <div className="relative">
              <input
                type="checkbox"
                checked={params.enforce_q_lims}
                onChange={(e) => handleChange('enforce_q_lims', e.target.checked)}
                className="checkbox-custom"
                disabled={isLoading}
              />
            </div>
            <div>
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                {t('calculationForm.enforceQLims')}
              </span>
              <p className="text-xs text-slate-500">{t('calculationForm.enforceQLimsDesc')}</p>
            </div>
          </label>

          <label className={`
            flex items-center gap-3 cursor-pointer group
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}>
            <div className="relative">
              <input
                type="checkbox"
                checked={params.calculate_voltage_angles}
                onChange={(e) => handleChange('calculate_voltage_angles', e.target.checked)}
                className="checkbox-custom"
                disabled={isLoading}
              />
            </div>
            <div>
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                {t('calculationForm.calcVoltageAngles')}
              </span>
              <p className="text-xs text-slate-500">{t('calculationForm.calcVoltageAnglesDesc')}</p>
            </div>
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('calculationForm.running')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{t('calculationForm.run')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
