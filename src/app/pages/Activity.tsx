import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { useDemoMode } from '../context/DemoContext';
import {
  Pill, Filter, Search, X, Calendar, Clock, FileText, ChevronRight, BrainCircuit
} from 'lucide-react';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: number;
  doctor: string;
  status: 'Active' | 'Completed';
  date: string;
  durationDays: number;
  medicines: Medicine[];
  instructions: string;
  hospital?: string;
}

const prescriptions: Prescription[] = [
  {
    id: 1,
    doctor: 'Dr. Sarah Jenkins',
    status: 'Active',
    date: '2023-10-24',
    durationDays: 7,
    hospital: 'City General Hospital',
    medicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times a day', duration: 'For 7 days' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed for pain', duration: 'For 5 days' },
    ],
    instructions: 'Take antibiotics after meals. Drink plenty of water.',
  },
  {
    id: 2,
    doctor: 'Dr. Michael Chen',
    status: 'Completed',
    date: '2023-09-15',
    durationDays: 30,
    hospital: 'Riverside Medical Center',
    medicines: [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: 'For 30 days' },
    ],
    instructions: 'Take in the morning with or without food. Monitor blood pressure regularly.',
  },
  {
    id: 3,
    doctor: 'Dr. Emily Carter',
    status: 'Completed',
    date: '2023-08-02',
    durationDays: 14,
    hospital: 'Northside Allergy Clinic',
    medicines: [
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: 'For 14 days' },
      { name: 'Fluticasone', dosage: '2 sprays', frequency: 'Twice daily (each nostril)', duration: 'For 14 days' },
    ],
    instructions: 'Use Fluticasone spray before bedtime. Avoid known allergens during treatment.',
  },
  {
    id: 4,
    doctor: 'Dr. Ravi Patel',
    status: 'Completed',
    date: '2023-06-10',
    durationDays: 5,
    hospital: 'Metro Urgent Care',
    medicines: [
      { name: 'Azithromycin', dosage: '250mg', frequency: 'Once daily', duration: 'For 5 days' },
      { name: 'Bromhexine', dosage: '8mg', frequency: 'Twice a day', duration: 'For 5 days' },
      { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: 'For 3 days' },
    ],
    instructions: 'Complete the full course of antibiotics. Rest adequately and stay hydrated.',
  },
  {
    id: 5,
    doctor: 'Dr. Aisha Nkosi',
    status: 'Active',
    date: '2023-11-01',
    durationDays: 21,
    hospital: 'Lakewood Family Clinic',
    medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily with meals', duration: 'Ongoing' },
      { name: 'Vitamin B12', dosage: '1000mcg', frequency: 'Once daily', duration: 'Ongoing' },
    ],
    instructions: 'Monitor blood sugar levels twice daily. Maintain a low-carb diet and stay active.',
  },
  {
    id: 6,
    doctor: 'Dr. James Liu',
    status: 'Completed',
    date: '2023-05-18',
    durationDays: 10,
    hospital: 'Greenfield Sports Medicine',
    medicines: [
      { name: 'Naproxen', dosage: '500mg', frequency: 'Twice a day', duration: 'For 10 days' },
      { name: 'Cyclobenzaprine', dosage: '5mg', frequency: 'At bedtime', duration: 'For 7 days' },
    ],
    instructions: 'Apply ice to the affected area for 20 minutes every 2 hours. Avoid strenuous activity.',
  },
];

const filters = ['All', 'Active', 'Completed'];

