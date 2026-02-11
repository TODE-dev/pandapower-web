import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const SUPPORTED_EXTENSIONS = ['.json', '.xlsx', '.xls', '.p', '.pkl', '.pickle', '.sqlite', '.db'];

const FILE_TYPES = [
  { ext: '.json', label: 'JSON', color: 'text-amber-400' },
  { ext: '.xlsx', label: 'Excel', color: 'text-emerald-400' },
  { ext: '.pkl', label: 'Pickle', color: 'text-violet-400' },
  { ext: '.sqlite', label: 'SQLite', color: 'text-cyan-400' },
];

export default function FileUpload({ onUpload, isLoading }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return t('fileUpload.unsupportedFormat');
    }
    return null;
  };

  const handleFile = (file) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          {t('fileUpload.title')}
        </h2>
        <p className="text-slate-400 text-sm">
          {t('fileUpload.description')}
        </p>
      </div>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative group cursor-pointer
          rounded-xl border-2 border-dashed p-12
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-cyan-400 bg-cyan-400/5 scale-[1.02]'
            : 'border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-800/30'}
          ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        {isDragging && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-cyan-400/10 to-transparent animate-pulse" />
        )}

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={SUPPORTED_EXTENSIONS.join(',')}
          className="hidden"
          disabled={isLoading}
        />

        <div className="relative flex flex-col items-center gap-6">
          <div className={`
            relative w-20 h-20 rounded-2xl
            flex items-center justify-center
            bg-slate-800/80 border border-slate-700/50
            transition-all duration-300
            ${isDragging ? 'scale-110 border-cyan-500/50' : 'group-hover:scale-105'}
          `}>
            {isLoading ? (
              <svg className="w-10 h-10 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className={`w-10 h-10 transition-colors duration-300 ${isDragging ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}

            {isDragging && (
              <div className="absolute inset-0 rounded-2xl blur-xl bg-cyan-400/20" />
            )}
          </div>

          <div className="text-center">
            {isLoading ? (
              <p className="text-cyan-400 font-medium animate-pulse-glow">
                {t('fileUpload.processing')}
              </p>
            ) : (
              <>
                <p className="text-slate-200 font-medium mb-1">
                  {isDragging ? (
                    <span className="text-cyan-400">{t('fileUpload.dropHere')}</span>
                  ) : (
                    <>
                      {t('fileUpload.dragOrClick')}{' '}
                      <span className="text-cyan-400 hover:text-cyan-300 transition-colors">{t('fileUpload.browse')}</span>
                    </>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {t('fileUpload.supportedFormats')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        {FILE_TYPES.map(({ ext, label, color }) => (
          <div key={ext} className="flex items-center gap-2">
            <span className={`text-xs font-mono font-semibold ${color}`}>{ext}</span>
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-rose-300">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
