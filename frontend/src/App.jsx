import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from './components/FileUpload';
import NetworkSummary from './components/NetworkSummary';
import CalculationForm from './components/CalculationForm';
import ResultsDisplay from './components/ResultsDisplay';
import ExampleCases from './components/ExampleCases';
import LanguageSwitcher from './components/LanguageSwitcher';
import { uploadNetwork, runPowerFlow, downloadResults } from './api/powerflow';
import { logger } from './utils/logger';

function PowerGridIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [sessionId, setSessionId] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleUpload = async (file) => {
    logger.info('Starting file upload', { filename: file.name, size: file.size });
    setIsUploading(true);
    setError(null);
    setResults(null);

    try {
      const response = await uploadNetwork(file);
      setSessionId(response.session_id);
      setNetworkInfo({
        filename: response.filename,
        fileFormat: response.file_format,
        summary: response.network_summary,
      });
      logger.info('Upload successful', { sessionId: response.session_id });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || t('error.uploadFailed');
      logger.error('Upload failed', { error: errorMessage });
      setError(errorMessage);
      setSessionId(null);
      setNetworkInfo(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRun = async (params) => {
    if (!sessionId) return;

    logger.info('Starting power flow calculation', { sessionId, params });
    setIsRunning(true);
    setError(null);

    try {
      const response = await runPowerFlow(sessionId, params);
      setResults(response);
      logger.info('Calculation completed', {
        sessionId,
        converged: response.converged,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || t('error.calculationFailed');
      logger.error('Calculation failed', { sessionId, error: errorMessage });
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownload = async () => {
    if (!sessionId) return;

    logger.info('Downloading results', { sessionId });
    setIsDownloading(true);
    try {
      await downloadResults(sessionId);
      logger.info('Download completed', { sessionId });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || t('error.downloadFailed');
      logger.error('Download failed', { sessionId, error: errorMessage });
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setNetworkInfo(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen grid-pattern">
      <header className="sticky top-0 z-50 glass-card border-t-0 border-x-0 rounded-none">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <PowerGridIcon className="h-10 w-10 text-cyan-400" />
                <div className="absolute inset-0 blur-lg bg-cyan-400/30" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                  {t('header.title')} <span className="text-cyan-400">{t('header.titleHighlight')}</span>
                </h1>
                <p className="text-xs text-slate-500 font-mono tracking-widest">
                  {t('header.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {networkInfo && (
                <button
                  onClick={handleReset}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('header.reUpload')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {error && (
            <div className="animate-slide-up glass-card rounded-xl p-4 status-error border">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <svg className="h-5 w-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-rose-300">{t('error.title')}</p>
                  <p className="text-sm text-rose-400/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!networkInfo && (
            <div className="animate-slide-up space-y-8">
              <FileUpload onUpload={handleUpload} isLoading={isUploading} />
              <ExampleCases />
            </div>
          )}

          {networkInfo && (
            <div className="space-y-6 animate-slide-up">
              <NetworkSummary
                summary={networkInfo.summary}
                filename={networkInfo.filename}
                fileFormat={networkInfo.fileFormat}
              />

              <CalculationForm onRun={handleRun} isLoading={isRunning} />
            </div>
          )}

          {results && (
            <div className="animate-slide-up">
              <ResultsDisplay
                results={results}
                onDownload={handleDownload}
                isDownloading={isDownloading}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-8 text-center">
        <p className="text-xs text-slate-600 font-mono">
          Powered by <span className="text-slate-400">pandapower</span>
        </p>
      </footer>
    </div>
  );
}
