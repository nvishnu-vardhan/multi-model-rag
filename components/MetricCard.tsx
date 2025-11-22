import React from 'react';
import { RetrievalMetric } from '../types';
import { Clock, Zap, FileSearch, Cpu } from 'lucide-react';

interface MetricCardProps {
  metrics: RetrievalMetric;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metrics }) => {
  return (
    <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
      <div className="flex items-center gap-2 text-slate-400">
        <Cpu className="w-3 h-3 text-green-400" />
        <span className="truncate">{metrics.modelName}</span>
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        <Clock className="w-3 h-3 text-blue-400" />
        <span>{metrics.latencyMs}ms</span>
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        <FileSearch className="w-3 h-3 text-purple-400" />
        <span>{metrics.sourcesCount} docs</span>
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        <Zap className="w-3 h-3 text-yellow-400" />
        <span>{metrics.tokensUsed > 0 ? `${(metrics.tokensUsed / 1000).toFixed(1)}k toks` : 'N/A'}</span>
      </div>
    </div>
  );
};