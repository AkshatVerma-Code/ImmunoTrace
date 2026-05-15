import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, CheckCircle, Lightbulb, Activity } from 'lucide-react';
import { aiInsights } from '../data/healthData';

export function AIInsightPanel() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return Activity;
      case 'preventive':
        return Lightbulb;
      case 'trend':
        return TrendingUp;
      default:
        return CheckCircle;
    }
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'pattern':
        return { text: 'text-[#E63946]', bg: 'bg-[#E63946]/5', border: 'border-[#E63946]/20' };
      case 'preventive':
        return { text: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' };
      case 'trend':
        return { text: 'text-[#2EC4B6]', bg: 'bg-[#2EC4B6]/5', border: 'border-[#2EC4B6]/20' };
      default:
        return { text: 'text-[#0F3D3E]', bg: 'bg-[#0F3D3E]/5', border: 'border-[#0F3D3E]/20' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-50">
        <h3 className="text-base font-semibold text-[#0F3D3E]">Clinical Intelligence</h3>
        <p className="text-sm text-slate-500 mt-1">Algorithmic pattern recognition and preventive care</p>
      </div>

      <div className="p-6 space-y-4">
        {aiInsights.map((insight, index) => {
          const Icon = getIcon(insight.type);
          const style = getStyle(insight.type);
          
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative rounded-xl border border-slate-100 bg-[#F7F9F9] p-5 hover:border-slate-200 transition-colors"
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg border ${style.bg} ${style.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${style.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-[#0F3D3E] uppercase tracking-wide">{insight.title}</h4>
                    {insight.confidence && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase ${
                        insight.confidence === 'high' 
                          ? 'bg-[#2EC4B6]/10 text-[#2EC4B6]' 
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {insight.confidence} conf
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-base font-medium text-[#0F3D3E] mb-2">
                    {insight.description}
                  </p>

                  {/* Detail */}
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    {insight.detail}
                  </p>

                  {/* Suggestion */}
                  {insight.actionable && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 border border-amber-100 shadow-sm">
                      <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-amber-600/70 uppercase tracking-wide mb-1">Action Suggested</div>
                        <p className="text-sm font-medium text-[#0F3D3E]">{insight.suggestion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}