export function Activity() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Prescription | null>(null);
  const { isDemoMode } = useDemoMode();

  const filtered = prescriptions.filter(p => {
    const matchFilter = filter === 'All' || p.status === filter;
    const matchSearch =
      p.doctor.toLowerCase().includes(search.toLowerCase()) ||
      p.medicines.some(m => m.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.hospital ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 relative">
      {isDemoMode && (
        <div className="fixed inset-0 pointer-events-none z-0 border-8 border-[#2EC4B6]/20 transition-all duration-500" />
      )}
      <Header />
      <main className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-heading font-extrabold text-slate-900 tracking-tighter mb-1">
                Health Records
              </h1>
              <p className="text-sm text-slate-500">
                Your complete prescription and treatment history.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor, medicine..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white/80 backdrop-blur-md border border-white rounded-full text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full md:w-64 transition-all"
                />
              </div>
              <button className="p-3 bg-white/80 backdrop-blur-md border border-white rounded-full text-slate-500 hover:text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] rounded-tl-2xl rounded-br-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white mb-8">
            <div className="flex gap-2 flex-wrap">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-[#0F3D3E] text-white shadow-md shadow-[#0F3D3E]/20'
                      : 'bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <BrainCircuit className="w-3.5 h-3.5 text-[#2EC4B6]" />
                <span>{filtered.length} records found</span>
              </div>
            </div>
          </div>

          {/* Flash Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((prescription, index) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                index={index}
                onClick={() => setSelected(prescription)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-24 flex flex-col items-center gap-3 text-slate-400">
                <FileText className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">No records found.</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <PrescriptionDetailModal
            prescription={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ─── Flash Card ─────────────────────────────────────────────── */

function PrescriptionCard({
  prescription,
  index,
  onClick,
}: {
  prescription: Prescription;
  index: number;
  onClick: () => void;
}) {
  const isActive = prescription.status === 'Active';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      onClick={onClick}
      className="group relative bg-white/90 backdrop-blur-2xl rounded-[28px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 cursor-pointer hover:shadow-[0_16px_48px_rgba(15,61,62,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
    >
      {/* Top row: status + date */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            isActive
              ? 'bg-[#EAF7F6] text-[#0F3D3E] border-[#2EC4B6]/40'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6] mr-1.5 animate-pulse" />
          )}
          {prescription.status}
        </span>
        <span className="text-xs font-semibold text-slate-400 tabular-nums">
          {prescription.date}
        </span>
      </div>

      {/* Doctor name */}
      <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1 leading-snug">
        {prescription.doctor}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-5">
        <Pill className="w-3.5 h-3.5 text-[#2EC4B6]" />
        <span>{prescription.medicines.length} medication{prescription.medicines.length !== 1 ? 's' : ''}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <Clock className="w-3.5 h-3.5" />
        <span>{prescription.durationDays} days</span>
      </div>

      {/* Medicine list */}
      <div className="flex flex-col gap-2 mb-6 flex-1">
        {prescription.medicines.slice(0, 3).map((med, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#EAF7F6] flex items-center justify-center shrink-0">
              <Pill className="w-3.5 h-3.5 text-[#2EC4B6]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-700 truncate block">{med.name}</span>
              <span className="text-xs text-slate-400 font-medium">{med.dosage}</span>
            </div>
          </div>
        ))}
        {prescription.medicines.length > 3 && (
          <p className="text-xs text-slate-400 font-medium pl-9">
            +{prescription.medicines.length - 3} more
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2EC4B6] group-hover:gap-2.5 transition-all duration-300">
          View full details
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Detail Modal ───────────────────────────────────────────── */

function PrescriptionDetailModal({
  prescription,
  onClose,
}: {
  prescription: Prescription;
  onClose: () => void;
}) {
  const isActive = prescription.status === 'Active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F3D3E]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight truncate">
                  {prescription.doctor}
                </h2>
                <span
                  className={`inline-flex items-center shrink-0 px-3 py-0.5 rounded-full text-xs font-semibold border ${
                    isActive
                      ? 'bg-[#EAF7F6] text-[#0F3D3E] border-[#2EC4B6]/40'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6] mr-1.5 animate-pulse" />
                  )}
                  {prescription.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Prescribed on {prescription.date}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Overall duration: {prescription.durationDays} days
                </span>
              </div>
              {prescription.hospital && (
                <p className="mt-1 text-xs text-slate-400 font-medium">{prescription.hospital}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto scrollbar-hide px-7 py-6 space-y-6 flex-1">
          {/* Prescribed Medicines */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-[#2EC4B6]" strokeWidth={2} />
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.12em]">
                Prescribed Medicines
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prescription.medicines.map((med, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-4 rounded-[18px] border border-slate-100 bg-slate-50/60 hover:border-[#2EC4B6]/30 hover:bg-[#EAF7F6]/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-extrabold text-slate-800">{med.name}</span>
                    <span className="text-xs font-bold text-[#2EC4B6] bg-[#EAF7F6] px-2.5 py-0.5 rounded-full border border-[#2EC4B6]/20">
                      {med.dosage}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      {med.frequency}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      {med.duration}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Doctor's Instructions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#2EC4B6]" strokeWidth={2} />
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.12em]">
                Doctor's Instructions
              </h3>
            </div>
            <div className="p-4 rounded-[18px] border border-slate-100 bg-slate-50/60 text-sm text-slate-600 leading-relaxed font-medium">
              {prescription.instructions}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold rounded-xl shadow-sm text-sm transition-all"
          >
            Close
          </button>
          <button className="px-5 py-2.5 bg-[#0F3D3E] text-white font-semibold rounded-xl shadow-md shadow-[#0F3D3E]/20 text-sm hover:bg-[#0a2e2f] transition-all">
            Download Record
          </button>
        </div>
      </motion.div>
    </div>
  );
}
