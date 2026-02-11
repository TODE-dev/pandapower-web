// Power flow algorithm definitions with default iterations
// Default iterations match pandapower's "auto" behavior (from pandapower/run.py)
export const ALGORITHMS = [
  { value: 'nr', name: 'Newton-Raphson', defaultIter: 10 },
  { value: 'bfsw', name: 'Backward/Forward Sweep', defaultIter: 100 },
  { value: 'gs', name: 'Gauss-Seidel', defaultIter: 1000 },
  { value: 'fdbx', name: 'Fast-Decoupled BX', defaultIter: 30 },
  { value: 'fdxb', name: 'Fast-Decoupled XB', defaultIter: 30 },
];

// Initialization method values
export const INIT_METHODS = [
  { value: 'auto' },
  { value: 'flat' },
  { value: 'dc' },
  { value: 'results' },
];

// Metric severity thresholds
export const METRIC_THRESHOLDS = {
  loading: { critical: 100, warning: 80 },
  voltageMin: { critical: 0.95, warning: 0.97 },
  voltageMax: { critical: 1.05, warning: 1.03 },
};

// Get severity level based on metric type and value
export const getMetricSeverity = (value, type) => {
  if (value == null) return 'normal';

  const thresholds = METRIC_THRESHOLDS[type];
  if (!thresholds) return 'normal';

  if (type === 'loading' || type === 'voltageMax') {
    if (value > thresholds.critical) return 'critical';
    if (value > thresholds.warning) return 'warning';
  } else if (type === 'voltageMin') {
    if (value < thresholds.critical) return 'critical';
    if (value < thresholds.warning) return 'warning';
  }
  return 'normal';
};

// Severity-based styling classes
export const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-400',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-400',
  },
  normal: {
    bg: 'bg-slate-800/50 border-slate-700/30',
    text: 'text-slate-200',
  },
};
