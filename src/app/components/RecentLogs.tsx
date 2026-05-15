import { motion } from 'motion/react';
import { Activity, Pill, FileText, Calendar } from 'lucide-react';
import { recentSymptoms, currentMedications, doctorNotes } from '../data/healthData';
import { format } from 'date-fns';

export function RecentLogs() {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'text-[#E63946] border-[#E63946]/20 bg-[#E63946]/5';
      case 'moderate':
        return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'mild':
        return 'text-[#F4C430] border-[#F4C430]/30 bg-[#F4C430]/10';
      default:
        return 'text-slate-600 border-slate-200 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#0F3D3E]">Recent Logs</h3>
          <p className="text-sm text-slate-500 mt-1">Latest structured data entries</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Symptoms Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Symptoms</h4>
          </div>
          <div className="space-y-3">
            {recentSymptoms.slice(0, 3).map((symptom, index) => (
              <motion.div
                key={symptom.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-[#F7F9F9] border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wider font-semibold border ${getSeverityStyle(symptom.severity)}`}>
                      {symptom.severity}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {format(new Date(symptom.date), 'MMM dd')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0F3D3E]">
                    {symptom.description}
                  </p>
                </div>
                <div className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-600 border border-slate-200 capitalize shadow-sm">
                  {symptom.bodyPart}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Medications Section */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Active Prescriptions</h4>
          </div>
          <div className="space-y-3">
            {currentMedications.map((med, index) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#F7F9F9] border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Pill className="w-5 h-5 text-[#2EC4B6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0F3D3E] mb-1">
                    {med.name}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {med.dosage} • {med.frequency}
                  </div>
                </div>
                {med.endDate && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                    <Calendar className="w-3 h-3" />
                    Until {format(new Date(med.endDate), 'MMM dd')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Doctor Notes Section */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Clinical Notes</h4>
          </div>
          <div className="space-y-3">
            {doctorNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-xl bg-[#F7F9F9] border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-semibold text-[#0F3D3E]">
                      {note.doctor}
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-1">
                      {note.specialty}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    {format(new Date(note.date), 'MMM dd, yyyy')}
                  </div>
                </div>
                {note.diagnosis && (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-[#0F3D3E] border border-slate-200 mb-3 shadow-sm">
                    Dx: {note.diagnosis}
                  </div>
                )}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {note.notes}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}