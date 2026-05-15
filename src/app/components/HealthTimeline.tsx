import { motion } from 'motion/react';
import { healthEvents } from '../data/healthData';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

export function HealthTimeline() {
  const navigate = useNavigate();
  const sortedEvents = [...healthEvents].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-[#E63946] border-[#E63946]/20 bg-[#E63946]/5';
      case 'medium':
        return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'low':
        return 'text-[#F4C430] border-[#F4C430]/30 bg-[#F4C430]/10';
      default:
        return 'text-[#2EC4B6] border-[#2EC4B6]/20 bg-[#2EC4B6]/5';
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-[#E63946] shadow-[0_0_8px_rgba(230,57,70,0.4)]';
      case 'medium': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      case 'low': return 'bg-[#F4C430] shadow-[0_0_8px_rgba(244,196,48,0.4)]';
      default: return 'bg-[#2EC4B6] shadow-[0_0_8px_rgba(46,196,182,0.4)]';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#0F3D3E]">Health History Timeline</h3>
          <p className="text-sm text-slate-500 mt-1">Chronological record of clinical events</p>
        </div>
      </div>

      {/* Horizontal scrollable timeline */}
      <div className="relative p-6">
        <div className="overflow-x-auto pb-6 scrollbar-hide">
          <div className="flex gap-6 min-w-max items-stretch">
            {sortedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group flex flex-col"
              >
                {/* Connection line */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-[calc(100%-1.5rem)] top-[42px] w-[calc(1.5rem+24px)] h-px bg-slate-200" />
                )}

                {/* Event card */}
                <div 
                  onClick={() => navigate(`/detail/${event.bodyPart}`)}
                  className="w-64 bg-[#F7F9F9] rounded-xl p-5 border border-slate-100 hover:border-[#2EC4B6]/40 hover:shadow-md transition-all cursor-pointer flex-1 flex flex-col"
                >
                  {/* Date & Dot */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${getSeverityDot(event.severity)}`} />
                    <span className="text-sm text-slate-500 font-medium">
                      {format(new Date(event.date), 'MMMM dd, yyyy')}
                    </span>
                  </div>

                  {/* Condition */}
                  <div className="mb-4 flex-1">
                    <h4 className="text-base font-semibold text-[#0F3D3E] mb-1 truncate">{event.condition}</h4>
                    <div className="text-sm text-slate-500">{event.category}</div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border capitalize ${getSeverityStyle(event.severity)}`}>
                      {event.severity} severity
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-600 border border-slate-200 capitalize">
                      {event.bodyPart}
                    </span>
                  </div>

                  {/* Pattern Hint */}
                  {event.patternHint && (
                    <div className="mt-auto pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#2EC4B6]">
                        <Sparkles className="w-3 h-3" />
                        Pattern: {event.patternHint}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}