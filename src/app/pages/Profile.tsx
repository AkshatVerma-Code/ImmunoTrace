import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { useDemoMode } from '../context/DemoContext';
import { User, Shield, Phone, HeartPulse, Edit2, MapPin, BrainCircuit, Activity, AlertTriangle, Stethoscope, ChevronRight, Clock, FileText } from 'lucide-react';

export function Profile() {
  const { isDemoMode } = useDemoMode();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);

  useState(() => {
    const timer = setTimeout(() => setIsAnalyzing(false), 2000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 relative">
      {/* Demo Mode Global Glow */}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-heading font-extrabold text-slate-900 tracking-tighter mb-1">Health Profile</h1>
              <p className="text-sm text-slate-500">Your AI-synthesized health summary and personal details.</p>
            </div>
            
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-white text-slate-700 rounded-full text-sm font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:text-slate-900 transition-all w-fit">
              <Edit2 className="w-4 h-4 text-slate-400" /> Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left Column: ID & AI Summary */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Main ID Card */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-[#EAF7F6] -z-10" />
                
                <div className="w-28 h-28 mx-auto bg-[#0F3D3E] rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-[#0F3D3E]/20 mt-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-4xl font-semibold text-white tracking-widest -rotate-3">SM</span>
                </div>
                <h2 className="text-3xl font-heading font-bold text-slate-800 mb-1 tracking-tight">Sarah Mitchell</h2>
                <p className="text-sm text-slate-500 mb-6">Patient ID: HW-2847</p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EAF7F6] text-[#2EC4B6] rounded-full text-[11px] font-bold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" /> Fully Verified
                </div>
              </div>

              {/* AI Understanding Panel */}
              <div className={`bg-gradient-to-br from-[#0A2C2D] to-[#0F3D3E] rounded-2xl rounded-tr-[48px] rounded-bl-[48px] shadow-[0_30px_60px_rgba(15,61,62,0.4)] border ${isDemoMode ? 'border-[#2EC4B6] shadow-[0_0_60px_rgba(46,196,182,0.6)] animate-[pulse_3s_ease-in-out_infinite]' : 'border-[#2EC4B6]/50'} border-l-4 border-l-[#2EC4B6] p-8 relative overflow-hidden group transition-all duration-500`}>
                {/* Decorative memory loop curve */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 800 400" preserveAspectRatio="none">
                  <path d="M-100,300 C200,100 400,400 800,200 L800,0 L-100,0 Z" fill="url(#ai-glow-profile)" />
                  <defs>
                    <linearGradient id="ai-glow-profile" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#2EC4B6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0F3D3E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#2EC4B6]/20 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-70" />
                
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all ${isAnalyzing ? 'animate-pulse shadow-[0_0_15px_rgba(46,196,182,0.4)]' : ''}`}>
                      <BrainCircuit className={`w-5 h-5 text-[#2EC4B6] ${isAnalyzing ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        {isAnalyzing ? 'Analyzing profile data...' : 'AI Understanding of You'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#2EC4B6]/80 font-medium mt-0.5">
                        {isAnalyzing ? (
                          <>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2EC4B6] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2EC4B6]"></span>
                            </span>
                            Updating
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Updated 2 min ago
                          </>
                        )}
                        <span className="text-white/30 px-1">•</span>
                        AI-assisted, not medical advice
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 min-h-[80px]">
                  <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                        <div className="h-4 bg-white/10 rounded w-11/12 animate-pulse" />
                        <div className="h-4 bg-white/10 rounded w-4/5 animate-pulse" />
                      </motion.div>
                    ) : (
                      <motion.p 
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-sm text-white/90 leading-relaxed font-medium"
                      >
                        Sarah is a 33-year-old female with a generally stable health profile. Recent data indicates a trend of tension headaches potentially linked to stress and mild blood pressure elevation. She maintains excellent medication adherence but should monitor cardiovascular indicators closely.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Vitals Summary */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#2EC4B6]" /> Basic Biometrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Blood Type</span>
                    <span className="text-sm font-semibold text-[#E63946] bg-red-50 px-2 py-0.5 rounded-md">O Positive</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Height</span>
                    <span className="text-sm font-medium text-slate-800">5' 6" (168 cm)</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Weight</span>
                    <span className="text-sm font-medium text-slate-800">142 lbs (64 kg)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Biological Sex</span>
                    <span className="text-sm font-medium text-slate-800">Female</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Health Intelligence & Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Health Intelligence Block */}
              <div className={`bg-white/90 backdrop-blur-2xl rounded-2xl rounded-tr-[40px] rounded-bl-[40px] shadow-[0_15px_40px_rgba(46,196,182,0.15)] border border-l-4 p-8 relative overflow-hidden group transition-all duration-500 ${isDemoMode ? 'border-[#2EC4B6]/80 shadow-[0_0_40px_rgba(46,196,182,0.3)] border-l-[#2EC4B6]' : 'border-[#2EC4B6]/30 border-l-[#2EC4B6]'}`}>
                {/* Decorative memory loop curve */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02] group-hover:opacity-[0.04] transition-opacity" viewBox="0 0 800 400" preserveAspectRatio="none">
                  <path d="M800,300 C600,100 400,400 0,200 L0,0 L800,0 Z" fill="url(#ai-glow-intelligence)" />
                  <defs>
                    <linearGradient id="ai-glow-intelligence" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2EC4B6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0F3D3E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#2EC4B6]" /> Clinical Health Intelligence
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <Shield className="w-3 h-3" /> Doctor-verified insights (future scope)
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAF7F6] text-[#0F3D3E] rounded-full text-[11px] font-bold uppercase tracking-wider border border-[#2EC4B6]/20">
                    <span className="w-2 h-2 rounded-full bg-[#2EC4B6] animate-pulse"></span>
                    Generally Stable, Mild BP Risk
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Risk Indicators */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Indicators
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">Cardiovascular Risk</span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">Moderate</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[11px] text-slate-500">Elevated resting blood pressure detected in last 3 readings.</p>
                          <button 
                            onClick={() => setExpandedEvidence(expandedEvidence === 'cv' ? null : 'cv')}
                            className="text-[10px] font-bold text-[#2EC4B6] hover:text-[#0F3D3E] transition-colors"
                          >
                            {expandedEvidence === 'cv' ? 'HIDE' : 'VIEW EVIDENCE'}
                          </button>
                        </div>
                        <AnimatePresence>
                          {expandedEvidence === 'cv' && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 relative">
                                <div className="absolute -left-0 top-3 bottom-3 w-1 bg-amber-400 rounded-r-md"></div>
                                <div className="flex justify-between items-center text-xs pl-2">
                                  <span className="text-slate-600 flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5 text-amber-500" /> Morning Vitals Log</span>
                                  <span className="font-semibold text-slate-800">142/90</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pl-2">
                                  <span className="text-slate-600 flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5 text-amber-500" /> Yesterday Vitals</span>
                                  <span className="font-semibold text-slate-800">138/88</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">Stress-Induced Tension</span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">Moderate</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[11px] text-slate-500">Correlates with reported headache frequency.</p>
                          <button 
                            onClick={() => setExpandedEvidence(expandedEvidence === 'stress' ? null : 'stress')}
                            className="text-[10px] font-bold text-[#2EC4B6] hover:text-[#0F3D3E] transition-colors"
                          >
                            {expandedEvidence === 'stress' ? 'HIDE' : 'VIEW EVIDENCE'}
                          </button>
                        </div>
                        <AnimatePresence>
                          {expandedEvidence === 'stress' && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 relative">
                                <div className="absolute -left-0 top-3 bottom-3 w-1 bg-amber-400 rounded-r-md"></div>
                                <div className="flex justify-between items-center text-xs pl-2">
                                  <span className="text-slate-600 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-500" /> Daily Journal Log</span>
                                  <span className="font-semibold text-slate-800">"High stress at work"</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pl-2">
                                  <span className="text-slate-600 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-500" /> Symptom Tracker</span>
                                  <span className="font-semibold text-slate-800">Migraine (Severity: 7/10)</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">GI Sensitivity</span>
                          <span className="text-[10px] font-bold text-[#2EC4B6] bg-[#EAF7F6] px-2 py-0.5 rounded uppercase tracking-wider">Low</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                          <div className="bg-[#2EC4B6] h-1.5 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">NSAID usage is monitored, no immediate risk.</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Conditions */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-[#0F3D3E]" /> Key Conditions
                    </h4>
                    <div className="space-y-3">
                      <div className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-[#2EC4B6]/30 hover:shadow-md transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                          <HeartPulse className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-[#2EC4B6] transition-colors">Mild Hypertension</h5>
                          <p className="text-xs text-slate-500">Diagnosed Nov 2025. Monitored via home cuffs.</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2EC4B6]" />
                      </div>

                      <div className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-[#2EC4B6]/30 hover:shadow-md transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <Activity className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-[#2EC4B6] transition-colors">Chronic Tension Headaches</h5>
                          <p className="text-xs text-slate-500">Recurring 2-3x monthly. Managed PRN.</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2EC4B6]" />
                      </div>

                      <div className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-[#2EC4B6]/30 hover:shadow-md transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-[#2EC4B6] transition-colors">Seasonal Allergies</h5>
                          <p className="text-xs text-slate-500">Primarily spring pollen. Controlled.</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2EC4B6]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Personal Info */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] rounded-tl-xl rounded-br-xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8 relative overflow-hidden group">
                {/* Subtle data flow curve background */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" preserveAspectRatio="none">
                  <path d="M0,80 Q200,0 400,100 T800,20" fill="none" stroke="#2EC4B6" strokeWidth="4" />
                  <path d="M0,180 Q100,100 300,180 T600,120" fill="none" stroke="#0F3D3E" strokeWidth="3" strokeDasharray="4 8" />
                </svg>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Personal Information
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                    <Shield className="w-3 h-3 text-[#2EC4B6]" />
                    Your data is secure
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <div className="text-base font-medium text-slate-800">Sarah Elizabeth Mitchell</div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                    <div className="text-base font-medium text-slate-800">August 14, 1992 (33 yrs)</div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="text-base font-medium text-slate-800">sarah.mitchell@example.com</div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="text-base font-medium text-slate-800">+1 (555) 019-2834</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Address</label>
                    <div className="text-base font-medium text-slate-800 flex items-center gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <MapPin className="w-5 h-5 text-[#2EC4B6]" />
                      1248 Magnolia Blvd, Apt 4B, Seattle, WA 98101
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-500" /> Emergency Contacts
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-medium text-slate-800 mb-0.5">David Mitchell</div>
                        <div className="text-xs text-slate-500">Husband</div>
                      </div>
                      <div className="text-[10px] font-bold text-[#E63946] bg-red-50 px-2 py-1 rounded-lg uppercase tracking-wider">Primary</div>
                    </div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +1 (555) 019-8832
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-medium text-slate-800 mb-0.5">Eleanor Vance</div>
                        <div className="text-xs text-slate-500">Mother</div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">Secondary</div>
                    </div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +1 (555) 019-4411
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}