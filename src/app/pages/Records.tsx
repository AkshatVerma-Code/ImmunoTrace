import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { useDemoMode } from '../context/DemoContext';
import { UploadPrescriptionModal } from '../components/UploadPrescriptionModal';
import {
  FileText, Download, Filter, UploadCloud, Sparkles, BrainCircuit,
  MessageSquareText, ShieldCheck, Clock, Pill, Stethoscope, User,
  X, Calendar, ChevronRight, FlaskConical, ScanLine, ClipboardList,
  Search
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

type DocType = 'Lab Result' | 'Clinical Note' | 'Prescription' | 'Imaging';
type Relevance = 'High relevance' | 'Recent trend' | 'Repeated' | null;

interface Document {
  id: number;
  name: string;
  type: DocType;
  date: string;
  provider: string;
  size: string;
  tags: Relevance[];
  summary: string;
  details: string[];
}

/* ─── Data ───────────────────────────────────────────────────── */

type PrescriptionApiItem = {
  id: number;
  image_name: string | null;
  doctor_name: string | null;
  doctor_advice: string | null;
  diagnosis: string | null;
  prescription_date: string | null;
   treatment_start_date: string | null;
   treatment_end_date: string | null;
  medicines_json: unknown;
  ai_summary: string | null;
  created_at: string;
};

function parseMedicines(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapPrescriptionToDocument(item: PrescriptionApiItem): Document {
  const medicines = parseMedicines(item.medicines_json).map((med: any) => ({
    name: String(med?.name || 'Unknown medicine'),
    dosage: med?.dosage ? String(med.dosage) : '',
    frequency: med?.frequency ? String(med.frequency) : '',
    duration: med?.duration ? String(med.duration) : '',
  }));

  const medicineDetails = medicines.map((med: { name: string; dosage: string; frequency: string; duration: string }) => {
    const parts = [med.name, med.dosage, med.frequency, med.duration].filter(Boolean);
    return parts.join(' • ');
  });

  const treatmentPeriod = (() => {
    const start = formatDate(item.treatment_start_date);
    const end = formatDate(item.treatment_end_date);
    if (!item.treatment_start_date && !item.treatment_end_date) return null;
    if (item.treatment_start_date && item.treatment_end_date) return `Treatment period: ${start} - ${end}`;
    if (item.treatment_start_date) return `Treatment started: ${start}`;
    return `Treatment ended: ${end}`;
  })();

  const details = [
    ...medicineDetails,
    ...(treatmentPeriod ? [treatmentPeriod] : []),
    ...(item.doctor_advice ? [`Doctor advice: ${item.doctor_advice}`] : []),
    ...(item.ai_summary ? [item.ai_summary] : []),
    ...(item.diagnosis && medicineDetails.length === 0 ? [item.diagnosis] : []),
  ];

  const recencyDays = Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const tags: Relevance[] = recencyDays <= 14 ? ['Recent trend'] : ['High relevance'];

  return {
    id: item.id,
    name: item.image_name || item.doctor_name || `Prescription #${item.id}`,
    type: 'Prescription',
    date: formatDate(item.prescription_date || item.created_at),
    provider: item.doctor_name || 'Uploaded prescription',
    size: medicines.length > 0 ? `${medicines.length} medicine${medicines.length > 1 ? 's' : ''}` : 'Uploaded',
    tags,
    summary: item.ai_summary || item.diagnosis || 'No diagnosis details were provided.',
    details: details.length > 0 ? details : ['Prescription uploaded'],
  };
}

/* ─── Icon & colour helpers ──────────────────────────────────── */

const typeConfig: Record<DocType, { Icon: React.ElementType; bg: string; color: string; border: string }> = {
  'Lab Result':    { Icon: FlaskConical,   bg: 'bg-violet-50',     color: 'text-violet-500',    border: 'border-violet-100' },
  'Clinical Note': { Icon: ClipboardList,  bg: 'bg-sky-50',        color: 'text-sky-500',       border: 'border-sky-100'    },
  'Prescription':  { Icon: Pill,           bg: 'bg-[#EAF7F6]',     color: 'text-[#2EC4B6]',     border: 'border-[#2EC4B6]/20' },
  'Imaging':       { Icon: ScanLine,       bg: 'bg-amber-50',      color: 'text-amber-500',     border: 'border-amber-100'  },
};

const tagConfig: Record<NonNullable<Relevance>, { bg: string; text: string; border: string }> = {
  'High relevance': { bg: 'bg-rose-50',      text: 'text-rose-600',      border: 'border-rose-100'       },
  'Recent trend':   { bg: 'bg-[#EAF7F6]',   text: 'text-[#0F3D3E]',     border: 'border-[#2EC4B6]/30'   },
  'Repeated':       { bg: 'bg-amber-50',     text: 'text-amber-600',     border: 'border-amber-100'      },
};

const filters = ['All', 'Lab Result', 'Clinical Note', 'Prescription', 'Imaging'];

/* ─── Page ───────────────────────────────────────────────────── */

export function Records() {
  const { isDemoMode, isTourActive, tourStep } = useDemoMode();
  const [isAnalyzing] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState('');

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    setRecordsError('');
    try {
      const res = await fetch('/api/prescriptions', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load records');

      const items = Array.isArray(data.items) ? data.items : [];
      setDocuments(items.map((item: PrescriptionApiItem) => mapPrescriptionToDocument(item)));
    } catch (e: any) {
      setRecordsError(e?.message || 'Failed to load records');
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const dataSource = documents;

  const filtered = dataSource.filter(d => {
    const matchFilter = filter === 'All' || d.type === filter;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.provider.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 relative">
      {isDemoMode && (
        <div className="fixed inset-0 pointer-events-none z-0 border-8 border-[#2EC4B6]/20 transition-all duration-500" />
      )}
      <Header />
      <main className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-heading font-extrabold text-slate-900 tracking-tighter mb-1">
                Medical Records
              </h1>
              <p className="text-sm text-slate-500">
                Securely stored documents, lab results, and prescriptions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-white text-slate-700 rounded-full text-sm font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:text-slate-900 transition-all">
                <Filter className="w-4 h-4 text-slate-400" /> Filter
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0F3D3E] hover:bg-[#1A595A] text-white rounded-full text-sm font-medium shadow-lg shadow-[#0F3D3E]/20 transition-all"
              >
                <UploadCloud className="w-4 h-4" /> Upload Record
              </button>
            </div>
          </div>

          {/* ── AI Insights Panel (unchanged) ─────────────────── */}
          <div className={`mb-12 relative w-full rounded-[32px] rounded-tr-[48px] rounded-bl-[48px] p-8 shadow-[0_40px_80px_rgba(15,61,62,0.4)] bg-gradient-to-br from-[#0A2C2D] to-[#0F3D3E] border ${isDemoMode ? 'border-[#2EC4B6] shadow-[0_0_60px_rgba(46,196,182,0.6)] animate-[pulse_3s_ease-in-out_infinite]' : 'border-[#2EC4B6]/50'} border-l-4 border-l-[#2EC4B6] overflow-hidden flex flex-col gap-8 group transition-all duration-500 hover:shadow-[0_45px_90px_rgba(15,61,62,0.5)]`}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 800 400" preserveAspectRatio="none">
              <path d="M-100,300 C200,100 400,400 800,200 L800,0 L-100,0 Z" fill="url(#ai-glow-records)" />
              <defs>
                <linearGradient id="ai-glow-records" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2EC4B6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0F3D3E" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#2EC4B6]/20 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-70" />

            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner transition-all ${isAnalyzing ? 'animate-pulse shadow-[0_0_15px_rgba(46,196,182,0.4)]' : ''}`}>
                <BrainCircuit className={`w-6 h-6 text-[#2EC4B6] ${isAnalyzing ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-white tracking-tight leading-none mb-1 flex items-center gap-2">
                  {isAnalyzing ? 'Scanning documents...' : 'AI Record Analysis'}
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-[#2EC4B6]">
                  {isAnalyzing ? (
                    <span className="flex items-center gap-1.5 text-[#2EC4B6]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2EC4B6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2EC4B6]"></span>
                      </span>
                      Synthesizing 24 past documents
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Updated just now
                    </span>
                  )}
                  <span className="w-1 h-1 rounded-full bg-[#2EC4B6]/50 mx-1"></span>
                  <span className="text-[10px] text-white/60 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    AI-assisted, not medical advice
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 min-h-[140px]">
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 overflow-hidden relative h-[140px]">
                        <div className="absolute inset-0 -translate-x-full bg-white/5 animate-[shimmer_1.5s_infinite]" style={{ animationDelay: `${i * 0.15}s` }} />
                        <div className="h-3 bg-white/20 rounded w-1/3 mb-4 animate-pulse" />
                        <div className="h-6 bg-white/20 rounded w-2/3 mb-4 animate-pulse" />
                        <div className="h-2 bg-white/10 rounded w-full mb-2 animate-pulse" />
                        <div className="h-2 bg-white/10 rounded w-4/5 animate-pulse" />
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-700 ${isTourActive && tourStep === 3 ? 'ring-2 ring-amber-400 ring-offset-4 ring-offset-[#0F3D3E] shadow-[0_0_40px_rgba(251,191,36,0.3)] z-20 scale-[1.02] rounded-2xl' : ''}`}
                  >
                    {/* Total Visits */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 border-l-2 border-l-[#2EC4B6] rounded-r-2xl rounded-l-lg p-5 hover:bg-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all group/card relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute inset-0 -translate-x-full bg-white/5 group-hover/card:animate-[shimmer_1.5s_infinite]" />
                      <div>
                        <h4 className="text-xs font-bold text-[#2EC4B6] uppercase tracking-wider mb-2 relative z-10">Total Visits</h4>
                        <div className="flex items-end gap-3 mb-1 relative z-10">
                          <span className="text-3xl font-semibold text-white leading-none">12</span>
                          <span className="text-xs font-medium text-white/70 mb-1">Past 12 months</span>
                        </div>
                        <p className="text-[11px] text-white/60 relative z-10">3 primary care, 5 specialist, 4 lab visits</p>
                      </div>
                      <button onClick={() => setExpandedEvidence(expandedEvidence === 'visits' ? null : 'visits')} className="mt-3 inline-flex items-center gap-1.5 w-fit px-2.5 py-1 bg-[#2EC4B6]/10 hover:bg-[#2EC4B6]/20 text-[#2EC4B6] text-[10px] uppercase font-bold rounded-md border border-[#2EC4B6]/20 transition-colors z-10">
                        <Sparkles className="w-3 h-3" />
                        {expandedEvidence === 'visits' ? 'Hide Data' : 'View Data'}
                      </button>
                      <AnimatePresence>
                        {expandedEvidence === 'visits' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 12 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="relative z-10 overflow-hidden">
                            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                              <div className="flex items-center justify-between text-xs text-white/80"><span className="flex items-center gap-1.5"><Stethoscope className="w-3 h-3" /> Specialist</span><span className="font-bold">5</span></div>
                              <div className="flex items-center justify-between text-xs text-white/80"><span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Lab</span><span className="font-bold">4</span></div>
                              <div className="flex items-center justify-between text-xs text-white/80"><span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Primary</span><span className="font-bold">3</span></div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Pattern Detected */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 border-l-2 border-l-[#2EC4B6] rounded-r-2xl rounded-l-lg p-5 hover:bg-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all group/card relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute inset-0 -translate-x-full bg-white/5 group-hover/card:animate-[shimmer_1.5s_infinite]" />
                      <div>
                        <div className="flex items-center justify-between mb-2 relative z-10">
                          <h4 className="text-xs font-bold text-[#2EC4B6] uppercase tracking-wider">Pattern Detected</h4>
                          <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                            <div className="flex gap-[2px]"><div className="w-2 h-1.5 rounded-[1px] bg-amber-400" /><div className="w-2 h-1.5 rounded-[1px] bg-amber-400" /><div className="w-2 h-1.5 rounded-[1px] bg-white/20" /></div>
                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Moderate Risk</span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-white leading-snug mb-1 relative z-10">Throat infections & mild hypertension</p>
                        <p className="text-[11px] text-white/60 relative z-10">This pattern could affect your well-being. Mentioned in 4 clinical notes.</p>
                      </div>
                      <button onClick={() => setExpandedEvidence(expandedEvidence === 'issues' ? null : 'issues')} className="mt-3 inline-flex items-center gap-1.5 w-fit px-2.5 py-1 bg-[#2EC4B6]/10 hover:bg-[#2EC4B6]/20 text-[#2EC4B6] text-[10px] uppercase font-bold rounded-md border border-[#2EC4B6]/20 transition-colors z-10">
                        <Sparkles className="w-3 h-3" />
                        {expandedEvidence === 'issues' ? 'Hide Data' : 'View Data'}
                      </button>
                      <AnimatePresence>
                        {expandedEvidence === 'issues' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 12 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="relative z-10 overflow-hidden">
                            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                              {['Visit Summary – Dr. Chen', 'Annual Physical Report'].map(name => (
                                <div key={name} className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2 rounded-lg border border-white/5 relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2EC4B6]/50"></div>
                                  <FileText className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0" />
                                  <span className="truncate">{name}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Medication Patterns */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 border-l-2 border-l-[#2EC4B6] rounded-r-2xl rounded-l-lg p-5 hover:bg-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all group/card relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute inset-0 -translate-x-full bg-white/5 group-hover/card:animate-[shimmer_1.5s_infinite]" />
                      <div>
                        <h4 className="text-xs font-bold text-[#2EC4B6] uppercase tracking-wider mb-2 relative z-10">Medication Patterns</h4>
                        <p className="text-sm font-semibold text-white leading-snug mb-1 relative z-10">Frequent NSAID & Antibiotic use</p>
                        <p className="text-[11px] text-white/60 relative z-10">Potential GI sensitivity risk flagged.</p>
                      </div>
                      <button onClick={() => setExpandedEvidence(expandedEvidence === 'meds' ? null : 'meds')} className="mt-3 inline-flex items-center gap-1.5 w-fit px-2.5 py-1 bg-[#2EC4B6]/10 hover:bg-[#2EC4B6]/20 text-[#2EC4B6] text-[10px] uppercase font-bold rounded-md border border-[#2EC4B6]/20 transition-colors z-10">
                        <Sparkles className="w-3 h-3" />
                        {expandedEvidence === 'meds' ? 'Hide Data' : 'View Data'}
                      </button>
                      <AnimatePresence>
                        {expandedEvidence === 'meds' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 12 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="relative z-10 overflow-hidden">
                            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                              {['Amoxicillin Prescription', 'Ibuprofen Logs (Daily)'].map(name => (
                                <div key={name} className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2 rounded-lg border border-white/5 relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2EC4B6]/50"></div>
                                  <Pill className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0" />
                                  <span className="truncate">{name}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Filter + Search Bar ───────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] rounded-tl-2xl rounded-br-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white mb-8">
            <div className="flex flex-wrap items-center gap-2">
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
              <div className="ml-auto relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]/20 w-52 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Flash Card Grid ───────────────────────────────── */}
          {recordsError ? (
            <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
              {recordsError}
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingRecords ? (
              <div className="col-span-3 py-24 flex flex-col items-center gap-3 text-slate-400">
                <FileText className="w-10 h-10 opacity-30 animate-pulse" />
                <p className="text-sm font-medium">Loading records...</p>
              </div>
            ) : null}
            {filtered.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                index={index}
                onClick={() => setSelected(doc)}
              />
            ))}
            {!loadingRecords && filtered.length === 0 && (
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
          <DocumentDetailModal doc={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <UploadPrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadRecords}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ─── Flash Card ─────────────────────────────────────────────── */

function DocumentCard({
  doc,
  index,
  onClick,
}: {
  doc: Document;
  index: number;
  onClick: () => void;
}) {
  const { Icon, bg, color, border } = typeConfig[doc.type];
  const activeTags = doc.tags.filter(Boolean) as NonNullable<Relevance>[];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      onClick={onClick}
      className="group relative bg-white/90 backdrop-blur-2xl rounded-[28px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 cursor-pointer hover:shadow-[0_16px_48px_rgba(15,61,62,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
    >
      {/* Top row: type badge + date */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${color} ${border}`}>
          <Icon className="w-3 h-3" strokeWidth={2} />
          {doc.type}
        </span>
        <span className="text-xs font-semibold text-slate-400 tabular-nums">{doc.date}</span>
      </div>

      {/* Document name */}
      <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1 leading-snug">
        {doc.name}
      </h3>

      {/* Provider + size */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
        <User className="w-3.5 h-3.5" />
        <span>{doc.provider}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>{doc.size}</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1 line-clamp-3 mb-5">
        {doc.summary}
      </p>

      {/* Tags */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {activeTags.map(tag => {
            const tc = tagConfig[tag];
            return (
              <span key={tag} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer */}
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

function DocumentDetailModal({
  doc,
  onClose,
}: {
  doc: Document;
  onClose: () => void;
}) {
  const { Icon, bg, color, border } = typeConfig[doc.type];
  const activeTags = doc.tags.filter(Boolean) as NonNullable<Relevance>[];

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
              {/* Type + tag badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${color} ${border}`}>
                  <Icon className="w-3 h-3" strokeWidth={2} />
                  {doc.type}
                </span>
                {activeTags.map(tag => {
                  const tc = tagConfig[tag];
                  return (
                    <span key={tag} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>
                      {tag}
                    </span>
                  );
                })}
              </div>

              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight mb-1.5">
                {doc.name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {doc.date}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {doc.provider}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-400">{doc.size}</span>
              </div>
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
          {/* Summary */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#2EC4B6]" strokeWidth={2} />
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.12em]">
                Summary
              </h3>
            </div>
            <div className="p-4 rounded-[18px] border border-slate-100 bg-slate-50/60 text-sm text-slate-600 leading-relaxed font-medium">
              {doc.summary}
            </div>
          </section>

          {/* Details / Findings */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-[#2EC4B6]" strokeWidth={2} />
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.12em]">
                Key Findings
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doc.details.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-[16px] border border-slate-100 bg-slate-50/60 hover:border-[#2EC4B6]/30 hover:bg-[#EAF7F6]/40 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6] mt-1.5 shrink-0" />
                  <span className="text-sm text-slate-700 font-medium leading-snug">{item}</span>
                </motion.div>
              ))}
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
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-[#2EC4B6]/40 text-slate-700 font-semibold rounded-xl shadow-sm text-sm transition-all">
            <MessageSquareText className="w-4 h-4 text-[#2EC4B6]" />
            Ask AI
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0F3D3E] text-white font-semibold rounded-xl shadow-md shadow-[#0F3D3E]/20 text-sm hover:bg-[#0a2e2f] transition-all">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </motion.div>
    </div>
  );
}
