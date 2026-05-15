import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { useDemoMode } from '../context/DemoContext';
import { Check, FileText, Pill, HeartPulse, BrainCircuit, Activity, ChevronDown, AlertTriangle, ShieldAlert, Info, ArrowRight, Sparkles, Clock, PhoneCall } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const vitalsData = [
  { day: 'Mon', bpm: 68 },
  { day: 'Tue', bpm: 72 },
  { day: 'Wed', bpm: 70 },
  { day: 'Thu', bpm: 82 }, // slight anomaly
  { day: 'Fri', bpm: 74 },
  { day: 'Sat', bpm: 66 },
  { day: 'Sun', bpm: 65 },
];

const bpData = [
  { day: 'Mon', sys: 122, dia: 82 },
  { day: 'Tue', sys: 124, dia: 84 },
  { day: 'Wed', sys: 120, dia: 80 },
  { day: 'Thu', sys: 126, dia: 86 },
  { day: 'Fri', sys: 122, dia: 82 },
  { day: 'Sat', sys: 118, dia: 78 },
  { day: 'Sun', sys: 116, dia: 76 },
];

const upcomingAppointments = [
  { name: 'Dr. Sarah Chen', title: 'Primary Care Physician', time: '10:00 AM', date: 'Tomorrow', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150' },
  { name: 'City ENT Clinic', title: 'Specialist Visit', time: '2:30 PM', date: 'Mar 15', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=150' },
  { name: 'Dr. Michael Torres', title: 'Physical Therapy', time: '9:00 AM', date: 'Mar 22', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150' },
];

export function Dashboard() {
  const [isWhyMattersOpen, setIsWhyMattersOpen] = useState(false);
  const [isAnalyzing] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const { isDemoMode, isTourActive, tourStep } = useDemoMode();

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 relative">
      {/* Demo Mode Global Glow */}
      {isDemoMode && (
        <div className="fixed inset-0 pointer-events-none z-0 border-8 border-[#2EC4B6]/20 transition-all duration-500" />
      )}
      <Header />
      
      <main className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* HEALTH ALERTS STRIP */}
          <div className="mb-12 w-full bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-[20px] p-2 flex items-center gap-3 shadow-sm overflow-hidden">
            <div className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg uppercase tracking-wide shrink-0 shadow-sm flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#2EC4B6]" />
              For your attention
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 pb-0.5">
              {/* Red Risk Alert */}
              <button className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-colors group shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold text-rose-700 group-hover:text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  We noticed a recurring symptom you might want to check
                </span>
                <div className="flex items-center gap-1.5 ml-1 pl-2.5 border-l border-rose-200">
                  <div className="flex gap-[2px]">
                    <div className="w-2 h-1.5 rounded-[1px] bg-rose-500" />
                    <div className="w-2 h-1.5 rounded-[1px] bg-rose-500" />
                    <div className="w-2 h-1.5 rounded-[1px] bg-rose-500" />
                  </div>
                  <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">High</span>
                </div>
              </button>
              
              {/* Amber Warning Alert */}
              <button className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-lg transition-colors group shadow-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <span className="text-xs font-bold text-amber-700 group-hover:text-amber-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Just a heads-up: you took a similar medication last month
                </span>
                <div className="flex items-center gap-1.5 ml-1 pl-2.5 border-l border-amber-200">
                  <div className="flex gap-[2px]">
                    <div className="w-2 h-1.5 rounded-[1px] bg-amber-500" />
                    <div className="w-2 h-1.5 rounded-[1px] bg-amber-500" />
                    <div className="w-2 h-1.5 rounded-[1px] bg-amber-200" />
                  </div>
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Mod</span>
                </div>
              </button>

              {/* Green Safe Alert */}
              <button className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors group shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Looking good! All your vitals are in a healthy range today
                </span>
                <div className="flex items-center gap-1.5 ml-1 pl-2.5 border-l border-emerald-200">
                  <div className="flex gap-[2px]">
                    <div className="w-2 h-1.5 rounded-[1px] bg-emerald-500" />
                    <div className="w-2 h-1.5 rounded-[1px] bg-emerald-200" />
                    <div className="w-2 h-1.5 rounded-[1px] bg-emerald-200" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Low</span>
                </div>
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-4xl font-heading font-extrabold text-slate-900 tracking-tighter flex items-center gap-3">
              Welcome back, Sarah <span className="text-3xl">🌿</span>
            </h1>
            <p className="text-slate-500 mt-2 text-base leading-relaxed max-w-2xl font-sans">
              Here is your intelligent health summary for today. We've synthesized your latest records.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT MAIN SECTION (Span 8) */}
            <div className="xl:col-span-8 flex flex-col gap-10">
              
              {/* PRIMARY CONTRAST ZONE: AI INSIGHTS */}
              <div className={`relative w-full rounded-[32px] rounded-tr-[48px] rounded-bl-[48px] p-8 bg-gradient-to-br from-[#0A2C2D] to-[#0F3D3E] border-y border-r overflow-hidden flex flex-col gap-6 group transition-all duration-700 hover:shadow-[0_45px_90px_rgba(15,61,62,0.5)] ${
                isTourActive && tourStep === 2 
                  ? 'border-amber-400 scale-[1.02] shadow-[0_0_60px_rgba(251,191,36,0.4)] z-20' 
                  : isDemoMode 
                    ? 'border-[#2EC4B6] shadow-[0_0_60px_rgba(46,196,182,0.6)] animate-[pulse_3s_ease-in-out_infinite]' 
                    : 'border-[#2EC4B6]/50 shadow-[0_40px_80px_rgba(15,61,62,0.4)]'
              } border-l-4 ${isTourActive && tourStep === 2 ? 'border-l-amber-400' : 'border-l-[#2EC4B6]'}`}>
                {/* Decorative memory loop curve */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 800 400" preserveAspectRatio="none">
                  <path d="M-100,300 C200,100 400,400 800,200 L800,0 L-100,0 Z" fill="url(#ai-glow)" />
                  <defs>
                    <linearGradient id="ai-glow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#2EC4B6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0F3D3E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Glowing Orbs */}
      <div className={`absolute top-0 right-0 w-[400px] h-[400px] bg-[#2EC4B6]/20 rounded-full blur-[90px] pointer-events-none -translate-y-1/3 translate-x-1/3 transition-opacity group-hover:opacity-100 ${isAnalyzing ? 'opacity-100 animate-pulse' : 'opacity-70'}`} />
      <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#2EC4B6]/15 rounded-full blur-[80px] pointer-events-none translate-y-1/3 -translate-x-1/4 transition-opacity group-hover:opacity-100 ${isAnalyzing ? 'opacity-100 animate-pulse delay-75' : 'opacity-60'}`} />
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-[20px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner transition-all duration-500 ${isAnalyzing ? 'animate-pulse shadow-[0_0_20px_rgba(46,196,182,0.4)]' : ''}`}>
                      <Sparkles className={`w-7 h-7 text-[#2EC4B6] ${isAnalyzing ? 'animate-spin-slow' : ''}`} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-heading font-bold text-white tracking-tight leading-tight mb-1 flex items-center gap-2">
                        {isAnalyzing ? 'Reviewing your health history...' : 'We noticed something important for your health'}
                      </h2>
                      <div className="flex items-center gap-2 text-sm font-medium text-[#2EC4B6]">
                        {isAnalyzing ? (
                          <>
                            <span className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2EC4B6] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2EC4B6]"></span>
                              </span>
                              Reviewing your latest entries to see how you're doing...
                            </span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>We've been reviewing your recent logs and noticed a few patterns</span>
                          </>
                        )}
                        <span className="w-1 h-1 rounded-full bg-[#2EC4B6]/50 mx-1"></span>
                        <span className="text-[10px] text-white/60">AI-assisted, not medical advice</span>
                      </div>
                    </div>
                  </div>
                  <button className={`px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 transition-all duration-300 shadow-sm flex items-center gap-2 backdrop-blur-md ${isAnalyzing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                    View full history
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Insights List */}
                <div className="flex flex-col gap-3 relative z-10 min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute inset-0 flex flex-col gap-3"
                      >
                        {/* Skeleton Shimmer Blocks */}
                        <div className="w-full h-[104px] bg-white/5 backdrop-blur-md rounded-r-2xl rounded-l-lg border border-white/10 overflow-hidden relative">
                           <div className="absolute inset-0 -translate-x-full bg-white/5 animate-[shimmer_1.5s_infinite]" />
                           <div className="p-5 flex items-start gap-4 opacity-50">
                             <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                             <div className="flex-1 space-y-3 py-1">
                               <div className="h-4 bg-white/20 rounded w-3/4" />
                               <div className="h-3 bg-white/10 rounded w-full" />
                               <div className="h-3 bg-white/10 rounded w-5/6" />
                             </div>
                           </div>
                        </div>
                        <div className="w-full h-[104px] bg-white/5 backdrop-blur-md rounded-r-2xl rounded-l-lg border border-white/10 overflow-hidden relative">
                           <div className="absolute inset-0 -translate-x-full bg-white/5 animate-[shimmer_1.5s_infinite_0.2s]" />
                           <div className="p-5 flex items-start gap-4 opacity-50">
                             <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                             <div className="flex-1 space-y-3 py-1">
                               <div className="h-4 bg-white/20 rounded w-2/3" />
                               <div className="h-3 bg-white/10 rounded w-11/12" />
                             </div>
                           </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, staggerChildren: 0.1 }}
                        className="flex flex-col gap-3"
                      >
                        {/* Insight 1 */}
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1, duration: 0.4 }}
                          className="bg-white/10 backdrop-blur-md border border-white/20 border-l-2 border-l-amber-500 rounded-r-2xl rounded-l-lg p-5 hover:bg-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all relative overflow-hidden group/card"
                        >
                          <div className="absolute inset-0 -translate-x-full bg-white/5 group-hover/card:animate-[shimmer_1.5s_infinite]" />
                          <div className="flex items-start gap-4 relative z-10">
                            <div className="mt-0.5 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                              <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white leading-snug mb-1">Recurring throat infections detected over last 3 months</h4>
                              <p className="text-sm text-white/70">Pattern recognized across 4 recent clinical notes and prescribed antibiotics. This frequency is higher than average.</p>
                              
                              <button 
                                onClick={() => setExpandedEvidence(expandedEvidence === 'throat' ? null : 'throat')}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/20 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {expandedEvidence === 'throat' ? 'Hide Evidence' : 'View Evidence'}
                              </button>

                              <AnimatePresence>
                                {expandedEvidence === 'throat' && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 relative mt-1 ml-2">
                                      {/* Visual Connection Line */}
                                      <div className="absolute -left-[27px] -top-6 bottom-4 w-[2px] bg-amber-500/30"></div>
                                      <div className="absolute -left-[27px] top-4 w-[27px] h-[2px] bg-amber-500/40"></div>
                                      
                                      <h5 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider mb-3">Sourced from 3 records</h5>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                            <FileText className="w-3 h-3 text-amber-400" />
                                          </div>
                                          <span className="flex-1 font-medium group-hover/item:text-amber-300 transition-colors">Visit Summary - City ENT Clinic</span>
                                          <span className="text-[10px] text-white/40">Feb 22</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                            <Pill className="w-3 h-3 text-amber-400" />
                                          </div>
                                          <span className="flex-1 font-medium group-hover/item:text-amber-300 transition-colors">Amoxicillin Prescription</span>
                                          <span className="text-[10px] text-white/40">Feb 20</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                            <FileText className="w-3 h-3 text-amber-400" />
                                          </div>
                                          <span className="flex-1 font-medium group-hover/item:text-amber-300 transition-colors">Annual Physical Report</span>
                                          <span className="text-[10px] text-white/40">Nov 10, 2025</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>

                        {/* Insight 2 */}
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                          className="bg-white/10 backdrop-blur-md border border-white/20 border-l-2 border-l-rose-500 rounded-r-2xl rounded-l-lg p-5 hover:bg-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all relative overflow-hidden group/card"
                        >
                          <div className="absolute inset-0 -translate-x-full bg-white/5 group-hover/card:animate-[shimmer_1.5s_infinite]" />
                          <div className="flex items-start gap-4 relative z-10">
                            <div className="mt-0.5 w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-[0_0_15px_rgba(243,24,71,0.2)]">
                              <ShieldAlert className="w-5 h-5 text-rose-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white leading-snug mb-1">Possible medication duplication risk</h4>
                              <p className="text-sm text-white/70">Ibuprofen and Naproxen both logged in your active regimen. Combining NSAIDs is generally not recommended.</p>
                              
                              <button 
                                onClick={() => setExpandedEvidence(expandedEvidence === 'nsaid' ? null : 'nsaid')}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/20 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {expandedEvidence === 'nsaid' ? 'Hide Evidence' : 'View Evidence'}
                              </button>

                              <AnimatePresence>
                                {expandedEvidence === 'nsaid' && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 relative mt-1 ml-2">
                                      {/* Visual Connection Line */}
                                      <div className="absolute -left-[27px] -top-6 bottom-4 w-[2px] bg-rose-500/30"></div>
                                      <div className="absolute -left-[27px] top-4 w-[27px] h-[2px] bg-rose-500/40"></div>
                                      
                                      <h5 className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider mb-3">Active Regimen Conflicts</h5>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item relative overflow-hidden">
                                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500/50"></div>
                                          <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                                            <Pill className="w-3 h-3 text-rose-400" />
                                          </div>
                                          <span className="flex-1 font-medium group-hover/item:text-rose-300 transition-colors">Ibuprofen (Advil) 400mg</span>
                                          <span className="text-[10px] text-rose-300/80 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold">NSAID</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item relative overflow-hidden">
                                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500/50"></div>
                                          <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                                            <Pill className="w-3 h-3 text-rose-400" />
                                          </div>
                                          <span className="flex-1 font-medium group-hover/item:text-rose-300 transition-colors">Naproxen (Aleve) 220mg</span>
                                          <span className="text-[10px] text-rose-300/80 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold">NSAID</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Expandable Why This Matters */}
                <div className={`relative z-10 mt-2 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 delay-300 ${isAnalyzing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  <button 
                    onClick={() => setIsWhyMattersOpen(!isWhyMattersOpen)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group/btn"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-[#2EC4B6]" />
                      <span className="text-sm font-semibold text-white group-hover/btn:text-[#2EC4B6] transition-colors">Why this matters</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/50 transition-transform duration-300 ${isWhyMattersOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isWhyMattersOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 text-sm text-white/80 leading-relaxed border-t border-white/10 mt-1">
                          <p className="mb-4">
                            <strong className="text-white">Throat Infections:</strong> Frequent infections may indicate an underlying immune issue or require an ENT specialist consultation rather than repeated antibiotic courses, which can lead to resistance.
                          </p>
                          <p>
                            <strong className="text-white">Medication Duplication:</strong> Taking multiple NSAIDs simultaneously significantly increases the risk of gastrointestinal bleeding and kidney stress without providing proportional additional pain relief. Consider discussing alternatives with your provider.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* BASE UI: LIGHT AND MINIMAL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Stat 1 */}
                <div className="bg-white/40 backdrop-blur-2xl rounded-[32px] p-6 shadow-sm border border-slate-200/40 hover:bg-white/60 transition-colors flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#2EC4B6]/5 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Health Index Score</h3>
                  <div className="my-2">
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-semibold text-slate-800 leading-none">92</span>
                      <span className="bg-[#E6F8EB] text-[#22C55E] text-xs font-bold px-2 py-0.5 rounded-full mb-1 border border-[#22C55E]/20">Excellent</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pr-4">Based on your recent vitals and symptom logs.</p>
                  </div>
                  <div className="h-2 w-3/4 rounded-full bg-slate-200 overflow-hidden mt-2 relative">
                    <div className="absolute top-0 left-0 h-full w-[92%] bg-[#2EC4B6] rounded-full" />
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white/40 backdrop-blur-2xl rounded-[32px] p-6 shadow-sm border border-slate-200/40 hover:bg-white/60 transition-colors flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#2EC4B6]/5 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Tracking</h3>
                  <div className="my-2">
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-semibold text-slate-800 leading-none">4</span>
                      <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full mb-1">Items</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                        <HeartPulse className="w-2.5 h-2.5 text-[#2EC4B6]" />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">Blood Pressure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                        <Activity className="w-2.5 h-2.5 text-[#2EC4B6]" />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">Morning Migraines</span>
                    </div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white/40 backdrop-blur-2xl rounded-[32px] p-6 shadow-sm border border-slate-200/40 hover:bg-white/60 transition-colors flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#2EC4B6]/5 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Adherence Rate</h3>
                  <div className="my-2">
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-semibold text-slate-800 leading-none">98%</span>
                      <span className="bg-[#E6F8EB] text-[#22C55E] text-xs font-bold px-2 py-0.5 rounded-full mb-1 border border-[#22C55E]/20">+2%</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pr-4">Medication compliance over the last 30 days</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden mt-2 relative">
                    <div className="absolute top-0 left-0 h-full w-[98%] bg-[#2EC4B6] rounded-full" />
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW (Contextual AI Charts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Heart Rate Chart */}
                <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] rounded-tr-2xl rounded-bl-2xl p-6 shadow-sm border border-slate-200/40 flex flex-col relative overflow-hidden group">
                  {/* Subtle data flow curve background */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" preserveAspectRatio="none">
                    <path d="M0,50 Q100,100 200,0 T400,50" fill="none" stroke="#2EC4B6" strokeWidth="4" />
                    <path d="M0,150 Q150,100 300,200 T600,150" fill="none" stroke="#0F3D3E" strokeWidth="3" strokeDasharray="4 8" />
                  </svg>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-800">Resting Heart Rate (BPM)</h3>
                    <div className="flex bg-slate-100/50 rounded-full p-1 border border-slate-200/50">
                      <button className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-slate-800 shadow-sm border border-slate-200/50 uppercase tracking-wider">W</button>
                      <button className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider">M</button>
                    </div>
                  </div>
                  
                  {/* AI Insight Header */}
                  <div className="bg-[#E6F8EB] border border-[#2EC4B6]/40 border-l-4 border-l-[#2EC4B6] rounded-r-[24px] rounded-l-[14px] p-4 mb-6 flex items-start gap-3 shadow-sm relative overflow-hidden group">
                    <div className="w-8 h-8 rounded-xl bg-[#2EC4B6]/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#0F3D3E]" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-[#2EC4B6] uppercase tracking-wide mb-0.5">AI Analysis</h4>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">"Your heart rate peaks align with stress periods"</p>
                    </div>
                  </div>

                  <div className="w-full mt-auto" style={{ height: '160px', minHeight: '160px' }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={vitalsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs key="defs1">
                          <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1" key="grad1">
                            <stop offset="5%" stopColor="#2EC4B6" stopOpacity={0.3} key="stop1a" />
                            <stop offset="95%" stopColor="#2EC4B6" stopOpacity={0} key="stop1b" />
                          </linearGradient>
                        </defs>
                        <XAxis key="xaxis1" dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={5} />
                        <YAxis key="yaxis1" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} ticks={[40, 80, 120]} domain={[40, 120]} />
                        <Tooltip key="tooltip1" cursor={{ fill: 'transparent', stroke: '#E2E8F0', strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                        <Area key="area1" type="monotone" dataKey="bpm" stroke="#2EC4B6" strokeWidth={3} fillOpacity={1} fill="url(#colorBpm)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Blood Pressure Chart */}
                <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] rounded-tl-2xl rounded-br-2xl p-6 shadow-sm border border-slate-200/40 flex flex-col relative overflow-hidden group">
                  {/* Subtle data flow curve background */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" preserveAspectRatio="none">
                    <path d="M0,80 Q200,0 400,100 T800,20" fill="none" stroke="#2EC4B6" strokeWidth="4" />
                    <path d="M0,180 Q100,100 300,180 T600,120" fill="none" stroke="#0F3D3E" strokeWidth="3" strokeDasharray="4 8" />
                  </svg>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-800">Blood Pressure (mmHg)</h3>
                    <div className="flex bg-slate-100/50 rounded-full p-1 border border-slate-200/50">
                      <button className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-slate-800 shadow-sm border border-slate-200/50 uppercase tracking-wider">W</button>
                      <button className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider">M</button>
                    </div>
                  </div>
                  
                  {/* AI Insight Header */}
                  <div className="bg-amber-50 border border-amber-300/60 border-l-4 border-l-amber-500 rounded-r-[24px] rounded-l-[14px] p-4 mb-6 flex items-start gap-3 shadow-sm relative overflow-hidden group">
                    <div className="w-8 h-8 rounded-xl bg-amber-100/50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">AI Analysis</h4>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">"Your blood pressure is looking stable, though it's been slightly elevated on recent weekdays."</p>
                    </div>
                  </div>

                  <div className="w-full mt-auto" style={{ height: '160px', minHeight: '160px' }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={bpData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs key="defs2">
                          <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1" key="grad2">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} key="stop2a" />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} key="stop2b" />
                          </linearGradient>
                        </defs>
                        <XAxis key="xaxis2" dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={5} />
                        <YAxis key="yaxis2" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} ticks={[60, 100, 140]} domain={[60, 150]} />
                        <Tooltip key="tooltip2" cursor={{ fill: 'transparent', stroke: '#E2E8F0', strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                        <Area key="area2a" type="monotone" dataKey="sys" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSys)" name="Systolic" />
                        <Area key="area2b" type="monotone" dataKey="dia" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" fill="transparent" name="Diastolic" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* BOTTOM ROW (Daily Regimen) */}
              <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] rounded-tl-[16px] p-6 shadow-sm border border-slate-200/40 relative overflow-hidden group">
                <svg className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-[0.02] group-hover:opacity-[0.05] transition-opacity" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <path d="M400,0 C300,50 200,0 100,100 S0,200 -100,150" fill="none" stroke="#2EC4B6" strokeWidth="8" strokeDasharray="10 20" />
                </svg>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800">Daily Health Regimen</h3>
                    <p className="text-xs text-slate-500 mt-1">Your prescribed medications and routine checks for today.</p>
                  </div>
                  <button className="text-sm font-medium text-[#2EC4B6] hover:underline">View all</button>
                </div>
                
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-4 w-[35%]">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 text-[#2EC4B6] shadow-sm">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Vitamin D3</div>
                        <div className="text-[11px] text-slate-500 font-medium">2000 IU</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-[25%]">
                      <span className="text-sm font-medium text-slate-600 w-8">100%</span>
                      <div className="h-1.5 w-full max-w-[100px] rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full w-[100%] bg-[#2EC4B6] rounded-full" />
                      </div>
                    </div>
                    
                    <div className="w-[20%] text-sm text-slate-500 font-medium">Daily • Morning</div>
                    
                    <div className="flex items-center justify-end gap-3 w-[20%]">
                      <button className="px-4 py-2 bg-slate-100/80 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-200/50">
                        Mark Taken
                      </button>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-200/50" />

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-4 w-[35%]">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 text-[#0F3D3E] shadow-sm">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Blood Pressure Check</div>
                        <div className="text-[11px] text-slate-500 font-medium">Log Reading</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-[25%]">
                      <span className="text-sm font-medium text-slate-600 w-8">50%</span>
                      <div className="h-1.5 w-full max-w-[100px] rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full w-[50%] bg-[#0F3D3E] rounded-full" />
                      </div>
                    </div>
                    
                    <div className="w-[20%] text-sm text-slate-500 font-medium">2x Daily</div>
                    
                    <div className="flex items-center justify-end gap-3 w-[20%]">
                      <button className="px-4 py-2 bg-[#0F3D3E] text-white rounded-xl text-xs font-semibold hover:bg-[#0F3D3E]/90 transition-colors shadow-sm">
                        Log Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR (Span 4) */}
            <div className="xl:col-span-4 flex flex-col gap-10">
              
              {/* SECONDARY CONTRAST ZONE: ACTIVE ALERTS */}
              <div className={`bg-[#0F3D3E] rounded-[32px] rounded-tl-[40px] rounded-br-[40px] p-6 shadow-[0_30px_60px_rgba(15,61,62,0.4)] border-y border-l flex flex-col gap-5 relative overflow-hidden group transition-all duration-700 ${isTourActive && tourStep === 1 ? 'border-rose-400 border-r-4 border-r-rose-400 scale-[1.02] shadow-[0_0_60px_rgba(244,63,94,0.4)] z-20' : 'border-[#2EC4B6]/40 border-r-4 border-r-rose-500'}`}>
                {/* Decorative memory loop curve */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 400" preserveAspectRatio="none">
                  <path d="M400,0 C200,50 100,200 0,150 L0,0 Z" fill="url(#ai-glow-alert)" />
                  <defs>
                    <linearGradient id="ai-glow-alert" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2EC4B6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0F3D3E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Subtle glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/3 transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
                      <Activity className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">You might want to check this</h3>
                      <p className="text-[10px] text-amber-400 font-medium">This pattern could affect your well-being</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 relative z-10">
                  {/* Alert 1 */}
                  <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-black/30 transition-colors">
                     <div className="flex justify-between items-start mb-1.5">
                       <span className="text-sm font-semibold text-white">Elevated BP Trend</span>
                       <div className="flex items-center gap-1.5 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                         <div className="flex gap-[2px]">
                           <div className="w-2 h-1.5 rounded-[1px] bg-rose-400" />
                           <div className="w-2 h-1.5 rounded-[1px] bg-rose-400" />
                           <div className="w-2 h-1.5 rounded-[1px] bg-rose-400" />
                         </div>
                         <span className="text-[9px] uppercase tracking-wider text-rose-400 font-bold">High</span>
                       </div>
                     </div>
                     <p className="text-xs text-white/70 leading-relaxed mb-3">Average 142/90 over last 4 days. Exceeds your target threshold.</p>
                     <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                       <PhoneCall className="w-3.5 h-3.5" />
                       Contact Provider
                     </button>
                  </div>
                  
                  {/* Alert 2 */}
                  <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-black/30 transition-colors">
                     <div className="flex justify-between items-start mb-1.5">
                       <span className="text-sm font-semibold text-white">Prescription Refill</span>
                       <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                         <div className="flex gap-[2px]">
                           <div className="w-2 h-1.5 rounded-[1px] bg-amber-400" />
                           <div className="w-2 h-1.5 rounded-[1px] bg-amber-400" />
                           <div className="w-2 h-1.5 rounded-[1px] bg-white/20" />
                         </div>
                         <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">Moderate</span>
                       </div>
                     </div>
                     <p className="text-xs text-white/70 leading-relaxed mb-3">Lisinopril 10mg (2 days remaining).</p>
                     <button className="w-full py-2.5 bg-[#2EC4B6] hover:bg-[#25a69a] text-white rounded-xl text-xs font-bold transition-colors">
                       Request Refill
                     </button>
                  </div>
                </div>
              </div>

              {/* Upcoming Schedule (Minimal Base UI) */}
              <div className="bg-white/40 backdrop-blur-2xl rounded-[32px] p-6 shadow-sm border border-slate-200/40 flex flex-col gap-5 hover:bg-white/60 transition-colors">
                <div className="flex items-center gap-2 text-slate-800">
                  <Clock className="w-5 h-5 text-[#2EC4B6]" />
                  <h3 className="text-lg font-medium">Upcoming Schedule</h3>
                </div>
                
                {/* Calendar Row */}
                <div className="flex items-center justify-between text-center px-1">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sat', 'Su'].map((day, i) => {
                    const date = 21 + i;
                    const isActive = day === 'We';
                    return (
                      <div key={day} className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{day}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isActive ? 'bg-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/30' : 'text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer'
                        }`}>
                          {date}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Appointments List */}
                <div className="flex flex-col gap-5 mt-2">
                  {upcomingAppointments.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer bg-white/50 p-2.5 -mx-2.5 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-slate-200/50">
                      <div className="flex items-center gap-3">
                        <img src={doc.img} alt={doc.name} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100" />
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-[#2EC4B6] transition-colors">{doc.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{doc.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-700">{doc.time}</div>
                        <div className="text-[10px] text-[#2EC4B6] mt-1 font-bold uppercase tracking-wider bg-[#2EC4B6]/10 inline-block px-2 py-0.5 rounded-full">{doc.date}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-sm font-semibold transition-colors shadow-md mt-2">
                  Book new appointment
                </button>
              </div>

              {/* Records (Minimal Base UI) */}
              <div className="bg-white/40 backdrop-blur-2xl rounded-[32px] p-6 shadow-sm border border-slate-200/40 flex-1 flex flex-col gap-5 hover:bg-white/60 transition-colors">
                <div>
                  <h3 className="text-lg font-medium text-slate-800">Recent Medical Records</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Latest lab results, clinical notes, and imaging available for review.</p>
                </div>
                
                <div className="flex flex-col gap-3 mt-1">
                  {[
                    { title: 'Comprehensive Metabolic Panel', doc: 'Quest Diagnostics', date: 'Mar 12, 2026' },
                    { title: 'Visit Summary - Dr. Chen', doc: 'Primary Care', date: 'Feb 22, 2026' },
                    { title: 'Lumbar Spine MRI Results', doc: 'Northside Imaging', date: 'Feb 12, 2026' }
                  ].map((record, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer bg-white/50 hover:bg-white p-3.5 rounded-2xl transition-colors border border-transparent hover:border-slate-200/50 shadow-sm hover:shadow-md">
                      <div className="w-10 h-10 rounded-full bg-[#EAF7F6] text-[#2EC4B6] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-1">{record.title}</h4>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {record.doc} <span className="mx-1">•</span> {record.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
